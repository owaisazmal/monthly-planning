import { setSnapshot } from '../../modules/widget-bridge';
import { WidgetSnapshot } from './snapshot';

/**
 * Best-effort push of the snapshot to the iOS widgets. The native module is
 * absent outside a dev/release build, and a widget failing to update should
 * never surface in the app, so everything here swallows errors.
 */
export function syncWidgets(snapshot: WidgetSnapshot): void {
  try {
    setSnapshot(JSON.stringify(snapshot));
  } catch {
    // ignored on purpose
  }
}
