import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import SectionHeader from './SectionHeader';
import { useTheme, cardSurface, RADIUS } from '../theme';

interface Props {
  observations: string[];
  onChange: (index: number, text: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function Observations({ observations, onChange, onAdd, onRemove }: Props) {
  const { palette } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...cardSurface(palette),
          padding: 18,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: palette.lineFaint,
        },
        bullet: {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: palette.accent,
          marginRight: 10,
        },
        input: {
          flex: 1,
          paddingVertical: 10,
          fontSize: 14,
          color: palette.ink,
        },
        remove: {
          fontSize: 18,
          color: palette.inkSoft,
          paddingHorizontal: 6,
        },
        addBtn: {
          marginTop: 12,
          alignSelf: 'flex-start',
          backgroundColor: palette.accentSoft,
          borderRadius: RADIUS.control,
          paddingVertical: 9,
          paddingHorizontal: 16,
        },
        addText: {
          fontSize: 13,
          fontWeight: '800',
          color: palette.accent,
        },
      }),
    [palette]
  );

  return (
    <View style={styles.card}>
      <SectionHeader title="OBSERVATIONS" />
      {observations.map((o, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.bullet} />
          <TextInput
            style={styles.input}
            value={o}
            onChangeText={(t) => onChange(i, t)}
            placeholder="write it down…"
            placeholderTextColor={palette.inkSoft}
            multiline
          />
          {observations.length > 1 && (
            <Pressable
              hitSlop={8}
              onPress={() => onRemove(i)}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Text style={styles.remove}>×</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Pressable
        onPress={onAdd}
        hitSlop={8}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.addText}>＋ Add line</Text>
      </Pressable>
    </View>
  );
}
