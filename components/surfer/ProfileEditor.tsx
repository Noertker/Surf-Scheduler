import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import {
  SurferProfile,
  SurferLevel,
  Stance,
  SURFER_LEVEL_OPTIONS,
  SURF_SKILL_OPTIONS,
} from '@/types/profile';
import { useProfileStore } from '@/stores/useProfileStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  profile: SurferProfile | null;
  onClose: () => void;
}

const STANCE_OPTIONS: Stance[] = ['regular', 'goofy'];

function EnumPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  formatLabel,
  colors,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => pickerStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.option, opt === value && styles.optionActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.optionText, opt === value && styles.optionTextActive]}>
              {formatLabel ? formatLabel(opt) : opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MultiSelectPicker({
  label,
  options,
  selected,
  onChange,
  colors,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => pickerStyles(colors), [colors]);
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => toggle(opt)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pickerStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
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
  });

const formatLevel = (level: string) =>
  level.replace(/_/g, ' ');

export function ProfileEditor({ visible, profile, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const saveProfile = useProfileStore((s) => s.saveProfile);

  const [level, setLevel] = useState<SurferLevel>(profile?.level ?? 'beginner');
  const [yearsExp, setYearsExp] = useState(profile?.years_experience?.toString() ?? '');
  const [stance, setStance] = useState<Stance>(profile?.stance ?? 'regular');
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [strengths, setStrengths] = useState<string[]>(profile?.strengths ?? []);
  const [weaknesses, setWeaknesses] = useState<string[]>(profile?.weaknesses ?? []);
  const [sessionFocus, setSessionFocus] = useState(profile?.session_focus ?? '');

  const handleSave = async () => {
    const years = parseInt(yearsExp, 10);
    await saveProfile({
      level,
      years_experience: isNaN(years) ? 0 : years,
      stance,
      goals,
      strengths,
      weaknesses,
      session_focus: sessionFocus.trim() || null,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {profile ? 'Edit Profile' : 'Create Profile'}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <EnumPicker
              label="Level"
              options={SURFER_LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
              formatLabel={formatLevel}
              colors={colors}
            />

            <EnumPicker
              label="Stance"
              options={STANCE_OPTIONS}
              value={stance}
              onChange={setStance}
              colors={colors}
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>YEARS SURFING</Text>
              <TextInput
                style={styles.input}
                value={yearsExp}
                onChangeText={setYearsExp}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <MultiSelectPicker
              label="Goals"
              options={SURF_SKILL_OPTIONS}
              selected={goals}
              onChange={setGoals}
              colors={colors}
            />

            <MultiSelectPicker
              label="Strengths"
              options={SURF_SKILL_OPTIONS}
              selected={strengths}
              onChange={setStrengths}
              colors={colors}
            />

            <MultiSelectPicker
              label="Weaknesses"
              options={SURF_SKILL_OPTIONS}
              selected={weaknesses}
              onChange={setWeaknesses}
              colors={colors}
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SESSION FOCUS</Text>
              <TextInput
                style={styles.notesInput}
                value={sessionFocus}
                onChangeText={setSessionFocus}
                placeholder="What are you working on right now?"
                placeholderTextColor={colors.textDim}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>
              {profile ? 'Save Changes' : 'Create Profile'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      marginBottom: 20,
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
    field: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1,
      marginBottom: 6,
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
      minHeight: 80,
      textAlignVertical: 'top',
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
