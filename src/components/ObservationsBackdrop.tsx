import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Palette, RADIUS, useTheme } from '../theme';

/**
 * Looping video behind the observations card, one cut per theme.
 *
 * The clips are the card's whole background, so everything here is about
 * staying out of the way: no controls, no sound, no touch target, and a veil
 * on top so the writing stays legible over whichever frame is showing.
 */

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

// Static paths, so Metro can find and bundle them — a computed path wouldn't
// be visible to the bundler.
const CUTS = {
  dark: require('../../assets/video/observations/dark.mp4'),
  light: require('../../assets/video/observations/light.mp4'),
} as const;

export default function ObservationsBackdrop() {
  const { mode, palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  // useVideoPlayer rebuilds on a new source and releases the old player, so
  // switching theme swaps the cut with no manual teardown.
  const player = useVideoPlayer(CUTS[mode], (p) => {
    p.loop = true;
    // both files carry an audio track; a backdrop must never make a sound
    p.muted = true;
    // ...and must never behave like media, either. Left on the default the
    // Android player takes audio focus and claims the media-button session,
    // so a decorative loop would pause the user's music and swallow the play
    // button on their headphones.
    p.audioMixingMode = 'mixWithOthers';
    p.play();
  });

  return (
    // Clipped here rather than on the card itself: `overflow: hidden` on the
    // card would take its drop shadow with it.
    <View style={styles.clip} pointerEvents="none">
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      <View style={styles.veil} />
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    clip: {
      ...FILL,
      borderRadius: RADIUS.card,
      overflow: 'hidden',
    },
    veil: {
      ...FILL,
      backgroundColor: p.videoVeil,
    },
  });
