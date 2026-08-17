import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  PanResponder,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RadialTracker from './src/components/RadialTracker';
import YearChart from './src/components/YearChart';
import DailyCheck from './src/components/DailyCheck';
import HabitsList from './src/components/HabitsList';
import Observations from './src/components/Observations';
import KeyGoals from './src/components/KeyGoals';
import AuroraBackground from './src/components/AuroraBackground';
import SegmentedControl from './src/components/SegmentedControl';
import SettingsIcon from './src/components/SettingsIcon';
import StreakBadge from './src/components/StreakBadge';
import AuthScreen from './src/screens/AuthScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Account, AuthState, loadAuth, saveAuth } from './src/auth';
import { ScreenLayer, useScreenTransition } from './src/navigation';
import {
  MonthData,
  emptyMonthData,
  cellKey,
  CellState,
  nextHabitId,
  dayTally,
} from './src/types';
import {
  loadMonth,
  saveMonth,
  loadSettings,
  saveSettings,
  loadYearSummary,
  YearMonthSummary,
  Settings,
  ChartType,
} from './src/storage';
import { quoteForDate } from './src/quotes';
import { buildSnapshot, computeStreaks } from './src/widgets/snapshot';
import { syncWidgets } from './src/widgets/sync';
import { syncReminders } from './src/notifications';
import {
  ThemeContext,
  Theme,
  ThemeMode,
  darkPalette,
  lightPalette,
  Palette,
  cardSurface,
  RADIUS,
  FONT,
} from './src/theme';
import {
  useFonts,
  JosefinSans_400Regular,
  JosefinSans_400Regular_Italic,
  JosefinSans_500Medium,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
} from '@expo-google-fonts/josefin-sans';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const rowsAnimation = LayoutAnimation.create(200, 'easeInEaseOut', 'opacity');

const CHART_OPTIONS = [
  { value: 'radial' as ChartType, label: 'RADIAL' },
  { value: 'github' as ChartType, label: 'YEAR' },
] as const;

