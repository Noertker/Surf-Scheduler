import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { Spot } from '@/types/spot';

interface Props {
  spot: Spot;
  selected: boolean;
  onPress: () => void;
}

export function SpotCard({ spot, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}>
      <Text style={[styles.name, selected && styles.selectedText]}>
        {spot.name}
      </Text>
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
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
});
