import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
};

export function PrimaryButton({ title, disabled, ...rest }: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accent },
        (pressed || disabled) && styles.dimmed,
      ]}
      {...rest}>
      <ThemedText type="smallBold" style={styles.label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
  },
});
