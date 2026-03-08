import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { ProfileEditor } from '@/components/surfer/ProfileEditor';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useProfileStore } from '@/stores/useProfileStore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

export function ProfileSection() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, loading, fetchProfile } = useProfileStore();
  const [editorVisible, setEditorVisible] = useState(false);

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
      {/* Level / Experience / Stance */}
      <View style={styles.statRow}>
        <View style={styles.statBlock}>
          <Text style={styles.fieldLabel}>LEVEL</Text>
          <Text style={styles.statValue}>{profile.level.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.fieldLabel}>EXPERIENCE</Text>
          <Text style={styles.statValue}>
            {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'}
          </Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.fieldLabel}>STANCE</Text>
          <Text style={styles.statValue}>{profile.stance}</Text>
        </View>
      </View>

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
    statRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
      backgroundColor: 'transparent',
    },
    statBlock: {
      flex: 1,
      backgroundColor: colors.cardAlt,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textTransform: 'capitalize',
      textAlign: 'center',
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
  });
