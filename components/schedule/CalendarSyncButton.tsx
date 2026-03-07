import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { SurfSession } from '@/types/session';
import { syncSessionToCalendar } from '@/services/calendarSync';
import { useSessionStore } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  session: SurfSession;
}

export function CalendarSyncButton({ session }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const updateSession = useSessionStore((s) => s.updateSession);
  const isGoogleAuth = useAuthStore((s) => !!s.user);
  const [syncing, setSyncing] = useState(false);

  const isSynced = !!session.gcal_event_id;

  // If Google auth is active, auto-sync handles everything — just show status
  if (isGoogleAuth) {
    return (
      <Pressable hitSlop={8} style={styles.btn} disabled>
        <Text style={[styles.text, isSynced && styles.textSynced]}>
          {isSynced ? '\u2713 GCal' : '\u23F3'}
        </Text>
      </Pressable>
    );
  }

  // Fallback: manual sync via expo-calendar / ICS for unauthenticated users
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { eventId } = await syncSessionToCalendar(session);
      await updateSession(session.id, { gcal_event_id: eventId });
    } catch (err) {
      console.error('Calendar sync failed:', err);
    }
    setSyncing(false);
  };

  return (
    <Pressable
      onPress={isSynced ? undefined : handleSync}
      hitSlop={8}
      style={styles.btn}
      disabled={syncing}
    >
      <Text style={[styles.text, isSynced && styles.textSynced]}>
        {syncing ? '...' : isSynced ? '\u2713 Cal' : '\u{1F4C5}'}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    padding: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  textSynced: {
    color: colors.accentMuted,
  },
});
