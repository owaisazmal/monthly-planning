import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RADIUS, useTheme } from '../theme';

/**
 * Round back control, sized and bordered like the header's settings button and
 * the month arrows — the auth flow's top-left corner is the same kind of place.
 */
export default function BackButton({
  onPress,
  label = 'Back',
}: {
  onPress: () => void;
  label?: string;
}) {
  const { palette } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          width: 44,
          height: 44,
          borderRadius: RADIUS.pill,
          borderWidth: 1,
          borderColor: palette.lineFaint,
          backgroundColor: palette.card,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [palette]
  );

  return (
    <Pressable
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // No android_ripple here: a borderless ripple swaps the view's background
      // for the ripple drawable, which takes the circle and its border with it.
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          // nudged right of centre: a chevron's visual mass sits at its elbow
          d="M14.2 5 L7.6 12 L14.2 19"
          stroke={palette.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}
