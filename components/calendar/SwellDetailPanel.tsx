import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { MultiSwellChart } from '@/components/charts/MultiSwellChart';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useSwellComponentStore } from '@/stores/useSwellComponentStore';
import { degToCompass } from '@/utils/tideWindows';
import { SwellComponentReading, BuoyObservation } from '@/types/conditions';
import { localDateKey } from '@/utils/tideWindows';

interface Props {
  date: Date;
  ndbcStationId: string | null;
  lat: number;
  lng: number;
  dayStartHour?: number;
  dayEndHour?: number;
  activeTime?: Date | null;
  onTimeChange?: (time: Date | null) => void;
}

const M_TO_FT = 3.28084;
const MPS_TO_MPH = 2.23694;

export const COMPONENT_COLORS = ['#06b6d4', '#f59e0b', '#a855f7', '#10b981'];
export const COMPONENT_LABELS = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];

export function SwellDetailPanel({
  date,
  ndbcStationId,
  lat,
  lng,
  dayStartHour,
  dayEndHour,
  activeTime,
  onTimeChange,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createSwellDetailStyles(colors), [colors]);
  const { components, buoyObs, loading, fetchForStation } = useSwellComponentStore();

  useEffect(() => {
    if (ndbcStationId) fetchForStation(ndbcStationId);
  }, [ndbcStationId]);

  // Filter components for this day
  const dayKey = localDateKey(date);
  const dayComponents = useMemo(
    () => components.filter((c) => localDateKey(c.validAt) === dayKey),
    [components, dayKey],
  );

  // Latest buoy observation with wave data (within 3 hours), fallback to any recent obs
  const latestObs = useMemo(() => {
    if (buoyObs.length === 0) return null;
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    const withWaves = buoyObs.find(
      (o) => o.observedAt.getTime() > threeHoursAgo && o.waveHeightFt != null,
    );
    if (withWaves) return withWaves;
    const latest = buoyObs[0];
    if (latest.observedAt.getTime() > threeHoursAgo) return latest;
    return null;
  }, [buoyObs]);

  // Get the latest swell breakdown (most recent observation's components)
  const latestBreakdown = useMemo(() => {
    if (dayComponents.length === 0) return [];
    // Get the most recent timestamp's components
    const latestTime = dayComponents[0].validAt.getTime();
    return dayComponents
      .filter((c) => c.validAt.getTime() === latestTime)
      .sort((a, b) => a.componentIndex - b.componentIndex);
  }, [dayComponents]);

  if (!ndbcStationId) return null;

  if (loading && dayComponents.length === 0 && !latestObs) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const hasData = dayComponents.length > 0 || latestObs != null;
  if (!hasData) return null;

  return (
    <View style={styles.container}>
      {/* Section title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>SWELL DETAIL</Text>
        {ndbcStationId && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>Buoy {ndbcStationId}</Text>
          </View>
        )}
      </View>

      {/* Latest buoy observation */}
      {latestObs && (
        <BuoyObsCard obs={latestObs} colors={colors} styles={styles} />
      )}

      {/* Multi-swell breakdown table */}
      {latestBreakdown.length > 0 && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionLabel}>SWELL COMPONENTS</Text>
          {latestBreakdown.map((comp) => (
            <SwellComponentRow key={comp.componentIndex} comp={comp} colors={colors} styles={styles} />
          ))}
        </View>
      )}

      {/* Multi-swell chart */}
      {dayComponents.length > 0 && (
        <View style={styles.chartContainer}>
          <MultiSwellChart
            components={dayComponents}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
            height={140}
            interactive={true}
            activeTime={activeTime}
            onTimeChange={onTimeChange}
          />
        </View>
      )}
    </View>
  );
}

// Sub-components

export function BuoyObsCard({
  obs,
  colors,
  styles,
}: {
  obs: BuoyObservation;
  colors: ThemeColors;
  styles: ReturnType<typeof createSwellDetailStyles>;
}) {
  const ageMinutes = Math.round((Date.now() - obs.observedAt.getTime()) / 60000);
  const ageLabel = ageMinutes < 60
    ? `${ageMinutes}m ago`
    : `${Math.round(ageMinutes / 60)}h ago`;

  return (
    <View style={styles.obsCard}>
      <View style={styles.obsRow}>
        <Text style={styles.obsLabel}>Observed</Text>
        <Text style={styles.obsAge}>{ageLabel}</Text>
      </View>
      <View style={styles.obsDataRow}>
        {obs.waveHeightFt != null && (
          <View style={styles.obsItem}>
            <Text style={styles.obsValue}>{obs.waveHeightFt}ft</Text>
            <Text style={styles.obsUnit}>height</Text>
          </View>
        )}
        {obs.dominantPeriodS != null && (
          <View style={styles.obsItem}>
            <Text style={styles.obsValue}>{obs.dominantPeriodS}s</Text>
            <Text style={styles.obsUnit}>period</Text>
          </View>
        )}
        {obs.meanDirectionDeg != null && (
          <View style={styles.obsItem}>
            <Text style={styles.obsValue}>{degToCompass(obs.meanDirectionDeg)}</Text>
            <Text style={styles.obsUnit}>{obs.meanDirectionDeg}°</Text>
          </View>
        )}
        {obs.waterTempF != null && (
          <View style={styles.obsItem}>
            <Text style={styles.obsValue}>{obs.waterTempF}°F</Text>
            <Text style={styles.obsUnit}>water</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function SwellComponentRow({
  comp,
  colors,
  styles,
}: {
  comp: SwellComponentReading;
  colors: ThemeColors;
  styles: ReturnType<typeof createSwellDetailStyles>;
}) {
  const color = COMPONENT_COLORS[comp.componentIndex] ?? colors.textDim;
  const label = COMPONENT_LABELS[comp.componentIndex] ?? `Swell ${comp.componentIndex + 1}`;

  return (
    <View style={styles.compRow}>
      <View style={[styles.compDot, { backgroundColor: color }]} />
      <Text style={[styles.compLabel, { color }]}>{label}</Text>
      <Text style={styles.compValue}>{comp.heightFt}ft</Text>
      <Text style={styles.compValue}>@ {comp.periodS}s</Text>
      <Text style={styles.compDir}>{comp.directionCompass} ({comp.directionDeg}°)</Text>
    </View>
  );
}

export const createSwellDetailStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    sourceBadge: {
      backgroundColor: colors.cardAlt,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    sourceBadgeText: {
      fontSize: 10,
      color: colors.textDim,
      fontWeight: '600',
    },
    // Buoy observation card
    obsCard: {
      backgroundColor: colors.cardAlt,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
    },
    obsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    obsLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1,
    },
    obsAge: {
      fontSize: 10,
      color: colors.textDim,
    },
    obsDataRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    obsItem: {
      alignItems: 'center',
    },
    obsValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    obsUnit: {
      fontSize: 10,
      color: colors.textDim,
      marginTop: 2,
    },
    // Swell components breakdown
    breakdownContainer: {
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: 6,
    },
    compRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    compDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    compLabel: {
      fontSize: 12,
      fontWeight: '600',
      width: 80,
    },
    compValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
    },
    compDir: {
      fontSize: 12,
      color: colors.textDim,
      flex: 1,
      textAlign: 'right',
    },
    // Chart
    chartContainer: {
      marginTop: 4,
    },
  });
