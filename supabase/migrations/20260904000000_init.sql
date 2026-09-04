-- Monthly Planning — the sync backend's schema, and its security model.
--
-- The app is open source and the anon key ships inside it, so nothing about
-- this backend is secret: anyone can read this file, lift the key out of the
-- binary and call the API directly with whatever payload they like. Every
-- guarantee therefore has to be made here, in Postgres, and not in the client:
--
--   * row-level security keeps each account's rows invisible to every other
--     account, including through direct REST calls that skip the app;
--   * the `anon` role can't touch these tables at all — you need a session;
--   * CHECK constraints and a trigger cap what one account can store, so a
--     script can't run up the bill or plant a payload the app can't parse;
--   * `user_id` defaults to the caller and can't be pointed at anyone else;
--   * `updated_at` is stamped by the server, never trusted from the client;
--   * an account can delete itself, and that cascades to everything it owns.
--
-- Not expressible in SQL, and to be set in the dashboard before going live:
--
--   Authentication → Providers → Email   confirm email ON; minimum password
--                                        length 8 or more; leaked-password
--                                        protection ON
--   Authentication → Attack protection   CAPTCHA (Turnstile / hCaptcha) ON;
--                                        rate limits at the defaults or tighter
--   Authentication → URL configuration   site URL and redirect allow-list set
--                                        to the app's verified universal / app
--                                        link only, never a bare custom scheme
--   Authentication → Sessions            defaults; OTP and reset expiry ≤ 3600 s
--   Authentication → Anonymous sign-ins  OFF
--
--   The service_role key never goes in the app, the repo, or eas.json.
--
-- Not wired up yet: the client still writes to AsyncStorage only. This file
-- exists so the security model is reviewed and versioned before the first
-- byte is synced. It has not been run against a live project.

-- ---------------------------------------------------------------------------
-- months: one row per account per calendar month, mirroring `MonthData`
-- ---------------------------------------------------------------------------

create table public.months (
  user_id      uuid        not null default auth.uid()
                           references auth.users (id) on delete cascade,
  year         integer     not null,
  -- 0-based, matching the app
  month        integer     not null,
  habits       jsonb       not null default '[]'::jsonb,
  grid         jsonb       not null default '{}'::jsonb,
  observations jsonb       not null default '["", "", "", ""]'::jsonb,
  key_goals    jsonb       not null default
    '[{"text": "", "done": false}, {"text": "", "done": false}, {"text": "", "done": false}]'::jsonb,
  updated_at   timestamptz not null default now(),

  primary key (user_id, year, month),

  -- with the primary key, this also bounds an account at 1212 rows
  constraint months_year  check (year between 2000 and 2100),
  constraint months_month check (month between 0 and 11),

  -- The outer shape the app's parser insists on. Element shapes are left to
  -- the client, which re-validates every field on read (src/storage.ts);
  -- the size ceilings below are what stop a bad element from mattering.
  constraint months_habits_shape check (
    jsonb_typeof(habits) = 'array' and jsonb_array_length(habits) <= 10
  ),
  constraint months_grid_shape check (jsonb_typeof(grid) = 'object'),
  constraint months_observations_shape check (
    jsonb_typeof(observations) = 'array' and jsonb_array_length(observations) <= 100
  ),
  constraint months_key_goals_shape check (
    jsonb_typeof(key_goals) = 'array' and jsonb_array_length(key_goals) = 3
  ),

  -- a real month is a few hundred bytes to a few KB; these are ceilings, not targets
  constraint months_size check (
    pg_column_size(habits)       <= 4096  and
    pg_column_size(grid)         <= 16384 and
    pg_column_size(observations) <= 16384 and
    pg_column_size(key_goals)    <= 2048
  )
);

comment on table public.months is
  'One planner month per account. Shapes match src/types.ts; the client re-validates on read.';

-- ---------------------------------------------------------------------------
-- tasks: deadlines, one flat list per account, mirroring `Task`
-- ---------------------------------------------------------------------------

create table public.tasks (
  user_id      uuid        not null default auth.uid()
                           references auth.users (id) on delete cascade,
  -- the app's own id for the task: a short string, stable across edits
  id           text        not null,
  text         text        not null default '',
  -- the deadline itself
  due          timestamptz not null,
  done         boolean     not null default false,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),

  primary key (user_id, id),

  constraint tasks_id_length   check (char_length(id) between 1 and 64),
  constraint tasks_text_length check (char_length(text) <= 500),
  -- an unfinished task has no completion time, whatever the client claims
  constraint tasks_completed_only_when_done check (completed_at is null or done)
);

create index tasks_user_due on public.tasks (user_id, due);

comment on table public.tasks is
  'Deadlines. Keyed by the client''s own task id so the app needs no id mapping.';

-- A ceiling on the list, not a quota anyone will meet: the app shows a handful
-- of pending tasks and files the rest under history.
create or replace function public.enforce_task_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.tasks where user_id = new.user_id) >= 500 then
    raise exception 'task limit reached' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger tasks_cap
  before insert on public.tasks
  for each row execute function public.enforce_task_cap();

-- ---------------------------------------------------------------------------
-- updated_at is the server's clock, not the client's
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger months_touch
  before insert or update on public.months
  for each row execute function public.touch_updated_at();

create trigger tasks_touch
  before insert or update on public.tasks
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- row-level security: an account sees its own rows and nothing else
-- ---------------------------------------------------------------------------

alter table public.months enable row level security;
alter table public.tasks  enable row level security;

-- `(select auth.uid())` rather than a bare call: Postgres then evaluates it
-- once per statement instead of once per row.
create policy "months are private to their owner"
  on public.months
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tasks are private to their owner"
  on public.tasks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Belt and braces. RLS already denies `anon` — no policy names it — but a role
-- with no privileges on the table can't even try.
revoke all on table public.months, public.tasks from anon, public;
grant select, insert, update, delete on table public.months, public.tasks to authenticated;

-- ---------------------------------------------------------------------------
-- deleting an account
-- ---------------------------------------------------------------------------

-- Apple requires an in-app way to delete any account the app let you create.
-- Deleting the auth row cascades through both tables above. Security definer
-- because `auth.users` is not the caller's to touch; the empty search_path
-- is the standard guard for such functions.
create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
