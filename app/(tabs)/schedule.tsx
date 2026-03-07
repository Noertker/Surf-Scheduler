import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSpotStore } from '@/stores/useSpotStore';
import { SurfSession } from '@/types/session';
import {
  useScheduleForecasts,
  LiveForecast,
  degToCompass,
} from '@/hooks/useScheduleForecasts';

export default function ScheduleScreen() {
  const { sessions, loading, fetchSessions, removeSession, updateSession } =
    useSessionStore();
  const fetchSpots = useSpotStore((s) => s.fetchSpots);

  useEffect(() => {
    fetchSpots();
    fetchSessions();
  }, []);

  const { forecasts, loading: forecastLoading } =
    useScheduleForecasts(sessions);

  const handleDelete = (id: string, spotName: string) => {
    Alert.alert('Remove Session', `Remove ${spotName} from your schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeSession(id),
      },
    ]);
  };

  const now = new Date();
  const upcoming = sessions.filter(
    (s) => new Date(s.planned_start) >= now
  );
  const past = sessions.filter(
    (s) => new Date(s.planned_start) < now
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Sessions Scheduled</Text>
            <Text style={styles.emptyHint}>
              Go to the Calendar tab, tap a day, and press + on a tide window
              card to schedule a surf session.
            </Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  {forecastLoading && (
                    <ActivityIndicator size="small" style={{ marginLeft: 8 }} />
                  )}
                </View>
                {upcoming.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    forecast={forecasts.get(s.id)}
                    onDelete={() => handleDelete(s.id, s.spot_name)}
                    onUpdate={updateSession}
                  />
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past</Text>
                {past.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onDelete={() => handleDelete(s.id, s.spot_name)}
                    onUpdate={updateSession}
                    isPast
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SessionCard({
  session,
  forecast,
  onDelete,
  onUpdate,
  isPast,
}: {
  session: SurfSession;
  forecast?: LiveForecast;
  onDelete: () => void;
  onUpdate: (id: string, updates: Partial<Pick<SurfSession, 'planned_start' | 'planned_end' | 'notes'>>) => Promise<void>;
  isPast?: boolean;
}) {
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
            {hasLive && (
              <Text style={styles.liveLabel}>Live</Text>
            )}
            {tide && (
              <Text style={styles.conditionLine}>
                {tide.startFt.toFixed(1)}→{tide.endFt.toFixed(1)}ft
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardPast: {
    opacity: 0.5,
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
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  cardTime: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  editBtn: {
    padding: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f95dc',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.4,
  },
  // Edit form
  editForm: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f95dc',
    backgroundColor: 'rgba(47, 149, 220, 0.06)',
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
    opacity: 0.6,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2f95dc',
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
    color: '#2ecc71',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  conditionLine: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 2,
  },
  swellBlock: {
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  secondarySwell: {
    fontSize: 12,
    opacity: 0.55,
    marginBottom: 2,
    paddingLeft: 8,
  },
  combinedSwell: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
