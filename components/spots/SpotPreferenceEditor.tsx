import React, { useState, useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Pressable, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { Spot } from '@/types/spot';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  spot: Spot;
  onClose: () => void;
}

export function SpotPreferenceEditor({ visible, spot, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { getPreferenceForSpot, savePreference } = usePreferenceStore();
  const existing = getPreferenceForSpot(spot.id);

  const [tideMin, setTideMin] = useState(existing?.tide_min_ft ?? 1.0);
  const [tideMax, setTideMax] = useState(existing?.tide_max_ft ?? 4.0);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  // Sync when spot or existing preference changes
  useEffect(() => {
    const pref = getPreferenceForSpot(spot.id);
    setTideMin(pref?.tide_min_ft ?? 1.0);
    setTideMax(pref?.tide_max_ft ?? 4.0);
    setEnabled(pref?.enabled ?? true);
  }, [spot.id]);

  const handleSave = async () => {
    // Ensure min <= max
    const finalMin = Math.min(tideMin, tideMax);
    const finalMax = Math.max(tideMin, tideMax);
    await savePreference(spot.id, finalMin, finalMax, enabled);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{spot.name}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Tide Range (ft)</Text>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Min</Text>
            <Slider
              style={styles.slider}
              minimumValue={-2}
              maximumValue={8}
              step={0.5}
              value={tideMin}
              onValueChange={setTideMin}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderLight}
            />
            <Text style={styles.sliderValue}>{tideMin.toFixed(1)}</Text>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Max</Text>
            <Slider
              style={styles.slider}
              minimumValue={-2}
              maximumValue={8}
              step={0.5}
              value={tideMax}
              onValueChange={setTideMax}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderLight}
            />
            <Text style={styles.sliderValue}>{tideMax.toFixed(1)}</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show on Dashboard</Text>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: colors.border, true: colors.primary }} />
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
    marginBottom: 20,
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
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    width: 36,
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
