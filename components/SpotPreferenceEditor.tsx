import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Pressable, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, View } from '@/components/Themed';
import { Spot } from '@/types/spot';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

interface Props {
  visible: boolean;
  spot: Spot;
  onClose: () => void;
}

export function SpotPreferenceEditor({ visible, spot, onClose }: Props) {
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
              minimumTrackTintColor="#2f95dc"
              maximumTrackTintColor="#ddd"
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
              minimumTrackTintColor="#2f95dc"
              maximumTrackTintColor="#ddd"
            />
            <Text style={styles.sliderValue}>{tideMax.toFixed(1)}</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show on Dashboard</Text>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
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
  },
  closeButton: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.5,
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
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
  },
  saveButton: {
    backgroundColor: '#2f95dc',
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
