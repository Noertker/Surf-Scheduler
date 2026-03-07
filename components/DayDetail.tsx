import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TideChart } from './TideChart';
import { WindChart } from './WindChart';
import { TidePrediction, TideWindow } from '@/types/tide';
import { WindReading, SwellReading } from '@/types/conditions';
import { formatTimeCompact, localDateKey } from '@/utils/tideWindows';

interface Props {
  visible: boolean;
  date: Date;
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  windows: TideWindow[];
  wind: WindReading[];
  swell: SwellReading[];
  tideMin?: number;
  tideMax?: number;
  dayStartHour?: number;
  dayEndHour?: number;
  onClose: () => void;
}

export function DayDetail({
  visible,
  date,
  predictions,
  hiLo,
  windows,
  wind,
  swell,
  tideMin,
  tideMax,
  dayStartHour,
  dayEndHour,
  onClose,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);

  const dateStr = date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Filter wind/swell to this day
  const dayKey = localDateKey(date);
  const dayWind = useMemo(
    () => wind.filter((r) => localDateKey(r.timestamp) === dayKey),
    [wind, dayKey]
  );
  const daySwell = useMemo(
    () => swell.filter((r) => localDateKey(r.timestamp) === dayKey),
    [swell, dayKey]
  );

  // Average swell for the day
  const avgSwell = useMemo(() => {
    if (daySwell.length === 0) return null;
    const avgHt = daySwell.reduce((s, r) => s + r.heightFt, 0) / daySwell.length;
    const avgPeriod = daySwell.reduce((s, r) => s + r.periodS, 0) / daySwell.length;
    return { heightFt: +avgHt.toFixed(1), periodS: Math.round(avgPeriod) };
  }, [daySwell]);

  // Sort windows by start time
  const sortedWindows = useMemo(
    () => [...windows].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [windows]
  );

  const selectedWindow = selectedIdx != null ? sortedWindows[selectedIdx] : null;

  // Build highlight for the tide chart based on selected window
  // Uses the selected spot's own tide preferences for the Y range
  const highlightWindow = useMemo(() => {
    if (!selectedWindow) return undefined;
    return {
      start: selectedWindow.start,
      end: selectedWindow.end,
      tideMin: selectedWindow.tideMinPref,
      tideMax: selectedWindow.tideMaxPref,
    };
  }, [selectedWindow]);

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={() => setSelectedIdx(0)}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{dateStr}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Window Cards */}
            {sortedWindows.length > 0 ? (
              <View style={styles.cardsSection}>
                <Text style={styles.sectionTitle}>Good Tide Windows</Text>
                {sortedWindows.map((w, i) => {
                  const selected = selectedIdx === i;
                  return (
                    <Pressable
                      key={i}
                      style={[styles.card, selected && styles.cardSelected]}
                      onPress={() => setSelectedIdx(selected ? null : i)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardSpot}>{w.spotName}</Text>
                        <Text style={styles.cardTime}>
                          {formatTimeCompact(w.start)} - {formatTimeCompact(w.end)}
                        </Text>
                      </View>
                      <View style={styles.cardDetails}>
                        <Text style={styles.cardTide}>
                          {w.startHeight.toFixed(1)}-{w.endHeight.toFixed(1)} ft tide
                        </Text>
                        {w.avgSwellFt != null && (
                          <Text style={styles.cardConditions}>
                            {w.avgSwellFt}ft swell{'  '}{w.avgWindMph}mph g{w.avgGustsMph}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noWindows}>
                No tide windows match your preferences for this day.
              </Text>
            )}

            {/* Tide Chart */}
            {predictions.length > 0 && (
              <TideChart
                predictions={predictions}
                tideMin={tideMin}
                tideMax={tideMax}
                highlightWindow={highlightWindow}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
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

            {/* Wind Chart */}
            {dayWind.length > 0 && (
              <View style={styles.windSection}>
                <Text style={styles.sectionTitle}>Wind (mph)</Text>
                <WindChart
                  wind={dayWind}
                  dayStartHour={dayStartHour}
                  dayEndHour={dayEndHour}
                />
                {avgSwell && (
                  <View style={styles.swellRow}>
                    <Text style={styles.swellLabel}>Avg Swell</Text>
                    <Text style={styles.swellValue}>
                      {avgSwell.heightFt} ft @ {avgSwell.periodS}s
                    </Text>
                  </View>
                )}
              </View>
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
  cardsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardSpot: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  cardTide: {
    fontSize: 13,
    opacity: 0.6,
  },
  cardConditions: {
    fontSize: 13,
    opacity: 0.5,
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
  noWindows: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
    opacity: 0.5,
  },
  windSection: {
    marginTop: 20,
  },
  swellRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  swellLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  swellValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
