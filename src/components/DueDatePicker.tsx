import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, Palette, RADIUS, cardSurface, useTheme } from '../theme';

/**
 * Picking the moment a task is due.
 *
 * Written rather than imported. The platform pickers are the one part of a
 * screen the app can't restyle — they arrive in the system font and the system
 * colours, which is exactly what the rest of this app spends its time avoiding.
 * A month grid and two steppers is the whole requirement, and this way it also
 * costs no native dependency and no rebuild.
 */

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/** Minutes move in fives — a deadline is never meaningfully 18:37 */
const MINUTE_STEP = 5;

interface Props {
  visible: boolean;
  /** the deadline being edited, epoch ms */
  value: number;
  onCancel: () => void;
  onConfirm: (due: number) => void;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Monday-first weeks, padded with nulls so every row has seven cells */
function monthCells(year: number, month: number): (number | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const len = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= len; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DueDatePicker({ visible, value, onCancel, onConfirm }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const [picked, setPicked] = useState(() => new Date(value));
  const [cursor, setCursor] = useState(() => ({
    year: new Date(value).getFullYear(),
    month: new Date(value).getMonth(),
  }));

  // Opening is the only moment the sheet should adopt the task's own deadline;
  // re-syncing while it is open would fight whatever is being picked.
  useEffect(() => {
    if (!visible) return;
    const d = new Date(value);
    setPicked(d);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }, [visible, value]);

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor]);
  const todayStart = startOfDay(new Date());

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const pickDay = (day: number) => {
    const next = new Date(picked);
    next.setFullYear(cursor.year, cursor.month, day);
    setPicked(next);
  };

  const shiftTime = (hours: number, minutes: number) => {
    const next = new Date(picked);
    next.setHours(next.getHours() + hours, next.getMinutes() + minutes, 0, 0);
    setPicked(next);
  };

  const sameDay =
    picked.getFullYear() === cursor.year && picked.getMonth() === cursor.month;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* tapping the dim area behind the sheet dismisses it, as a sheet should */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>DUE</Text>

          <View style={styles.monthNav}>
            <Pressable
              hitSlop={10}
              onPress={() => shiftMonth(-1)}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() => shiftMonth(1)}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={i} style={styles.cell} />;
              const selected = sameDay && day === picked.getDate();
              const past = new Date(cursor.year, cursor.month, day).getTime() < todayStart;
              return (
                <Pressable
                  key={i}
                  onPress={() => pickDay(day)}
                  style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}
                >
                  <View style={[styles.dayDot, selected && styles.dayDotOn]}>
                    <Text
                      style={[
                        styles.dayText,
                        past && styles.dayTextPast,
                        selected && styles.dayTextOn,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>TIME</Text>
            <Stepper
              styles={styles}
              value={String(picked.getHours()).padStart(2, '0')}
              onDown={() => shiftTime(-1, 0)}
              onUp={() => shiftTime(1, 0)}
            />
            <Text style={styles.colon}>:</Text>
            <Stepper
              styles={styles}
              value={String(picked.getMinutes()).padStart(2, '0')}
              onDown={() => shiftTime(0, -MINUTE_STEP)}
              onUp={() => shiftTime(0, MINUTE_STEP)}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.ghostText}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(picked.getTime())}
              style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryText}>SET</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({
  styles,
  value,
  onDown,
  onUp,
}: {
  styles: ReturnType<typeof makeStyles>;
  value: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        hitSlop={8}
        onPress={onDown}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.stepGlyph}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        hitSlop={8}
        onPress={onUp}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.stepGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 22,
    },
    sheet: {
      ...cardSurface(p),
      // the sheet floats over a dimmed page rather than over the aurora, so it
      // takes the solid background instead of the translucent card colour
      backgroundColor: p.bg,
      width: '100%',
      maxWidth: 360,
      padding: 20,
    },
    title: {
      fontSize: 13,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
      marginBottom: 14,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    navBtn: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      backgroundColor: p.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navArrow: {
      fontSize: 18,
      fontFamily: FONT.bold,
      color: p.ink,
      lineHeight: 21,
    },
    monthLabel: {
      fontSize: 14,
      fontFamily: FONT.bold,
      letterSpacing: 1.5,
      color: p.ink,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
      fontFamily: FONT.bold,
      letterSpacing: 1,
      color: p.inkSoft,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayDot: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayDotOn: {
      backgroundColor: p.accent,
    },
    dayText: {
      fontSize: 13,
      fontFamily: FONT.medium,
      color: p.ink,
    },
    /** a deadline can be back-dated, but the days behind you shouldn't invite it */
    dayTextPast: {
      color: p.inkSoft,
      opacity: 0.5,
    },
    dayTextOn: {
      color: p.onAccent,
      fontFamily: FONT.bold,
      opacity: 1,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 18,
    },
    timeLabel: {
      flex: 1,
      fontSize: 10,
      fontFamily: FONT.bold,
      letterSpacing: 1.5,
      color: p.inkSoft,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.chip,
      borderRadius: RADIUS.control,
      paddingHorizontal: 4,
    },
    stepBtn: {
      width: 30,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepGlyph: {
      fontSize: 16,
      fontFamily: FONT.bold,
      color: p.accent,
      lineHeight: 19,
    },
    stepValue: {
      minWidth: 28,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: FONT.bold,
      color: p.ink,
    },
    colon: {
      fontSize: 16,
      fontFamily: FONT.bold,
      color: p.inkSoft,
      paddingHorizontal: 6,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    ghostBtn: {
      flex: 1,
      height: 44,
      borderRadius: RADIUS.control,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostText: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.inkSoft,
    },
    primary: {
      flex: 1,
      height: 44,
      borderRadius: RADIUS.control,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.onAccent,
    },
  });
