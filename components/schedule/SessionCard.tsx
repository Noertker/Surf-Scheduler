import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { CalendarSyncButton } from '@/components/schedule/CalendarSyncButton';
import { LiveForecast, degToCompass } from '@/hooks/useScheduleForecasts';
import { SurfSession } from '@/types/session';
import { TidePrediction } from '@/types/tide';
import { useSpotStore } from '@/stores/useSpotStore';
import { getTidePredictions } from '@/services/noaa';
import { computeTimelinePredictions } from '@/services/tidePredictor';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  session: SurfSession;
  forecast?: LiveForecast;
  onDelete: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onLogResults?: () => void;
  isPast?: boolean;
}

export function SessionCard({ session, forecast, onDelete, onUpdate, onLogResults, isPast }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const spots = useSpotStore((s) => s.spots);
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState<Date | null>(null);
  const [editEnd, setEditEnd] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [editTides, setEditTides] = useState<TidePrediction[]>([]);

  const start = new Date(session.planned_start);
  const end = new Date(session.planned_end);

  const dateStr = start.toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const timeStr = `${fmtTime(start)} - ${fmtTime(end)}`;

  // Fetch tide predictions when editing starts
  useEffect(() => {
    if (!editing) { setEditTides([]); return; }
    const spot = spots.find((sp) => sp.id === session.spot_id);
    if (!spot?.noaa_station_id) return;

    const dayStart = new Date(session.planned_start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    (async () => {
      try {
        const preds = await getTidePredictions(spot.noaa_station_id!, dayStart, dayEnd, '6');
        setEditTides(preds);
      } catch {
        try {
          const preds = computeTimelinePredictions(spot.noaa_station_id!, dayStart, dayEnd);
          setEditTides(preds);
        } catch { /* ignore */ }
      }
    })();
  }, [editing]);

  // Interpolate tide height from predictions
  const interpolateTide = (targetMs: number): number | null => {
    if (editTides.length === 0) return null;
    let best = editTides[0];
    let bestDiff = Math.abs(best.timestamp.getTime() - targetMs);
    for (const p of editTides) {
      const diff = Math.abs(p.timestamp.getTime() - targetMs);
      if (diff < bestDiff) { best = p; bestDiff = diff; }
    }
    return best.heightFt;
  };

  const editTideStart = useMemo(
    () => editStart ? interpolateTide(editStart.getTime()) : null,
    [editTides, editStart]
  );
  const editTideEnd = useMemo(
    () => editEnd ? interpolateTide(editEnd.getTime()) : null,
    [editTides, editEnd]
  );

  const handleEditStart = () => {
    setEditing(true);
    setEditStart(new Date(start));
    setEditEnd(new Date(end));
  };

  const adjustTime = (which: 'start' | 'end', minutes: number) => {
    if (which === 'start' && editStart) {
      setEditStart(new Date(editStart.getTime() + minutes * 60_000));
    } else if (which === 'end' && editEnd) {
      setEditEnd(new Date(editEnd.getTime() + minutes * 60_000));
    }
  };

  const handleSave = async () => {
    if (!editStart || !editEnd) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        planned_start: editStart.toISOString(),
        planned_end: editEnd.toISOString(),
      };
      if (editTideStart != null) updates.tide_start_ft = editTideStart;
      if (editTideEnd != null) updates.tide_end_ft = editTideEnd;

      await onUpdate(session.id, updates);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
    setEditing(false);
  };

  // Use live forecast if available, fall back to snapshot
  const tide = forecast?.tide ?? (
    session.tide_start_ft != null && session.tide_end_ft != null
      ? { startFt: session.tide_start_ft, endFt: session.tide_end_ft }
      : null
  );
  const wind = forecast?.wind ?? (
    session.avg_wind_mph != null
      ? { avgMph: session.avg_wind_mph, avgGustsMph: session.avg_gusts_mph ?? 0, directionDeg: 0 }
      : null
  );
  const swell = forecast?.swell ?? null;
  const hasLive = !!forecast;

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          {/* Left: spot, date, time */}
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardSpot}>{session.spot_name}</Text>
            <Text style={styles.cardDate}>{dateStr}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>

          {/* Center: live forecast conditions */}
          <View style={styles.cardConditions}>
            {tide && (
              <Text style={styles.conditionLine}>
                {tide.startFt.toFixed(1)}{'\u2192'}{tide.endFt.toFixed(1)}ft
              </Text>
            )}
            {wind && (
              <Text style={styles.conditionLine}>
                {wind.avgMph}mph{wind.directionDeg ? ` ${degToCompass(wind.directionDeg)}` : ''} g{wind.avgGustsMph}
              </Text>
            )}
            {swell ? (
              <>
                <Text style={styles.conditionLine}>
                  {swell.primaryHeightFt}ft@{swell.primaryPeakPeriodS ?? swell.primaryPeriodS}s {degToCompass(swell.primaryDirectionDeg)}
                </Text>
                {swell.secondaryHeightFt != null && swell.secondaryDirectionDeg != null && (
                  <Text style={styles.secondarySwell}>
                    +{swell.secondaryHeightFt}ft@{swell.secondaryPeriodS}s {degToCompass(swell.secondaryDirectionDeg)}
                  </Text>
                )}
                <Text style={styles.combinedSwell}>
                  {swell.combinedHeightFt}ft comb | {swell.energyKj}kJ
                </Text>
              </>
            ) : session.avg_swell_ft != null && !hasLive ? (
              <Text style={styles.conditionLine}>
                {session.avg_swell_ft}ft swell
              </Text>
            ) : null}
          </View>

          {/* Right: Edit + Sync + Log + X */}
          <View style={styles.cardActions}>
            {!isPast && !editing && (
              <>
                <Pressable onPress={handleEditStart} hitSlop={8} style={styles.editBtn}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <CalendarSyncButton session={session} />
              </>
            )}
            {isPast && !session.completed && onLogResults && (
              <Pressable onPress={onLogResults} hitSlop={8} style={styles.editBtn}>
                <Text style={styles.editText}>Log</Text>
              </Pressable>
            )}
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>X</Text>
            </Pressable>
          </View>
        </View>

        {/* Results row for completed sessions */}
        {session.completed && (
          <View style={styles.resultsRow}>
            <Text style={styles.resultStars}>
              {'\u2605'.repeat(session.rating ?? 0)}{'\u2606'.repeat(5 - (session.rating ?? 0))}
            </Text>
            {session.wave_type && (
              <Text style={styles.resultTag}>{session.wave_type}</Text>
            )}
          </View>
        )}

        {/* Edit mode */}
        {editing && editStart && editEnd && (
          <View style={styles.editForm}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Start:</Text>
              <Pressable onPress={() => adjustTime('start', -15)} hitSlop={4}>
                <Text style={styles.timeAdjust}>-15m</Text>
              </Pressable>
              <Text style={styles.timeValue}>{fmtTime(editStart)}</Text>
              <Pressable onPress={() => adjustTime('start', 15)} hitSlop={4}>
                <Text style={styles.timeAdjust}>+15m</Text>
              </Pressable>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>End:</Text>
              <Pressable onPress={() => adjustTime('end', -15)} hitSlop={4}>
                <Text style={styles.timeAdjust}>-15m</Text>
              </Pressable>
              <Text style={styles.timeValue}>{fmtTime(editEnd)}</Text>
              <Pressable onPress={() => adjustTime('end', 15)} hitSlop={4}>
                <Text style={styles.timeAdjust}>+15m</Text>
              </Pressable>
            </View>
            {editTideStart != null && editTideEnd != null && (
              <View style={styles.tidePreviewRow}>
                <Text style={styles.tidePreviewLabel}>Tide:</Text>
                <Text style={styles.tidePreviewValue}>
                  {editTideStart.toFixed(1)}ft {'\u2192'} {editTideEnd.toFixed(1)}ft
                </Text>
              </View>
            )}
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  cardPast: {
    opacity: 0.35,
  },
  cardBody: {
    backgroundColor: 'transparent',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  cardTitleArea: {
    width: '25%',
    backgroundColor: 'transparent',
  },
  cardConditions: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'transparent',
    width: '25%',
  },
  cardSpot: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    color: colors.text,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardTime: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  editBtn: {
    padding: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDim,
  },
  editForm: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
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
    color: colors.textSecondary,
  },
  timeAdjust: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tidePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  tidePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  tidePreviewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  conditionLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  secondarySwell: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 2,
    paddingLeft: 8,
  },
  combinedSwell: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: 'transparent',
  },
  resultStars: {
    fontSize: 14,
    color: colors.warning,
  },
  resultTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
});
