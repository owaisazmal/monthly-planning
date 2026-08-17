import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ObservationsBackdrop from './ObservationsBackdrop';
import SectionHeader from './SectionHeader';
import { useTheme, cardSurface, RADIUS, FONT } from '../theme';

interface Props {
  observations: string[];
  onChange: (index: number, text: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M7 7 L17 17 M17 7 L7 17"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
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
        addBtn: {
          width: 30,
          height: 30,
          borderRadius: RADIUS.pill,
          backgroundColor: palette.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        /** rule under the header, as in the reference */
        divider: {
          height: 1,
          backgroundColor: palette.lineFaint,
          marginBottom: 14,
        },
        list: {
          gap: 10,
        },
        /** each line is its own raised pill rather than a bordered list row */
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.chip,
          borderRadius: RADIUS.control,
          paddingLeft: 14,
          paddingRight: 8,
        },
        dash: {
          width: 14,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: palette.accent,
          marginRight: 12,
        },
        input: {
          flex: 1,
          paddingVertical: 12,
          fontSize: 14,
          fontFamily: FONT.regular,
          color: palette.ink,
        },
        remove: {
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [palette]
  );

  return (
    <View style={styles.card}>
      {/* first child, so it sits under the header and the rows */}
      <ObservationsBackdrop />
      <SectionHeader
        title="OBSERVATIONS"
        right={
          <Pressable
            hitSlop={8}
            onPress={onAdd}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.6 }]}
          >
            <PlusGlyph color={palette.accent} />
          </Pressable>
        }
      />
      <View style={styles.divider} />
      <View style={styles.list}>
        {observations.map((o, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.dash} />
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
                style={({ pressed }) => [styles.remove, pressed && { opacity: 0.5 }]}
              >
                <CloseGlyph color={palette.inkSoft} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
