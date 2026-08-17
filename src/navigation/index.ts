/**
 * The screen stack. `ScreenLayer` and `useScreenTransition` are the mechanism —
 * how a layer slides, recedes and swipes back; `Navigator` is the policy — which
 * screens exist and what sits under what.
 *
 * Only the root should import from here. Anything Navigator renders has to
 * reach for `./ScreenLayer` directly, or it imports the barrel that imports it.
 */
export { default as Navigator } from './Navigator';
