import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useCoachStore } from '@/stores/useCoachStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSessionForecasts } from '@/hooks/useSessionForecasts';
import { useSimilarSessions } from '@/hooks/useSimilarSessions';
import { SurfSession } from '@/types/session';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { CoachMode } from '@/services/coachService';

const MODES: { key: CoachMode; label: string }[] = [
  { key: 'week_brief', label: 'Week Brief' },
  { key: 'pre_session', label: 'Pre-Session' },
  { key: 'post_debrief', label: 'Post-Session' },
  { key: 'ask_coach', label: 'Ask Coach' },
];

export function CoachingSection() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useProfileStore((s) => s.profile);
  const sessions = useSessionStore((s) => s.sessions);
  const {
    response,
    loading,
    error,
    fetchWeekBrief,
    fetchPreSession,
    fetchPostDebrief,
    askCoach,
    clearCoach,
  } = useCoachStore();

  const [mode, setMode] = useState<CoachMode>('week_brief');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  // Session lists for pickers
  const now = new Date();
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.planned_start) >= now
  );
  const completedSessions = sessions
    .filter((s) => s.completed)
    .sort(
      (a, b) =>
        new Date(b.planned_start).getTime() -
        new Date(a.planned_start).getTime()
    )
    .slice(0, 10);

  const pickerSessions =
    mode === 'pre_session' ? upcomingSessions : completedSessions;

  const selectedSession = selectedSessionId
    ? sessions.find((s) => s.id === selectedSessionId) ?? null
    : null;

  // Reset selection when mode changes
  useEffect(() => {
    setSelectedSessionId(null);
    setQuestion('');
    clearCoach();
  }, [mode]);

  // Fetch forecasts for upcoming sessions (week_brief + pre_session)
  const forecastInput = useMemo(
    () =>
      mode === 'week_brief' || mode === 'pre_session'
        ? upcomingSessions
        : [],
    [mode, upcomingSessions]
  );
  const { forecasts, loading: forecastLoading } =
    useSessionForecasts(forecastInput);
  const selectedForecast = selectedSession
    ? forecasts.get(selectedSession.id)
    : undefined;

  // Similar sessions for pre-session mode
  const similarSessions = useSimilarSessions(
    selectedSession ?? ({ spot_id: '' } as SurfSession),
    selectedForecast
  );

  const canSubmit = () => {
    if (loading) return false;
    switch (mode) {
      case 'week_brief':
        return upcomingSessions.length > 0;
      case 'pre_session':
        return !!selectedSession && !forecastLoading;
      case 'post_debrief':
        return !!selectedSession;
      case 'ask_coach':
        return question.trim().length > 0;
    }
  };

  const handleSubmit = () => {
    switch (mode) {
      case 'week_brief':
        fetchWeekBrief(forecasts);
        break;
      case 'pre_session':
        if (selectedSession)
          fetchPreSession(
            selectedSession,
            selectedForecast ?? { tide: null, wind: null, swell: null },
            similarSessions
          );
        break;
      case 'post_debrief':
        if (selectedSession) fetchPostDebrief(selectedSession);
        break;
      case 'ask_coach':
        if (question.trim()) askCoach(question.trim());
        break;
    }
  };

  if (!profile) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Set Up Your Profile First</Text>
        <Text style={styles.emptyHint}>
          Go to Profile to set your level, goals, and preferences — then come
          back for personalized coaching.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
            onPress={() => setMode(m.key)}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === m.key && styles.modeChipTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Mode-specific inputs */}
      {(mode === 'pre_session' || mode === 'post_debrief') && (
        <View style={styles.pickerSection}>
          <Text style={styles.fieldLabel}>
            {mode === 'pre_session' ? 'UPCOMING SESSION' : 'COMPLETED SESSION'}
          </Text>
          {pickerSessions.length === 0 ? (
            <Text style={styles.hintText}>
              {mode === 'pre_session'
                ? 'No upcoming sessions scheduled'
                : 'No completed sessions yet'}
            </Text>
          ) : (
            <View style={styles.sessionList}>
              {pickerSessions.map((s) => {
                const active = s.id === selectedSessionId;
                const date = new Date(s.planned_start).toLocaleDateString(
                  'default',
                  { weekday: 'short', month: 'short', day: 'numeric' }
                );
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.sessionChip, active && styles.sessionChipActive]}
                    onPress={() =>
                      setSelectedSessionId(active ? null : s.id)
                    }
                  >
                    <Text
                      style={[
                        styles.sessionChipText,
                        active && styles.sessionChipTextActive,
                      ]}
                    >
                      {s.spot_name} — {date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {mode === 'pre_session' && selectedSession && forecastLoading && (
            <View style={styles.forecastLoading}>
              <ActivityIndicator size="small" />
              <Text style={styles.hintText}>Loading forecast...</Text>
            </View>
          )}
        </View>
      )}

      {mode === 'week_brief' && forecastLoading && (
        <View style={styles.forecastLoading}>
          <ActivityIndicator size="small" />
          <Text style={styles.hintText}>Loading forecasts...</Text>
        </View>
      )}

      {mode === 'ask_coach' && (
        <View style={styles.pickerSection}>
          <Text style={styles.fieldLabel}>YOUR QUESTION</Text>
          <TextInput
            style={styles.questionInput}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask about technique, board choice, conditions..."
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Submit */}
      <Pressable
        style={[styles.submitButton, !canSubmit() && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit()}
      >
        <Text style={styles.submitText}>
          {loading
            ? 'Thinking...'
            : mode === 'ask_coach'
            ? 'Ask'
            : 'Get Coaching'}
        </Text>
      </Pressable>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Streaming response */}
      {(response || loading) && (
        <View style={styles.responseCard}>
          <ScrollView style={styles.responseScroll}>
            <Text style={styles.responseText}>
              {response || ''}
              {loading && '\u2588'}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: 'transparent',
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: 'transparent',
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
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 20,
    },
    modeChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardAlt,
    },
    modeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    modeChipTextActive: {
      color: '#fff',
    },
    pickerSection: {
      marginBottom: 16,
      backgroundColor: 'transparent',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1,
      marginBottom: 8,
    },
    hintText: {
      fontSize: 12,
      color: colors.textDim,
      fontStyle: 'italic',
    },
    sessionList: {
      gap: 6,
      backgroundColor: 'transparent',
    },
    sessionChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardAlt,
    },
    sessionChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sessionChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sessionChipTextActive: {
      color: '#fff',
    },
    forecastLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      backgroundColor: 'transparent',
    },
    questionInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.cardAlt,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 16,
    },
    submitDisabled: {
      opacity: 0.5,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      marginBottom: 12,
    },
    responseCard: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      maxHeight: 400,
    },
    responseScroll: {
      maxHeight: 368,
    },
    responseText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
  });
