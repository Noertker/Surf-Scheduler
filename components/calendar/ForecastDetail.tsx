import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { TideChart } from '@/components/charts/TideChart';
import { WindChart } from '@/components/charts/WindChart';
import { SwellChart } from '@/components/charts/SwellChart';
import { MultiSwellChart } from '@/components/charts/MultiSwellChart';
import { SwellWindCompass } from '@/components/charts/SwellWindCompass';
import {
  BuoyObsCard,
  SwellComponentRow,
  createSwellDetailStyles,
  COMPONENT_COLORS,
  COMPONENT_LABELS,
} from '@/components/calendar/SwellDetailPanel';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useSwellComponentStore } from '@/stores/useSwellComponentStore';
import { TidePrediction } from '@/types/tide';
import { WindReading, SwellReading } from '@/types/conditions';
import { localDateKey } from '@/utils/tideWindows';

interface Props {
  visible: boolean;
  date: Date;
  predictions: TidePrediction[];
  wind: WindReading[];
  swell: SwellReading[];
  tideMin?: number;
  tideMax?: number;
  dayStartHour?: number;
  dayEndHour?: number;
  spotNdbcStationId?: string | null;
  spotLat?: number;
  spotLng?: number;
  onClose: () => void;
}

export function ForecastDetail({
  visible,
  date,
  predictions,
  wind,
  swell,
  tideMin,
  tideMax,
  dayStartHour,
  dayEndHour,
  spotNdbcStationId,
  spotLat,
  spotLng,
  onClose,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swellStyles = useMemo(() => createSwellDetailStyles(colors), [colors]);

  const { components, buoyObs, loading, fetchForStation } = useSwellComponentStore();

  useEffect(() => {
    if (spotNdbcStationId) fetchForStation(spotNdbcStationId);
  }, [spotNdbcStationId]);

  const dateStr = date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dayKey = localDateKey(date);

  // Filter data for this day
  const dayWind = useMemo(
    () => wind.filter((r) => localDateKey(r.timestamp) === dayKey),
    [wind, dayKey],
  );
  const daySwell = useMemo(
    () => swell.filter((r) => localDateKey(r.timestamp) === dayKey),
    [swell, dayKey],
  );
  const dayComponents = useMemo(
    () => components.filter((c) => localDateKey(c.validAt) === dayKey),
    [components, dayKey],
  );

  // Latest buoy observation with wave data (within 3 hours), fallback to any recent obs
  const latestObs = useMemo(() => {
    if (buoyObs.length === 0) return null;
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    // Prefer observation with wave data
    const withWaves = buoyObs.find(
      (o) => o.observedAt.getTime() > threeHoursAgo && o.waveHeightFt != null,
    );
    if (withWaves) return withWaves;
    // Fallback to most recent
    const latest = buoyObs[0];
    if (latest.observedAt.getTime() > threeHoursAgo) return latest;
    return null;
  }, [buoyObs]);

  // Latest swell breakdown
  const latestBreakdown = useMemo(() => {
    if (dayComponents.length === 0) return [];
    const latestTime = dayComponents[0].validAt.getTime();
    return dayComponents
      .filter((c) => c.validAt.getTime() === latestTime)
      .sort((a, b) => a.componentIndex - b.componentIndex);
  }, [dayComponents]);

  // Synchronized crosshair state
  const [activeTime, setActiveTime] = useState<Date | null>(null);
  const handleTimeChange = useCallback((time: Date | null) => {
    setActiveTime(time);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{dateStr}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeButton}>{'\u2715'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Compass */}
          {(dayComponents.length > 0 || dayWind.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SWELL & WIND COMPASS</Text>
              <SwellWindCompass
                swellComponents={components}
                wind={wind}
                date={date}
                size={220}
              />
            </View>
          )}

          {/* Buoy observation */}
          {latestObs && (
            <View style={styles.section}>
              <View style={swellStyles.titleRow}>
                <Text style={swellStyles.obsLabel}>BUOY OBSERVATION</Text>
                {spotNdbcStationId && (
                  <View style={swellStyles.sourceBadge}>
                    <Text style={swellStyles.sourceBadgeText}>Buoy {spotNdbcStationId}</Text>
                  </View>
                )}
              </View>
              <BuoyObsCard obs={latestObs} colors={colors} styles={swellStyles} />
            </View>
          )}

          {/* Swell component breakdown */}
          {latestBreakdown.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SWELL COMPONENTS</Text>
              {latestBreakdown.map((comp) => (
                <SwellComponentRow key={comp.componentIndex} comp={comp} colors={colors} styles={swellStyles} />
              ))}
            </View>
          )}

          {/* Tide chart */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TIDE</Text>
              <TideChart
                predictions={predictions}
                tideMin={tideMin}
                tideMax={tideMax}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                height={200}
                interactive
                activeTime={activeTime}
                onTimeChange={handleTimeChange}
              />
            </View>
          )}

          {/* Wind chart */}
          {dayWind.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>WIND (MPH)</Text>
              <WindChart
                wind={dayWind}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                height={140}
                interactive
                activeTime={activeTime}
                onTimeChange={handleTimeChange}
              />
            </View>
          )}

          {/* Swell chart */}
          {daySwell.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SWELL (FT)</Text>
              <SwellChart
                swell={daySwell}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                height={160}
                interactive
                activeTime={activeTime}
                onTimeChange={handleTimeChange}
              />
            </View>
          )}

          {/* Multi-swell chart */}
          {dayComponents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SPECTRAL SWELL BREAKDOWN</Text>
              <MultiSwellChart
                components={dayComponents}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                height={160}
                interactive
                activeTime={activeTime}
                onTimeChange={handleTimeChange}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textTertiary,
      padding: 4,
    },
    content: {
      paddingBottom: 40,
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
  });
