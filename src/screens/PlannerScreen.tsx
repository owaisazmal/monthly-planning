import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RadialTracker from '../components/RadialTracker';
import YearChart from '../components/YearChart';
import DailyCheck from '../components/DailyCheck';
import HabitsList from '../components/HabitsList';
import Observations from '../components/Observations';
import KeyGoals from '../components/KeyGoals';
import Deadlines from '../components/Deadlines';
import DueDatePicker from '../components/DueDatePicker';
import SegmentedControl from '../components/SegmentedControl';
import SettingsIcon from '../components/SettingsIcon';
import HistoryIcon from '../components/HistoryIcon';
import LogoMark from '../components/LogoMark';
import StreakBadge from '../components/StreakBadge';
import { useMonthData } from '../hooks/useMonthData';
import { useYearSummary } from '../hooks/useYearSummary';
import { useCurrentStreak } from '../hooks/useCurrentStreak';
import { TaskStore } from '../hooks/useTasks';
import { useNow } from '../hooks/useNow';
import { useWidgetSync, useReminderSync } from '../hooks/useOutboundSync';
import { quoteForDate } from '../quotes';
import { ChartType } from '../storage';
import { HistoryFilter } from '../history';
import { ThemeContext } from '../theme';
import { makeStyles } from './plannerStyles';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const rowsAnimation = LayoutAnimation.create(200, 'easeInEaseOut', 'opacity');

const CHART_OPTIONS = [
  { value: 'radial' as ChartType, label: 'RADIAL' },
  { value: 'github' as ChartType, label: 'YEAR' },
] as const;

/**
 * The planner itself. Presentation and gestures only — what a month contains,
 * how it persists, and what gets pushed to the widgets and the notification
 * schedule all live in hooks, so this file reads as the screen's shape.
 */
export default function PlannerScreen({
  chart,
  onSetChart,
  onOpenSettings,
  onOpenHistory,
  taskStore,
}: {
  chart: ChartType;
  onSetChart: (c: ChartType) => void;
  onOpenSettings: () => void;
  onOpenHistory: (filter?: HistoryFilter) => void;
  /** owned by the Navigator, because history reads the same list */
  taskStore: TaskStore;
}) {
  const { mode, palette } = useContext(ThemeContext);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const { width } = useWindowDimensions();
  const pendingSelect = useRef<number | null>(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : null;
  const [selectedDay, setSelectedDay] = useState(today ?? 1);

  const {
    data,
    loaded,
    daysInMonth,
    stats,
    flushSave,
    setCell,
    cycleCell,
    addHabit: appendHabit,
    renameHabit,
    removeHabit: deleteHabit,
    habitHasMarks,
    findHabit,
    setGoalText,
    toggleGoalDone,
    setObservation,
    addObservation,
    removeObservation,
  } = useMonthData(year, month, today);

  const {
    tasks,
    loaded: tasksLoaded,
    addTask,
    setTaskText,
    setTaskDue,
    toggleTaskDone,
    removeTask,
    findTask,
  } = taskStore;
  // which task's deadline is being edited, or null when the sheet is closed
  const [editingDue, setEditingDue] = useState<string | null>(null);
  // deadlines are the one thing here that ages without anyone touching it
  const nowMs = useNow();

  const yearMonths = useYearSummary(year, month, data, daysInMonth);
  const streakDays = useCurrentStreak(year, yearMonths);
  // Both, not just the month: pushing before the deadlines have loaded would
  // put a snapshot on the home screen saying nothing is due, and only correct
  // it on the next edit.
  useWidgetSync(loaded && tasksLoaded, year, month, data, yearMonths, mode, tasks);
  useReminderSync(loaded && tasksLoaded, data, today, tasks);

  // Opening a month lands on today when it's the current one, on the 1st
  // otherwise — unless a date was picked from the year grid on the way in.
  useEffect(() => {
    const n = new Date();
    setSelectedDay(
      pendingSelect.current ??
        (year === n.getFullYear() && month === n.getMonth() ? n.getDate() : 1)
    );
    pendingSelect.current = null;
  }, [year, month]);

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

  // Rows animate open and closed here rather than in the hook: the list moving
  // is a property of this screen, not of the month's data.
  const addHabit = useCallback(() => {
    LayoutAnimation.configureNext(rowsAnimation);
    appendHabit();
  }, [appendHabit]);

  const removeHabit = useCallback(
    (id: string) => {
      const doRemove = () => {
        LayoutAnimation.configureNext(rowsAnimation);
        deleteHabit(id);
      };
      if (habitHasMarks(id)) {
        Alert.alert(
          'Remove habit?',
          `"${findHabit(id)?.name || 'This habit'}" has marks this month — they will be deleted.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: doRemove },
          ]
        );
      } else {
        doRemove();
      }
    },
    [deleteHabit, habitHasMarks, findHabit]
  );

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
            {/*
              The mark shares the eyebrow line rather than sitting beside the
              whole wordmark: PLANNING at full size plus the three actions
              already fills a 400pt screen, so anything to its left would push
              the settings button off the edge.
            */}
            <View>
              <View style={styles.brand}>
                <LogoMark size={28} />
                <Text style={styles.headerSub}>MONTHLY</Text>
              </View>
              <Text style={styles.headerTitle}>PLANNING</Text>
            </View>
            <View style={styles.headerActions}>
              <StreakBadge days={streakDays} palette={palette} />
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="History"
                onPress={() => onOpenHistory()}
                style={({ pressed }) => [styles.themeBtn, pressed && { opacity: 0.6 }]}
              >
                <HistoryIcon color={palette.ink} />
              </Pressable>
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

          {/* Deadlines */}
          <View style={styles.section}>
            <Deadlines
              tasks={tasks}
              now={nowMs}
              onAdd={() => {
                LayoutAnimation.configureNext(rowsAnimation);
                addTask();
              }}
              onChangeText={setTaskText}
              onEditDue={setEditingDue}
              onToggleDone={(id) => {
                // ticking one files it away into history, so the row leaves
                LayoutAnimation.configureNext(rowsAnimation);
                toggleTaskDone(id);
              }}
              onRemove={(id) => {
                LayoutAnimation.configureNext(rowsAnimation);
                removeTask(id);
              }}
              onShowHistory={() => onOpenHistory('deadlines')}
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
              onChangeText={setGoalText}
              onToggleDone={toggleGoalDone}
            />
          </View>

          {/* Observations */}
          <View style={styles.section}>
            <Observations
              observations={data.observations}
              onChange={setObservation}
              onAdd={() => {
                LayoutAnimation.configureNext(rowsAnimation);
                addObservation();
              }}
              onRemove={(i) => {
                LayoutAnimation.configureNext(rowsAnimation);
                removeObservation(i);
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

      <DueDatePicker
        visible={editingDue !== null}
        value={findTask(editingDue ?? '')?.due ?? Date.now()}
        onCancel={() => setEditingDue(null)}
        onConfirm={(due) => {
          if (editingDue) setTaskDue(editingDue, due);
          setEditingDue(null);
        }}
      />
    </SafeAreaView>
  );
}
