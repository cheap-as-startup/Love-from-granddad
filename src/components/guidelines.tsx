import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const Rules = [
  'Keep it kind and family friendly — children use this app too.',
  'Use your first name or a family nickname. No phone numbers, addresses or links.',
  'Only share photos you took, and that everyone in them is happy to share.',
  'Every post is checked automatically before it appears.',
  'Posts reported by several people are hidden.',
];

export function Guidelines() {
  return (
    <ThemedView type="backgroundElement" style={styles.box}>
      <ThemedText type="smallBold">Before you post</ThemedText>
      {Rules.map((rule) => (
        <ThemedText key={rule} type="small" themeColor="textSecondary">
          • {rule}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
