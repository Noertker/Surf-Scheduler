import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet } from 'react-native';
import { View } from '@/components/shared/View';
import { Text } from '@/components/shared/Text';
import { BoardCard } from '@/components/surfer/BoardCard';
import { BoardEditor } from '@/components/surfer/BoardEditor';
import { useSurfboardStore } from '@/stores/useSurfboardStore';
import { Surfboard } from '@/types/surfboard';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

export function QuiverSection() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { boards, loading, fetchBoards, addBoard, editBoard, removeBoard } =
    useSurfboardStore();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Surfboard | undefined>();

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleAdd = () => {
    setEditingBoard(undefined);
    setEditorVisible(true);
  };

  const handleEdit = (board: Surfboard) => {
    setEditingBoard(board);
    setEditorVisible(true);
  };

  const handleDelete = (board: Surfboard) => {
    if (Platform.OS === 'web') {
      if (confirm(`Delete ${board.name}?`)) removeBoard(board.id);
    } else {
      Alert.alert('Delete Board', `Delete ${board.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeBoard(board.id) },
      ]);
    }
  };

  const handleSave = async (data: Omit<Surfboard, 'id' | 'created_at'>) => {
    if (editingBoard) {
      const { user_id, ...updates } = data;
      await editBoard(editingBoard.id, updates);
    } else {
      await addBoard(data);
    }
    setEditorVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View>
      {boards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No boards yet. Add your first board!</Text>
        </View>
      ) : (
        boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onEdit={() => handleEdit(board)}
            onDelete={() => handleDelete(board)}
          />
        ))
      )}

      <Pressable style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addText}>+ Add Board</Text>
      </Pressable>

      <BoardEditor
        visible={editorVisible}
        board={editingBoard}
        onSave={handleSave}
        onClose={() => setEditorVisible(false)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textDim,
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
