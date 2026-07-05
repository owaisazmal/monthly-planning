import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import { KeyGoal } from '../types';
import { useTheme } from '../theme';

interface Props {
  goals: KeyGoal[];
  onChangeText: (index: number, text: string) => void;
  onToggleDone: (index: number) => void;
}

export default function KeyGoals({ goals, onChangeText, onToggleDone }: Props) {
  const { palette } = useTheme();

  const doneCount = goals.filter((g) => g.done && g.text.trim()).length;

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
          gap: 10,
        },
        goalBox: {
          flex: 1,
          backgroundColor: palette.chip,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.lineFaint,
          paddingVertical: 10,
          paddingHorizontal: 8,
          alignItems: 'center',
        },
        goalBoxDone: {
          backgroundColor: palette.greenSoft,
          borderColor: palette.green,
        },
        input: {
          minHeight: 48,
          fontSize: 14,
          fontWeight: '800',
          color: palette.ink,
          textAlignVertical: 'center',
          alignSelf: 'stretch',
        },
        inputDone: {
          color: palette.green,
        },
        check: {
          marginTop: 6,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.5,
          color: palette.inkSoft,
          borderWidth: 1,
          borderColor: palette.line,
          borderRadius: 8,
          paddingVertical: 3,
          paddingHorizontal: 8,
          overflow: 'hidden',
        },
        checkDone: {
          color: '#ffffff',
          backgroundColor: palette.green,
          borderColor: palette.green,
        },
      }),
    [palette]
  );

  return (
    <View style={styles.card}>
      <SectionHeader
        title="KEY GOALS"
        right={
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {doneCount}/{goals.length}
            </Text>
          </View>
        }
      />
      <View style={styles.row}>
        {goals.map((g, i) => (
          <View key={i} style={[styles.goalBox, g.done && styles.goalBoxDone]}>
            <TextInput
              style={[styles.input, g.done && styles.inputDone]}
              value={g.text}
              onChangeText={(t) => onChangeText(i, t)}
              placeholder="goal"
              placeholderTextColor={palette.inkSoft}
              multiline
              textAlign="center"
            />
            <Pressable
              hitSlop={6}
              onPress={() => onToggleDone(i)}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={[styles.check, g.done && styles.checkDone]}>
                {g.done ? '✓ DONE' : 'MARK DONE'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
