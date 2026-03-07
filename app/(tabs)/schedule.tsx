import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useSessionStore } from '@/stores/useSessionStore';
import { SurfSession } from '@/types/session';

export default function ScheduleScreen() {
  const { sessions, loading, fetchSessions, removeSession } =
    useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, []);

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
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {upcoming.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onDelete={() => handleDelete(s.id, s.spot_name)}
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
  onDelete,
  isPast,
}: {
  session: SurfSession;
  onDelete: () => void;
  isPast?: boolean;
}) {
  const start = new Date(session.planned_start);
  const end = new Date(session.planned_end);

  const dateStr = start.toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = `${start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardSpot}>{session.spot_name}</Text>
        <Text style={styles.cardDate}>{dateStr}</Text>
        <Text style={styles.cardTime}>{timeStr}</Text>
        {(session.tide_start_ft != null || session.avg_swell_ft != null) && (
          <View style={styles.cardConditions}>
            {session.tide_start_ft != null && session.tide_end_ft != null && (
              <Text style={styles.conditionText}>
                {session.tide_start_ft.toFixed(1)}-{session.tide_end_ft.toFixed(1)} ft tide
              </Text>
            )}
            {session.avg_swell_ft != null && (
              <Text style={styles.conditionText}>
                {session.avg_swell_ft}ft swell
              </Text>
            )}
            {session.avg_wind_mph != null && (
              <Text style={styles.conditionText}>
                {session.avg_wind_mph}mph wind{session.avg_gusts_mph != null ? ` g${session.avg_gusts_mph}` : ''}
              </Text>
            )}
          </View>
        )}
      </View>
      <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>X</Text>
      </Pressable>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardPast: {
    opacity: 0.5,
  },
  cardBody: {
    flex: 1,
    backgroundColor: 'transparent',
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
  cardConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  conditionText: {
    fontSize: 12,
    opacity: 0.5,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.4,
  },
});
