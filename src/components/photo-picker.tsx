import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PhotoPickerProps = {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
};

export function PhotoPicker({ photoUri, onChange }: PhotoPickerProps) {
  const theme = useTheme();

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: false,
    });
    if (result.canceled) {
      return;
    }

    // Shrink the photo on the phone first, so uploads are quick even on slow signal.
    const image = await ImageManipulator.manipulate(result.assets[0].uri)
      .resize({ width: 1200 })
      .renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
    onChange(saved.uri);
  }

  if (photoUri) {
    return (
      <View style={styles.preview}>
        <Image source={{ uri: photoUri }} style={styles.image} contentFit="cover" />
        <Pressable accessibilityRole="button" onPress={() => onChange(null)}>
          <ThemedText type="small" style={{ color: theme.accent }}>
            Remove photo
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={choosePhoto}>
      <ThemedView type="backgroundElement" style={styles.addButton}>
        <ThemedText themeColor="textSecondary">📷 Add a photo from your walk</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.three,
  },
  preview: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.three,
  },
});
