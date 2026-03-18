import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarSubHeader } from '@/components/calendar/CalendarSubHeader';
import { DayCard } from '@/components/calendar/DayCard';
import { DayDetail } from '@/components/calendar/DayDetail';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { fetchSwellWithFallback, fetchWindWithFallback } from '@/services/forecasts';
import { useThemeStore } from '@/hooks/useThemeStore';
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, ViewToken } from 'react-native';

interface TimelineDay {
  date: Date;
  dateKey: string;
}

export default function DashboardScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { groupSpots, loading, fetchGroups } = useGroupStore();
  const { preferences } = usePreferenceStore();
  const { dayStartHour, dayEndHour } = useSettingsStore();
  const {
    monthlyPredictions,
    monthlyHiLo,
    monthlyLoading,
    error: tideError,
    fetchMonthlyTides,
  } = useTideStore();

  const viewMode = useThemeStore((s) => s.calendarViewMode);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [highlightedDate, setHighlightedDate] = useState(new Date());
  const [wind, setWind] = useState<WindReading[]>([]);
  const [swell, setSwell] = useState<SwellReading[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (groupSpots.length === 0) return;
    const spot = groupSpots[0];
    if (spot?.noaa_station_id) fetchMonthlyTides(spot.noaa_station_id);
    if (spot) {
      fetchWindWithFallback(spot.lat, spot.lng, 16).then(setWind).catch(() => setWind([]));
      fetchSwellWithFallback(spot.lat, spot.lng, 16).then(setSwell).catch(() => setSwell([]));

    }
  }, [groupSpots]);

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

  // Pre-compute day maps at page level for both timeline and modal
  const dayMap = useMemo(
    () => groupPredictionsByDay(monthlyPredictions),
    [monthlyPredictions]
  );
  const hiLoMap = useMemo(
    () => groupPredictionsByDay(monthlyHiLo),
    [monthlyHiLo]
  );

  // Timeline: 60 days from today
  const timelineDays = useMemo(() => {
    const days: TimelineDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push({ date: d, dateKey: localDateKey(d) });
    }
    return days;
  }, []);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return { predictions: [], hiLo: [], windows: [] };
    const key = localDateKey(selectedDate);
    return {
      predictions: dayMap.get(key) ?? [],
      hiLo: hiLoMap.get(key) ?? [],
      windows: dayWindows.get(key) ?? [],
    };
  }, [selectedDate, dayMap, hiLoMap, dayWindows]);

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

  // Track which day is currently visible in the timeline
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        setHighlightedDate((viewableItems[0].item as TimelineDay).date);
      }
    },
    []
  );

  const renderTimelineItem = useCallback(
    ({ item }: { item: TimelineDay }) => (
      <DayCard
        date={item.date}
        predictions={dayMap.get(item.dateKey) ?? []}
        hiLo={hiLoMap.get(item.dateKey) ?? []}
        windows={dayWindows.get(item.dateKey) ?? []}
        wind={wind}
        swell={swell}
        tideMin={representativePref?.tide_min_ft}
        tideMax={representativePref?.tide_max_ft}
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
        compact
      />
    ),
    [dayMap, hiLoMap, dayWindows, wind, swell, representativePref, dayStartHour, dayEndHour]
  );

  const keyExtractor = useCallback((item: TimelineDay) => item.dateKey, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const subHeader = (
    <CalendarSubHeader highlightedDate={highlightedDate} />
  );

  // Error / empty-prefs banners shown inside FlatList/ScrollView header
  const statusBanners = (
    <View style={{ backgroundColor: colors.bg }}>
      {tideError ? (
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
      ) : null}
      {spotsWithPrefs.length === 0 && !monthlyLoading ? (
        <View style={styles.prefsHint}>
          <Text style={styles.prefsHintText}>
            No tide preferences set — go to Surfer tab to enable spots
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (viewMode === 'timeline') {
    const timelineHeader = (
      <View style={{ backgroundColor: colors.bg }}>
        {subHeader}
        {statusBanners}
      </View>
    );

    return (
      <View style={styles.container}>
        {monthlyLoading && monthlyPredictions.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={timelineDays}
            keyExtractor={keyExtractor}
            renderItem={renderTimelineItem}
            ListHeaderComponent={timelineHeader}
            stickyHeaderIndices={[0]}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        )}

      </View>
    );
  }

  // Grid mode
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
      >
        {subHeader}
        {statusBanners}
        {hasContent && (
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{monthName1.toUpperCase()} {year}</Text>
          </View>
        )}
        {hasContent && (
          <CalendarGrid
            year={year}
            month={month}
            dayWindows={dayWindows}
            onDayPress={setSelectedDate}
          />
        )}
        {hasContent && (
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{monthName2.toUpperCase()} {nextYear}</Text>
          </View>
        )}
        {hasContent && (
          <CalendarGrid
            year={nextYear}
            month={nextMonth}
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
          wind={wind}
          swell={swell}
          tideMin={representativePref?.tide_min_ft}
          tideMax={representativePref?.tide_max_ft}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
          spotNdbcStationId={groupSpots[0]?.ndbc_station_id}
          spotLat={groupSpots[0]?.lat}
          spotLng={groupSpots[0]?.lng}
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
  prefsHint: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.cardAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefsHintText: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
  },
});
