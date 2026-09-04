import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoMark from '../components/LogoMark';
import { FONT, Palette, RADIUS, useTheme } from '../theme';
import { FadingStreak, MarkAndFlame, OpenSource, ThinkingClip } from './introArt';

/**
 * What the app is for, before anyone is asked to sign in.
 *
 * Terms first: what the app does with your data is the one thing a stranger
 * has no way to verify from the outside, so it is answered before any pitch
 * rather than buried in a policy nobody opens. Then the case, in the order
 * someone actually meets it — the problem, the part that turns out to matter,
 * and what it costs them daily. Two of the illustrations are the app's own
 * grid and marks, so the pitch is showing the product rather than stock
 * artwork of it.
 */

type PageKind = 'open' | 'grid' | 'clip' | 'marks';

const PAGES: { kind: PageKind; eyebrow: string; title: string; body: string }[] = [
  {
    kind: 'open',
    eyebrow: 'BEFORE ANYTHING ELSE',
    title: 'Built for myself.\nOpen to everyone.',
    body:
      'No analytics, no trackers, no account needed — your habits sit on your phone and go nowhere else. The source is public and stays that way for as long as this app exists. If something here bothers you, read it, fork it, and build the version you would rather use.',
  },
  {
    kind: 'grid',
    eyebrow: 'THE PROBLEM',
    title: 'Habits don’t break.\nThey fade.',
    body:
      'Nobody quits on purpose. You miss a Tuesday, then most of a week, and by the time it registers there is nothing to point at. A grid remembers the things memory quietly rounds off.',
  },
  {
    kind: 'clip',
    eyebrow: 'THE USEFUL PART',
    title: 'The reason matters\nmore than the miss.',
    body:
      'A blank square tells you what happened, never why. Every month keeps room for notes, so “travel weeks are hard” stops being a vague feeling and turns into something you can plan around.',
  },
  {
    kind: 'marks',
    eyebrow: 'WHAT IT COSTS YOU',
    title: 'One mark a day.',
    body:
      'Tick it or cross it — that is the entire ritual. The year fills in behind you, the streak keeps its own count, and widgets put it on your home screen so remembering is not your job.',
  },
];

export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const last = page === PAGES.length - 1;

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const advance = () => {
    if (last) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    // paging animates, but the button label shouldn't lag a whole scroll behind
    setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <LogoMark size={30} />
        <Pressable
          hitSlop={12}
          onPress={onDone}
          style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}
        >
          {/* holds its slot on the last page so the bar doesn't twitch */}
          <Text style={[styles.skipText, last && styles.skipSpent]}>SKIP</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef as never}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {PAGES.map((p) => (
          <View key={p.kind} style={[styles.page, { width }]}>
            <View style={styles.art}>
              {p.kind === 'open' ? <OpenSource palette={palette} /> : null}
              {p.kind === 'grid' ? <FadingStreak palette={palette} /> : null}
              {p.kind === 'clip' ? <ThinkingClip palette={palette} /> : null}
              {p.kind === 'marks' ? <MarkAndFlame palette={palette} /> : null}
            </View>
            <Text style={styles.eyebrow}>{p.eyebrow}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <Animated.View
              key={p.kind}
              style={[
                styles.dot,
                {
                  // The active dot stretches into a bar and hands that width to
                  // its neighbour as the page turns. Done with scaleX, not
                  // width: the scroll offset drives this on the native thread,
                  // and width is not a property the native driver can animate.
                  transform: [
                    {
                      scaleX: scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [1, 3.1, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                  opacity: scrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={advance}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.primaryText}>{last ? 'GET STARTED' : 'NEXT'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    topBar: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 4,
    },
    skip: { paddingVertical: 6, paddingHorizontal: 4 },
    skipText: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.inkSoft,
    },
    skipSpent: { opacity: 0 },
    page: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    art: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 34,
    },
    eyebrow: {
      fontSize: 10,
      fontFamily: FONT.bold,
      letterSpacing: 3,
      color: p.accent,
      marginBottom: 10,
    },
    title: {
      fontSize: 29,
      lineHeight: 35,
      fontFamily: FONT.bold,
      color: p.ink,
      marginBottom: 14,
    },
    body: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: FONT.regular,
      color: p.inkSoft,
    },
    footer: {
      paddingHorizontal: 30,
      paddingBottom: 12,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: RADIUS.pill,
      backgroundColor: p.accent,
      // scaleX grows it from the centre, so the row stays balanced as the
      // active dot expands; the gap absorbs the extra width
      marginHorizontal: 5,
    },
    primary: {
      height: 52,
      borderRadius: RADIUS.control,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      fontSize: 12,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.onAccent,
    },
  });
