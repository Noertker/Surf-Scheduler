import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { ProfileEditor } from '@/components/surfer/ProfileEditor';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/hooks/useThemeStore';
import { PROGRESSION_LEVELS } from '@/constants/progression';
import { ThemePreference, CalendarViewMode } from '@/hooks/useThemeStore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

interface Props {
  onNavigateToProgression?: () => void;
}

export function ProfileSection({ onNavigateToProgression }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, loading, fetchProfile } = useProfileStore();
  const { user, signOut } = useAuthStore();
  const [editorVisible, setEditorVisible] = useState(false);
  const { preference, setPreference, calendarViewMode, setCalendarViewMode } = useThemeStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Set up your surfer profile to get personalized coaching and board recommendations.
        </Text>
        <Pressable style={styles.addButton} onPress={() => setEditorVisible(true)}>
          <Text style={styles.addText}>+ Create Profile</Text>
        </Pressable>
        <ProfileEditor
          visible={editorVisible}
          profile={null}
          onClose={() => setEditorVisible(false)}
        />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionHeading}>Surfer Profile</Text>

      {/* Progression Level */}
      <Pressable style={styles.progressionCard} onPress={onNavigateToProgression}>
        {profile.skill_stage ? (() => {
          const node = PROGRESSION_LEVELS
            .flatMap((g) => g.nodes)
            .find((n) => n.stage === profile.skill_stage);
          const group = PROGRESSION_LEVELS.find((g) =>
            g.nodes.some((n) => n.stage === profile.skill_stage)
          );
          return (
            <>
              <View style={styles.progressionInfo}>
                <Text style={styles.progressionStage}>
                  {node?.stage.toUpperCase()} — {node?.label}
                </Text>
                <Text style={styles.progressionLevel}>{group?.title}: {group?.subtitle}</Text>
              </View>
              <Text style={styles.progressionArrow}>{'\u203A'}</Text>
            </>
          );
        })() : (
          <>
            <Text style={styles.progressionPrompt}>
              Set your progression level to track your surf journey
            </Text>
            <Text style={styles.progressionArrow}>{'\u203A'}</Text>
          </>
        )}
      </Pressable>

      {/* Goals */}
      {profile.goals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>GOALS</Text>
          <View style={styles.chipRow}>
            {profile.goals.map((g) => (
              <View key={g} style={styles.chip}>
                <Text style={styles.chipText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Strengths */}
      {profile.strengths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>STRENGTHS</Text>
          <View style={styles.chipRow}>
            {profile.strengths.map((s) => (
              <View key={s} style={[styles.chip, styles.chipStrength]}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Weaknesses */}
      {profile.weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>WEAKNESSES</Text>
          <View style={styles.chipRow}>
            {profile.weaknesses.map((w) => (
              <View key={w} style={[styles.chip, styles.chipWeakness]}>
                <Text style={styles.chipText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Session Focus */}
      {profile.session_focus && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>SESSION FOCUS</Text>
          <Text style={styles.focusText}>{profile.session_focus}</Text>
        </View>
      )}

      <Pressable style={styles.addButton} onPress={() => setEditorVisible(true)}>
        <Text style={styles.addText}>Edit Profile</Text>
      </Pressable>

      <ProfileEditor
        visible={editorVisible}
        profile={profile}
        onClose={() => setEditorVisible(false)}
      />

      <Text style={styles.sectionHeading}>Account Settings</Text>

      {user && (
        <View style={styles.accountCard}>
          <View style={styles.accountInfo}>
            <Text style={styles.emailDisplay}>{user.email}</Text>
            <Text style={styles.accountStatus}>
              {user.app_metadata?.provider === 'google'
                ? 'Google Calendar connected'
                : 'Signed in with email'}
            </Text>
          </View>
          <Pressable onPress={signOut} hitSlop={8} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionHeading}>App Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Appearance</Text>
        <View style={styles.segmentGroup}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setPreference(opt)}
              style={[styles.segmentBtn, preference === opt && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, preference === opt && styles.segmentTextActive]}>
                {opt === 'system' ? 'Auto' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Calendar View</Text>
        <View style={styles.segmentGroup}>
          {(['timeline', 'grid'] as CalendarViewMode[]).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setCalendarViewMode(opt)}
              style={[styles.segmentBtn, calendarViewMode === opt && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, calendarViewMode === opt && styles.segmentTextActive]}>
                {opt === 'timeline' ? 'Timeline' : 'Grid'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centered: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    empty: {
      paddingVertical: 30,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textDim,
      textAlign: 'center',
      marginBottom: 16,
    },
    progressionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressionInfo: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    progressionStage: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    progressionLevel: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    progressionPrompt: {
      flex: 1,
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    progressionArrow: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textTertiary,
      marginLeft: 8,
    },
    section: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipStrength: {
      borderColor: colors.accent,
    },
    chipWeakness: {
      borderColor: colors.warning,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    focusText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    addButton: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 16,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
    },
    addText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      padding: 4
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountInfo: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    emailDisplay: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    accountStatus: {
      fontSize: 12,
      color: colors.accentMuted,
      marginTop: 2,
    },
    signOutBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    segmentGroup: {
      flexDirection: 'row',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    segmentBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: colors.cardAlt,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    segmentTextActive: {
      color: '#fff',
    },
  });
