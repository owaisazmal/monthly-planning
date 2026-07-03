import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  habits: string[];
  onChange: (slot: number, text: string) => void;
}

export default function HabitsList({ habits, onChange }: Props) {
  return (
    <View>
      <Text style={styles.title}>HABITS:</Text>
      {habits.map((h, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.num}>{i + 1}.</Text>
          <TextInput
            style={styles.input}
            value={h}
            onChangeText={(t) => onChange(i, t)}
            placeholder="add a habit…"
            placeholderTextColor={colors.line}
            autoCapitalize="characters"
            returnKeyType="done"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
    color: colors.ink,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    marginBottom: 4,
  },
  num: {
    width: 22,
    fontWeight: '700',
    fontSize: 14,
    color: colors.ink,
  },
  input: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
});
