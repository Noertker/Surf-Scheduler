import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { CoachingSection } from '@/components/surfer/CoachingSection';
import { ProfileSection } from '@/components/surfer/ProfileSection';
import { ProgressionSection } from '@/components/surfer/ProgressionSection';
import { QuiverSection } from '@/components/surfer/QuiverSection';
import { SpotPreferencesSection } from '@/components/surfer/SpotPreferencesSection';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

type Section = 'profile' | 'progression' | 'spots' | 'quiver' | 'coaching';

const MENU_ITEMS: { key: Section; label: string; renderIcon: (size: number, color: string) => React.ReactNode }[] = [
  { key: 'spots', label: 'Breaks', renderIcon: (s, c) => <Ionicons name="water-outline" size={s} color={c} /> },
  { key: 'profile', label: 'Profile', renderIcon: (s, c) => <Ionicons name="person-outline" size={s} color={c} /> },
  { key: 'progression', label: 'Progression', renderIcon: (s, c) => <Ionicons name="trending-up-outline" size={s} color={c} /> },
  { key: 'quiver', label: 'Quiver', renderIcon: (s, c) => <MaterialIcons name="surfing" size={s} color={c} /> },
  { key: 'coaching', label: 'Coaching', renderIcon: (s, c) => <Ionicons name="bulb-outline" size={s} color={c} /> },
];

export default function SurferScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [active, setActive] = useState<Section>('profile');
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const renderContent = () => {
    switch (active) {
      case 'profile':
        return <ProfileSection onNavigateToProgression={() => setActive('progression')} />;
      case 'progression':
        return <ProgressionSection />;
      case 'spots':
        return <SpotPreferencesSection />;
      case 'quiver':
        return <QuiverSection />;
      case 'coaching':
        return <CoachingSection />;
    }
  };

  if (isWide) {
    // Wide layout: sidebar + main content
    return (
      <View style={styles.container}>
        <View style={styles.sidebar}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setActive(item.key)}
              style={[styles.menuItem, active === item.key && styles.menuItemActive]}
            >
              {item.renderIcon(18, active === item.key ? colors.primary : colors.textTertiary)}
              <Text style={[styles.menuLabel, active === item.key && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainScroll}>
          {renderContent()}
        </ScrollView>
      </View>
    );
  }

  // Narrow layout: horizontal tab strip + content below
  return (
    <View style={styles.containerNarrow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setActive(item.key)}
            style={[styles.tab, active === item.key && styles.tabActive]}
          >
            {item.renderIcon(16, active === item.key ? colors.primary : colors.textTertiary)}
            <Text style={[styles.tabLabel, active === item.key && styles.tabLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // Wide layout
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  sidebar: {
    width: 180,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 8,
    backgroundColor: colors.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: colors.primaryDark,
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuIcon: {
    width: 20,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  menuLabelActive: {
    color: colors.primary,
  },
  mainContent: {
    flex: 1,
  },
  mainScroll: {
    paddingBottom: 32,
  },

  // Narrow layout
  containerNarrow: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabStrip: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabIcon: {
    width: 18,
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: 32,
  },

});
