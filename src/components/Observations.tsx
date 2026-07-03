import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import { colors } from '../theme';

interface Props {
  observations: string[];
  onChange: (index: number, text: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function Observations({ observations, onChange, onAdd, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <SectionHeader title="OBSERVATIONS" />
      <View style={styles.body}>
        {observations.map((o, i) => (
          <View key={i} style={styles.row}>
            <TextInput
              style={styles.input}
              value={o}
              onChangeText={(t) => onChange(i, t)}
              placeholder="…"
              placeholderTextColor={colors.line}
              multiline
            />
            {observations.length > 1 && (
              <Pressable hitSlop={8} onPress={() => onRemove(i)}>
                <Text style={styles.remove}>×</Text>
              </Pressable>
            )}
          </View>
        ))}
        <Pressable onPress={onAdd} hitSlop={8}>
          <Text style={styles.add}>+ add line</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink,
  },
  remove: {
    fontSize: 18,
    color: colors.inkSoft,
    paddingHorizontal: 4,
  },
  add: {
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
  },
});
