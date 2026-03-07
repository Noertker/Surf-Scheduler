import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { Surfboard, NoseShape, TailShape, FinSetup, RockerProfile } from '@/types/surfboard';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  board?: Surfboard;
  onSave: (data: Omit<Surfboard, 'id' | 'created_at'>) => void;
  onClose: () => void;
}

const NOSE_OPTIONS: NoseShape[] = ['pointed', 'round', 'hybrid'];
const TAIL_OPTIONS: TailShape[] = ['squash', 'round', 'swallow', 'pin', 'fish'];
const FIN_OPTIONS: FinSetup[] = ['thruster', 'quad', 'twin', 'single', '5-fin'];
const ROCKER_OPTIONS: RockerProfile[] = ['low', 'low-med', 'mid', 'mid-high', 'high'];

function EnumPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  colors,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
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
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const pickerStyles = (colors: ThemeColors) => StyleSheet.create({
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

export function BoardEditor({ visible, board, onSave, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(board?.name ?? '');
  const [lengthFt, setLengthFt] = useState(board?.length_ft?.toString() ?? '');
  const [widthIn, setWidthIn] = useState(board?.width_in?.toString() ?? '');
  const [thicknessIn, setThicknessIn] = useState(board?.thickness_in?.toString() ?? '');
  const [volumeL, setVolumeL] = useState(board?.volume_l?.toString() ?? '');
  const [noseShape, setNoseShape] = useState<NoseShape>(board?.nose_shape ?? 'round');
  const [tailShape, setTailShape] = useState<TailShape>(board?.tail_shape ?? 'squash');
  const [finSetup, setFinSetup] = useState<FinSetup>(board?.fin_setup ?? 'thruster');
  const [noseRocker, setNoseRocker] = useState<RockerProfile>(board?.nose_rocker ?? 'mid');
  const [tailRocker, setTailRocker] = useState<RockerProfile>(board?.tail_rocker ?? 'mid');

  const handleSave = () => {
    const length = parseFloat(lengthFt);
    const width = parseFloat(widthIn);
    const thickness = parseFloat(thicknessIn);
    if (!name.trim() || isNaN(length) || isNaN(width) || isNaN(thickness)) return;

    const vol = parseFloat(volumeL);
    onSave({
      user_id: null,
      name: name.trim(),
      length_ft: length,
      width_in: width,
      thickness_in: thickness,
      volume_l: isNaN(vol) ? null : vol,
      nose_shape: noseShape,
      tail_shape: tailShape,
      fin_setup: finSetup,
      nose_rocker: noseRocker,
      tail_rocker: tailRocker,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{board ? 'Edit Board' : 'Add Board'}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Daily Driver"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.dimRow}>
              <View style={styles.dimField}>
                <Text style={styles.fieldLabel}>LENGTH (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={lengthFt}
                  onChangeText={setLengthFt}
                  keyboardType="decimal-pad"
                  placeholder="6.2"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={styles.dimField}>
                <Text style={styles.fieldLabel}>WIDTH (in)</Text>
                <TextInput
                  style={styles.input}
                  value={widthIn}
                  onChangeText={setWidthIn}
                  keyboardType="decimal-pad"
                  placeholder="20.5"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <View style={styles.dimRow}>
              <View style={styles.dimField}>
                <Text style={styles.fieldLabel}>THICKNESS (in)</Text>
                <TextInput
                  style={styles.input}
                  value={thicknessIn}
                  onChangeText={setThicknessIn}
                  keyboardType="decimal-pad"
                  placeholder="2.6"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={styles.dimField}>
                <Text style={styles.fieldLabel}>VOLUME (L)</Text>
                <TextInput
                  style={styles.input}
                  value={volumeL}
                  onChangeText={setVolumeL}
                  keyboardType="decimal-pad"
                  placeholder="33"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <EnumPicker label="Nose Shape" options={NOSE_OPTIONS} value={noseShape} onChange={setNoseShape} colors={colors} />
            <EnumPicker label="Tail Shape" options={TAIL_OPTIONS} value={tailShape} onChange={setTailShape} colors={colors} />
            <EnumPicker label="Fin Setup" options={FIN_OPTIONS} value={finSetup} onChange={setFinSetup} colors={colors} />
            <EnumPicker label="Nose Rocker" options={ROCKER_OPTIONS} value={noseRocker} onChange={setNoseRocker} colors={colors} />
            <EnumPicker label="Tail Rocker" options={ROCKER_OPTIONS} value={tailRocker} onChange={setTailRocker} colors={colors} />
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>{board ? 'Save Changes' : 'Add Board'}</Text>
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
  dimRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dimField: {
    flex: 1,
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
