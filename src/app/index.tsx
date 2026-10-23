import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Challenge } from '@/constants/challenge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useScreenPadding } from '@/hooks/use-screen-padding';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { useWalks, type Walk } from '@/lib/walks';

function formatMiles(miles: number) {
  return miles.toLocaleString('en-GB', { maximumFractionDigits: 1 });
}

export default function HomeScreen() {
  const { walks, totalMiles, status, refresh } = useWalks();
  const theme = useTheme();
  const padding = useScreenPadding();
  const [refreshing, setRefreshing] = useState(false);

  // Runs when you pull down on the screen, to fetch the latest walks.
  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const progress = Math.min(totalMiles / Challenge.milesGoal, 1);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, padding]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.hero}>
          {/* Swap this placeholder for a photo of Granddad later */}
          <ThemedView type="backgroundElement" style={styles.photo}>
            <ThemedText style={styles.photoEmoji}>👴</ThemedText>
          </ThemedView>
          <ThemedText type="subtitle" style={styles.centered}>
            Walking with {Challenge.granddadName}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {Challenge.story}
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.total, { color: theme.accent }]}>
            {formatMiles(totalMiles)}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            of {formatMiles(Challenge.milesGoal)} miles walked together
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: theme.progress },
              ]}
            />
          </View>
        </ThemedView>

        <PrimaryButton title="Log my miles" onPress={() => router.navigate('/log')} />

        <View style={styles.wall}>
          <ThemedText type="smallBold">Wall of walks</ThemedText>
          {status === 'loading' && <ThemedText themeColor="textSecondary">Loading walks…</ThemedText>}
          {status === 'error' && (
            <ThemedText themeColor="textSecondary">
              Couldn&apos;t load the walks. Pull down to try again.
            </ThemedText>
          )}
          {status === 'ready' && walks.length === 0 && (
            <ThemedText themeColor="textSecondary">
              No walks yet — be the first to walk with {Challenge.granddadName}!
            </ThemedText>
          )}
          {walks.map((walk) => (
            <WalkRow key={walk.id} walk={walk} />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function WalkRow({ walk }: { walk: Walk }) {
  const { reportWalk } = useWalks();
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | string>('idle');
  const date = walk.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  async function handleReport() {
    const sure = await confirm(
      'Report this post?',
      "If it isn't family friendly, let us know. Posts reported by several people are hidden.",
      'Report',
    );
    if (!sure) {
      return;
    }
    setReportState('sending');
    try {
      await reportWalk(walk.id);
      setReportState('sent');
    } catch (e) {
      setReportState(e instanceof Error ? e.message : 'Sorry, something went wrong.');
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.walkRow}>
      <View style={styles.walkHeader}>
        <ThemedText type="smallBold">{walk.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatMiles(walk.miles)} mi · {date}
        </ThemedText>
      </View>
      {walk.message ? <ThemedText type="small">“{walk.message}”</ThemedText> : null}
      {walk.photoUrl ? (
        <Image
          source={{ uri: walk.photoUrl }}
          style={styles.walkPhoto}
          contentFit="cover"
          accessibilityLabel={`Photo from ${walk.name}'s walk`}
        />
      ) : null}
      <View style={styles.reportRow}>
        {reportState === 'idle' ? (
          <Pressable accessibilityRole="button" onPress={handleReport} hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary">
              Report
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {reportState === 'sending'
              ? 'Reporting…'
              : reportState === 'sent'
                ? 'Thanks — reported'
                : reportState}
          </ThemedText>
        )}
      </View>
    </ThemedView>
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
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 64,
    lineHeight: 76,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  total: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: 700,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  wall: {
    gap: Spacing.two,
  },
  walkRow: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  walkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  walkPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  reportRow: {
    alignItems: 'flex-end',
  },
});
