import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { View } from '@/components/shared/View';
import { Text } from '@/components/shared/Text';
import { SpotPreferencesSection } from '@/components/surfer/SpotPreferencesSection';
import { QuiverSection } from '@/components/surfer/QuiverSection';
import { AccountSection } from '@/components/surfer/AccountSection';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

type Section = 'spots' | 'quiver' | 'calendar' | 'coaching';

const MENU_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: 'spots', label: 'Surf Spots', icon: '\u{1F30A}' },
  { key: 'quiver', label: 'Quiver', icon: '\u{1F3C4}' },
  { key: 'calendar', label: 'Calendar', icon: '\u{1F4C5}' },
  { key: 'coaching', label: 'Coaching', icon: '\u{1F9E0}' },
];

export default function SurferScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [active, setActive] = useState<Section>('spots');
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const renderContent = () => {
    switch (active) {
      case 'spots':
        return <SpotPreferencesSection />;
      case 'quiver':
        return <QuiverSection />;
      case 'calendar':
        return <AccountSection />;
      case 'coaching':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>AI Coach coming soon</Text>
          </View>
        );
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
              <Text style={styles.menuIcon}>{item.icon}</Text>
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
            <Text style={styles.tabIcon}>{item.icon}</Text>
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
    fontSize: 18,
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
    fontSize: 16,
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

  // Shared
  placeholder: {
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textDim,
  },
});
