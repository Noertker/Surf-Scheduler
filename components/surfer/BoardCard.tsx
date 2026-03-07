import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { Surfboard } from '@/types/surfboard';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  board: Surfboard;
  onEdit: () => void;
  onDelete: () => void;
}

export function BoardCard({ board, onEdit, onDelete }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const dims = `${board.length_ft}' x ${board.width_in}" x ${board.thickness_in}"`;
  const vol = board.volume_l ? `${board.volume_l}L` : null;

  return (
    <Pressable style={styles.card} onPress={onEdit}>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{board.name}</Text>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text style={styles.deleteText}>X</Text>
          </Pressable>
        </View>
        <Text style={styles.dims}>{dims}{vol ? ` / ${vol}` : ''}</Text>
        <View style={styles.tagsRow}>
          <Text style={styles.tag}>{board.fin_setup}</Text>
          <Text style={styles.tag}>{board.tail_shape} tail</Text>
          <Text style={styles.tag}>{board.nose_shape} nose</Text>
          <Text style={styles.tag}>NR: {board.nose_rocker}</Text>
          <Text style={styles.tag}>TR: {board.tail_rocker}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    backgroundColor: colors.card,
  },
  cardBody: {
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDim,
    padding: 4,
  },
  dims: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
});
