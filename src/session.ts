import * as SecureStore from 'expo-secure-store';

/**
 * Where an auth session token lives.
 *
 * Deliberately not AsyncStorage. AsyncStorage is plaintext on disk — a SQLite
 * row on Android, a file in the app container on iOS — readable from any debug
 * build with `adb run-as`, and from any release build on a rooted or
 * jailbroken device. That is fine for habit grids and fine for the name and
 * email in `auth.ts`; it is not fine for a credential that grants access to an
 * account.
 *
 * SecureStore puts the value in the iOS Keychain and the Android Keystore
 * instead, so it is encrypted at rest and tied to this app.
 *
 * Nothing calls this yet — there is no backend. It exists so that when one
 * arrives, the token has an obvious right place to go and no reason to end up
 * beside the rest of the app's storage. Whatever client is used (Supabase takes
 * a custom storage adapter; Firebase has its own persistence hook) should be
 * pointed here.
 *
 * Needs a native rebuild before first use — SecureStore ships native code, so
 * the currently installed dev builds don't have it yet.
 */

const TOKEN_KEY = 'monthly-planning.session';

/** Values are capped at 2048 bytes; a JWT is well under, a blob of state is not */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // a corrupt or unreadable entry should sign the user out, not crash the app
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // already gone
  }
}

/** Whether SecureStore is usable — false on web, where there's no keystore */
export function isAvailable(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}
