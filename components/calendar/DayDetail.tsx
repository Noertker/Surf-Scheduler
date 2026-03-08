import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { TideChart } from '@/components/charts/TideChart';
import { WindChart } from '@/components/charts/WindChart';
import { SwellChart } from '@/components/charts/SwellChart';
import { SessionTimeEditor } from '@/components/sessions/SessionTimeEditor';
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
    setSchedulingIdx(idx);
  };

  const handleConfirmSchedule = async (
    w: TideWindow,
    start: Date,
    end: Date,
    tideStartFt: number | null,
    tideEndFt: number | null,
  ) => {
    const startMs = start.getTime();
    const endMs = end.getTime();

    const tideStart = tideStartFt ?? w.startHeight;
    const tideEnd = tideEndFt ?? w.endHeight;

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

    const { getUserId } = require('@/services/supabase');
    await addSession({
      user_id: getUserId(), spot_id: w.spotId, spot_name: w.spotName,
      planned_start: start.toISOString(), planned_end: end.toISOString(),
      tide_start_ft: tideStart, tide_end_ft: tideEnd,
      avg_wind_mph: avgWind, avg_gusts_mph: avgGusts, avg_swell_ft: avgSwell,
      notes: null, gcal_event_id: null,
      completed: false, rating: null, board_id: null, wave_type: null, result_notes: null,
    });
    setSchedulingIdx(null);
    if (Platform.OS === 'web') {
      window.alert(`${w.spotName} added to your schedule.`);
    } else {
      Alert.alert('Scheduled!', `${w.spotName} added to your schedule.`);
    }
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
                      {scheduling && (
                        <View style={styles.scheduleForm}>
                          <Text style={styles.scheduleFormTitle}>SCHEDULE SESSION</Text>
                          <SessionTimeEditor
                            initialStart={new Date(w.start)}
                            initialEnd={new Date(w.end)}
                            predictions={predictions}
                            confirmLabel="+ SCHEDULE"
                            onCancel={() => setSchedulingIdx(null)}
                            onConfirm={(start, end, tideStartFt, tideEndFt) =>
                              handleConfirmSchedule(w, start, end, tideStartFt, tideEndFt)
                            }
                          />
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
    marginTop: -4, marginBottom: 8,
  },
  scheduleFormTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1, marginBottom: 8,
  },
});
