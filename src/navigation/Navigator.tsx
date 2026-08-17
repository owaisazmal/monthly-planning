import { useState } from 'react';
import PlannerScreen from '../screens/PlannerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import { ScreenLayer, useScreenTransition } from './ScreenLayer';
import { Account } from '../auth';
import { ChartType } from '../storage';

type Screen = 'planner' | 'settings' | 'auth';
type AuthVariant = 'onboarding' | 'standalone';

export default function Navigator({
  initialScreen,
  account,
  chart,
  onSetChart,
  onSignIn,
  onSignOut,
  onSkipOnboarding,
}: {
  initialScreen: Exclude<Screen, 'settings'>;
  account: Account | null;
  chart: ChartType;
  onSetChart: (c: ChartType) => void;
  onSignIn: (account: Account) => void;
  onSignOut: () => void;
  onSkipOnboarding: () => void;
}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  // Frozen at the moment the auth screen opens rather than derived from the
  // account, which changes the instant someone signs in — mid-exit, that would
  // swap the screen's back button in behind the animation.
  const [authVariant, setAuthVariant] = useState<AuthVariant>(
    initialScreen === 'auth' ? 'onboarding' : 'standalone'
  );

  // Settings stays in the stack underneath a sign-in reached from it, so
  // dismissing that sign-in slides Settings back rather than rebuilding it.
  const settingsLayer = useScreenTransition(
    screen === 'settings' || (screen === 'auth' && authVariant === 'standalone')
  );
  const authLayer = useScreenTransition(screen === 'auth');

  const dismissAuth = () => {
    if (authVariant === 'standalone') {
      setScreen('settings');
    } else {
      onSkipOnboarding();
      setScreen('planner');
    }
  };

  const authenticated = (acc: Account) => {
    onSignIn(acc);
    // back to Settings if that's where the sign-in started, otherwise the
    // planner — which on first run is the screen behind the onboarding fade
    setScreen(authVariant === 'standalone' ? 'settings' : 'planner');
  };

  return (
    <>
      {/*
        The planner is never unmounted, so opening Settings doesn't throw away
        the open month, the selected day or the scroll position — and it keeps
        drawing through the transition, receding under whatever slides over it,
        until it is genuinely out of sight.
      */}
      <ScreenLayer
        coveredBy={settingsLayer.progress}
        hidden={settingsLayer.settledOpen || authLayer.settledOpen}
      >
        <PlannerScreen
          chart={chart}
          onSetChart={onSetChart}
          onOpenSettings={() => setScreen('settings')}
        />
      </ScreenLayer>

      <ScreenLayer
        transition={settingsLayer}
        coveredBy={authVariant === 'standalone' ? authLayer.progress : undefined}
        onSwipeBack={() => setScreen('planner')}
      >
        <SettingsScreen
          account={account}
          onSignIn={() => {
            setAuthVariant('standalone');
            setScreen('auth');
          }}
          onSignOut={onSignOut}
          onClose={() => setScreen('planner')}
        />
      </ScreenLayer>

      {/*
        First run has nothing behind it to push against, so the welcome screen
        rises into place instead of sliding in from the side — and there is
        nowhere to swipe back to.
      */}
      <ScreenLayer
        transition={authLayer}
        presentation={authVariant === 'onboarding' ? 'fade' : 'push'}
        swipeBackEnabled={authVariant === 'standalone'}
        onSwipeBack={dismissAuth}
      >
        <AuthScreen
          variant={authVariant}
          onAuthenticated={authenticated}
          onDismiss={dismissAuth}
        />
      </ScreenLayer>
    </>
  );
}
