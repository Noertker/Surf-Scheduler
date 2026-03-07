import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { TideChart } from '@/components/charts/TideChart';
import { WindChart } from '@/components/charts/WindChart';
import { SwellChart } from '@/components/charts/SwellChart';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
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
  visible, date, predictions, hiLo, windows, wind, swell,
  tideMin, tideMax, dayStartHour, dayEndHour,
  onClose, onPrevDay, onNextDay,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [schedulingIdx, setSchedulingIdx] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const { addSession } = useSessionStore();

  useEffect(() => {
    setSelectedIdx(0);
    setSchedulingIdx(null);
  }, [date.getTime()]);

  const dateStr = date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dayKey = localDateKey(date);
  const dayWind = useMemo(
    () => wind.filter((r) => localDateKey(r.timestamp) === dayKey),
    [wind, dayKey]
  );
  const daySwell = useMemo(
    () => swell.filter((r) => localDateKey(r.timestamp) === dayKey),
    [swell, dayKey]
  );

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
      user_id: null, spot_id: w.spotId, spot_name: w.spotName,
      planned_start: customStart.toISOString(), planned_end: customEnd.toISOString(),
      tide_start_ft: tideStart, tide_end_ft: tideEnd,
      avg_wind_mph: avgWind, avg_gusts_mph: avgGusts, avg_swell_ft: avgSwell,
      notes: null, gcal_event_id: null,
      completed: false, rating: null, board_id: null, wave_type: null, result_notes: null,
    });
    setSchedulingIdx(null);
    Alert.alert('Scheduled!', `${w.spotName} added to your schedule.`);
  };

  const highlightWindow = useMemo(() => {
    if (!selectedWindow) return undefined;
    return {
      start: selectedWindow.start, end: selectedWindow.end,
      tideMin: selectedWindow.tideMinPref, tideMax: selectedWindow.tideMaxPref,
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
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {sortedWindows.length > 0 ? (
              <View style={styles.cardsSection}>
                <Text style={styles.sectionTitle}>TIDE WINDOWS</Text>
                {sortedWindows.map((w, i) => {
                  const selected = selectedIdx === i;
                  const scheduling = schedulingIdx === i;
                  return (
                    <View key={i}>
                      <Pressable
                        style={[styles.card, selected && styles.cardSelected]}
                        onPress={() => setSelectedIdx(selected ? null : i)}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardSpot}>{w.spotName}</Text>
                          <View style={styles.cardHeaderRight}>
                            <Text style={styles.cardTime}>
                              {formatTimeCompact(w.start)} - {formatTimeCompact(w.end)}
                            </Text>
                            <Pressable
                              onPress={() => handleSchedulePress(i)}
                              hitSlop={8}
                              style={styles.scheduleButton}>
                              <Text style={styles.scheduleButtonText}>+</Text>
                            </Pressable>
                          </View>
                        </View>
                        <View style={styles.cardDetails}>
                          <Text style={styles.cardTide}>
                            {w.startHeight.toFixed(1)}-{w.endHeight.toFixed(1)} ft
                          </Text>
                          {w.avgSwellFt != null && (
                            <Text style={styles.cardConditions}>
                              {w.avgSwellFt}ft swell  {w.avgWindMph}mph g{w.avgGustsMph}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                      {scheduling && customStart && customEnd && (
                        <View style={styles.scheduleForm}>
                          <Text style={styles.scheduleFormTitle}>SCHEDULE SESSION</Text>
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
                              <Text style={styles.confirmText}>+ SCHEDULE</Text>
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

            {hiLo.length > 0 && (
              <View style={styles.hiLoRow}>
                {hiLo.map((p, i) => (
                  <View key={i} style={styles.hiLoItem}>
                    <Text style={styles.hiLoType}>
                      {p.type === 'H' ? 'HIGH' : 'LOW'}
                    </Text>
                    <Text style={styles.hiLoValue}>
                      {p.heightFt.toFixed(1)} ft
                    </Text>
                    <Text style={styles.hiLoTime}>
                      {p.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {dayWind.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>WIND (MPH)</Text>
                <WindChart wind={dayWind} dayStartHour={dayStartHour} dayEndHour={dayEndHour} />
              </View>
            )}

            {daySwell.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>SWELL (FT)</Text>
                <SwellChart swell={daySwell} dayStartHour={dayStartHour} dayEndHour={dayEndHour} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayDark },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
    backgroundColor: 'transparent',
  },
  navArrow: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  navArrowText: { fontSize: 28, fontWeight: '600', color: colors.primary, lineHeight: 32 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1, color: colors.text },
  closeButton: { fontSize: 16, fontWeight: '600', color: colors.textTertiary, padding: 4 },
  cardsSection: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textDim,
    letterSpacing: 1.5, marginBottom: 10,
  },
  card: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, marginBottom: 8, backgroundColor: colors.cardAlt,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDark },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: 'transparent',
  },
  cardHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent',
  },
  scheduleButton: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  scheduleButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  cardSpot: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  cardTime: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  cardDetails: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4, backgroundColor: 'transparent',
  },
  cardTide: { fontSize: 12, color: colors.textTertiary },
  cardConditions: { fontSize: 12, color: colors.textDim },
  hiLoRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingVertical: 12 },
  hiLoItem: { alignItems: 'center' },
  hiLoType: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
    color: colors.textDim, letterSpacing: 1,
  },
  hiLoValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  hiLoTime: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  noWindows: { textAlign: 'center', marginTop: 16, marginBottom: 16, fontSize: 13, color: colors.textDim },
  chartSection: { marginTop: 20 },
  scheduleForm: {
    marginTop: -4, marginBottom: 8, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryDark,
  },
  scheduleFormTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1, marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 6, backgroundColor: 'transparent',
  },
  timeLabel: { fontSize: 13, fontWeight: '600', width: 40, color: colors.textSecondary },
  timeAdjust: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  timeValue: { fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'center', color: colors.text },
  scheduleActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    marginTop: 8, backgroundColor: 'transparent',
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  cancelText: { fontSize: 13, color: colors.textTertiary },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 6 },
  confirmText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
