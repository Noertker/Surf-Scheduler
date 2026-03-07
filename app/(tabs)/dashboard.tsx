import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { GroupSelector } from '@/components/GroupSelector';
import { CalendarGrid } from '@/components/CalendarGrid';
import { DayDetail } from '@/components/DayDetail';
import { useGroupStore } from '@/stores/useGroupStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useTideStore } from '@/stores/useTideStore';
import { TideWindow, TidePrediction } from '@/types/tide';
import {
  calculateTideWindows,
  groupPredictionsByDay,
} from '@/utils/tideWindows';

export default function DashboardScreen() {
  const { groups, activeGroupId, groupSpots, loading, fetchGroups, setActiveGroup } =
    useGroupStore();
  const { preferences, fetchPreferences } = usePreferenceStore();
  const {
    monthlyPredictions,
    monthlyHiLo,
    monthlyLoading,
    fetchMonthlyTides,
  } = useTideStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Load groups and preferences on mount
  useEffect(() => {
    fetchGroups();
    fetchPreferences();
  }, []);

  // When active group changes, fetch monthly tides for its station
  useEffect(() => {
    if (groupSpots.length === 0) return;

    // All spots in a group share the same NOAA station
    const stationId = groupSpots[0]?.noaa_station_id;
    if (stationId) {
      fetchMonthlyTides(stationId);
    }
  }, [activeGroupId, groupSpots]);

  // Calculate tide windows for all enabled spots with preferences
  const dayWindows = useMemo(() => {
    const map = new Map<string, TideWindow[]>();

    if (monthlyPredictions.length === 0) return map;

    for (const spot of groupSpots) {
      const pref = preferences.find((p) => p.spot_id === spot.id);
      if (!pref || !pref.enabled) continue;

      const windows = calculateTideWindows(
        monthlyPredictions,
        pref.tide_min_ft,
        pref.tide_max_ft,
        spot.id,
        spot.name
      );

      for (const w of windows) {
        const key = w.start.toISOString().slice(0, 10);
        const arr = map.get(key) ?? [];
        arr.push(w);
        map.set(key, arr);
      }
    }

    return map;
  }, [monthlyPredictions, groupSpots, preferences]);

  // Get predictions and windows for the selected day
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return { predictions: [], hiLo: [], windows: [] };

    const key = selectedDate.toISOString().slice(0, 10);
    const dayMap = groupPredictionsByDay(monthlyPredictions);
    const hiLoMap = groupPredictionsByDay(monthlyHiLo);

    return {
      predictions: dayMap.get(key) ?? [],
      hiLo: hiLoMap.get(key) ?? [],
      windows: dayWindows.get(key) ?? [],
    };
  }, [selectedDate, monthlyPredictions, monthlyHiLo, dayWindows]);

  // Get a representative tideMin/tideMax for the day detail chart
  const representativePref = useMemo(() => {
    if (groupSpots.length === 0) return undefined;
    const enabledPrefs = groupSpots
      .map((s) => preferences.find((p) => p.spot_id === s.id))
      .filter((p) => p && p.enabled);
    if (enabledPrefs.length === 0) return undefined;
    // Use the first enabled preference for chart shading
    return enabledPrefs[0];
  }, [groupSpots, preferences]);

  const spotsWithPrefs = groupSpots.filter((s) =>
    preferences.some((p) => p.spot_id === s.id && p.enabled)
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GroupSelector
        groups={groups}
        activeGroupId={activeGroupId}
        onSelect={setActiveGroup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {monthlyLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" />
        ) : spotsWithPrefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Preferences Set</Text>
            <Text style={styles.emptyHint}>
              Long-press a spot on the Spots tab to set your preferred tide
              range. Spots with preferences will show their tide windows here.
            </Text>
          </View>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            dayWindows={dayWindows}
            onDayPress={setSelectedDate}
          />
        )}
      </ScrollView>

      {selectedDate && (
        <DayDetail
          visible={!!selectedDate}
          date={selectedDate}
          predictions={selectedDayData.predictions}
          hiLo={selectedDayData.hiLo}
          windows={selectedDayData.windows}
          tideMin={representativePref?.tide_min_ft}
          tideMax={representativePref?.tide_max_ft}
          onClose={() => setSelectedDate(null)}
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
  scrollContent: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});
