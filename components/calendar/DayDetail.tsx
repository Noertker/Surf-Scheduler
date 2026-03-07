import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { TideChart } from '@/components/charts/TideChart';
import { WindChart } from '@/components/charts/WindChart';
import { SwellChart } from '@/components/charts/SwellChart';
import { TidePrediction, TideWindow } from '@/types/tide';
import { WindReading, SwellReading } from '@/types/conditions';
import { formatTimeCompact, localDateKey } from '@/utils/tideWindows';
import { useSessionStore } from '@/stores/useSessionStore';

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
  onPrevDay?: () => void;
  onNextDay?: () => void;
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
  onPrevDay,
  onNextDay,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [schedulingIdx, setSchedulingIdx] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const { addSession } = useSessionStore();

  // Reset state when navigating between days
  useEffect(() => {
    setSelectedIdx(0);
    setSchedulingIdx(null);
  }, [date.getTime()]);

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

  // Sort windows by start time
  const sortedWindows = useMemo(
    () => [...windows].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [windows]
  );

  const selectedWindow = selectedIdx != null ? sortedWindows[selectedIdx] : null;

  const handleSchedulePress = (idx: number) => {
    const w = sortedWindows[idx];
    setSchedulingIdx(idx);
    setCustomStart(new Date(w.start));
    setCustomEnd(new Date(w.end));
  };

  const adjustTime = (which: 'start' | 'end', minutes: number) => {
    if (which === 'start' && customStart) {
      setCustomStart(new Date(customStart.getTime() + minutes * 60_000));
    } else if (which === 'end' && customEnd) {
      setCustomEnd(new Date(customEnd.getTime() + minutes * 60_000));
    }
  };

  const handleConfirmSchedule = async () => {
    if (schedulingIdx == null || !customStart || !customEnd) return;
    const w = sortedWindows[schedulingIdx];

    const startMs = customStart.getTime();
    const endMs = customEnd.getTime();

    // Compute tide height at the custom start/end from predictions
    const closestHeight = (target: number) => {
      let best = predictions[0];
      let bestDiff = Math.abs(best.timestamp.getTime() - target);
      for (const p of predictions) {
        const diff = Math.abs(p.timestamp.getTime() - target);
        if (diff < bestDiff) { best = p; bestDiff = diff; }
      }
      return best.heightFt;
    };
    const tideStart = predictions.length > 0 ? closestHeight(startMs) : w.startHeight;
    const tideEnd = predictions.length > 0 ? closestHeight(endMs) : w.endHeight;

    // Re-average wind/swell for the custom time range
    const windInRange = dayWind.filter(
      (r) => r.timestamp.getTime() >= startMs && r.timestamp.getTime() <= endMs
    );
    const swellInRange = daySwell.filter(
      (r) => r.timestamp.getTime() >= startMs && r.timestamp.getTime() <= endMs
    );

    const avgWind = windInRange.length > 0
      ? Math.round(windInRange.reduce((s, r) => s + r.speedMph, 0) / windInRange.length)
      : w.avgWindMph ?? null;
    const avgGusts = windInRange.length > 0
      ? Math.round(windInRange.reduce((s, r) => s + r.gustsMph, 0) / windInRange.length)
      : w.avgGustsMph ?? null;
    const avgSwell = swellInRange.length > 0
      ? +(swellInRange.reduce((s, r) => s + r.heightFt, 0) / swellInRange.length).toFixed(1)
      : w.avgSwellFt ?? null;

    await addSession({
      user_id: null,
      spot_id: w.spotId,
      spot_name: w.spotName,
      planned_start: customStart.toISOString(),
      planned_end: customEnd.toISOString(),
      tide_start_ft: tideStart,
      tide_end_ft: tideEnd,
      avg_wind_mph: avgWind,
      avg_gusts_mph: avgGusts,
      avg_swell_ft: avgSwell,
      notes: null,
      gcal_event_id: null,
    });
    setSchedulingIdx(null);
    Alert.alert('Scheduled!', `${w.spotName} added to your schedule.`);
  };

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
            <View style={styles.navRow}>
              {onPrevDay ? (
                <Pressable onPress={onPrevDay} hitSlop={12} style={styles.navArrow}>
                  <Text style={styles.navArrowText}>‹</Text>
                </Pressable>
              ) : <View style={styles.navArrow} />}
              <Text style={styles.title}>{dateStr}</Text>
              {onNextDay ? (
                <Pressable onPress={onNextDay} hitSlop={12} style={styles.navArrow}>
                  <Text style={styles.navArrowText}>›</Text>
                </Pressable>
              ) : <View style={styles.navArrow} />}
            </View>
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
                  const scheduling = schedulingIdx === i;
                  return (
                    <View key={i}>
                      <Pressable
                        style={[styles.card, selected && styles.cardSelected]}
                        onPress={() => setSelectedIdx(selected ? null : i)}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardSpot}>{w.spotName}</Text>
                          <View style={styles.cardHeaderRight}>
                            <Text style={styles.cardTime}>
                              {formatTimeCompact(w.start)} - {formatTimeCompact(w.end)}
                            </Text>
                            <Pressable
                              onPress={() => handleSchedulePress(i)}
                              hitSlop={8}
                              style={styles.scheduleButton}
                            >
                              <Text style={styles.scheduleButtonText}>+</Text>
                            </Pressable>
                          </View>
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
                      {scheduling && customStart && customEnd && (
                        <View style={styles.scheduleForm}>
                          <Text style={styles.scheduleFormTitle}>Schedule Session</Text>
                          <View style={styles.timeRow}>
                            <Text style={styles.timeLabel}>Start:</Text>
                            <Pressable onPress={() => adjustTime('start', -15)} hitSlop={4}>
                              <Text style={styles.timeAdjust}>-15m</Text>
                            </Pressable>
                            <Text style={styles.timeValue}>
                              {customStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                            <Pressable onPress={() => adjustTime('start', 15)} hitSlop={4}>
                              <Text style={styles.timeAdjust}>+15m</Text>
                            </Pressable>
                          </View>
                          <View style={styles.timeRow}>
                            <Text style={styles.timeLabel}>End:</Text>
                            <Pressable onPress={() => adjustTime('end', -15)} hitSlop={4}>
                              <Text style={styles.timeAdjust}>-15m</Text>
                            </Pressable>
                            <Text style={styles.timeValue}>
                              {customEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                            <Pressable onPress={() => adjustTime('end', 15)} hitSlop={4}>
                              <Text style={styles.timeAdjust}>+15m</Text>
                            </Pressable>
                          </View>
                          <View style={styles.scheduleActions}>
                            <Pressable onPress={() => setSchedulingIdx(null)} style={styles.cancelBtn}>
                              <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={handleConfirmSchedule} style={styles.confirmBtn}>
                              <Text style={styles.confirmText}>Add to Schedule</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
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
              </View>
            )}

            {/* Swell Chart */}
            {daySwell.length > 0 && (
              <View style={styles.windSection}>
                <Text style={styles.sectionTitle}>Swell (ft)</Text>
                <SwellChart
                  swell={daySwell}
                  dayStartHour={dayStartHour}
                  dayEndHour={dayEndHour}
                />
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  navArrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowText: {
    fontSize: 28,
    fontWeight: '600',
    opacity: 0.5,
    lineHeight: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  scheduleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
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
  scheduleForm: {
    marginTop: -4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.06)',
  },
  scheduleFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 40,
  },
  timeAdjust: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f95dc',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    opacity: 0.6,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2ecc71',
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
