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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RadialTracker from './src/components/RadialTracker';
import HabitsList from './src/components/HabitsList';
import Observations from './src/components/Observations';
import KeyGoals from './src/components/KeyGoals';
import { MonthData, emptyMonthData, cellKey, CellState } from './src/types';
import { loadMonth, saveMonth } from './src/storage';
import { quoteForDate } from './src/quotes';
import { colors } from './src/theme';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

function PlannerScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [data, setData] = useState<MonthData>(emptyMonthData());
  const [loaded, setLoaded] = useState(false);
  const { width } = useWindowDimensions();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : null;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadMonth(year, month).then((d) => {
      if (!cancelled) {
        setData(d);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // Debounced save whenever data changes
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveMonth(year, month, data), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded, year, month]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const activeSlots = useMemo(
    () => data.habits.map((h, i) => (h.trim() ? i : -1)).filter((i) => i >= 0),
    [data.habits]
  );

  const onToggleCell = useCallback((day: number, slot: number) => {
    setData((prev) => {
      const key = cellKey(day, slot);
      const next: CellState = (((prev.grid[key] ?? 0) + 1) % 3) as CellState;
      const grid = { ...prev.grid };
      if (next === 0) delete grid[key];
      else grid[key] = next;
      return { ...prev, grid };
    });
  }, []);

  const stats = useMemo(() => {
    const total = activeSlots.length * daysInMonth;
    let done = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      for (const slot of activeSlots) {
        if (data.grid[cellKey(day, slot)] === 1) done++;
      }
    }
    return { done, total };
  }, [data.grid, activeSlots, daysInMonth]);

  const chartSize = Math.min(width - 24, 420);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
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
            <View style={styles.monthNav}>
              <Pressable hitSlop={10} onPress={() => shiftMonth(-1)}>
                <Text style={styles.navArrow}>‹</Text>
              </Pressable>
              <View style={styles.monthLabelBox}>
                <Text style={styles.monthLabel}>{MONTH_NAMES[month]}</Text>
                <Text style={styles.yearLabel}>{year}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => shiftMonth(1)}>
                <Text style={styles.navArrow}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* Radial tracker */}
          <View style={styles.chartWrap}>
            <RadialTracker
              size={chartSize}
              daysInMonth={daysInMonth}
              habits={data.habits}
              grid={data.grid}
              today={today}
              onToggle={onToggleCell}
            />
            {activeSlots.length === 0 ? (
              <Text style={styles.chartHint}>
                Add habits below — each habit becomes a ring. Tap a cell to mark it:
                once for done, twice for missed.
              </Text>
            ) : (
              <Text style={styles.statsLine}>
                <Text style={styles.statsDone}>{stats.done}</Text>
                <Text> / {stats.total} cells filled</Text>
              </Text>
            )}
            <View style={styles.legend}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.green }]} />
              <Text style={styles.legendText}>done</Text>
              <View style={[styles.legendSwatch, { backgroundColor: colors.red }]} />
              <Text style={styles.legendText}>missed</Text>
              <View style={[styles.legendSwatch, styles.legendEmpty]} />
              <Text style={styles.legendText}>pending</Text>
            </View>
          </View>

          {/* Habits */}
          <View style={styles.section}>
            <HabitsList
              habits={data.habits}
              onChange={(slot, text) =>
                setData((prev) => {
                  const habits = [...prev.habits];
                  habits[slot] = text;
                  return { ...prev, habits };
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
              onAdd={() =>
                setData((prev) => ({ ...prev, observations: [...prev.observations, ''] }))
              }
              onRemove={(i) =>
                setData((prev) => ({
                  ...prev,
                  observations: prev.observations.filter((_, j) => j !== i),
                }))
              }
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

          {/* Discipline quote */}
          <View style={styles.quoteWrap}>
            <Text style={styles.quoteLabel}>DISCIPLINE.</Text>
            <Text style={styles.quote}>“{quoteForDate(now)}”</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlannerScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
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
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.inkSoft,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.ink,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navArrow: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: 6,
  },
  monthLabelBox: {
    alignItems: 'center',
    minWidth: 92,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.ink,
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  chartWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  chartHint: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  statsLine: {
    marginTop: 2,
    fontSize: 13,
    color: colors.inkSoft,
  },
  statsDone: {
    color: colors.green,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendEmpty: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  legendText: {
    fontSize: 12,
    color: colors.inkSoft,
    marginRight: 8,
  },
  section: {
    marginBottom: 16,
  },
  quoteWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.ink,
    marginBottom: 4,
  },
  quote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