function PlannerScreen({
  chart,
  onSetChart,
  onOpenSettings,
}: {
  chart: ChartType;
  onSetChart: (c: ChartType) => void;
  onOpenSettings: () => void;
}) {
  const { mode, palette } = React.useContext(ThemeContext);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [data, setData] = useState<MonthData>(emptyMonthData());
  const [loaded, setLoaded] = useState(false);
  const { width } = useWindowDimensions();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ year: number; month: number; data: MonthData } | null>(null);
  const pendingSelect = useRef<number | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : null;
  const [selectedDay, setSelectedDay] = useState(today ?? 1);

  const [yearSummary, setYearSummary] = useState<{
    year: number;
    months: YearMonthSummary[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadMonth(year, month).then((d) => {
      if (!cancelled) {
        setData(d);
        setLoaded(true);
      }
    });
    setSelectedDay(
      pendingSelect.current ??
        (year === now.getFullYear() && month === now.getMonth() ? now.getDate() : 1)
    );
    pendingSelect.current = null;
    return () => {
      cancelled = true;
    };
    // now is re-created every render; year/month capture the real dependency
  }, [year, month]);

  // Debounced save whenever data changes
  useEffect(() => {
    if (!loaded) return;
    pendingSave.current = { year, month, data };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMonth(year, month, data);
      pendingSave.current = null;
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded, year, month]);

  // Write out any pending edits immediately (used before navigating away from a month)
  const flushSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const p = pendingSave.current;
    if (p) {
      saveMonth(p.year, p.month, p.data);
      pendingSave.current = null;
    }
  }, []);

  // Year summary for the GRID chart and for the widget snapshot, so it loads
  // regardless of which chart is showing. month is a dep so edits made in a
  // month are re-read after navigating away (flushSave enqueues the write first).
  useEffect(() => {
    let cancelled = false;
    loadYearSummary(year).then((months) => {
      if (!cancelled) setYearSummary({ year, months });
    });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // Live tallies for the open month override the persisted snapshot in the year grid
  const yearMonths = useMemo(() => {
    if (!yearSummary || yearSummary.year !== year) return null;
    const tallies: YearMonthSummary['tallies'] = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const t = dayTally(data.grid, data.habits, d);
      if (t.done || t.missed) tallies[d] = t;
    }
    const months = yearSummary.months.slice();
    months[month] = { habitCount: data.habits.length, tallies };
    return months;
  }, [yearSummary, year, month, data, daysInMonth]);

  // The header flame always reports the streak as of today, never as of the
  // month being browsed — so paging back through history doesn't put it out.
  // Streaks are computed within a calendar year, so only the current year's
  // summary can answer; browsing to another year holds the last known count.
  const [streakDays, setStreakDays] = useState(0);
  useEffect(() => {
    if (!yearMonths || year !== now.getFullYear()) return;
    setStreakDays(
      computeStreaks(year, yearMonths, { month: now.getMonth(), day: now.getDate() }).current
    );
    // now is re-created every render; yearMonths carries the real dependency
  }, [yearMonths, year]);

  // Mirror a snapshot into the shared App Group for the iOS widgets. Debounced
  // longer than the save itself — WidgetKit rate-limits timeline reloads, so
  // there's no value in pushing one per keystroke.
  //
  // `mode` is a dependency because the widgets take their colour scheme from
  // the snapshot: without it, switching the app's theme would leave every
  // widget on the old one until the next edit happened to push a new snapshot.
  useEffect(() => {
    if (!loaded || !yearMonths) return;
    const t = setTimeout(() => {
      syncWidgets(buildSnapshot(year, month, data, yearMonths, new Date(), mode));
    }, 1200);
    return () => clearTimeout(t);
  }, [loaded, data, year, month, yearMonths, mode]);

  // Rewrite the reminder schedule on every change, so today's remaining nudges
  // disappear as soon as nothing is left pending.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      syncReminders({ habits: data.habits, grid: data.grid, today, now: new Date() });
    }, 1200);
    return () => clearTimeout(t);
  }, [loaded, data, today]);

  const shiftMonth = useCallback(
    (delta: number) => {
      flushSave();
      const d = new Date(year, month + delta, 1);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    },
    [flushSave, year, month]
  );

  // The arrows are still the obvious control; this just lets the month bar be
  // dragged the way the months themselves move — left for the next one.
  const monthSwipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) > 44 || Math.abs(g.vx) > 0.35) {
            shiftMonth(g.dx < 0 ? 1 : -1);
          }
        },
      }),
    [shiftMonth]
  );

  const gotoDate = useCallback(
    (m: number, day: number) => {
      if (m === month) {
        setSelectedDay(day);
        return;
      }
      flushSave();
      pendingSelect.current = day;
      setMonth(m);
    },
    [month, flushSave]
  );

  // History is read-only: only the real current day can be marked. `today` is
  // null whenever the open month isn't the current one, which locks it wholesale.
  // Guarded here rather than only in the UI so no caller can slip past it.
  const setCell = useCallback((day: number, habitId: string, state: CellState) => {
    if (day !== today) return;
    setData((prev) => {
      const key = cellKey(day, habitId);
      const grid = { ...prev.grid };
      if (state === 0) delete grid[key];
      else grid[key] = state;
      return { ...prev, grid };
    });
  }, [today]);

  const cycleCell = useCallback((day: number, habitId: string) => {
    if (day !== today) return;
    setData((prev) => {
      const key = cellKey(day, habitId);
      const next: CellState = (((prev.grid[key] ?? 0) + 1) % 3) as CellState;
      const grid = { ...prev.grid };
      if (next === 0) delete grid[key];
      else grid[key] = next;
      return { ...prev, grid };
    });
  }, [today]);

  const addHabit = useCallback(() => {
    LayoutAnimation.configureNext(rowsAnimation);
    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, { id: nextHabitId(prev.habits), name: '' }],
    }));
  }, []);

  const renameHabit = useCallback((id: string, name: string) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, name } : h)),
    }));
  }, []);

  const removeHabit = useCallback(
    (id: string) => {
      const doRemove = () => {
        LayoutAnimation.configureNext(rowsAnimation);
        setData((prev) => {
          const grid: typeof prev.grid = {};
          for (const [key, state] of Object.entries(prev.grid)) {
            if (!key.endsWith(`:${id}`)) grid[key] = state;
          }
          return { ...prev, habits: prev.habits.filter((h) => h.id !== id), grid };
        });
      };
      const habit = data.habits.find((h) => h.id === id);
      const hasMarks = Object.keys(data.grid).some((k) => k.endsWith(`:${id}`));
      if (hasMarks) {
        Alert.alert(
          'Remove habit?',
          `"${habit?.name || 'This habit'}" has marks this month — they will be deleted.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: doRemove },
          ]
        );
      } else {
        doRemove();
      }
    },
    [data.habits, data.grid]
  );

  const stats = useMemo(() => {
    const total = data.habits.length * daysInMonth;
    let done = 0;
    for (const state of Object.values(data.grid)) {
      if (state === 1) done++;
    }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [data.grid, data.habits, daysInMonth]);

  /**
   * Chart and month-label transitions.
   *
   * Swapping chart type is a swap in place, so it cross-fades. Moving month is
   * travel, so whatever arrives comes in from the side the month came from —
   * `enterFrom` is -1 going back, +1 going forward, and 0 for a swap, which
   * collapses the slide back into a plain cross-fade.
   */
  const chartAnim = useRef(new Animated.Value(1)).current;
  const monthAnim = useRef(new Animated.Value(1)).current;
  const [enterFrom, setEnterFrom] = useState(0);
  const monthIndex = year * 12 + month;
  const prevKey = useRef({ chart, monthIndex });

  useEffect(() => {
    const moved = monthIndex - prevKey.current.monthIndex;
    const swapped = chart !== prevKey.current.chart;
    if (!moved && !swapped) return;
    prevKey.current = { chart, monthIndex };
    setEnterFrom(Math.sign(moved));

    const replay = (value: Animated.Value, duration: number) => {
      value.setValue(0);
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    replay(chartAnim, 260);
    // the label only moves when the month does, not when the chart is swapped
    if (moved) replay(monthAnim, 240);
  }, [chart, monthIndex, chartAnim, monthAnim]);

  // Animated monthly progress bar
  const pctAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pctAnim, {
      toValue: stats.pct,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [stats.pct, pctAnim]);

  const chartSize = Math.min(width - 64, 420);
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSub}>MONTHLY</Text>
              <Text style={styles.headerTitle}>PLANNING</Text>
            </View>
            <View style={styles.headerActions}>
              <StreakBadge days={streakDays} palette={palette} />
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={onOpenSettings}
                style={({ pressed }) => [styles.themeBtn, pressed && { opacity: 0.6 }]}
              >
                <SettingsIcon color={palette.ink} />
              </Pressable>
            </View>
          </View>

          {/* Month navigation */}
          <View style={styles.monthNav} {...monthSwipe.panHandlers}>
            <Pressable
              hitSlop={10}
              onPress={() => shiftMonth(-1)}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Animated.View
              style={[
                styles.monthLabelBox,
                {
                  opacity: monthAnim,
                  transform: [
                    {
                      translateX: monthAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [enterFrom * 18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.monthLabel}>{MONTH_NAMES[month]}</Text>
              <Text style={styles.yearLabel}>{year}</Text>
            </Animated.View>
            <Pressable
              hitSlop={10}
              onPress={() => shiftMonth(1)}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>

          {/* Tracker */}
          <View style={styles.chartCard}>
            <View style={styles.chartHead}>
              <View style={styles.accent} />
              <Text style={styles.chartTitle}>TRACKER</Text>
              <SegmentedControl
                options={CHART_OPTIONS}
                value={chart}
                onChange={onSetChart}
                verticalPadding={6}
                style={styles.segment}
              />
            </View>

            <Animated.View
              style={{
                alignSelf: 'stretch',
                alignItems: 'center',
                opacity: chartAnim,
                transform: [
                  {
                    translateX: chartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [enterFrom * 34, 0],
                    }),
                  },
                  {
                    scale: chartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              }}
            >
              {chart === 'radial' ? (
                <RadialTracker
                  size={chartSize}
                  daysInMonth={daysInMonth}
                  habits={data.habits}
                  grid={data.grid}
                  today={today}
                  selectedDay={selectedDay}
                  onToggle={cycleCell}
                  onSelectDay={setSelectedDay}
                />
              ) : yearMonths ? (
                <YearChart
                  year={year}
                  months={yearMonths}
                  focusMonth={month}
                  now={{
                    year: now.getFullYear(),
                    month: now.getMonth(),
                    day: now.getDate(),
                  }}
                  selected={{ month, day: selectedDay }}
                  onSelectDate={gotoDate}
                />
              ) : (
                <View style={styles.chartLoading} />
              )}
            </Animated.View>

            {data.habits.length === 0 ? (
              <Text style={styles.chartHint}>
                Add habits below — then tap chart cells or use the daily check to fill
                them in.
              </Text>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: pctAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statsLine}>
                  <Text style={styles.statsDone}>{stats.done}</Text>
                  <Text>
                    {' '}
                    / {stats.total} this month · {stats.pct}%
                  </Text>
                </Text>
              </View>
            )}
            {chart === 'radial' && data.habits.length > 0 && (
              <View style={styles.legend}>
                <View style={[styles.legendSwatch, { backgroundColor: palette.done }]} />
                <Text style={styles.legendText}>done</Text>
                <View style={[styles.legendSwatch, { backgroundColor: palette.missed }]} />
                <Text style={styles.legendText}>missed</Text>
                <View style={[styles.legendSwatch, styles.legendEmpty]} />
                <Text style={styles.legendText}>pending</Text>
              </View>
            )}
          </View>

          {/* Daily check */}
          <View style={styles.section}>
            <DailyCheck
              day={selectedDay}
              daysInMonth={daysInMonth}
              monthName={MONTH_NAMES[month]}
              isToday={selectedDay === today}
              todayDay={today}
              habits={data.habits}
              grid={data.grid}
              onSet={setCell}
              onShiftDay={(d) =>
                setSelectedDay((prev) => Math.min(Math.max(prev + d, 1), daysInMonth))
              }
            />
          </View>

          {/* Habits */}
          <View style={styles.section}>
            <HabitsList
              habits={data.habits}
              onRename={renameHabit}
              onAdd={addHabit}
              onRemove={removeHabit}
            />
          </View>

          {/* Key goals */}
          <View style={styles.section}>
            <KeyGoals
              goals={data.keyGoals}
              onChangeText={(i, text) =>
                setData((prev) => {
                  const keyGoals = prev.keyGoals.map((g, j) =>
                    j === i ? { ...g, text } : g
                  );
                  return { ...prev, keyGoals };
                })
              }
              onToggleDone={(i) =>
                setData((prev) => {
                  const keyGoals = prev.keyGoals.map((g, j) =>
                    j === i ? { ...g, done: !g.done } : g
                  );
                  return { ...prev, keyGoals };
                })
              }
            />
          </View>

          {/* Observations */}
          <View style={styles.section}>
            <Observations
              observations={data.observations}
              onChange={(i, text) =>
                setData((prev) => {
                  const observations = [...prev.observations];
                  observations[i] = text;
                  return { ...prev, observations };
                })
              }
              onAdd={() => {
                LayoutAnimation.configureNext(rowsAnimation);
                setData((prev) => ({ ...prev, observations: [...prev.observations, ''] }));
              }}
              onRemove={(i) => {
                LayoutAnimation.configureNext(rowsAnimation);
                setData((prev) => ({
                  ...prev,
                  observations: prev.observations.filter((_, j) => j !== i),
                }));
              }}
            />
          </View>

          {/* Discipline quote */}
          <View style={styles.quoteCard}>
            <View style={styles.quoteHead}>
              <View style={styles.accent} />
              <Text style={styles.quoteLabel}>DISCIPLINE.</Text>
            </View>
            <Text style={styles.quote}>“{quoteForDate(now)}”</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Screen = 'planner' | 'settings' | 'auth';
type AuthVariant = 'onboarding' | 'standalone';

/**
 * The screen stack and everything that moves between its layers.
 *
 * Split out of App so it mounts only once the persisted state has landed:
 * every transition then initialises at rest, and nothing slides in on launch.
 */
function Navigator({
  initialScreen,
  account,
  chart,
  onSetChart,
  onSignIn,
  onSignOut,
  onSkipOnboarding,
}: {
  initialScreen: Exclude<Screen, 'settings'>;
  account: Account | null;
  chart: ChartType;
  onSetChart: (c: ChartType) => void;
  onSignIn: (account: Account) => void;
  onSignOut: () => void;
  onSkipOnboarding: () => void;
}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  // Frozen at the moment the auth screen opens rather than derived from the
  // account, which changes the instant someone signs in — mid-exit, that would
  // swap the screen's back button in behind the animation.
  const [authVariant, setAuthVariant] = useState<AuthVariant>(
    initialScreen === 'auth' ? 'onboarding' : 'standalone'
  );

  // Settings stays in the stack underneath a sign-in reached from it, so
  // dismissing that sign-in slides Settings back rather than rebuilding it.
  const settingsLayer = useScreenTransition(
    screen === 'settings' || (screen === 'auth' && authVariant === 'standalone')
  );
  const authLayer = useScreenTransition(screen === 'auth');

  const dismissAuth = () => {
    if (authVariant === 'standalone') {
      setScreen('settings');
    } else {
      onSkipOnboarding();
      setScreen('planner');
    }
  };

  const authenticated = (acc: Account) => {
    onSignIn(acc);
    // back to Settings if that's where the sign-in started, otherwise the
    // planner — which on first run is the screen behind the onboarding fade
    setScreen(authVariant === 'standalone' ? 'settings' : 'planner');
  };

  return (
    <>
      {/*
        The planner is never unmounted, so opening Settings doesn't throw away
        the open month, the selected day or the scroll position — and it keeps
        drawing through the transition, receding under whatever slides over it,
        until it is genuinely out of sight.
      */}
      <ScreenLayer
        coveredBy={settingsLayer.progress}
        hidden={settingsLayer.settledOpen || authLayer.settledOpen}
      >
        <PlannerScreen
          chart={chart}
          onSetChart={onSetChart}
          onOpenSettings={() => setScreen('settings')}
        />
      </ScreenLayer>

      <ScreenLayer
        transition={settingsLayer}
        coveredBy={authVariant === 'standalone' ? authLayer.progress : undefined}
        onSwipeBack={() => setScreen('planner')}
      >
        <SettingsScreen
          account={account}
          onSignIn={() => {
            setAuthVariant('standalone');
            setScreen('auth');
          }}
          onSignOut={onSignOut}
          onClose={() => setScreen('planner')}
        />
      </ScreenLayer>

      {/*
        First run has nothing behind it to push against, so the welcome screen
        rises into place instead of sliding in from the side — and there is
        nowhere to swipe back to.
      */}
      <ScreenLayer
        transition={authLayer}
        presentation={authVariant === 'onboarding' ? 'fade' : 'push'}
        swipeBackEnabled={authVariant === 'standalone'}
        onSwipeBack={dismissAuth}
      >
        <AuthScreen
          variant={authVariant}
          onAuthenticated={authenticated}
          onDismiss={dismissAuth}
        />
      </ScreenLayer>
    </>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [start, setStart] = useState<'planner' | 'auth' | null>(null);
  const [fontsLoaded] = useFonts({
    JosefinSans_400Regular,
    JosefinSans_400Regular_Italic,
    JosefinSans_500Medium,
    JosefinSans_600SemiBold,
    JosefinSans_700Bold,
  });

  useEffect(() => {
    loadSettings().then(setSettings);
    // The welcome screen is only shown to someone who has never answered it,
    // so the first screen can't be chosen until this lands.
    loadAuth().then((a) => {
      setAuth(a);
      setStart(a.onboarded ? 'planner' : 'auth');
    });
  }, []);

  useEffect(() => {
    if (settings) saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (auth) saveAuth(auth);
  }, [auth]);

  const mode: ThemeMode = settings?.theme ?? 'dark';
  const theme: Theme = useMemo(
    () => ({
      mode,
      palette: mode === 'dark' ? darkPalette : lightPalette,
      toggle: () =>
        setSettings((prev) => ({
          theme: (prev?.theme ?? 'dark') === 'dark' ? 'light' : 'dark',
          chart: prev?.chart ?? 'radial',
        })),
    }),
    [mode]
  );

  // hold the first paint until the persisted theme, the account and the font
  // are all ready, so nothing flashes in the system font, the wrong palette, or
  // the wrong screen
  if (!settings || !auth || !start || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        {/* The drifting background sits behind every layer; screens are transparent so it reads through */}
        <View style={{ flex: 1, backgroundColor: theme.palette.bg }}>
          <AuroraBackground />
          <Navigator
            initialScreen={start}
            account={auth.account}
            chart={settings.chart}
            onSetChart={(chart) => setSettings((prev) => ({ ...(prev as Settings), chart }))}
            onSignIn={(account) => setAuth({ account, onboarded: true })}
            onSignOut={() => setAuth({ account: null, onboarded: true })}
            onSkipOnboarding={() => setAuth({ account: null, onboarded: true })}
          />
        </View>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 48,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
      paddingHorizontal: 4,
    },
    headerSub: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 4,
      color: p.accent,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 30,
      fontFamily: FONT.bold,
      letterSpacing: 1,
      color: p.ink,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: p.lineFaint,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.card,
    },
    monthNav: {
      ...cardSurface(p),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: RADIUS.card,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 14,
    },
    navBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.pill,
      backgroundColor: p.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navArrow: {
      fontSize: 20,
      fontFamily: FONT.bold,
      color: p.ink,
      lineHeight: 24,
    },
    monthLabelBox: {
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: 16,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
    },
    yearLabel: {
      fontSize: 11,
      fontFamily: FONT.semibold,
      letterSpacing: 1,
      color: p.inkSoft,
    },
    chartCard: {
      ...cardSurface(p),
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    chartHead: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginBottom: 12,
    },
    accent: {
      width: 4,
      height: 15,
      borderRadius: 2,
      backgroundColor: p.accent,
      marginRight: 8,
    },
    chartTitle: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
    },
    // The options share the width evenly so the sliding pill is one size in
    // both positions; that needs a definite width here, since this row sizes
    // itself to its content.
    segment: {
      width: 152,
    },
    chartLoading: {
      height: 140,
    },
    chartHint: {
      marginTop: 10,
      fontSize: 13,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    statsRow: {
      marginTop: 12,
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: 6,
    },
    progressTrack: {
      alignSelf: 'stretch',
      height: 6,
      borderRadius: 3,
      backgroundColor: p.chip,
      overflow: 'hidden',
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: p.done,
    },
    statsLine: {
      fontSize: 12,
      color: p.inkSoft,
    },
    statsDone: {
      color: p.done,
      fontFamily: FONT.bold,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendEmpty: {
      backgroundColor: p.cellEmpty,
      borderWidth: 1,
      borderColor: p.line,
    },
    legendText: {
      fontSize: 12,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      marginRight: 8,
    },
    section: {
      marginBottom: 14,
    },
    quoteCard: {
      ...cardSurface(p),
      marginTop: 2,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    // an inline accent bar, matching every other section — a borderLeft would
    // detach into a floating arc against the card's large corner radius
    quoteHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    quoteLabel: {
      fontSize: 12,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.accent,
    },
    quote: {
      fontSize: 13,
      // the italic family carries the slant; fontStyle would be ignored here
      fontFamily: FONT.italic,
      lineHeight: 19,
      color: p.inkSoft,
    },
  });
