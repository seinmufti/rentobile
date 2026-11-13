import { Platform, useWindowDimensions } from 'react-native';

/** Minimum browser width for the admin desktop dashboard. */
export const DESKTOP_MIN_WIDTH = 900;
/** Width of the phone-style column the user interface uses on wide screens. */
export const MOBILE_COLUMN_WIDTH = 480;

/** True in a desktop-sized web browser. Native apps (phones, tablets) are never "desktop". */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;
}

/** True when the screen is wider than the phone column (the user UI then centers itself). */
export function useIsWide() {
  const { width } = useWindowDimensions();
  return width > MOBILE_COLUMN_WIDTH + 40;
}
