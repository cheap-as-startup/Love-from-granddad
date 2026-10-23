import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';

// Keeps screen content clear of the notch, the home indicator and the tab bar.
export function useScreenPadding() {
  const insets = useSafeAreaInsets();

  return {
    // On web the tab bar sits at the top of the page instead of the bottom.
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.five : insets.top + Spacing.four,
    paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
    paddingLeft: insets.left + Spacing.four,
    paddingRight: insets.right + Spacing.four,
  };
}
