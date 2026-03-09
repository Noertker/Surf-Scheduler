import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager } from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useProfileStore } from '@/stores/useProfileStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import {
  PROGRESSION_LEVELS,
  ALL_STAGES,
  SkillStage,
  ProgressionNode,
  getStageIndex,
} from '@/constants/progression';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NodeStatus = 'completed' | 'current' | 'future';

function getNodeStatus(nodeStage: SkillStage, currentStage: SkillStage | null): NodeStatus {
  if (!currentStage) return 'future';
  const currentIdx = getStageIndex(currentStage);
  const nodeIdx = getStageIndex(nodeStage);
  if (nodeIdx < currentIdx) return 'completed';
  if (nodeIdx === currentIdx) return 'current';
  return 'future';
}

function getLineColor(
  nodeStage: SkillStage,
  currentStage: SkillStage | null,
  position: 'above' | 'below',
  colors: ThemeColors
): string {
  if (!currentStage) return colors.border;
  const currentIdx = getStageIndex(currentStage);
  const nodeIdx = getStageIndex(nodeStage);

  if (position === 'above') {
    // Line above this node
    if (nodeIdx <= currentIdx) return colors.accent;
    if (nodeIdx === currentIdx + 1) return colors.border;
    return colors.border;
  }
  // Line below this node
  if (nodeIdx < currentIdx) return colors.accent;
  if (nodeIdx === currentIdx) return colors.primary;
  return colors.border;
}

