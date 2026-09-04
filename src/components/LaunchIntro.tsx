import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg from 'react-native-svg';
import { FONT, Palette, useTheme } from '../theme';
import { FILLED } from '../logo';
import { MARK_CELLS, MARK_VIEWBOX, MarkCells, MarkTick } from './LogoMark';

/**
 * The opening: the mark fills itself in, the way a month does.
 *
 * The pending ring fades up first, then the marked days land one sector at a
 * time, clockwise from the top, each blooming out from the centre with a
 * little overshoot; the tick drops onto the next day; the name rises under it.
 * Then the whole sheet lifts away, and the app — which has been sitting fully
 * drawn underneath the entire time — is simply there. Nothing is built during
 * the reveal, so the reveal is smooth.
 *
 * One clock drives everything. A single native-driven value counts
 * milliseconds from 0 to the end of the timeline, and every element reads its
 * own opacity and scale off it through keyframe interpolations. That is the
 * whole point: the JS thread is busiest exactly now, mounting the planner
 * underneath, and a stagger built from per-animation delays would wait on JS
 * timers it can't get — on a slow device the ring sat half-drawn for seconds,
 * then everything landed at once. Keyframes sampled from the easing curves
 * give the same motion with nothing left for JS to schedule.
 *
 * The clock starts from the sheet's first layout, and then only once two
 * frames have actually been drawn. Mounting a whole planner's worth of views
 * stalls the UI thread for a moment at launch, and a native animation started
 * into that stall takes its start time from a frame timestamp that is already
 * stale — its first real frame then lands most of the way through the run. On
 * a slow device the first frame anyone saw was the sheet already lifting.
 * Animation frames are only delivered while the UI thread is pumping, so two
 * of them in a row mean the stall is over and the clock's first tick will be
 * fresh. The sheet may sit blank for a beat on a starved device, but the whole
 * run is always watched from the start.
 *
 * Reduce Motion is honoured without waiting for it: the setting arrives
 * asynchronously, and if it says so before the first sector has moved, the
 * clock jumps straight to the settled mark, holds, and lifts. If it arrives
 * late the full run has already begun and is left to finish rather than
 * yanked backwards.
 */

type Curve = (t: number) => number;
type Span = readonly [start: number, end: number];

/**
 * Every span is [start, end] in ms on the one shared clock. The opening is the
 * quiet part — only the pending ring fading up — so a frame or two lost to a
 * slow first paint costs nothing that matters.
 */
const T = {
  pending: [0, 300] as Span,
  sector: (i: number): Span => [220 + i * 60, 220 + i * 60 + 300],
  tick: [860, 1160] as Span,
  sub: [570, 1010] as Span,
  title: [660, 1100] as Span,
  /** breathing room after the last element lands, then the sheet lifts */
  out: [1560, 1940] as Span,
};
/** everything has landed and nothing has started to leave */
const SETTLED = T.tick[1];
const END = T.out[1];
/** Reduce Motion can still take over up to here: nothing but the pending ring has moved */
const LATEST_SKIP = T.sector(0)[0];

const PENDING_CELLS = MARK_CELLS.filter((c) => c.state === 'empty');
const DAY_CELLS = Array.from({ length: FILLED }, (_, day) =>
  MARK_CELLS.filter((c) => c.day === day)
);

const easeOut = Easing.out(Easing.cubic);
const bloomOut = Easing.out(Easing.back(1.7));
const dropOut = Easing.out(Easing.back(2.2));
const lift = Easing.inOut(Easing.quad);

