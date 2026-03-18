import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { area, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { SwellComponentReading } from '@/types/conditions';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { View } from '@/components/shared/View';
import { useChartTouch } from '@/hooks/useChartTouch';
import { useColors } from '@/hooks/useColors';

interface Props {
  components: SwellComponentReading[];
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
  interactive?: boolean;
  activeTime?: Date | null;
  onTimeChange?: (time: Date | null) => void;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

const COMPONENT_COLORS = [
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.20)' },   // Primary — cyan
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.18)' },   // Secondary — orange
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)' },   // Tertiary — purple
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)' },   // Quaternary — green
];

const LABELS = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];

interface TimeSlice {
  timestamp: Date;
  heights: number[]; // heights[0] = primary, [1] = secondary, etc.
}

export function MultiSwellChart({
  components,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 160,
  interactive = true,
  activeTime,
  onTimeChange,
}: Props) {
  const colors = useColors();
  const chartWidth = Dimensions.get('window').width - 32;

  const { slices, xScale, yScale, ticks, componentCount } = useMemo(() => {
    const empty = { slices: [] as TimeSlice[], xScale: null as any, yScale: null as any, ticks: [] as Date[], componentCount: 0 };
    if (components.length === 0) return empty;

    // Group by timestamp, build time slices
    const byTime = new Map<number, Map<number, SwellComponentReading>>();
    let maxIdx = 0;
    for (const c of components) {
      const key = c.validAt.getTime();
      if (!byTime.has(key)) byTime.set(key, new Map());
      byTime.get(key)!.set(c.componentIndex, c);
      if (c.componentIndex > maxIdx) maxIdx = c.componentIndex;
    }
    const numComponents = maxIdx + 1;

    // Build sorted time slices within day window
    const refDate = components[0].validAt;
    const dayStart = new Date(refDate);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const allSlices: TimeSlice[] = [];
    const sortedTimes = [...byTime.keys()].sort((a, b) => a - b);
    for (const t of sortedTimes) {
      const ts = new Date(t);
      if (ts < dayStart || ts > dayEnd) continue;
      const map = byTime.get(t)!;
      const heights: number[] = [];
      for (let i = 0; i < numComponents; i++) {
        heights.push(map.get(i)?.heightFt ?? 0);
      }
      allSlices.push({ timestamp: ts, heights });
    }

    if (allSlices.length === 0) return empty;

    // Max height across all components (not stacked — overlaid)
    const maxH = Math.max(...allSlices.flatMap((s) => s.heights));
    const yMax = Math.ceil(maxH) + 1;

    const xS = scaleTime()
      .domain([dayStart, dayEnd])
      .range([PADDING.left, chartWidth - PADDING.right]);

    const yS = scaleLinear()
      .domain([0, yMax])
      .range([height - PADDING.bottom, PADDING.top]);

    const timeTicks: Date[] = [];
    const firstTick = Math.ceil(dayStartHour / 3) * 3;
    for (let h = firstTick; h <= dayEndHour; h += 3) {
      const tick = new Date(refDate);
      tick.setHours(h, 0, 0, 0);
      timeTicks.push(tick);
    }

    return {
      slices: allSlices,
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
      componentCount: numComponents,
    };
  }, [components, chartWidth, height, dayStartHour, dayEndHour]);

  const dataXPositions = useMemo(
    () => (xScale && slices.length > 0 ? slices.map((s) => xScale(s.timestamp)) : []),
    [xScale, slices],
  );

  const { panHandlers, touchX, activeIndex } = useChartTouch(
    dataXPositions,
    PADDING.left,
    chartWidth - PADDING.right,
    interactive,
  );

  const localActiveSlice = activeIndex != null ? slices[activeIndex] : null;
  React.useEffect(() => {
    if (!onTimeChange) return;
    onTimeChange(localActiveSlice?.timestamp ?? null);
  }, [localActiveSlice?.timestamp?.getTime()]);

  const resolvedSlice = useMemo(() => {
    if (activeTime && xScale && slices.length > 0) {
      let bestIdx = 0;
      let bestDist = Math.abs(slices[0].timestamp.getTime() - activeTime.getTime());
      for (let i = 1; i < slices.length; i++) {
        const dist = Math.abs(slices[i].timestamp.getTime() - activeTime.getTime());
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      return slices[bestIdx];
    }
    return localActiveSlice;
  }, [activeTime, localActiveSlice, slices]);

  const showCrosshair = resolvedSlice != null && (touchX != null || activeTime != null);

  if (!xScale || !yScale || slices.length === 0) return null;

  // Build area paths for each component (rendered back to front: tertiary under, primary on top)
  const areaPaths: { path: string; color: typeof COMPONENT_COLORS[0] }[] = [];
  for (let idx = Math.min(componentCount, COMPONENT_COLORS.length) - 1; idx >= 0; idx--) {
    const areaGen = area<TimeSlice>()
      .x((d) => xScale(d.timestamp))
      .y0(yScale(0))
      .y1((d) => yScale(d.heights[idx] ?? 0))
      .curve(curveNatural);
    const path = areaGen(slices) ?? '';
    if (path) areaPaths.push({ path, color: COMPONENT_COLORS[idx] });
  }

  return (
    <View style={{ alignItems: 'center' }} {...panHandlers}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis labels */}
        {yScale.ticks(4).map((tick: number) => (
          <SvgText
            key={`y-${tick}`}
            x={PADDING.left - 4}
            y={yScale(tick) + 4}
            fontSize={10}
            fill={colors.chartAxis}
            textAnchor="end">
            {tick}
          </SvgText>
        ))}

        {/* X-axis time labels */}
        {ticks.map((tick) => (
          <SvgText
            key={`x-${tick.getTime()}`}
            x={xScale(tick)}
            y={height - 4}
            fontSize={10}
            fill={colors.chartAxis}
            textAnchor="middle">
            {tick.toLocaleTimeString([], { hour: 'numeric' })}
          </SvgText>
        ))}

        {/* Grid lines */}
        {ticks.map((tick) => (
          <Line
            key={`grid-${tick.getTime()}`}
            x1={xScale(tick)}
            y1={PADDING.top}
            x2={xScale(tick)}
            y2={height - PADDING.bottom}
            stroke={colors.chartGrid}
            strokeWidth={1}
          />
        ))}

        {/* Area fills (back to front) */}
        {areaPaths.map((ap, i) => (
          <Path key={`area-${i}`} d={ap.path} fill={ap.color.fill} />
        ))}

        {/* Stroke lines (back to front) */}
        {areaPaths.map((ap, i) => (
          <Path key={`line-${i}`} d={ap.path} fill="none" stroke={ap.color.stroke} strokeWidth={1.5} />
        ))}

        {/* Touch crosshair */}
        {showCrosshair && resolvedSlice && (
          <>
            <Line
              x1={xScale(resolvedSlice.timestamp)}
              y1={PADDING.top}
              x2={xScale(resolvedSlice.timestamp)}
              y2={height - PADDING.bottom}
              stroke={colors.crosshairStroke}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            {/* Dots for each component */}
            {resolvedSlice.heights.map((h, idx) =>
              h > 0 && idx < COMPONENT_COLORS.length ? (
                <Circle
                  key={`dot-${idx}`}
                  cx={xScale(resolvedSlice.timestamp)}
                  cy={yScale(h)}
                  r={3.5}
                  fill={COMPONENT_COLORS[idx].stroke}
                />
              ) : null,
            )}
            {/* Label — only when no external sync */}
            {!activeTime && (
              <>
                <Rect
                  x={clampX(xScale(resolvedSlice.timestamp) - 90, PADDING.left, chartWidth - PADDING.right - 180)}
                  y={0}
                  width={180}
                  height={18}
                  rx={4}
                  fill={colors.chartLabelBg}
                />
                <SvgText
                  x={clampX(xScale(resolvedSlice.timestamp), PADDING.left + 90, chartWidth - PADDING.right - 90)}
                  y={13}
                  fontSize={10}
                  fill={colors.crosshairLabelText}
                  textAnchor="middle"
                  fontWeight="600">
                  {resolvedSlice.heights
                    .map((h, idx) => (h > 0 ? `${LABELS[idx]}: ${h}ft` : null))
                    .filter(Boolean)
                    .join(' | ')}
                </SvgText>
              </>
            )}
          </>
        )}
      </Svg>
    </View>
  );
}

function clampX(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}
