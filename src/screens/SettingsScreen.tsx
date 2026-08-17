import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionHeader from '../components/SectionHeader';
import SegmentedControl from '../components/SegmentedControl';
import ThemeIcon from '../components/ThemeIcon';
import { Account, displayName } from '../auth';
import { FONT, Palette, RADIUS, ThemeMode, cardSurface, useTheme } from '../theme';

const THEME_OPTIONS = [
  { value: 'dark' as ThemeMode, label: 'DARK' },
  { value: 'light' as ThemeMode, label: 'LIGHT' },
] as const;

interface Props {
  account: Account | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function SettingsScreen({ account, onSignIn, onSignOut, onClose }: Props) {
  const { mode, palette, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const confirmSignOut = () =>
    Alert.alert(
      'Sign out?',
      'Your habits stay on this device either way.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: onSignOut },
      ],
      { cancelable: true }
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>SETTINGS</Text>
          <Pressable
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          {account ? (
            <>
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName(account).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {displayName(account)}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {account.email}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={confirmSignOut}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.ghostText}>SIGN OUT</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>Not signed in</Text>
              <Text style={styles.emptyBody}>
                Everything works without an account. Sign in to keep your habits when
                you change phones.
              </Text>
              <Pressable
                onPress={onSignIn}
                style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.primaryText}>SIGN IN</Text>
              </Pressable>
            </>
          )}
        </View>

        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              {/*
                ThemeIcon is built for the old header toggle, where it showed
                the mode you'd switch *to*. Here it labels the mode you're in,
                next to text that says so — so it takes the flipped value.
              */}
              <ThemeIcon mode={mode === 'dark' ? 'light' : 'dark'} color={palette.accent} size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Theme</Text>
              <Text style={styles.rowSub}>
                {mode === 'dark' ? 'Dark — ivory on charcoal' : 'Light — charcoal on ivory'}
              </Text>
            </View>
          </View>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={mode}
            // toggle() is the only mutator the theme exposes; tapping the mode
            // that is already on would flip it, so guard instead
            onChange={(next) => next !== mode && toggle()}
            verticalPadding={9}
          />
        </View>

        <Text style={styles.footer}>Your widgets follow this too.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 48,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 26,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
    },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: p.lineFaint,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeGlyph: {
      fontSize: 15,
      fontFamily: FONT.medium,
      color: p.ink,
      lineHeight: 18,
    },
    card: {
      ...cardSurface(p),
      padding: 16,
      marginBottom: 22,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: RADIUS.pill,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },
    avatarText: {
      fontSize: 20,
      fontFamily: FONT.bold,
      color: p.onAccent,
      // Josefin sits high in its line box; nudge the initial onto the circle's centre
      marginTop: 2,
    },
    identityText: {
      flex: 1,
    },
    name: {
      fontSize: 17,
      fontFamily: FONT.semibold,
      color: p.ink,
    },
    email: {
      marginTop: 1,
      fontSize: 13,
      fontFamily: FONT.regular,
      color: p.inkSoft,
    },
    ghostBtn: {
      marginTop: 16,
      height: 42,
      borderRadius: RADIUS.control,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostText: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.inkSoft,
    },
    emptyTitle: {
      fontSize: 17,
      fontFamily: FONT.semibold,
      color: p.ink,
    },
    emptyBody: {
      marginTop: 6,
      fontSize: 13,
      fontFamily: FONT.regular,
      lineHeight: 19,
      color: p.inkSoft,
    },
    primary: {
      marginTop: 16,
      height: 44,
      borderRadius: RADIUS.control,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.onAccent,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.chip,
      backgroundColor: p.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
      fontFamily: FONT.semibold,
      color: p.ink,
    },
    rowSub: {
      marginTop: 1,
      fontSize: 12,
      fontFamily: FONT.regular,
      color: p.inkSoft,
    },
    footer: {
      textAlign: 'center',
      fontSize: 11,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      opacity: 0.8,
    },
  });
