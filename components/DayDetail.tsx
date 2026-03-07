import React from 'react';
import { Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TideChart } from './TideChart';
import { TidePrediction, TideWindow } from '@/types/tide';
import { formatTimeCompact } from '@/utils/tideWindows';

interface Props {
  visible: boolean;
  date: Date;
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  windows: TideWindow[];
  tideMin?: number;
  tideMax?: number;
  onClose: () => void;
}

export function DayDetail({
  visible,
  date,
  predictions,
  hiLo,
  windows,
  tideMin,
  tideMax,
  onClose,
}: Props) {
  const dateStr = date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Group windows by spot
  const bySpot = new Map<string, TideWindow[]>();
  for (const w of windows) {
    const arr = bySpot.get(w.spotName) ?? [];
    arr.push(w);
    bySpot.set(w.spotName, arr);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{dateStr}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tide Chart */}
            {predictions.length > 0 && (
              <TideChart
                predictions={predictions}
                tideMin={tideMin}
                tideMax={tideMax}
              />
            )}

            {/* Hi/Lo Summary */}
            {hiLo.length > 0 && (
              <View style={styles.hiLoRow}>
                {hiLo.map((p, i) => (
                  <View key={i} style={styles.hiLoItem}>
                    <Text style={styles.hiLoType}>
                      {p.type === 'H' ? 'High' : 'Low'}
                    </Text>
                    <Text style={styles.hiLoValue}>
                      {p.heightFt.toFixed(1)} ft
                    </Text>
                    <Text style={styles.hiLoTime}>
                      {p.timestamp.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tide Windows by Spot */}
            {bySpot.size > 0 && (
              <View style={styles.windowsSection}>
                <Text style={styles.sectionTitle}>Good Windows</Text>
                {Array.from(bySpot.entries()).map(([spotName, spotWindows]) => (
                  <View key={spotName} style={styles.spotWindows}>
                    <Text style={styles.spotName}>{spotName}</Text>
                    {spotWindows.map((w, i) => (
                      <Text key={i} style={styles.windowTime}>
                        {formatTimeCompact(w.start)} - {formatTimeCompact(w.end)}
                        {'  '}({w.minHeight.toFixed(1)}-{w.maxHeight.toFixed(1)} ft)
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {windows.length === 0 && (
              <Text style={styles.noWindows}>
                No tide windows match your preferences for this day.
              </Text>
            )}
          </ScrollView>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.5,
    padding: 4,
  },
  hiLoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
  },
  hiLoItem: {
    alignItems: 'center',
  },
  hiLoType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  hiLoValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  hiLoTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  windowsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  spotWindows: {
    marginBottom: 12,
  },
  spotName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  windowTime: {
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 8,
    marginBottom: 2,
  },
  noWindows: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
    opacity: 0.5,
  },
});
