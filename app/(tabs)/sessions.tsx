import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionResultEditor } from '@/components/sessions/SessionResultEditor';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSpotStore } from '@/stores/useSpotStore';
import { useSessionForecasts } from '@/hooks/useSessionForecasts';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { SurfSession } from '@/types/session';

export default function SessionsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sessions, loading, removeSession, updateSession, completeSession } =
    useSessionStore();
  const fetchSpots = useSpotStore((s) => s.fetchSpots);
  const [loggingSession, setLoggingSession] = useState<SurfSession | null>(null);
  const dismissedRef = useRef(false);

  // Find the most recent past session that hasn't been logged
  const getUnloggedSession = useCallback((): SurfSession | null => {
    const now = new Date();
    const unlogged = sessions
      .filter((s) => new Date(s.planned_start) < now && !s.completed)
      .sort(
        (a, b) =>
          new Date(b.planned_start).getTime() -
          new Date(a.planned_start).getTime()
      );
    return unlogged[0] ?? null;
  }, [sessions]);

  // Auto-prompt feedback when sessions finish loading
  useEffect(() => {
    if (loading || dismissedRef.current || loggingSession) return;
    const session = getUnloggedSession();
    if (session) setLoggingSession(session);
  }, [loading, sessions]);

  // Re-prompt when app returns to foreground (resets dismiss flag)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        dismissedRef.current = false;
        const session = getUnloggedSession();
        if (session) setLoggingSession(session);
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [getUnloggedSession]);

  // Spots are not user-scoped — safe to fetch on mount.
  // Sessions are fetched by AuthRefreshBridge after auth is ready.
  useEffect(() => {
    fetchSpots();
  }, []);

  const { forecasts, loading: forecastLoading } =
    useSessionForecasts(sessions);

  const handleDelete = (id: string, spotName: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${spotName} from your schedule?`)) {
        removeSession(id);
      }
    } else {
      Alert.alert('Remove Session', `Remove ${spotName} from your schedule?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeSession(id),
        },
      ]);
    }
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
        ) : null}
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
                onLogResults={() => setLoggingSession(s)}
                isPast
              />
            ))}
          </View>
        )}
      </ScrollView>

      {loggingSession && (
        <SessionResultEditor
          visible={!!loggingSession}
          session={loggingSession}
          forecast={forecasts.get(loggingSession.id)}
          onSave={async (results) => {
            await completeSession(loggingSession.id, results);
            setLoggingSession(null);
          }}
          onClose={() => {
            dismissedRef.current = true;
            setLoggingSession(null);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingBottom: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.text,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.textDim,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
