import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import { Habit, MAX_HABITS } from '../types';
import { useTheme } from '../theme';

interface Props {
  habits: Habit[];
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function HabitsList({ habits, onRename, onAdd, onRemove }: Props) {
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
        countBadge: {
          backgroundColor: palette.chip,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        countText: {
          fontSize: 11,
          fontWeight: '800',
          color: palette.inkSoft,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: palette.lineFaint,
          paddingVertical: 2,
        },
        num: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.chip,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        },
        numText: {
          fontWeight: '800',
          fontSize: 11,
          color: palette.inkSoft,
        },
        input: {
          flex: 1,
          paddingVertical: 10,
          fontSize: 14,
          fontWeight: '600',
          color: palette.ink,
        },
        remove: {
          fontSize: 20,
          color: palette.inkSoft,
          paddingHorizontal: 8,
        },
        addBtn: {
          marginTop: 12,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.greenSoft,
          borderRadius: 10,
          paddingVertical: 8,
          paddingHorizontal: 14,
        },
        addText: {
          fontSize: 13,
          fontWeight: '800',
          color: palette.green,
        },
        limit: {
          marginTop: 12,
          fontSize: 12,
          color: palette.inkSoft,
        },
        empty: {
          fontSize: 13,
          color: palette.inkSoft,
          paddingVertical: 4,
        },
      }),
    [palette]
  );

  return (
    <View style={styles.card}>
      <SectionHeader
        title="HABITS"
        right={
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {habits.length}/{MAX_HABITS}
            </Text>
          </View>
        }
      />
      {habits.length === 0 && (
        <Text style={styles.empty}>No habits yet — add your first one.</Text>
      )}
      {habits.map((h, i) => (
        <View key={h.id} style={styles.row}>
          <View style={styles.num}>
            <Text style={styles.numText}>{i + 1}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={h.name}
            onChangeText={(t) => onRename(h.id, t)}
            placeholder="habit name…"
            placeholderTextColor={palette.inkSoft}
            autoCapitalize="characters"
            returnKeyType="done"
          />
          <Pressable
            hitSlop={8}
            onPress={() => onRemove(h.id)}
            style={({ pressed }) => pressed && { opacity: 0.5 }}
          >
            <Text style={styles.remove}>×</Text>
          </Pressable>
        </View>
      ))}
      {habits.length < MAX_HABITS ? (
        <Pressable
          onPress={onAdd}
          hitSlop={6}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.addText}>＋ Add habit</Text>
        </Pressable>
      ) : (
        <Text style={styles.limit}>Maximum of {MAX_HABITS} habits reached.</Text>
      )}
    </View>
  );
}
