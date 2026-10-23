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
import { useWalks } from '@/lib/walks';

// Nobody walks more than this in one go — it catches typos like "50" instead of "5.0".
const MaxMilesPerWalk = 100;

export default function LogScreen() {
  const { addWalk } = useWalks();
  const padding = useScreenPadding();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [milesText, setMilesText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    // Accept "2,5" as well as "2.5", since both are common ways to write decimals.
    const miles = Number(milesText.replace(',', '.'));

    if (name.trim() === '') {
      setError('Please add your name so Granddad knows who walked with him.');
      return;
    }
    if (!Number.isFinite(miles) || miles <= 0) {
      setError('Please enter how many miles you walked, for example 2.5');
      return;
    }
    if (miles > MaxMilesPerWalk) {
      setError(`That's a long way! Please enter ${MaxMilesPerWalk} miles or fewer per walk.`);
      return;
    }

    addWalk({
      name: name.trim(),
      miles: Math.round(miles * 10) / 10,
      message: message.trim() || undefined,
    });

    setMilesText('');
    setMessage('');
    setError(null);
    router.navigate('/');
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
            maxLength={200}
            style={styles.messageInput}
          />
        </Field>

        {error ? <ThemedText style={{ color: theme.accent }}>{error}</ThemedText> : null}

        <PrimaryButton title="Add my miles" onPress={handleSubmit} />
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
