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
  LayoutAnimation,
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
import ThemeIcon from './src/components/ThemeIcon';
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

function PlannerScreen({
  chart,
  onSetChart,
}: {
  chart: ChartType;
  onSetChart: (c: ChartType) => void;
}) {
  const { mode, palette, toggle } = React.useContext(ThemeContext);
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

  // Year summary for the GRID chart; month is a dep so edits made in a month
  // are re-read after navigating away (flushSave enqueues the write first).
  useEffect(() => {
    if (chart !== 'github') return;
    let cancelled = false;
    loadYearSummary(year).then((months) => {
      if (!cancelled) setYearSummary({ year, months });
    });
    return () => {
      cancelled = true;
    };
  }, [chart, year, month]);

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

  const shiftMonth = (delta: number) => {
    flushSave();
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

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

  const setCell = useCallback((day: number, habitId: string, state: CellState) => {
    setData((prev) => {
      const key = cellKey(day, habitId);
      const grid = { ...prev.grid };
      if (state === 0) delete grid[key];
      else grid[key] = state;
      return { ...prev, grid };
    });
  }, []);

  const cycleCell = useCallback((day: number, habitId: string) => {
    setData((prev) => {
      const key = cellKey(day, habitId);
      const next: CellState = (((prev.grid[key] ?? 0) + 1) % 3) as CellState;
      const grid = { ...prev.grid };
      if (next === 0) delete grid[key];
      else grid[key] = next;
      return { ...prev, grid };
    });
  }, []);

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

  // Chart cross-fade on chart-type or month switch
  const chartAnim = useRef(new Animated.Value(1)).current;
  const chartKey = `${chart}-${year}-${month}`;
  const prevChartKey = useRef(chartKey);
  useEffect(() => {
    if (prevChartKey.current === chartKey) return;
    prevChartKey.current = chartKey;
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [chartKey, chartAnim]);

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
            <Pressable
              hitSlop={10}
              onPress={toggle}
              style={({ pressed }) => [styles.themeBtn, pressed && { opacity: 0.6 }]}
            >
              <ThemeIcon mode={mode} color={palette.ink} />
            </Pressable>
          </View>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable
              hitSlop={10}
              onPress={() => shiftMonth(-1)}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <View style={styles.monthLabelBox}>
              <Text style={styles.monthLabel}>{MONTH_NAMES[month]}</Text>
              <Text style={styles.yearLabel}>{year}</Text>
            </View>
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
              <View style={styles.segment}>
                {(['radial', 'github'] as ChartType[]).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.segmentBtn, chart === c && styles.segmentBtnActive]}
                    onPress={() => onSetChart(c)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        chart === c && styles.segmentTextActive,
                      ]}
                    >
                      {c === 'radial' ? 'RADIAL' : 'YEAR'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Animated.View
              style={{
                alignSelf: 'stretch',
                alignItems: 'center',
                opacity: chartAnim,
                transform: [
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
                  today={
                    year === now.getFullYear()
                      ? { month: now.getMonth(), day: now.getDate() }
                      : null
                  }
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

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fontsLoaded] = useFonts({
    JosefinSans_400Regular,
    JosefinSans_400Regular_Italic,
    JosefinSans_500Medium,
    JosefinSans_600SemiBold,
    JosefinSans_700Bold,
  });

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (settings) saveSettings(settings);
  }, [settings]);

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

  // hold the first paint until both the persisted theme and the font are ready,
  // so nothing flashes in the system font or the wrong palette
  if (!settings || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        {/* The drifting background sits behind every screen; cards are translucent so it reads through */}
        <View style={{ flex: 1, backgroundColor: theme.palette.bg }}>
          <AuroraBackground />
          <PlannerScreen
            chart={settings.chart}
            onSetChart={(chart) => setSettings((prev) => ({ ...(prev as Settings), chart }))}
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
    segment: {
      flexDirection: 'row',
      borderRadius: RADIUS.control,
      backgroundColor: p.chip,
      padding: 3,
    },
    segmentBtn: {
      paddingVertical: 6,
      paddingHorizontal: 13,
      borderRadius: RADIUS.chip,
    },
    segmentBtnActive: {
      backgroundColor: p.accent,
    },
    segmentText: {
      fontSize: 10,
      fontFamily: FONT.bold,
      letterSpacing: 1,
      color: p.inkSoft,
    },
    segmentTextActive: {
      color: p.onAccent,
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
