import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { TidePrediction } from '@/types/tide';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  initialStart: Date;
  initialEnd: Date;
  /** Tide predictions for the day — used for live tide interpolation preview. */
  predictions: TidePrediction[];
  /** Called when the user confirms. Return a promise to show a loading state. */
  onConfirm: (
    start: Date,
    end: Date,
    tideStartFt: number | null,
    tideEndFt: number | null,
  ) => Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function interpolateTide(predictions: TidePrediction[], targetMs: number): number | null {
  if (predictions.length === 0) return null;
  let best = predictions[0];
  let bestDiff = Math.abs(best.timestamp.getTime() - targetMs);
  for (const p of predictions) {
    const diff = Math.abs(p.timestamp.getTime() - targetMs);
    if (diff < bestDiff) { best = p; bestDiff = diff; }
  }
  return best.heightFt;
}

export function SessionTimeEditor({
  initialStart,
  initialEnd,
  predictions,
  onConfirm,
  onCancel,
  confirmLabel = 'Save',
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [start, setStart] = useState(() => new Date(initialStart));
  const [end, setEnd] = useState(() => new Date(initialEnd));
  const [saving, setSaving] = useState(false);

  const adjustTime = (which: 'start' | 'end', minutes: number) => {
    if (which === 'start') {
      setStart((prev) => new Date(prev.getTime() + minutes * 60_000));
    } else {
      setEnd((prev) => new Date(prev.getTime() + minutes * 60_000));
    }
  };

  const tideStart = useMemo(
    () => interpolateTide(predictions, start.getTime()),
    [predictions, start],
  );
  const tideEnd = useMemo(
    () => interpolateTide(predictions, end.getTime()),
    [predictions, end],
  );

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(start, end, tideStart, tideEnd);
    } catch (err) {
      console.error('SessionTimeEditor confirm failed:', err);
    }
    setSaving(false);
  };

  return (
    <View style={styles.form}>
      {/* Start row */}
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Start:</Text>
        <Pressable onPress={() => adjustTime('start', -15)} hitSlop={4}>
          <Text style={styles.timeAdjust}>-15m</Text>
        </Pressable>
        <Text style={styles.timeValue}>{fmtTime(start)}</Text>
        <Pressable onPress={() => adjustTime('start', 15)} hitSlop={4}>
          <Text style={styles.timeAdjust}>+15m</Text>
        </Pressable>
      </View>

      {/* End row */}
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>End:</Text>
        <Pressable onPress={() => adjustTime('end', -15)} hitSlop={4}>
          <Text style={styles.timeAdjust}>-15m</Text>
        </Pressable>
        <Text style={styles.timeValue}>{fmtTime(end)}</Text>
        <Pressable onPress={() => adjustTime('end', 15)} hitSlop={4}>
          <Text style={styles.timeAdjust}>+15m</Text>
        </Pressable>
      </View>

      {/* Tide preview */}
      {tideStart != null && tideEnd != null && (
        <View style={styles.tidePreviewRow}>
          <Text style={styles.tidePreviewLabel}>Tide:</Text>
          <Text style={styles.tidePreviewValue}>
            {tideStart.toFixed(1)}ft {'\u2192'} {tideEnd.toFixed(1)}ft
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={styles.cancelBtn} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    form: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryDark,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
      backgroundColor: 'transparent',
    },
    timeLabel: {
      fontSize: 13,
      fontWeight: '600',
      width: 40,
      color: colors.textSecondary,
    },
    timeAdjust: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    timeValue: {
      fontSize: 14,
      fontWeight: '700',
      minWidth: 80,
      textAlign: 'center',
      color: colors.text,
    },
    tidePreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
      backgroundColor: 'transparent',
    },
    tidePreviewLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textDim,
    },
    tidePreviewValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 4,
      backgroundColor: 'transparent',
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    cancelText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    confirmBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    confirmBtnDisabled: {
      opacity: 0.6,
    },
    confirmText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
