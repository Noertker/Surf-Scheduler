import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { TideWindow } from '@/types/tide';
import { formatTimeCompact, localDateKey } from '@/utils/tideWindows';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';

interface Props {
  year: number;
  month: number; // 0-indexed
  dayWindows: Map<string, TideWindow[]>; // key = "2026-03-06"
  onDayPress: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL_WIDTH = (Dimensions.get('window').width - 32) / 7;
const MAX_WINDOWS_SHOWN = 2;

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  return (
    <View style={styles.container}>
      {/* Day-of-week headers */}
      <View style={styles.headerRow}>
        {DAYS_OF_WEEK.map((d) => (
          <View key={d} style={styles.headerCell}>
            <Text style={styles.headerText}>{d.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) {
            return <View key={`blank-${i}`} style={styles.cell} />;
          }

          const key = localDateKey(date);
          const windows = dayWindows.get(key) ?? [];
          const hasWindows = windows.length > 0;
          const today = isToday(date);
          const past = isPast(date);

          const bySpot = new Map<string, TideWindow[]>();
          for (const w of windows) {
            const arr = bySpot.get(w.spotName) ?? [];
            arr.push(w);
            bySpot.set(w.spotName, arr);
          }
          const spotEntries = Array.from(bySpot.entries());
          const shownSpots = spotEntries.slice(0, MAX_WINDOWS_SHOWN);
          const moreCount = spotEntries.length - MAX_WINDOWS_SHOWN;

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
              <Text style={[styles.dayNumber, today && styles.dayNumberToday]}>
                {date.getDate()}
              </Text>
              {shownSpots.map(([spotName, spotWindows]) => (
                <View key={spotName} style={styles.windowEntry}>
                  <Text style={styles.windowSpot} numberOfLines={1}>
                    {spotName}
                  </Text>
                  {spotWindows.map((w, wi) => (
                    <React.Fragment key={wi}>
                      <Text style={styles.windowTime} numberOfLines={1}>
                        {formatTimeCompact(w.start)}-{formatTimeCompact(w.end)}
                      </Text>
                      {w.avgSwellFt != null && (
                        <Text style={styles.conditionsText} numberOfLines={1}>
                          {w.avgSwellFt}ft {w.avgWindMph}mph
                        </Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDim,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_WIDTH,
    minHeight: CELL_WIDTH * 1.1,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  cellWithWindows: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.todayTint,
  },
  cellPast: {
    opacity: 0.35,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  dayNumberToday: {
    color: colors.primary,
  },
  windowEntry: {
    marginTop: 1,
    backgroundColor: 'transparent',
  },
  windowSpot: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 14,
  },
  windowTime: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 14,
  },
  conditionsText: {
    fontSize: 9,
    color: colors.textDim,
    lineHeight: 11,
  },
  moreText: {
    fontSize: 9,
    color: colors.textDim,
    marginTop: 2,
  },
});
