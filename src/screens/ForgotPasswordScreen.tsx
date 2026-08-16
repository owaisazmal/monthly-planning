import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BackButton from '../components/BackButton';
import { isEmail } from '../auth';
import { FONT, Palette, RADIUS, cardSurface, useTheme } from '../theme';

interface Props {
  /** whatever was already typed on the sign-in form, so it isn't retyped */
  initialEmail: string;
  onBack: () => void;
}

export default function ForgotPasswordScreen({ initialEmail, onBack }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const [email, setEmail] = useState(initialEmail);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!isEmail(email)) {
      setError('Enter the email address you signed up with.');
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} label="Back to sign in" />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Text style={styles.brandSub}>RESET</Text>
            <Text style={styles.brandTitle}>PASSWORD</Text>
            <Text style={styles.tagline}>
              {sent
                ? 'The streak is still there. Just the password moved.'
                : "We'll send a link to set a new one."}
            </Text>
          </View>

          {sent ? (
            <View style={styles.card}>
              <View style={styles.sealRow}>
                <View style={styles.seal}>
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Path
                      d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
                      stroke={palette.onAccent}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                </View>
              </View>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentBody}>
                If an account exists for{' '}
                <Text style={styles.sentEmail}>{email.trim()}</Text>, a reset link is on
                its way. It expires in an hour.
              </Text>

              <Pressable
                onPress={onBack}
                style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.primaryText}>BACK TO SIGN IN</Text>
              </Pressable>

              <Pressable
                hitSlop={8}
                onPress={() => setSent(false)}
                style={({ pressed }) => [styles.quiet, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.quietText}>Use a different email</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.inkSoft}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                autoFocus={initialEmail === ''}
                returnKeyType="go"
                onSubmitEditing={send}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={send}
                style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.primaryText}>SEND RESET LINK</Text>
              </Pressable>

              <Text style={styles.fine}>
                Nothing on this device changes. Your habits and streak stay exactly where
                they are.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    topBar: {
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: 20,
      marginTop: 4,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 28,
    },
    brand: {
      alignItems: 'center',
      marginBottom: 22,
    },
    brandSub: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 4,
      color: p.accent,
      marginBottom: 2,
    },
    brandTitle: {
      fontSize: 32,
      fontFamily: FONT.bold,
      letterSpacing: 1,
      color: p.ink,
    },
    tagline: {
      marginTop: 8,
      fontSize: 13,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      textAlign: 'center',
    },
    card: {
      ...cardSurface(p),
      padding: 18,
    },
    label: {
      fontSize: 10,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.inkSoft,
      marginBottom: 6,
    },
    input: {
      backgroundColor: p.chip,
      borderRadius: RADIUS.control,
      borderWidth: 1,
      borderColor: p.lineFaint,
      paddingHorizontal: 13,
      paddingVertical: Platform.OS === 'ios' ? 13 : 9,
      fontSize: 15,
      fontFamily: FONT.medium,
      color: p.ink,
      marginBottom: 16,
    },
    inputFocused: {
      borderColor: p.accent,
    },
    error: {
      fontSize: 12,
      fontFamily: FONT.medium,
      color: p.missed,
      marginTop: -8,
      marginBottom: 12,
    },
    primary: {
      height: 48,
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
    fine: {
      marginTop: 14,
      fontSize: 11,
      fontFamily: FONT.regular,
      lineHeight: 16,
      color: p.inkSoft,
      textAlign: 'center',
    },
    sealRow: {
      alignItems: 'center',
      marginBottom: 14,
    },
    seal: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.pill,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sentTitle: {
      fontSize: 19,
      fontFamily: FONT.semibold,
      color: p.ink,
      textAlign: 'center',
    },
    sentBody: {
      marginTop: 8,
      marginBottom: 20,
      fontSize: 13,
      fontFamily: FONT.regular,
      lineHeight: 20,
      color: p.inkSoft,
      textAlign: 'center',
    },
    sentEmail: {
      fontFamily: FONT.semibold,
      color: p.ink,
    },
    quiet: {
      alignSelf: 'center',
      marginTop: 14,
    },
    quietText: {
      fontSize: 12,
      fontFamily: FONT.medium,
      color: p.inkSoft,
      textDecorationLine: 'underline',
    },
  });
