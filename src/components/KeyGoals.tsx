import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import { KeyGoal } from '../types';
import { colors } from '../theme';

interface Props {
  goals: KeyGoal[];
  onChangeText: (index: number, text: string) => void;
  onToggleDone: (index: number) => void;
}

export default function KeyGoals({ goals, onChangeText, onToggleDone }: Props) {
  return (
    <View style={styles.card}>
      <SectionHeader title="KEY GOALS" />
      <View style={styles.row}>
        {goals.map((g, i) => (
          <View key={i} style={[styles.goalBox, i < goals.length - 1 && styles.divider]}>
            <TextInput
              style={[styles.input, g.done && styles.inputDone]}
              value={g.text}
              onChangeText={(t) => onChangeText(i, t)}
              placeholder="goal"
              placeholderTextColor={colors.line}
              multiline
              textAlign="center"
            />
            <Pressable hitSlop={6} onPress={() => onToggleDone(i)}>
              <Text style={[styles.check, g.done && styles.checkDone]}>
                {g.done ? '✓ done' : 'mark done'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  row: {
    flexDirection: 'row',
  },
  goalBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: colors.ink,
  },
  input: {
    minHeight: 52,
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlignVertical: 'center',
  },
  inputDone: {
    color: colors.green,
  },
  check: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  checkDone: {
    color: colors.green,
  },
});
