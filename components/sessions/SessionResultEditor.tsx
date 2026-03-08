import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { SurfSession, WaveType } from '@/types/session';
import { Surfboard } from '@/types/surfboard';
import { useSurfboardStore } from '@/stores/useSurfboardStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  session: SurfSession;
  onSave: (results: {
    rating: number;
    board_id?: string;
    wave_type?: WaveType;
    result_notes?: string;
  }) => void;
  onClose: () => void;
}

const WAVE_TYPES: WaveType[] = ['punchy', 'hollow', 'mushy'];
const RATINGS = [1, 2, 3, 4, 5];

export function SessionResultEditor({ visible, session, onSave, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { boards, fetchBoards } = useSurfboardStore();

  const [rating, setRating] = useState(session.rating ?? 3);
  const [boardId, setBoardId] = useState<string | undefined>(session.board_id ?? undefined);
  const [waveType, setWaveType] = useState<WaveType | undefined>(session.wave_type ?? undefined);
  const [notes, setNotes] = useState(session.result_notes ?? '');

  useEffect(() => {
    if (visible) fetchBoards();
  }, [visible]);

  const handleSave = () => {
    onSave({
      rating,
      board_id: boardId,
      wave_type: waveType,
      result_notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Session</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{session.spot_name}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rating */}
            <Text style={styles.fieldLabel}>RATING</Text>
            <View style={styles.ratingRow}>
              {RATINGS.map((r) => (
                <Pressable key={r} onPress={() => setRating(r)} style={styles.starBtn}>
                  <Text style={[styles.star, r <= rating && styles.starActive]}>
                    {r <= rating ? '\u2605' : '\u2606'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Wave Type */}
            <Text style={styles.fieldLabel}>WAVE TYPE</Text>
            <View style={styles.optionRow}>
              {WAVE_TYPES.map((wt) => (
                <Pressable
                  key={wt}
                  style={[styles.option, wt === waveType && styles.optionActive]}
                  onPress={() => setWaveType(wt === waveType ? undefined : wt)}
                >
                  <Text style={[styles.optionText, wt === waveType && styles.optionTextActive]}>
                    {wt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Board */}
            {boards.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>BOARD USED</Text>
                <View style={styles.optionRow}>
                  {boards.map((b) => (
                    <Pressable
                      key={b.id}
                      style={[styles.option, b.id === boardId && styles.optionActive]}
                      onPress={() => setBoardId(b.id === boardId ? undefined : b.id)}
                    >
                      <Text style={[styles.optionText, b.id === boardId && styles.optionTextActive]}>
                        {b.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Notes */}
            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How was the session?"
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Results</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayDark,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  starBtn: {
    padding: 4,
  },
  star: {
    fontSize: 28,
    color: colors.textDim,
  },
  starActive: {
    color: colors.warning,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.cardAlt,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
