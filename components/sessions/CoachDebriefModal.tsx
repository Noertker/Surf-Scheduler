import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useCoachStore } from '@/stores/useCoachStore';
import { SurfSession } from '@/types/session';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  session: SurfSession;
  onClose: () => void;
}

export function CoachDebriefModal({ visible, session, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { response, loading, error, fetchPostDebrief, clearCoach } =
    useCoachStore();

  useEffect(() => {
    if (visible) {
      clearCoach();
      fetchPostDebrief(session);
    }
  }, [visible]);

  const handleClose = () => {
    clearCoach();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Coach Debrief</Text>
              <Text style={styles.subtitle}>{session.spot_name}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeButton}>X</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView style={styles.responseScroll}>
            <Text style={styles.responseText}>
              {response || ''}
              {loading && '\u2588'}
            </Text>
          </ScrollView>
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
      maxHeight: '80%',
      backgroundColor: colors.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      backgroundColor: 'transparent',
    },
    headerLeft: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textTertiary,
      padding: 4,
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      marginBottom: 12,
    },
    responseScroll: {
      flex: 1,
    },
    responseText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
  });
