import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { DayCard } from '@/components/calendar/DayCard';
import { SwellDetailPanel } from '@/components/calendar/SwellDetailPanel';
import { ThemeColors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { TidePrediction, TideWindow } from '@/types/tide';
import { WindReading, SwellReading } from '@/types/conditions';

interface Props {
  visible: boolean;
  date: Date;
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  windows: TideWindow[];
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
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

export function DayDetail({
  visible, date, predictions, hiLo, windows, wind, swell,
  tideMin, tideMax, dayStartHour, dayEndHour,
  spotNdbcStationId, spotLat, spotLng,
  onClose, onPrevDay, onNextDay,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showDetails, setShowDetails] = useState(false);

  const dateStr = date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.navRow}>
              {onPrevDay ? (
                <Pressable onPress={onPrevDay} hitSlop={12} style={styles.navArrow}>
                  <Text style={styles.navArrowText}>{'\u2039'}</Text>
                </Pressable>
              ) : <View style={styles.navArrow} />}
              <Text style={styles.title}>{dateStr}</Text>
              {onNextDay ? (
                <Pressable onPress={onNextDay} hitSlop={12} style={styles.navArrow}>
                  <Text style={styles.navArrowText}>{'\u203A'}</Text>
                </Pressable>
              ) : <View style={styles.navArrow} />}
            </View>
            <View style={styles.headerRight}>
              {spotNdbcStationId && (
                <Pressable
                  onPress={() => setShowDetails((v) => !v)}
                  hitSlop={8}
                  style={[styles.detailsButton, showDetails && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.detailsButtonText, showDetails && { color: colors.card }]}>
                    {showDetails ? 'Less' : 'Details'}
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.closeButton}>{'\u2715'}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <DayCard
              date={date}
              predictions={predictions}
              hiLo={hiLo}
              windows={windows}
              wind={wind}
              swell={swell}
              tideMin={tideMin}
              tideMax={tideMax}
              dayStartHour={dayStartHour}
              dayEndHour={dayEndHour}
              compact={false}
            />
            {showDetails && spotNdbcStationId && spotLat != null && spotLng != null && (
              <SwellDetailPanel
                date={date}
                ndbcStationId={spotNdbcStationId}
                lat={spotLat}
                lng={spotLng}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayDark },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
    backgroundColor: 'transparent',
  },
  navArrow: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  navArrowText: { fontSize: 28, fontWeight: '600', color: colors.primary, lineHeight: 32 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1, color: colors.text },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'transparent',
  },
  detailsButton: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: colors.primary,
  },
  detailsButtonText: {
    fontSize: 12, fontWeight: '600', color: colors.primary,
  },
  closeButton: { fontSize: 16, fontWeight: '600', color: colors.textTertiary, padding: 4 },
});
