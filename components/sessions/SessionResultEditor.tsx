import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { SurfSession, WaveType, ConditionsSnapshot, SessionFeedback } from '@/types/session';
import { SURF_SKILL_OPTIONS } from '@/types/profile';
import { LiveForecast, degToCompass } from '@/hooks/useSessionForecasts';
import { useSurfboardStore } from '@/stores/useSurfboardStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  session: SurfSession;
  forecast?: LiveForecast;
  onSave: (results: {
    rating: number;
    board_id?: string;
    wave_type?: WaveType;
    result_notes?: string;
    conditions_snapshot?: ConditionsSnapshot;
    feedback?: SessionFeedback;
  }) => void;
  onClose: () => void;
}

const WAVE_TYPES: WaveType[] = ['punchy', 'hollow', 'mushy'];
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function SessionResultEditor({ visible, session, forecast, onSave, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { boards, fetchBoards } = useSurfboardStore();

  const [rating, setRating] = useState(session.rating ?? 5);
  const [boardId, setBoardId] = useState<string | undefined>(session.board_id ?? undefined);
  const [waveType, setWaveType] = useState<WaveType | undefined>(session.wave_type ?? undefined);
  const [notes, setNotes] = useState(session.result_notes ?? '');

  // Expanded feedback fields
  const [waveCount, setWaveCount] = useState(
    session.feedback?.waveCountEstimate?.toString() ?? ''
  );
  const [boardFeel, setBoardFeel] = useState(session.feedback?.boardFeelRating ?? 5);
  const [focusGoals, setFocusGoals] = useState<string[]>(
    session.feedback?.focusGoalsWorked ?? []
  );
  const [whatClicked, setWhatClicked] = useState(session.feedback?.whatClicked ?? '');
  const [whatDidnt, setWhatDidnt] = useState(session.feedback?.whatDidnt ?? '');

  useEffect(() => {
    if (visible) fetchBoards();
  }, [visible]);

  const toggleGoal = (goal: string) => {
    setFocusGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSave = () => {
    // Freeze conditions from live forecast at feedback time
    const conditionsSnapshot: ConditionsSnapshot | undefined = forecast
      ? {
          tide: forecast.tide,
          wind: forecast.wind,
          swell: forecast.swell
            ? {
                primaryHeightFt: forecast.swell.primaryHeightFt,
                primaryDirectionDeg: forecast.swell.primaryDirectionDeg,
                primaryPeriodS: forecast.swell.primaryPeriodS,
                primaryPeakPeriodS: forecast.swell.primaryPeakPeriodS,
                secondaryHeightFt: forecast.swell.secondaryHeightFt,
                secondaryDirectionDeg: forecast.swell.secondaryDirectionDeg,
                secondaryPeriodS: forecast.swell.secondaryPeriodS,
                combinedHeightFt: forecast.swell.combinedHeightFt,
                energyKj: forecast.swell.energyKj,
              }
            : null,
        }
      : undefined;

    const waveCountNum = parseInt(waveCount, 10);

    onSave({
      rating,
      board_id: boardId,
      wave_type: waveType,
      result_notes: notes.trim() || undefined,
      conditions_snapshot: conditionsSnapshot,
      feedback: {
        waveCountEstimate: isNaN(waveCountNum) ? null : waveCountNum,
        boardFeelRating: boardFeel,
        focusGoalsWorked: focusGoals,
        whatClicked: whatClicked.trim() || null,
        whatDidnt: whatDidnt.trim() || null,
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Session</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          {/* Session info header */}
          <View style={styles.sessionInfo}>
            <Text style={styles.infoSpot}>{session.spot_name}</Text>
            <Text style={styles.infoTime}>
              {new Date(session.planned_start).toLocaleDateString('default', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {'  '}
              {new Date(session.planned_start).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {' - '}
              {new Date(session.planned_end).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.infoConditions}>
              {(forecast?.tide ?? session.tide_start_ft != null) && (
                <Text style={styles.infoStat}>
                  {forecast
                    ? `${forecast.tide?.startFt}→${forecast.tide?.endFt}ft`
                    : `${session.tide_start_ft}→${session.tide_end_ft}ft`}
                </Text>
              )}
              {(forecast?.wind ?? session.avg_wind_mph != null) && (
                <Text style={styles.infoStat}>
                  {forecast?.wind
                    ? `${forecast.wind.avgMph}mph ${degToCompass(forecast.wind.directionDeg)} g${forecast.wind.avgGustsMph}`
                    : `${session.avg_wind_mph}mph`}
                </Text>
              )}
              {(forecast?.swell ?? session.avg_swell_ft != null) && (
                <Text style={styles.infoStat}>
                  {forecast?.swell
                    ? `${forecast.swell.primaryHeightFt}ft@${forecast.swell.primaryPeriodS}s ${degToCompass(forecast.swell.primaryDirectionDeg)}`
                    : `${session.avg_swell_ft}ft swell`}
                </Text>
              )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rating 1-10 */}
            <Text style={styles.fieldLabel}>OVERALL RATING</Text>
            <View style={styles.optionRow}>
              {RATINGS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRating(r)}
                  style={[styles.ratingChip, r === rating && styles.optionActive]}
                >
                  <Text style={[styles.ratingChipText, r === rating && styles.optionTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Wave Type */}
            <Text style={styles.fieldLabel}>WAVE TYPE</Text>
            <View style={styles.optionRow}>
              {WAVE_TYPES.map((wt) => (
                <Pressable
                  key={wt}
                  style={[styles.option, wt === waveType && styles.optionActive]}
                  onPress={() => setWaveType(wt === waveType ? undefined : wt)}
                >
                  <Text style={[styles.optionText, wt === waveType && styles.optionTextActive]}>
                    {wt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Wave Count */}
            <Text style={styles.fieldLabel}>WAVES CAUGHT (ESTIMATE)</Text>
            <TextInput
              style={styles.input}
              value={waveCount}
              onChangeText={setWaveCount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textDim}
            />

            {/* Board Used */}
            <Text style={styles.fieldLabel}>BOARD USED</Text>
            {boards.length > 0 ? (
              <View style={styles.optionRow}>
                {boards.map((b) => (
                  <Pressable
                    key={b.id}
                    style={[styles.option, b.id === boardId && styles.optionActive]}
                    onPress={() => setBoardId(b.id === boardId ? undefined : b.id)}
                  >
                    <Text style={[styles.optionText, b.id === boardId && styles.optionTextActive]}>
                      {b.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.hintText}>
                Add boards in Surfer → Quiver to track board performance
              </Text>
            )}

            {/* Board Feel */}
            {boardId && (
              <>
                <Text style={styles.fieldLabel}>BOARD FEEL</Text>
                <View style={styles.optionRow}>
                  {RATINGS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setBoardFeel(r)}
                      style={[styles.ratingChip, r === boardFeel && styles.optionActive]}
                    >
                      <Text style={[styles.ratingChipText, r === boardFeel && styles.optionTextActive]}>
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Focus Goals Worked */}
            <Text style={styles.fieldLabel}>FOCUS / GOALS WORKED ON</Text>
            <View style={styles.optionRow}>
              {SURF_SKILL_OPTIONS.map((skill) => {
                const active = focusGoals.includes(skill);
                return (
                  <Pressable
                    key={skill}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => toggleGoal(skill)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {skill}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* What Clicked */}
            <Text style={styles.fieldLabel}>WHAT CLICKED</Text>
            <TextInput
              style={styles.notesInput}
              value={whatClicked}
              onChangeText={setWhatClicked}
              placeholder="Breakthroughs, things that felt good..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={2}
            />

            {/* What Didn't */}
            <Text style={styles.fieldLabel}>WHAT DIDN'T WORK</Text>
            <TextInput
              style={styles.notesInput}
              value={whatDidnt}
              onChangeText={setWhatDidnt}
              placeholder="Struggles, things to work on..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={2}
            />

            {/* General Notes */}
            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else about the session?"
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Results</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayDark,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
    padding: 4,
  },
  sessionInfo: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoSpot: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  infoTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  infoStat: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#fff',
  },
  ratingChip: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.cardAlt,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 12,
    color: colors.textDim,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.cardAlt,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
