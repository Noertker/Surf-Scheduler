import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { View } from '@/components/shared/View';
import { Text } from '@/components/shared/Text';
import { SpotPreferencesSection } from '@/components/surfer/SpotPreferencesSection';
import { QuiverSection } from '@/components/surfer/QuiverSection';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

export default function SurferScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SPOT PREFERENCES</Text>
        </View>
        <SpotPreferencesSection />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUIVER</Text>
        </View>
        <QuiverSection />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  placeholder: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textDim,
  },
});
