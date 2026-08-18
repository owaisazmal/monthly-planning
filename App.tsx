import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuroraBackground from './src/components/AuroraBackground';
import { Navigator } from './src/navigation';
import { AuthState, loadAuth, saveAuth } from './src/auth';
import { loadIntroSeen, saveIntroSeen } from './src/onboarding';
import { Settings, loadSettings, saveSettings } from './src/storage';
import {
  ThemeContext,
  Theme,
  ThemeMode,
  darkPalette,
  lightPalette,
} from './src/theme';
import {
  useFonts,
  JosefinSans_400Regular,
  JosefinSans_400Regular_Italic,
  JosefinSans_500Medium,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
} from '@expo-google-fonts/josefin-sans';

/**
 * The root: persisted settings, the account, the font, and the theme every
 * screen reads from. Which screens exist and how they move is the Navigator's
 * job; what a month contains is the planner's.
 */
export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [start, setStart] = useState<'planner' | 'auth' | 'intro' | null>(null);
  const [fontsLoaded] = useFonts({
    JosefinSans_400Regular,
    JosefinSans_400Regular_Italic,
    JosefinSans_500Medium,
    JosefinSans_600SemiBold,
    JosefinSans_700Bold,
  });

  useEffect(() => {
    loadSettings().then(setSettings);
    // Neither the intro nor the welcome screen is shown to someone who has
    // already answered it, so the first screen can't be chosen until both
    // flags land. Intro first, then sign-in, then the planner.
    Promise.all([loadAuth(), loadIntroSeen()]).then(([a, introSeen]) => {
      setAuth(a);
      setStart(a.onboarded ? 'planner' : introSeen ? 'auth' : 'intro');
    });
  }, []);

  useEffect(() => {
    if (settings) saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (auth) saveAuth(auth);
  }, [auth]);

  const mode: ThemeMode = settings?.theme ?? 'dark';
  const theme: Theme = useMemo(
    () => ({
      mode,
      palette: mode === 'dark' ? darkPalette : lightPalette,
      toggle: () =>
        setSettings((prev) => ({
          theme: (prev?.theme ?? 'dark') === 'dark' ? 'light' : 'dark',
          chart: prev?.chart ?? 'radial',
        })),
    }),
    [mode]
  );

  // hold the first paint until the persisted theme, the account and the font
  // are all ready, so nothing flashes in the system font, the wrong palette, or
  // the wrong screen
  if (!settings || !auth || !start || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        {/* The drifting background sits behind every layer; screens are transparent so it reads through */}
        <View style={{ flex: 1, backgroundColor: theme.palette.bg }}>
          <AuroraBackground />
          <Navigator
            initialScreen={start}
            account={auth.account}
            chart={settings.chart}
            onSetChart={(chart) => setSettings((prev) => ({ ...(prev as Settings), chart }))}
            onSignIn={(account) => setAuth({ account, onboarded: true })}
            onSignOut={() => setAuth({ account: null, onboarded: true })}
            onSkipOnboarding={() => setAuth({ account: null, onboarded: true })}
            onIntroDone={saveIntroSeen}
          />
        </View>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
