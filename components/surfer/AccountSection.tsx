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
  const { user, loading, signInWithGoogle, signOut } = useAuthStore();

  if (!user) {
    return (
      <View style={styles.container}>
        <Pressable
          onPress={signInWithGoogle}
          disabled={loading}
          style={styles.googleButton}
        >
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </Pressable>
        <Text style={styles.hint}>
          Sync surf sessions to Google Calendar automatically
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.accountRow}>
        <View style={styles.accountInfo}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.status}>Google Calendar connected</Text>
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
  googleButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  accountInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  email: {
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
