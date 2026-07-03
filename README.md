# Monthly Planning

A digital version of the whiteboard "Monthly Planning" board with a **radial habit tracker** — built with Expo / React Native for iOS and Android.

## Features

- **Radial habit tracker** — the circle is divided into one sector per day of the month and one ring per habit (up to 8, innermost ring = habit 1). Tap a cell to cycle: pending → **done** (green) → **missed** (red) → pending. Today's date is highlighted.
- **Habits list** — 8 slots; each named habit activates its ring on the chart.
- **Observations** — free-form note lines, add/remove as needed.
- **Key Goals** — three goal boxes with a "mark done" toggle.
- **Discipline quote** — rotates daily.
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
App.tsx                        main screen: header, month nav, sections, persistence
src/types.ts                   data model (MonthData, cell states)
src/storage.ts                 AsyncStorage load/save per month
src/quotes.ts                  discipline quotes, one per day
src/theme.ts                   whiteboard-style palette
src/components/RadialTracker   the SVG radial chart
src/components/HabitsList      numbered habit inputs
src/components/Observations    note lines
src/components/KeyGoals        three goal boxes
```
