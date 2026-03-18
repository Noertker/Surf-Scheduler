import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable, StyleSheet } from 'react-native';
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
  compact?: boolean;
  onDetailsPress?: () => void;
}

function DayCardInner({
  date, predictions, hiLo, windows, wind, swell,
  tideMin, tideMax, dayStartHour, dayEndHour,
  compact = false, onDetailsPress,
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
    month: 'short',
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
      conditions_snapshot: null, feedback: null,
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

  // Shared crosshair state for synchronized charts (compact mode)
  const [activeTime, setActiveTime] = useState<Date | null>(null);
  const handleTimeChange = useCallback((time: Date | null) => {
    setActiveTime(time);
  }, []);

  // Find nearest readings for the unified tooltip
  const tooltipData = useMemo(() => {
    if (!activeTime) return null;
    const t = activeTime.getTime();

    let tide: { heightFt: number } | null = null;
    if (predictions.length > 0) {
      let bestDist = Infinity;
      for (const p of predictions) {
        const dist = Math.abs(p.timestamp.getTime() - t);
        if (dist < bestDist) { bestDist = dist; tide = p; }
      }
    }

    let windR: { speedMph: number; gustsMph: number; directionDeg: number } | null = null;
    if (dayWind.length > 0) {
      let bestDist = Infinity;
      for (const w of dayWind) {
        const dist = Math.abs(w.timestamp.getTime() - t);
        if (dist < bestDist) { bestDist = dist; windR = w; }
      }
    }

    let swellR: { heightFt: number; periodS: number; directionDeg: number } | null = null;
    if (daySwell.length > 0) {
      let bestDist = Infinity;
      for (const s of daySwell) {
        const dist = Math.abs(s.timestamp.getTime() - t);
        if (dist < bestDist) { bestDist = dist; swellR = s; }
      }
    }

    const timeStr = activeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return { timeStr, tide, wind: windR, swell: swellR };
  }, [activeTime, predictions, dayWind, daySwell]);

  const tideHeight = compact ? 100 : 200;
  const windHeight = compact ? 70 : 140;
  const swellHeight = compact ? 80 : 160;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Date header */}
      <View style={styles.dateRow}>
        <Text style={styles.dateHeader}>{dateStr}</Text>
        {onDetailsPress && (
          <Pressable onPress={onDetailsPress} hitSlop={8} style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </Pressable>
        )}
      </View>

      {/* Tide windows */}
      {sortedWindows.length > 0 ? (
        <View style={styles.windowsSection}>
          {!compact && <Text style={styles.sectionTitle}>TIDE WINDOWS</Text>}
          {sortedWindows.map((w, i) => {
            const selected = selectedIdx === i;
            const scheduling = schedulingIdx === i;
            return (
              <View key={i}>
                <Pressable
                  style={[
                    compact ? styles.windowRowCompact : styles.windowCard,
                    selected && styles.windowSelected,
                  ]}
                  onPress={() => setSelectedIdx(selected ? null : i)}
                >
                  {compact ? (
                    <View style={styles.windowRowInner}>
                      <Text style={styles.windowSpot}>{w.spotName}</Text>
                      <Text style={styles.windowTime}>
                        {formatTimeCompact(w.start)}-{formatTimeCompact(w.end)}
                      </Text>
                      <Text style={styles.windowTide}>
                        {w.startHeight.toFixed(1)}-{w.endHeight.toFixed(1)}ft
                      </Text>
                      {w.avgSwellFt != null && (
                        <Text style={styles.windowConditions}>
                          {w.avgSwellFt}ft {w.avgWindMph}mph
                        </Text>
                      )}
                      <Pressable
                        onPress={() => setSchedulingIdx(i)}
                        hitSlop={8}
                        style={styles.scheduleButtonSmall}
                      >
                        <Text style={styles.scheduleButtonText}>+</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.windowHeader}>
                        <Text style={styles.windowSpotFull}>{w.spotName}</Text>
                        <View style={styles.windowHeaderRight}>
                          <Text style={styles.windowTimeFull}>
                            {formatTimeCompact(w.start)} - {formatTimeCompact(w.end)}
                          </Text>
                          <Pressable
                            onPress={() => setSchedulingIdx(i)}
                            hitSlop={8}
                            style={styles.scheduleButton}
                          >
                            <Text style={styles.scheduleButtonText}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.windowDetails}>
                        <Text style={styles.windowTideFull}>
                          {w.startHeight.toFixed(1)}-{w.endHeight.toFixed(1)} ft
                        </Text>
                        {w.avgSwellFt != null && (
                          <Text style={styles.windowConditionsFull}>
                            {w.avgSwellFt}ft swell  {w.avgWindMph}mph g{w.avgGustsMph}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </Pressable>
                {scheduling && (
                  <View style={styles.scheduleForm}>
                    {!compact && <Text style={styles.scheduleFormTitle}>SCHEDULE SESSION</Text>}
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

      {/* Charts with floating tooltip overlay */}
      <View style={compact ? styles.chartsWrapper : undefined}>
        {/* Floating tooltip for synchronized crosshair (compact mode) */}
        {compact && tooltipData && (
          <View style={styles.tooltip} pointerEvents="none">
            <Text style={styles.tooltipTime}>{tooltipData.timeStr}</Text>
            <View style={styles.tooltipRow}>
              {tooltipData.tide && (
                <Text style={styles.tooltipItem}>
                  {tooltipData.tide.heightFt.toFixed(1)}ft tide
                </Text>
              )}
              {tooltipData.swell && (
                <Text style={styles.tooltipItem}>
                  {tooltipData.swell.heightFt}ft @ {Math.round(tooltipData.swell.periodS)}s swell
                </Text>
              )}
              {tooltipData.wind && (
                <Text style={styles.tooltipItem}>
                  {Math.round(tooltipData.wind.speedMph)}mph g{Math.round(tooltipData.wind.gustsMph)} wind
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tide chart — always rendered; TideChart returns null if no data */}
        <TideChart
          predictions={predictions}
          tideMin={tideMin}
          tideMax={tideMax}
          highlightWindow={highlightWindow}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
          height={tideHeight}
          interactive={true}
          {...(compact ? { activeTime, onTimeChange: handleTimeChange } : {})}
        />

        {/* Hi/Lo display */}
        {!compact && hiLo.length > 0 && (
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

        {/* Wind chart */}
        {dayWind.length > 0 && (
          <View style={!compact ? styles.chartSection : undefined}>
            {!compact && <Text style={styles.sectionTitle}>WIND (MPH)</Text>}
            <WindChart
              wind={dayWind}
              dayStartHour={dayStartHour}
              dayEndHour={dayEndHour}
              height={windHeight}
              interactive={true}
              {...(compact ? { activeTime, onTimeChange: handleTimeChange } : {})}
            />
          </View>
        )}

        {/* Swell chart */}
        {daySwell.length > 0 && (
          <View style={!compact ? styles.chartSection : undefined}>
            {!compact && <Text style={styles.sectionTitle}>SWELL (FT)</Text>}
            <SwellChart
              swell={daySwell}
              dayStartHour={dayStartHour}
              dayEndHour={dayEndHour}
              height={swellHeight}
              interactive={true}
              {...(compact ? { activeTime, onTimeChange: handleTimeChange } : {})}
            />
          </View>
        )}
      </View>

      {/* Hint for days without wind/swell data */}
      {dayWind.length === 0 && daySwell.length === 0 && (
        <Text style={styles.forecastHint}>Tide only — wind/swell forecast unavailable</Text>
      )}
    </View>
  );
}

export const DayCard = React.memo(DayCardInner, (prev, next) => {
  return (
    prev.date.getTime() === next.date.getTime() &&
    prev.windows.length === next.windows.length &&
    prev.predictions.length === next.predictions.length &&
    prev.compact === next.compact &&
    prev.tideMin === next.tideMin &&
    prev.tideMax === next.tideMax
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardCompact: {
    paddingVertical: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  dateHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  detailsButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  windowsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  // Compact window row
  windowRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    marginBottom: 4,
  },
  windowRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
  windowSpot: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  windowTime: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  windowTide: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  windowConditions: {
    fontSize: 10,
    color: colors.textDim,
    flex: 1,
  },
  scheduleButtonSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Full window card
  windowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.cardAlt,
  },
  windowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  windowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  windowHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  windowSpotFull: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  windowTimeFull: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  windowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  windowTideFull: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  windowConditionsFull: {
    fontSize: 12,
    color: colors.textDim,
  },
  scheduleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  scheduleForm: {
    marginTop: -4,
    marginBottom: 8,
  },
  scheduleFormTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  noWindows: {
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 13,
    color: colors.textDim,
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
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textDim,
    letterSpacing: 1,
  },
  hiLoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  hiLoTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  chartSection: {
    marginTop: 20,
  },
  forecastHint: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  chartsWrapper: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: colors.chartLabelBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tooltipTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  tooltipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  tooltipItem: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
