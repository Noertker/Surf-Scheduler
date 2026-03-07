import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Switch,
} from 'react-native';
import { View } from '@/components/shared/View';
import { Text } from '@/components/shared/Text';
import { SpotPreferenceEditor } from '@/components/spots/SpotPreferenceEditor';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { fetchAllGroupsWithSpots } from '@/services/spotGroups';
import { SpotGroup } from '@/types/group';
import { Spot } from '@/types/spot';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface GroupWithSpots {
  group: SpotGroup;
  spots: Spot[];
}

export default function SpotsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [groupsData, setGroupsData] = useState<GroupWithSpots[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchPreferences, getPreferenceForSpot, savePreference } =
    usePreferenceStore();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await fetchPreferences();
      const data = await fetchAllGroupsWithSpots();
      setGroupsData(data);
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

  const handleToggleEnabled = async (spot: Spot) => {
    const pref = getPreferenceForSpot(spot.id);
    if (pref) {
      await savePreference(spot.id, pref.tide_min_ft, pref.tide_max_ft, !pref.enabled);
    } else {
      await savePreference(spot.id, 1.0, 4.0, true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
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

                  return (
                    <Pressable
                      key={spot.id}
                      style={styles.spotRow}
                      onPress={() => setEditingSpot(spot)}
                    >
                      <View style={styles.spotInfo}>
                        <Text style={styles.spotName} numberOfLines={1}>
                          {spot.name}
                        </Text>
                        {pref && (
                          <Text style={styles.spotPrefHint}>
                            {pref.tide_min_ft.toFixed(1)}-
                            {pref.tide_max_ft.toFixed(1)} ft
                          </Text>
                        )}
                      </View>
                      <Switch
                        value={pref?.enabled ?? false}
                        onValueChange={() => handleToggleEnabled(spot)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        style={styles.toggle}
                      />
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
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
    color: colors.textDim,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    color: colors.text,
  },
  groupCount: {
    fontSize: 13,
    color: colors.textFaint,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  spotInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  spotName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  spotPrefHint: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 1,
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
