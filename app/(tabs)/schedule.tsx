import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { SessionCard } from '@/components/schedule/SessionCard';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSpotStore } from '@/stores/useSpotStore';
import { useScheduleForecasts } from '@/hooks/useScheduleForecasts';

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
});
