import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function TimeWindowEditor({ visible, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { dayStartHour, dayEndHour, saveTimeWindow } = useSettingsStore();

  const [start, setStart] = useState(dayStartHour);
  const [end, setEnd] = useState(dayEndHour);

  const handleSave = async () => {
    await saveTimeWindow(start, end);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Time Window</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Only show tide data and windows within this time range.
          </Text>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>From</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={23}
              step={1}
              value={start}
              onValueChange={setStart}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderLight}
            />
            <Text style={styles.sliderValue}>{formatHour(start)}</Text>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>To</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={24}
              step={1}
              value={end}
              onValueChange={setEnd}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderLight}
            />
            <Text style={styles.sliderValue}>{formatHour(end)}</Text>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
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
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  hint: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 52,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
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