export function ProgressionSection() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, fetchProfile, saveProfile } = useProfileStore();
  const [expandedStage, setExpandedStage] = useState<SkillStage | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const currentStage = profile?.skill_stage ?? null;

  const handleToggle = useCallback(
    (stage: SkillStage) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedStage((prev) => (prev === stage ? null : stage));
    },
    []
  );

  const handleSetCurrent = useCallback(
    async (stage: SkillStage) => {
      await saveProfile({ skill_stage: stage });
    },
    [saveProfile]
  );

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Set up your surfer profile to track your progression.
        </Text>
      </View>
    );
  }

  // Flatten all nodes with their global index for line logic
  const allNodes: { node: ProgressionNode; globalIdx: number; isFirst: boolean; isLast: boolean }[] = [];
  let idx = 0;
  for (const group of PROGRESSION_LEVELS) {
    for (const node of group.nodes) {
      allNodes.push({ node, globalIdx: idx, isFirst: idx === 0, isLast: idx === ALL_STAGES.length - 1 });
      idx++;
    }
  }

  return (
    <View style={styles.container}>
      {!currentStage && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Tap a level to set your starting point</Text>
        </View>
      )}

      {PROGRESSION_LEVELS.map((group) => (
        <View key={group.level} style={styles.levelGroup}>
          {/* Level group header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLine} />
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{group.title}</Text>
            </View>
            <View style={styles.headerLine} />
          </View>
          <Text style={styles.headerSubtitle}>{group.subtitle}</Text>

          {/* Nodes */}
          {group.nodes.map((node) => {
            const globalIdx = ALL_STAGES.indexOf(node.stage);
            const isFirst = globalIdx === 0;
            const isLast = globalIdx === ALL_STAGES.length - 1;
            const status = getNodeStatus(node.stage, currentStage);
            const isExpanded = expandedStage === node.stage;

            return (
              <View key={node.stage}>
                <Pressable
                  style={styles.nodeRow}
                  onPress={() => handleToggle(node.stage)}
                >
                  {/* Left: line + bubble */}
                  <View style={styles.lineColumn}>
                    {/* Line above */}
                    <View
                      style={[
                        styles.lineSegment,
                        {
                          backgroundColor: isFirst
                            ? 'transparent'
                            : getLineColor(node.stage, currentStage, 'above', colors),
                        },
                      ]}
                    />
                    {/* Bubble */}
                    <View style={styles.bubbleWrapper}>
                      {status === 'current' && (
                        <View style={[styles.bubbleRing, { borderColor: colors.primary }]} />
                      )}
                      <View
                        style={[
                          styles.bubble,
                          status === 'completed' && { backgroundColor: colors.accent },
                          status === 'current' && { backgroundColor: colors.primary },
                          status === 'future' && {
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderColor: colors.textDim,
                          },
                        ]}
                      >
                        {status === 'completed' && (
                          <Text style={styles.checkmark}>{'\u2713'}</Text>
                        )}
                        {status === 'current' && (
                          <View style={styles.currentDot} />
                        )}
                      </View>
                    </View>
                    {/* Line below */}
                    <View
                      style={[
                        styles.lineSegment,
                        {
                          backgroundColor: isLast
                            ? 'transparent'
                            : getLineColor(node.stage, currentStage, 'below', colors),
                        },
                      ]}
                    />
                  </View>

                  {/* Right: label */}
                  <View style={styles.labelColumn}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[
                          styles.stageTag,
                          status === 'completed' && { color: colors.accent, borderColor: colors.accent },
                          status === 'current' && { color: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        {node.stage.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.nodeLabel,
                          status === 'completed' && { color: colors.textSecondary },
                          status === 'current' && { color: colors.text },
                          status === 'future' && { color: colors.textTertiary },
                        ]}
                      >
                        {node.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.boardHint,
                        status === 'future' && { color: colors.textDim },
                      ]}
                    >
                      {node.board}
                    </Text>
                  </View>

                  {/* Expand indicator */}
                  <Text style={styles.expandArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                </Pressable>

                {/* Expanded detail card */}
                {isExpanded && (
                  <View style={styles.detailOuter}>
                    {/* Connector line on the left */}
                    <View style={styles.detailLineColumn}>
                      <View
                        style={[
                          styles.detailLine,
                          {
                            backgroundColor: isLast
                              ? 'transparent'
                              : getLineColor(node.stage, currentStage, 'below', colors),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.detailCard}>
                      <DetailCard
                        node={node}
                        status={status}
                        colors={colors}
                        styles={styles}
                        onSetCurrent={handleSetCurrent}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function DetailCard({
  node,
  status,
  colors,
  styles,
  onSetCurrent,
}: {
  node: ProgressionNode;
  status: NodeStatus;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onSetCurrent: (stage: SkillStage) => void;
}) {
  return (
    <>
      {/* The Skill */}
      <Text style={styles.detailLabel}>THE SKILL</Text>
      <Text style={styles.detailText}>{node.skill}</Text>

      {/* Ideal Conditions */}
      <Text style={styles.detailLabel}>IDEAL CONDITIONS</Text>
      <Text style={styles.detailText}>{node.idealConditions}</Text>

      {/* Board */}
      <Text style={styles.detailLabel}>BOARD</Text>
      <View style={styles.boardTag}>
        <Text style={styles.boardTagText}>{node.board}</Text>
      </View>

      {/* Drills */}
      <Text style={styles.detailLabel}>DRILLS</Text>
      {node.drills.map((d, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>{d}</Text>
        </View>
      ))}

      {/* Progression Signals */}
      <Text style={[styles.detailLabel, { marginTop: 12 }]}>PROGRESSION SIGNALS</Text>
      {node.progressionSignals.map((s, i) => (
        <View key={i} style={styles.signalRow}>
          <View style={styles.checkbox} />
          <Text style={styles.signalText}>{s}</Text>
        </View>
      ))}

      {/* Videos placeholder */}
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoIcon}>{'\uD83C\uDFA5'}</Text>
        <Text style={styles.videoText}>Videos coming soon</Text>
      </View>

      {/* Set as Current button */}
      {status !== 'current' && (
        <Pressable
          style={styles.setCurrentButton}
          onPress={() => onSetCurrent(node.stage)}
        >
          <Text style={styles.setCurrentText}>Set as Current Level</Text>
        </Pressable>
      )}

      {status === 'current' && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Your Current Level</Text>
        </View>
      )}
    </>
  );
}

const BUBBLE_SIZE = 22;
const LINE_WIDTH = 40;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingBottom: 24,
    },
    empty: {
      paddingVertical: 30,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textDim,
      textAlign: 'center',
    },
    banner: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.primaryDark,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    bannerText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },

    // Level group
    levelGroup: {
      marginTop: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    headerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    headerBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 8,
    },
    headerBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: 8,
    },

    // Node row
    nodeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 16,
      minHeight: 56,
    },
    lineColumn: {
      width: LINE_WIDTH,
      alignItems: 'center',
    },
    lineSegment: {
      width: 2,
      flex: 1,
      minHeight: 8,
    },
    bubbleWrapper: {
      width: BUBBLE_SIZE + 10,
      height: BUBBLE_SIZE + 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleRing: {
      position: 'absolute',
      width: BUBBLE_SIZE + 10,
      height: BUBBLE_SIZE + 10,
      borderRadius: (BUBBLE_SIZE + 10) / 2,
      borderWidth: 2,
      opacity: 0.4,
    },
    bubble: {
      width: BUBBLE_SIZE,
      height: BUBBLE_SIZE,
      borderRadius: BUBBLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    currentDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#fff',
    },
    labelColumn: {
      flex: 1,
      paddingVertical: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stageTag: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      borderWidth: 1,
      borderColor: colors.textDim,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      overflow: 'hidden',
    },
    nodeLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      flex: 1,
    },
    boardHint: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },
    expandArrow: {
      fontSize: 10,
      color: colors.textDim,
      marginLeft: 4,
    },

    // Detail card (expanded)
    detailOuter: {
      flexDirection: 'row',
    },
    detailLineColumn: {
      width: LINE_WIDTH,
      alignItems: 'center',
    },
    detailLine: {
      width: 2,
      flex: 1,
    },
    detailCard: {
      flex: 1,
      marginRight: 16,
      marginBottom: 8,
      padding: 14,
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 6,
      marginTop: 8,
    },
    detailText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginBottom: 4,
    },

    // Board tag
    boardTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.primaryDark,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: 4,
    },
    boardTagText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },

    // Drills
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingRight: 4,
    },
    bulletDot: {
      fontSize: 13,
      color: colors.textTertiary,
      marginRight: 6,
      marginTop: 1,
    },
    bulletText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      flex: 1,
    },

    // Progression signals
    signalRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    checkbox: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: colors.textDim,
      marginRight: 8,
      marginTop: 2,
    },
    signalText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      flex: 1,
    },

    // Video placeholder
    videoPlaceholder: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.cardHighlight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    videoIcon: {
      fontSize: 16,
    },
    videoText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },

    // Set as Current button
    setCurrentButton: {
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    setCurrentText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },

    // Current badge
    currentBadge: {
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.primaryDark,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
    },
    currentBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
  });
