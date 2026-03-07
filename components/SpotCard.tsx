import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Spot } from '@/types/spot';

interface Props {
  spot: Spot;
  selected: boolean;
  hasPreference?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function SpotCard({ spot, selected, hasPreference, onPress, onLongPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, selected && styles.selected]}>
      <View style={styles.inner}>
        <Text style={[styles.name, selected && styles.selectedText]}>
          {spot.name}
        </Text>
        {hasPreference && (
          <Text style={[styles.dot, selected && styles.selectedText]}>
            {' \u2699'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  selected: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  dot: {
    fontSize: 12,
    opacity: 0.7,
  },
});
