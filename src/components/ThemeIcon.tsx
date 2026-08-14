import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Sun / moon for the theme toggle. Drawn rather than typed as "☀"/"☾" because
 * iOS renders those as full-colour emoji, which would put an orange outside the
 * brand palette in the header.
 */
export default function ThemeIcon({
  mode,
  color,
  size = 20,
}: {
  mode: 'dark' | 'light';
  color: string;
  size?: number;
}) {
  if (mode === 'dark') {
    // showing the sun means "switch to light"
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={4.4} stroke={color} strokeWidth={2} fill="none" />
        <Path
          d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.5 14.6A8.8 8.8 0 1 1 11.1 3.5a6.9 6.9 0 0 0 9.4 11.1z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