export default function LaunchIntro() {
  const { palette, mode } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const size = Math.round(Math.min(Math.max(Math.min(width, height) * 0.46, 150), 220));

  /** milliseconds into the timeline; the one value the native driver moves */
  const clock = useRef(new Animated.Value(0)).current;
  const [gone, setGone] = useState(false);

  const reduce = useRef<boolean | null>(null);
  const armed = useRef(false);
  const startedAt = useRef<number | null>(null);
  const playing = useRef<Animated.CompositeAnimation | null>(null);
  const unmounted = useRef(false);

  /** run the clock from `from` to the end, replacing whatever was running */
  const play = useCallback(
    (from: number) => {
      playing.current?.stop();
      if (from > 0) clock.setValue(from);
      playing.current = Animated.timing(clock, {
        toValue: END,
        duration: END - from,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      playing.current.start(({ finished }) => {
        if (finished && !unmounted.current) setGone(true);
      });
    },
    [clock]
  );

  useEffect(() => {
    unmounted.current = false;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (unmounted.current) return;
      reduce.current = on;
      const since = startedAt.current === null ? null : Date.now() - startedAt.current;
      // already running, but still in the quiet opening: skip the build
      if (on && since !== null && since <= LATEST_SKIP) play(SETTLED);
    });
    return () => {
      unmounted.current = true;
      playing.current?.stop();
    };
  }, [play]);

  /** the sheet is laid out: start the clock once frames are flowing */
  const begin = () => {
    if (armed.current) return;
    armed.current = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (unmounted.current) return;
        startedAt.current = Date.now();
        play(reduce.current ? SETTLED : 0);
      })
    );
  };

  /**
   * A property's journey over one span: `curve` sampled into keyframes, so an
   * overshooting ease reads as overshoot. Clamped, so the property holds its
   * start value until the span begins and its end value ever after.
   */
  const over = ([start, end]: Span, curve: Curve, from: number, to: number, steps = 12) => {
    const inputRange: number[] = [];
    const outputRange: number[] = [];
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      inputRange.push(start + (end - start) * u);
      outputRange.push(from + (to - from) * curve(u));
    }
    return clock.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
  };
  const bloom = (span: Span, from: number, curve: Curve) => ({
    opacity: over(span, easeOut, 0, 1),
    transform: [{ scale: over(span, curve, from, 1) }],
  });
  const rise = (span: Span) => ({
    opacity: over(span, easeOut, 0, 1),
    transform: [{ translateY: over(span, easeOut, 10, 0) }],
  });

  if (gone) return null;

  return (
    <Animated.View
      style={[styles.sheet, { opacity: over(T.out, lift, 1, 0) }]}
      onLayout={begin}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.stage,
          // the sheet grows slightly as it goes, so the app reads as coming forward
          { transform: [{ scale: over(T.out, lift, 1, 1.06) }] },
        ]}
      >
        <View style={{ width: size, height: size }}>
          <Animated.View style={[styles.layer, { opacity: over(T.pending, easeOut, 0, 1) }]}>
            <Svg width={size} height={size} viewBox={MARK_VIEWBOX}>
              <MarkCells cells={PENDING_CELLS} palette={palette} mode={mode} />
            </Svg>
          </Animated.View>
          {DAY_CELLS.map((cells, day) => (
            <Animated.View key={day} style={[styles.layer, bloom(T.sector(day), 0.5, bloomOut)]}>
              <Svg width={size} height={size} viewBox={MARK_VIEWBOX}>
                <MarkCells cells={cells} palette={palette} mode={mode} />
              </Svg>
            </Animated.View>
          ))}
          <Animated.View style={[styles.layer, bloom(T.tick, 0.7, dropOut)]}>
            <Svg width={size} height={size} viewBox={MARK_VIEWBOX}>
              <MarkTick palette={palette} />
            </Svg>
          </Animated.View>
        </View>
        <Animated.Text style={[styles.sub, rise(T.sub)]}>MONTHLY</Animated.Text>
        <Animated.Text style={[styles.title, rise(T.title)]}>PLANNING</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    sheet: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: p.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stage: {
      alignItems: 'center',
    },
    layer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sub: {
      marginTop: 28,
      marginBottom: 4,
      fontSize: 12,
      fontFamily: FONT.bold,
      letterSpacing: 4,
      color: p.accent,
    },
    title: {
      fontSize: 36,
      fontFamily: FONT.bold,
      letterSpacing: 1.5,
      color: p.ink,
    },
  });
