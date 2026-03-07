import React from 'react';
import { StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TideWindow } from '@/types/tide';
import { formatTimeCompact } from '@/utils/tideWindows';

interface Props {
  year: number;
  month: number; // 0-indexed
  dayWindows: Map<string, TideWindow[]>; // key = "2026-03-06"
  onDayPress: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL_WIDTH = (Dimensions.get('window').width - 32) / 7;
const MAX_WINDOWS_SHOWN = 2;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isPast(d: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export function CalendarGrid({ year, month, dayWindows, onDayPress }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const monthName = firstDay.toLocaleString('default', { month: 'long' });

  // Build grid cells: leading blanks + day cells
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>
        {monthName} {year}
      </Text>

      {/* Day-of-week headers */}
      <View style={styles.headerRow}>
        {DAYS_OF_WEEK.map((d) => (
          <View key={d} style={styles.headerCell}>
            <Text style={styles.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) {
            return <View key={`blank-${i}`} style={styles.cell} />;
          }

          const key = dateKey(date);
          const windows = dayWindows.get(key) ?? [];
          const hasWindows = windows.length > 0;
          const today = isToday(date);
          const past = isPast(date);

          // Deduplicate by spot, show first window per spot
          const bySpot = new Map<string, TideWindow>();
          for (const w of windows) {
            if (!bySpot.has(w.spotId)) bySpot.set(w.spotId, w);
          }
          const summaries = Array.from(bySpot.values()).slice(
            0,
            MAX_WINDOWS_SHOWN
          );
          const moreCount = bySpot.size - MAX_WINDOWS_SHOWN;

          return (
            <Pressable
              key={key}
              style={[
                styles.cell,
                hasWindows && styles.cellWithWindows,
                today && styles.cellToday,
                past && styles.cellPast,
              ]}
              onPress={() => onDayPress(date)}>
              <Text
                style={[
                  styles.dayNumber,
                  today && styles.dayNumberToday,
                  past && styles.dayNumberPast,
                ]}>
                {date.getDate()}
              </Text>
              {summaries.map((w) => (
                <Text key={w.spotId} style={styles.windowText} numberOfLines={1}>
                  {formatTimeCompact(w.start)}-{formatTimeCompact(w.end)}
                </Text>
              ))}
              {moreCount > 0 && (
                <Text style={styles.moreText}>+{moreCount}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_WIDTH,
    minHeight: CELL_WIDTH * 1.1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  cellWithWindows: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#2f95dc',
  },
  cellPast: {
    opacity: 0.5,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNumberToday: {
    color: '#2f95dc',
  },
  dayNumberPast: {
    opacity: 0.6,
  },
  windowText: {
    fontSize: 9,
    opacity: 0.7,
    lineHeight: 12,
  },
  moreText: {
    fontSize: 9,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
