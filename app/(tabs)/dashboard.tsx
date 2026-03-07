import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { CalendarGrid } from '@/components/CalendarGrid';
import { DayDetail } from '@/components/DayDetail';
import { useGroupStore } from '@/stores/useGroupStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTideStore } from '@/stores/useTideStore';
import { TideWindow } from '@/types/tide';
import { SwellReading, WindReading } from '@/types/conditions';
import { fetchSwellData, fetchWindData } from '@/services/openMeteo';
import {
  calculateTideWindows,
  enrichWindowsWithConditions,
  groupPredictionsByDay,
  localDateKey,
} from '@/utils/tideWindows';

export default function DashboardScreen() {
  const { groups, activeGroupId, groupSpots, loading, fetchGroups, setActiveGroup } =
    useGroupStore();
  const { preferences, fetchPreferences } = usePreferenceStore();
  const { dayStartHour, dayEndHour, fetchSettings } = useSettingsStore();
  const {
    monthlyPredictions,
    monthlyHiLo,
    monthlyLoading,
    error: tideError,
    fetchMonthlyTides,
  } = useTideStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [wind, setWind] = useState<WindReading[]>([]);
  const [swell, setSwell] = useState<SwellReading[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Next month for 30-day forecast that spans two months
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  // Load groups and preferences on mount
  useEffect(() => {
    fetchGroups();
    fetchPreferences();
    fetchSettings();
  }, []);

  // When active group changes, fetch monthly tides + 7-day conditions
  useEffect(() => {
    if (groupSpots.length === 0) return;

    const spot = groupSpots[0];
    if (spot?.noaa_station_id) {
      fetchMonthlyTides(spot.noaa_station_id);
    }

    // Fetch 7-day wind/swell forecast for the group's region
    if (spot) {
      fetchWindData(spot.lat, spot.lng, 7)
        .then(setWind)
        .catch(() => setWind([]));
      fetchSwellData(spot.lat, spot.lng, 7)
        .then(setSwell)
        .catch(() => setSwell([]));
    }
  }, [activeGroupId, groupSpots]);

  // Calculate tide windows for all enabled spots with preferences
  const dayWindows = useMemo(() => {
    const map = new Map<string, TideWindow[]>();

    if (monthlyPredictions.length === 0) return map;

    let allWindows: TideWindow[] = [];

    for (const spot of groupSpots) {
      const pref = preferences.find((p) => p.spot_id === spot.id);
      if (!pref || !pref.enabled) continue;

      const windows = calculateTideWindows(
        monthlyPredictions,
        pref.tide_min_ft,
        pref.tide_max_ft,
        spot.id,
        spot.name,
        dayStartHour,
        dayEndHour
      );

      allWindows.push(...windows);
    }

    // Enrich windows within the 7-day forecast range with wind/swell averages
    allWindows = enrichWindowsWithConditions(allWindows, wind, swell);

    for (const w of allWindows) {
      const key = localDateKey(w.start);
      const arr = map.get(key) ?? [];
      arr.push(w);
      map.set(key, arr);
    }

    return map;
  }, [monthlyPredictions, groupSpots, preferences, dayStartHour, dayEndHour, wind, swell]);

  // Get predictions and windows for the selected day
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return { predictions: [], hiLo: [], windows: [] };

    const key = localDateKey(selectedDate);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tideError && (
          <Pressable
            style={styles.errorBanner}
            onPress={() => {
              const stationId = groupSpots[0]?.noaa_station_id;
              if (stationId) fetchMonthlyTides(stationId);
            }}
          >
            <Text style={styles.errorText}>
              Failed to load tides: {tideError} — Tap to retry
            </Text>
          </Pressable>
        )}
        {monthlyLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" />
        ) : spotsWithPrefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Preferences Set</Text>
            <Text style={styles.emptyHint}>
              Go to the Spots tab, expand a region, and toggle spots on. Use
              the gear icon to set your preferred tide range. Enabled spots
              will show their tide windows here.
            </Text>
          </View>
        ) : (
          <>
            <CalendarGrid
              year={year}
              month={month}
              dayWindows={dayWindows}
              onDayPress={setSelectedDate}
            />
            <CalendarGrid
              year={nextYear}
              month={nextMonth}
              dayWindows={dayWindows}
              onDayPress={setSelectedDate}
            />
          </>
        )}
      </ScrollView>

      {selectedDate && (
        <DayDetail
          visible={!!selectedDate}
          date={selectedDate}
          predictions={selectedDayData.predictions}
          hiLo={selectedDayData.hiLo}
          windows={selectedDayData.windows}
          wind={wind}
          swell={swell}
          tideMin={representativePref?.tide_min_ft}
          tideMax={representativePref?.tide_max_ft}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
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
  errorBanner: {
    backgroundColor: 'rgba(220, 50, 50, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#c0392b',
    textAlign: 'center',
  },
});
