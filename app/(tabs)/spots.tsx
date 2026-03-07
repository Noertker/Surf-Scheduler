import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Switch,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { SpotConditions } from '@/components/SpotConditions';
import { SpotPreferenceEditor } from '@/components/SpotPreferenceEditor';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTideStore } from '@/stores/useTideStore';
import { useConditionsStore } from '@/stores/useConditionsStore';
import { fetchAllGroupsWithSpots } from '@/services/spotGroups';
import { SpotGroup } from '@/types/group';
import { Spot } from '@/types/spot';

interface GroupWithSpots {
  group: SpotGroup;
  spots: Spot[];
}

export default function SpotsScreen() {
  const [groupsData, setGroupsData] = useState<GroupWithSpots[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchPreferences, getPreferenceForSpot, savePreference } =
    usePreferenceStore();
  const { dayStartHour, dayEndHour, fetchSettings } = useSettingsStore();
  const { fetchTides, predictions, hiLo, loading: tidesLoading } = useTideStore();
  const {
    fetchConditions,
    swell,
    wind,
    loading: conditionsLoading,
  } = useConditionsStore();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([fetchPreferences(), fetchSettings()]);
      const data = await fetchAllGroupsWithSpots();
      setGroupsData(data);
      // Expand all groups by default
      setExpandedGroups(new Set(data.map((d) => d.group.id)));
    } catch (err) {
      console.error('Failed to load spots:', err);
    }
    setLoading(false);
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSelectSpot = (spot: Spot) => {
    if (selectedSpot?.id === spot.id) {
      setSelectedSpot(null);
      return;
    }
    setSelectedSpot(spot);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (spot.noaa_station_id) {
      fetchTides(spot.noaa_station_id, today, weekFromNow);
    }
    fetchConditions(spot.lat, spot.lng);
  };

  const handleToggleEnabled = async (spot: Spot) => {
    const pref = getPreferenceForSpot(spot.id);
    if (pref) {
      await savePreference(spot.id, pref.tide_min_ft, pref.tide_max_ft, !pref.enabled);
    } else {
      // Create new preference with defaults, enabled
      await savePreference(spot.id, 1.0, 4.0, true);
    }
  };

  const activePref = selectedSpot
    ? getPreferenceForSpot(selectedSpot.id)
    : undefined;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={selectedSpot ? styles.listCompact : styles.listFull}
        contentContainerStyle={styles.listContent}
      >
        {groupsData.map(({ group, spots }) => {
          const expanded = expandedGroups.has(group.id);
          return (
            <View key={group.id} style={styles.groupContainer}>
              <Pressable
                style={styles.groupHeader}
                onPress={() => toggleGroup(group.id)}
              >
                <Text style={styles.groupArrow}>
                  {expanded ? '\u25BC' : '\u25B6'}
                </Text>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>{spots.length} spots</Text>
              </Pressable>

              {expanded &&
                spots.map((spot) => {
                  const pref = getPreferenceForSpot(spot.id);
                  const isSelected = selectedSpot?.id === spot.id;

                  return (
                    <Pressable
                      key={spot.id}
                      style={[
                        styles.spotRow,
                        isSelected && styles.spotRowSelected,
                      ]}
                      onPress={() => handleSelectSpot(spot)}
                    >
                      <View style={styles.spotInfo}>
                        <Text
                          style={[
                            styles.spotName,
                            isSelected && styles.spotNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {spot.name}
                        </Text>
                        {pref && (
                          <Text style={styles.spotPrefHint}>
                            {pref.tide_min_ft.toFixed(1)}-
                            {pref.tide_max_ft.toFixed(1)} ft
                          </Text>
                        )}
                      </View>
                      <View style={styles.spotActions}>
                        <Switch
                          value={pref?.enabled ?? false}
                          onValueChange={() => handleToggleEnabled(spot)}
                          style={styles.toggle}
                        />
                        <Pressable
                          onPress={() => setEditingSpot(spot)}
                          hitSlop={8}
                          style={styles.gearButton}
                        >
                          <Text style={styles.gearIcon}>{'\u2699'}</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      {selectedSpot && (
        <SpotConditions
          predictions={predictions}
          hiLo={hiLo}
          swell={swell}
          wind={wind}
          loading={tidesLoading || conditionsLoading}
          tideMin={activePref?.tide_min_ft}
          tideMax={activePref?.tide_max_ft}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
        />
      )}

      {editingSpot && (
        <SpotPreferenceEditor
          visible={!!editingSpot}
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listFull: {
    flex: 1,
  },
  listCompact: {
    maxHeight: '25%',
  },
  listContent: {
    paddingVertical: 8,
  },
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  groupArrow: {
    fontSize: 12,
    marginRight: 8,
    opacity: 0.5,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  groupCount: {
    fontSize: 13,
    opacity: 0.4,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  spotRowSelected: {
    backgroundColor: 'rgba(47, 149, 220, 0.08)',
  },
  spotInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  spotName: {
    fontSize: 15,
    fontWeight: '500',
  },
  spotNameSelected: {
    color: '#2f95dc',
    fontWeight: '700',
  },
  spotPrefHint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  spotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  gearButton: {
    paddingLeft: 8,
  },
  gearIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
});
