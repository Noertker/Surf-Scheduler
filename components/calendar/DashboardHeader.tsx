import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/shared/Text';
import { TimeWindowEditor } from '@/components/calendar/TimeWindowEditor';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function DashboardHeader() {
  const { groups, activeGroupId, setActiveGroup } = useGroupStore();
  const { dayStartHour, dayEndHour } = useSettingsStore();
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
          {'\u23F0'} {fmtHour(dayStartHour)}-{fmtHour(dayEndHour)}
        </Text>
      </Pressable>
      <TimeWindowEditor
        visible={showTimeSettings}
        onClose={() => setShowTimeSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  activePill: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#fff',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
