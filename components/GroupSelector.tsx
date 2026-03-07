import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { SpotGroup } from '@/types/group';

interface Props {
  groups: SpotGroup[];
  activeGroupId: string | null;
  onSelect: (groupId: string) => void;
}

export function GroupSelector({ groups, activeGroupId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {groups.map((group) => {
        const active = group.id === activeGroupId;
        return (
          <Pressable
            key={group.id}
            onPress={() => onSelect(group.id)}
            style={[styles.pill, active && styles.activePill]}>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {group.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  activePill: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#fff',
  },
});
