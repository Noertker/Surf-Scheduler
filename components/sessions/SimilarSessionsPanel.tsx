import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useSurfboardStore } from '@/stores/useSurfboardStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { SimilarSession } from '@/utils/conditionsMatcher';

interface Props {
  similarSessions: SimilarSession[];
}

export function SimilarSessionsPanel({ similarSessions }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const boards = useSurfboardStore((s) => s.boards);

  const getBoardName = (boardId: string | null) => {
    if (!boardId) return null;
    return boards.find((b) => b.id === boardId)?.name ?? null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Similar Past Sessions</Text>

      {similarSessions.length === 0 ? (
        <Text style={styles.emptyText}>
          No similar sessions yet — keep logging!
        </Text>
      ) : (
        similarSessions.map((match) => {
          const s = match.session;
          const date = new Date(s.planned_start).toLocaleDateString('default', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const boardName = getBoardName(s.board_id);
          const snippet =
            s.feedback?.whatClicked ?? s.result_notes ?? null;
          const truncated =
            snippet && snippet.length > 60
              ? snippet.slice(0, 57) + '...'
              : snippet;

          // Scale rating from 1-10 to star display (half: 5 stars)
          const starCount = Math.round((s.rating ?? 0) / 2);

          return (
            <View key={s.id} style={styles.matchRow}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchDate}>{date}</Text>
                <Text style={styles.matchStars}>
                  {'\u2605'.repeat(starCount)}
                  {'\u2606'.repeat(5 - starCount)}
                </Text>
                {boardName && (
                  <Text style={styles.matchBoard}>{boardName}</Text>
                )}
              </View>
              {truncated && (
                <Text style={styles.matchSnippet}>{truncated}</Text>
              )}
              <View style={styles.tagRow}>
                {match.matchReasons.map((reason, i) => (
                  <Text key={i} style={styles.tag}>
                    {reason}
                  </Text>
                ))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: 'transparent',
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textDim,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textDim,
      fontStyle: 'italic',
    },
    matchRow: {
      backgroundColor: colors.cardAlt,
      borderRadius: 8,
      padding: 10,
      marginBottom: 6,
    },
    matchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'transparent',
    },
    matchDate: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    matchStars: {
      fontSize: 12,
      color: colors.warning,
    },
    matchBoard: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
    },
    matchSnippet: {
      fontSize: 12,
      color: colors.textDim,
      marginTop: 4,
      lineHeight: 16,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
      backgroundColor: 'transparent',
    },
    tag: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
      backgroundColor: colors.primaryDark,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
      textTransform: 'capitalize',
    },
  });
