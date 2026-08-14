# Monthly Planning

A digital version of the whiteboard "Monthly Planning" board with a **radial habit tracker** — built with Expo / React Native for iOS and Android.

## Features

- **Radial habit tracker** — the circle is divided into one sector per day of the month and one ring per habit (innermost ring = habit 1). Tap a cell to cycle: pending → **done** (green) → **missed** (red) → pending. Today's date is highlighted.
- **Yearly grid** — switch the tracker to a GitHub-style contribution graph of the whole year. Cell intensity reflects how many habits you completed that day; tap any cell to jump to that month and day. Auto-scrolls to the open month.
- **Daily check** — a per-day checklist with ✓ / ✗ buttons, so filling the chart is one tap per habit. Navigate days with the arrows; today is badged.
- **Habits** — add, rename, and remove up to 10 habits per month. Removing a habit with marks asks for confirmation.
- **Observations** — free-form note lines, add/remove as needed.
- **Key Goals** — three goal boxes with a "mark done" toggle.
- **Discipline quote** — rotates daily.
- **Dark mode** — on by default, toggle with the ☀ / ☾ button. The choice persists.
- **Month navigation** — every month keeps its own habits, grid, observations, and goals, persisted on-device with AsyncStorage.

## Run it

```bash
npm install
npx expo start
```

- **On your phone**: install the Expo Go app (App Store / Play Store) and scan the QR code printed in the terminal.
- **Android emulator**: `npx expo start --android`
- **iOS simulator** (needs Xcode): `npx expo start --ios`

## Ship it

To produce store-ready binaries, use [EAS Build](https://docs.expo.dev/build/setup/):

```bash
npx eas build --platform all
```

## Structure

```
App.tsx                        main screen: header, month nav, tracker, sections, persistence
src/types.ts                   data model (MonthData, Habit, cell states)
src/storage.ts                 AsyncStorage load/save per month + year summary
src/quotes.ts                  discipline quotes, one per day
src/theme.ts                   dark/light palettes + theme context
src/components/RadialTracker   the SVG radial chart
src/components/YearChart       GitHub-style yearly contribution grid
src/components/DailyCheck      per-day ✓ / ✗ checklist
src/components/HabitsList      add/rename/remove habits
src/components/Observations    note lines
src/components/KeyGoals        three goal boxes
src/components/SectionHeader   accent-bar section title
```
