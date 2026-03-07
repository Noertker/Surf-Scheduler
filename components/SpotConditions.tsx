import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TideChart } from './TideChart';
import { TidePrediction } from '@/types/tide';
import { SwellReading, WindReading } from '@/types/conditions';

interface Props {
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  swell: SwellReading[];
  wind: WindReading[];
  loading: boolean;
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function findClosest<T extends { timestamp: Date }>(readings: T[]): T | undefined {
  if (readings.length === 0) return undefined;
  const now = Date.now();
  return readings.reduce((closest, r) =>
    Math.abs(r.timestamp.getTime() - now) < Math.abs(closest.timestamp.getTime() - now) ? r : closest
  );
}

export function SpotConditions({ predictions, hiLo, swell, wind, loading }: Props) {
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  // Filter to today's data for the chart
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayPredictions = predictions.filter(
    (p) => p.timestamp >= today && p.timestamp < tomorrow
  );
  const todayHiLo = hiLo.filter(
    (p) => p.timestamp >= today && p.timestamp < tomorrow
  );

  const currentSwell = findClosest(swell);
  const currentWind = findClosest(wind);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tide Chart */}
      {todayPredictions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Today's Tides</Text>
          <TideChart predictions={todayPredictions} />
        </>
      )}

      {/* Hi/Lo Summary */}
      {todayHiLo.length > 0 && (
        <View style={styles.hiLoRow}>
          {todayHiLo.map((p, i) => (
            <View key={i} style={styles.hiLoItem}>
              <Text style={styles.hiLoType}>
                {p.type === 'H' ? 'High' : 'Low'}
              </Text>
              <Text style={styles.hiLoValue}>
                {p.heightFt.toFixed(1)} ft
              </Text>
              <Text style={styles.hiLoTime}>
                {p.timestamp.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Current Swell */}
      {currentSwell && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swell</Text>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {currentSwell.heightFt} ft
              </Text>
              <Text style={styles.dataLabel}>Height</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {currentSwell.periodS.toFixed(0)}s
              </Text>
              <Text style={styles.dataLabel}>Period</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {degToCompass(currentSwell.directionDeg)}
              </Text>
              <Text style={styles.dataLabel}>Direction</Text>
            </View>
          </View>
        </View>
      )}

      {/* Current Wind */}
      {currentWind && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wind</Text>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {currentWind.speedMph} mph
              </Text>
              <Text style={styles.dataLabel}>Speed</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {currentWind.gustsMph} mph
              </Text>
              <Text style={styles.dataLabel}>Gusts</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>
                {degToCompass(currentWind.directionDeg)}
              </Text>
              <Text style={styles.dataLabel}>Direction</Text>
            </View>
          </View>
        </View>
      )}

      {predictions.length === 0 && swell.length === 0 && !loading && (
        <Text style={styles.placeholder}>
          Select a spot to see conditions
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  hiLoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  hiLoItem: {
    alignItems: 'center',
  },
  hiLoType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  hiLoValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  hiLoTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 12,
  },
  dataItem: {
    alignItems: 'center',
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  dataLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 60,
    opacity: 0.5,
    fontSize: 16,
  },
});
