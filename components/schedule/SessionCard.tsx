import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { LiveForecast, degToCompass } from '@/hooks/useScheduleForecasts';
import { SurfSession } from '@/types/session';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  session: SurfSession;
  forecast?: LiveForecast;
  onDelete: () => void;
  onUpdate: (id: string, updates: Partial<Pick<SurfSession, 'planned_start' | 'planned_end' | 'notes'>>) => Promise<void>;
  isPast?: boolean;
}

export function SessionCard({ session, forecast, onDelete, onUpdate, isPast }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState<Date | null>(null);
  const [editEnd, setEditEnd] = useState<Date | null>(null);

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
    await onUpdate(session.id, {
      planned_start: editStart.toISOString(),
      planned_end: editEnd.toISOString(),
    });
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

          {/* Right: Edit + X */}
          <View style={styles.cardActions}>
            {!isPast && !editing && (
              <Pressable onPress={handleEditStart} hitSlop={8} style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            )}
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>X</Text>
            </Pressable>
          </View>
        </View>

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
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
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
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
});
