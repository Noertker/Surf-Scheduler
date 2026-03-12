import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View as ThemedView } from '@/components/shared/View';
import { TimeWindowEditor } from '@/components/calendar/TimeWindowEditor';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface Props {
  highlightedDate: Date;
}

export function CalendarSubHeader({ highlightedDate }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { groups, activeGroupId, setActiveGroup } = useGroupStore();
  const { dayStartHour, dayEndHour } = useSettingsStore();
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const fmtHour = (h: number) =>
    `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`;

  const dateStr = highlightedDate.toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Region dropdown */}
        <Pressable onPress={() => setShowRegionPicker(true)} style={styles.dropdown}>
          <Text style={styles.dropdownText} numberOfLines={1}>
            {activeGroup?.name ?? 'Select Region'}
          </Text>
          <Text style={styles.dropdownArrow}>{'\u25BE'}</Text>
        </Pressable>

        {/* Highlighted date */}
        <Text style={styles.dateText}>{dateStr}</Text>

        {/* Time window badge */}
        <Pressable onPress={() => setShowTimeSettings(true)} hitSlop={6}>
          <Text style={styles.timeText}>
            {fmtHour(dayStartHour)}-{fmtHour(dayEndHour)}
          </Text>
        </Pressable>
      </View>

      <TimeWindowEditor
        visible={showTimeSettings}
        onClose={() => setShowTimeSettings(false)}
      />

      {/* Region picker modal */}
      <Modal
        visible={showRegionPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowRegionPicker(false)}
        >
          <ThemedView style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Region</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {groups.map((group) => {
                const isActive = group.id === activeGroupId;
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => {
                      setActiveGroup(group.id);
                      setShowRegionPicker(false);
                    }}
                    style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                  >
                    <Text style={[styles.pickerItemText, isActive && styles.pickerItemTextActive]}>
                      {group.name}
                    </Text>
                    {isActive && <Text style={styles.pickerCheck}>{'\u2713'}</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    gap: 5,
    maxWidth: 160,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.textDim,
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    width: 280,
    maxHeight: '70%',
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.card,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: colors.primaryDark,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pickerItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
