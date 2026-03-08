import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

export function AccountSection() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, signOut } = useAuthStore();

  if (!user) return null;

  const isGoogleUser = user.app_metadata?.provider === 'google';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account</Text>
      <View style={styles.card}>
        <View style={styles.accountInfo}>
          <Text style={styles.emailDisplay}>{user.email}</Text>
          <Text style={styles.status}>
            {isGoogleUser ? 'Google Calendar connected' : 'Signed in with email'}
          </Text>
        </View>
        <Pressable onPress={signOut} hitSlop={8} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
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
  status: {
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
});
