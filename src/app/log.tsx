import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Challenge } from '@/constants/challenge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useScreenPadding } from '@/hooks/use-screen-padding';
import { useTheme } from '@/hooks/use-theme';
import { checkWalk, MaxMessageLength, MaxNameLength } from '@/lib/walk-rules';
import { useWalks } from '@/lib/walks';

export default function LogScreen() {
  const { addWalk } = useWalks();
  const padding = useScreenPadding();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [milesText, setMilesText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const walk = {
      name: name.trim(),
      // Accept "2,5" as well as "2.5", since both are common ways to write decimals.
      miles: Math.round(Number(milesText.replace(',', '.')) * 10) / 10,
      message: message.trim() || undefined,
    };

    const problem = checkWalk(walk);
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addWalk(walk);
      setMilesText('');
      setMessage('');
      router.navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sorry, something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, padding]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText type="subtitle">Log your miles</ThemedText>
          <ThemedText themeColor="textSecondary">
            Every mile you walk is added to {Challenge.granddadName}&apos;s total.
          </ThemedText>
        </View>

        <Field label="Your name">
          <FormInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Auntie Sian"
            autoCapitalize="words"
            autoComplete="name"
            maxLength={MaxNameLength}
          />
        </Field>

        <Field label="Miles walked">
          <FormInput
            value={milesText}
            onChangeText={setMilesText}
            placeholder="e.g. 2.5"
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="A message for Granddad (optional)">
          <FormInput
            value={message}
            onChangeText={setMessage}
            placeholder="e.g. Walked along the beach for you!"
            multiline
            maxLength={MaxMessageLength}
            style={styles.messageInput}
          />
        </Field>

        {error ? <ThemedText style={{ color: theme.accent }}>{error}</ThemedText> : null}

        <PrimaryButton
          title={submitting ? 'Adding…' : 'Add my miles'}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </ScrollView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

function FormInput({ style, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        { backgroundColor: theme.backgroundElement, color: theme.text },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  messageInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
