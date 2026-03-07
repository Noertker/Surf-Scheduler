import React, { useState } from 'react';
import { Modal, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, View } from '@/components/Themed';
import { useSettingsStore } from '@/stores/useSettingsStore';

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
              minimumTrackTintColor="#2f95dc"
              maximumTrackTintColor="#ddd"
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
              minimumTrackTintColor="#2f95dc"
              maximumTrackTintColor="#ddd"
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
    marginBottom: 8,
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
  hint: {
    fontSize: 14,
    opacity: 0.6,
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
  saveButton: {
    backgroundColor: '#2f95dc',
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
