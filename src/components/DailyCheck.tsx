import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import MarkButton from './MarkButton';
import { CellState, Habit, cellKey } from '../types';
import { useTheme, cardSurface, RADIUS, FONT } from '../theme';

interface Props {
  day: number;
  daysInMonth: number;
  monthName: string;
  isToday: boolean;
  /** current day-of-month, or null when the open month isn't the current one */
  todayDay: number | null;
  habits: Habit[];
  grid: Record<string, CellState>;
  onSet: (day: number, habitId: string, state: CellState) => void;
  onShiftDay: (delta: number) => void;
}

export default function DailyCheck({
  day,
  daysInMonth,
  monthName,
  isToday,
  todayDay,
  habits,
  grid,
  onSet,
  onShiftDay,
}: Props) {
  const { palette } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...cardSurface(palette),
          padding: 18,
        },
        dayNav: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        navBtn: {
          width: 28,
          height: 28,
          borderRadius: RADIUS.pill,
          backgroundColor: palette.chip,
          alignItems: 'center',
          justifyContent: 'center',
        },
        navArrow: {
          fontSize: 16,
          fontFamily: FONT.bold,
          color: palette.ink,
          lineHeight: 19,
        },
        dayLabel: {
          fontSize: 13,
          fontFamily: FONT.bold,
          color: palette.ink,
          minWidth: 58,
          textAlign: 'center',
        },
        todayBadge: {
          fontSize: 9,
          fontFamily: FONT.bold,
          color: palette.accent,
          letterSpacing: 1,
          textAlign: 'center',
        },
        empty: {
          fontSize: 13,
          fontFamily: FONT.regular,
          color: palette.inkSoft,
          paddingVertical: 8,
          textAlign: 'center',
        },
        locked: {
          fontSize: 11,
          fontFamily: FONT.regular,
          color: palette.inkSoft,
          paddingBottom: 8,
        },
        habitRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          borderTopWidth: 1,
          borderTopColor: palette.lineFaint,
        },
        habitName: {
          flex: 1,
          fontSize: 14,
          fontFamily: FONT.medium,
          color: palette.ink,
        },
      }),
    [palette]
  );

  return (
    <View style={styles.card}>
      <SectionHeader
        title="DAILY CHECK"
        right={
          <View style={styles.dayNav}>
            <Pressable
              hitSlop={8}
              disabled={day <= 1}
              onPress={() => onShiftDay(-1)}
              style={({ pressed }) => [
                styles.navBtn,
                (pressed || day <= 1) && { opacity: day <= 1 ? 0.35 : 0.6 },
              ]}
            >
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <View>
              <Text style={styles.dayLabel}>
                {monthName.slice(0, 3)} {day}
              </Text>
              {isToday && <Text style={styles.todayBadge}>TODAY</Text>}
            </View>
            <Pressable
              hitSlop={8}
              disabled={day >= daysInMonth}
              onPress={() => onShiftDay(1)}
              style={({ pressed }) => [
                styles.navBtn,
                (pressed || day >= daysInMonth) && {
                  opacity: day >= daysInMonth ? 0.35 : 0.6,
                },
              ]}
            >
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>
        }
      />
      {habits.length > 0 && !isToday && (
        <Text style={styles.locked}>
          {day < (todayDay ?? 0) || todayDay === null
            ? 'Past days are locked — only today can be marked.'
            : "You can't mark a day before it arrives."}
        </Text>
      )}
      {habits.length === 0 ? (
        <Text style={styles.empty}>Add habits below to start checking them off.</Text>
      ) : (
        habits.map((h) => {
          const state = grid[cellKey(day, h.id)] ?? 0;
          return (
            <View key={h.id} style={styles.habitRow}>
              <Text style={styles.habitName} numberOfLines={1}>
                {h.name || 'Unnamed habit'}
              </Text>
              <MarkButton
                kind="done"
                active={state === 1}
                disabled={!isToday}
                palette={palette}
                onPress={() => onSet(day, h.id, state === 1 ? 0 : 1)}
              />
              <MarkButton
                kind="missed"
                active={state === 2}
                disabled={!isToday}
                palette={palette}
                onPress={() => onSet(day, h.id, state === 2 ? 0 : 2)}
              />
            </View>
          );
        })
      )}
    </View>
  );
}
