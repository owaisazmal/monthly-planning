import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import SectionHeader from './SectionHeader';
import { CellState, Habit, cellKey } from '../types';
import { useTheme, Palette } from '../theme';

interface Props {
  day: number;
  daysInMonth: number;
  monthName: string;
  isToday: boolean;
  habits: Habit[];
  grid: Record<string, CellState>;
  onSet: (day: number, habitId: string, state: CellState) => void;
  onShiftDay: (delta: number) => void;
}

function MarkButton({
  active,
  color,
  symbol,
  palette,
  onPress,
}: {
  active: boolean;
  color: string;
  symbol: string;
  palette: Palette;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      scale.setValue(0.5);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [active, scale]);

  return (
    <Pressable hitSlop={6} onPress={onPress}>
      {({ pressed }) => (
        <Animated.View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            borderColor: active ? color : palette.line,
            backgroundColor: active ? color : 'transparent',
            opacity: pressed ? 0.6 : 1,
            transform: [{ scale }],
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '900',
              color: active ? '#ffffff' : palette.inkSoft,
            }}
          >
            {symbol}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function DailyCheck({
  day,
  daysInMonth,
  monthName,
  isToday,
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
          backgroundColor: palette.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.lineFaint,
          padding: 16,
        },
        dayNav: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        navBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: palette.chip,
          alignItems: 'center',
          justifyContent: 'center',
        },
        navArrow: {
          fontSize: 16,
          fontWeight: '800',
          color: palette.ink,
          lineHeight: 19,
        },
        dayLabel: {
          fontSize: 13,
          fontWeight: '800',
          color: palette.ink,
          minWidth: 58,
          textAlign: 'center',
        },
        todayBadge: {
          fontSize: 9,
          fontWeight: '900',
          color: palette.green,
          letterSpacing: 1,
          textAlign: 'center',
        },
        empty: {
          fontSize: 13,
          color: palette.inkSoft,
          paddingVertical: 8,
          textAlign: 'center',
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
          fontWeight: '600',
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
                active={state === 1}
                color={palette.green}
                symbol="✓"
                palette={palette}
                onPress={() => onSet(day, h.id, state === 1 ? 0 : 1)}
              />
              <MarkButton
                active={state === 2}
                color={palette.red}
                symbol="✗"
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
