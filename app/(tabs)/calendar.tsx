import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DayDetail } from '@/components/calendar/DayDetail';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { fetchSwellData, fetchWindData } from '@/services/openMeteo';
import { useGroupStore } from '@/stores/useGroupStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTideStore } from '@/stores/useTideStore';
import { SwellReading, WindReading } from '@/types/conditions';
import { TideWindow } from '@/types/tide';
import {
  calculateTideWindows,
  enrichWindowsWithConditions,
  groupPredictionsByDay,
  localDateKey,
} from '@/utils/tideWindows';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  useEffect(() => {
    fetchGroups();
    fetchPreferences();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (groupSpots.length === 0) return;
    const spot = groupSpots[0];
    if (spot?.noaa_station_id) fetchMonthlyTides(spot.noaa_station_id);
    if (spot) {
      fetchWindData(spot.lat, spot.lng, 7).then(setWind).catch(() => setWind([]));
      fetchSwellData(spot.lat, spot.lng, 7).then(setSwell).catch(() => setSwell([]));
    }
  }, [activeGroupId, groupSpots]);

  const dayWindows = useMemo(() => {
    const map = new Map<string, TideWindow[]>();
    if (monthlyPredictions.length === 0) return map;
    let allWindows: TideWindow[] = [];
    for (const spot of groupSpots) {
      const pref = preferences.find((p) => p.spot_id === spot.id);
      if (!pref || !pref.enabled) continue;
      const windows = calculateTideWindows(
        monthlyPredictions, pref.tide_min_ft, pref.tide_max_ft,
        spot.id, spot.name, dayStartHour, dayEndHour
      );
      allWindows.push(...windows);
    }
    allWindows = enrichWindowsWithConditions(allWindows, wind, swell);
    for (const w of allWindows) {
      const key = localDateKey(w.start);
      const arr = map.get(key) ?? [];
      arr.push(w);
      map.set(key, arr);
    }
    return map;
  }, [monthlyPredictions, groupSpots, preferences, dayStartHour, dayEndHour, wind, swell]);

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

  const representativePref = useMemo(() => {
    if (groupSpots.length === 0) return undefined;
    const enabledPrefs = groupSpots
      .map((s) => preferences.find((p) => p.spot_id === s.id))
      .filter((p) => p && p.enabled);
    if (enabledPrefs.length === 0) return undefined;
    return enabledPrefs[0];
  }, [groupSpots, preferences]);

  const spotsWithPrefs = groupSpots.filter((s) =>
    preferences.some((p) => p.spot_id === s.id && p.enabled)
  );

  const monthName1 = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  const monthName2 = new Date(nextYear, nextMonth, 1).toLocaleString('default', { month: 'long' });
  const hasContent = spotsWithPrefs.length > 0 && !monthlyLoading;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={hasContent ? [0, 2] : undefined}
      >
        {tideError && (
          <Pressable
            style={styles.errorBanner}
            onPress={() => {
              const stationId = groupSpots[0]?.noaa_station_id;
              if (stationId) fetchMonthlyTides(stationId);
            }}>
            <Text style={styles.errorText}>
              Failed to load tides: {tideError} — Tap to retry
            </Text>
          </Pressable>
        )}
        {monthlyLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
        ) : spotsWithPrefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u301C'}</Text>
            <Text style={styles.emptyTitle}>NO PREFERENCES SET</Text>
            <Text style={styles.emptyHint}>
              Go to the Spots tab, expand a region, and toggle spots on. Set your preferred tide range to see windows here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{monthName1.toUpperCase()} {year}</Text>
            </View>
            <CalendarGrid
              year={year}
              month={month}
              dayWindows={dayWindows}
              onDayPress={setSelectedDate}
            />
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{monthName2.toUpperCase()} {nextYear}</Text>
            </View>
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
          onPrevDay={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            setSelectedDate(prev);
          }}
          onNextDay={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            setSelectedDate(next);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 32 },
  monthHeader: {
    backgroundColor: colors.bg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIcon: { fontSize: 40, color: colors.textFaint, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 12 },
  emptyHint: { fontSize: 13, textAlign: 'center', color: colors.textDim, lineHeight: 20 },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    paddingVertical: 10, paddingHorizontal: 16,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center' },
});
