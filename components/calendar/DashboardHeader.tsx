import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/shared/Text';
import { TimeWindowEditor } from '@/components/calendar/TimeWindowEditor';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/hooks/useThemeStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function DashboardHeader() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { groups, activeGroupId, setActiveGroup } = useGroupStore();
  const { dayStartHour, dayEndHour } = useSettingsStore();
  const { mode, toggleTheme } = useThemeStore();
  const [showTimeSettings, setShowTimeSettings] = useState(false);

  const fmtHour = (h: number) =>
    `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`;

  return (
    <View style={styles.container}>
      <View style={styles.pillRow}>
        {groups.map((group) => {
          const active = group.id === activeGroupId;
          return (
            <Pressable
              key={group.id}
              onPress={() => setActiveGroup(group.id)}
              style={[styles.pill, active && styles.activePill]}
            >
              <Text style={[styles.label, active && styles.activeLabel]}>
                {group.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => setShowTimeSettings(true)} style={styles.timeBadge}>
        <Text style={styles.timeText}>
          {fmtHour(dayStartHour)}-{fmtHour(dayEndHour)}
        </Text>
      </Pressable>
      <Pressable onPress={toggleTheme} hitSlop={8} style={styles.themeBadge}>
        <Text style={styles.themeIcon}>{mode === 'dark' ? '\u2600' : '\u263E'}</Text>
      </Pressable>
      <TimeWindowEditor
        visible={showTimeSettings}
        onClose={() => setShowTimeSettings(false)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#fff',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  themeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  themeIcon: {
    fontSize: 16,
    color: colors.textDim,
  },
});
