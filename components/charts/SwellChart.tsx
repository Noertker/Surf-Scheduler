import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { line, area, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { SwellReading } from '@/types/conditions';
import { DEFAULT_DAY_START, DEFAULT_DAY_END, degToCompass } from '@/utils/tideWindows';
import { View } from '@/components/shared/View';
import { useChartTouch } from '@/hooks/useChartTouch';
import { useColors } from '@/hooks/useColors';

interface Props {
  swell: SwellReading[];
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
  interactive?: boolean;
  activeTime?: Date | null;
  onTimeChange?: (time: Date | null) => void;
  label?: string;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };
const SECONDARY_COLOR = '#f59e0b'; // amber/orange to match component color scheme

export function SwellChart({
  swell,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 160,
  interactive = true,
  activeTime,
  onTimeChange,
  label,
}: Props) {
  const colors = useColors();
  const chartWidth = Dimensions.get('window').width - 32;

  const { heightPath, heightArea, secondaryPath, secondaryArea, xScale, yScale, ticks, filtered } = useMemo(() => {
    const empty = { heightPath: '', heightArea: '', secondaryPath: '', secondaryArea: '', xScale: null, yScale: null, ticks: [], filtered: [] as SwellReading[] };
    if (swell.length === 0) return empty;

    const refDate = swell[0].timestamp;
    const dayStart = new Date(refDate);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const f = swell.filter(
      (r) => r.timestamp >= dayStart && r.timestamp <= dayEnd
    );
    if (f.length === 0) return empty;

    // Include secondary heights in max calculation
    const allHeights = f.flatMap((r) => {
      const h = [r.heightFt];
      if (r.secondaryHeightFt != null) h.push(r.secondaryHeightFt);
      return h;
    });
    const maxH = Math.max(...allHeights);
    const yMax = Math.ceil(maxH) + 1;

    const xS = scaleTime()
      .domain([dayStart, dayEnd])
      .range([PADDING.left, chartWidth - PADDING.right]);

    const yS = scaleLinear()
      .domain([0, yMax])
      .range([height - PADDING.bottom, PADDING.top]);

    const hLine = line<SwellReading>()
      .x((d) => xS(d.timestamp))
      .y((d) => yS(d.heightFt))
      .curve(curveNatural);

    const hArea = area<SwellReading>()
      .x((d) => xS(d.timestamp))
      .y0(yS(0))
      .y1((d) => yS(d.heightFt))
      .curve(curveNatural);

    // Secondary swell line (only if data exists)
    const hasSecondary = f.some((r) => r.secondaryHeightFt != null);
    let secPath = '';
    let secArea = '';
    if (hasSecondary) {
      const secFiltered = f.filter((r) => r.secondaryHeightFt != null);
      const sLine = line<SwellReading>()
        .x((d) => xS(d.timestamp))
        .y((d) => yS(d.secondaryHeightFt!))
        .curve(curveNatural);
      const sArea = area<SwellReading>()
        .x((d) => xS(d.timestamp))
        .y0(yS(0))
        .y1((d) => yS(d.secondaryHeightFt!))
        .curve(curveNatural);
      secPath = sLine(secFiltered) ?? '';
      secArea = sArea(secFiltered) ?? '';
    }

    const timeTicks: Date[] = [];
    const firstTick = Math.ceil(dayStartHour / 3) * 3;
    for (let h = firstTick; h <= dayEndHour; h += 3) {
      const tick = new Date(refDate);
      tick.setHours(h, 0, 0, 0);
      timeTicks.push(tick);
    }

    return {
      heightPath: hLine(f) ?? '',
      heightArea: hArea(f) ?? '',
      secondaryPath: secPath,
      secondaryArea: secArea,
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
      filtered: f,
    };
  }, [swell, chartWidth, height, dayStartHour, dayEndHour]);

  const dataXPositions = useMemo(
    () => (xScale && filtered.length > 0 ? filtered.map((r) => xScale(r.timestamp)) : []),
    [xScale, filtered]
  );

  const { panHandlers, touchX, activeIndex } = useChartTouch(
    dataXPositions,
    PADDING.left,
    chartWidth - PADDING.right,
    interactive,
  );

  const localActiveReading = activeIndex != null ? filtered[activeIndex] : null;
  React.useEffect(() => {
    if (!onTimeChange) return;
    onTimeChange(localActiveReading?.timestamp ?? null);
  }, [localActiveReading?.timestamp?.getTime()]);

  const resolvedReading = useMemo(() => {
    if (activeTime && xScale && filtered.length > 0) {
      let bestIdx = 0;
      let bestDist = Math.abs(filtered[0].timestamp.getTime() - activeTime.getTime());
      for (let i = 1; i < filtered.length; i++) {
        const dist = Math.abs(filtered[i].timestamp.getTime() - activeTime.getTime());
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      return filtered[bestIdx];
    }
    return localActiveReading;
  }, [activeTime, localActiveReading, filtered]);

  const showCrosshair = resolvedReading != null && (touchX != null || activeTime != null);

  if (!heightPath || !xScale || !yScale) {
    return null;
  }

  return (
    <View style={{ alignItems: 'center' }} {...panHandlers}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis labels (ft) */}
        {yScale.ticks(4).map((tick) => (
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

        {/* Secondary swell area + line (behind primary) */}
        {secondaryArea !== '' && (
          <Path d={secondaryArea} fill="rgba(245, 158, 11, 0.1)" />
        )}
        {secondaryPath !== '' && (
          <Path d={secondaryPath} fill="none" stroke={SECONDARY_COLOR} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
        )}

        {/* Primary swell height area fill */}
        <Path d={heightArea} fill="rgba(6, 182, 212, 0.15)" />

        {/* Primary swell height line */}
        <Path d={heightPath} fill="none" stroke={colors.chartSwell} strokeWidth={2} />

        {/* Touch crosshair */}
        {showCrosshair && resolvedReading && (
          <>
            <Line
              x1={xScale(resolvedReading.timestamp)}
              y1={PADDING.top}
              x2={xScale(resolvedReading.timestamp)}
              y2={height - PADDING.bottom}
              stroke={colors.crosshairStroke}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            {/* Primary dot */}
            <Circle
              cx={xScale(resolvedReading.timestamp)}
              cy={yScale(resolvedReading.heightFt)}
              r={4}
              fill={colors.chartSwell}
            />
            {/* Secondary dot */}
            {resolvedReading.secondaryHeightFt != null && (
              <Circle
                cx={xScale(resolvedReading.timestamp)}
                cy={yScale(resolvedReading.secondaryHeightFt)}
                r={3}
                fill={SECONDARY_COLOR}
              />
            )}
            {/* Label — only when no external sync */}
            {!activeTime && (
              <>
                <Rect
                  x={clampLabelX(xScale(resolvedReading.timestamp) - 80, PADDING.left, chartWidth - PADDING.right - 160)}
                  y={0}
                  width={160}
                  height={resolvedReading.secondaryHeightFt != null ? 30 : 18}
                  rx={4}
                  fill={colors.chartLabelBg}
                />
                <SvgText
                  x={clampLabelX(xScale(resolvedReading.timestamp), PADDING.left + 80, chartWidth - PADDING.right - 80)}
                  y={13}
                  fontSize={11}
                  fill={colors.crosshairLabelText}
                  textAnchor="middle"
                  fontWeight="600">
                  {resolvedReading.heightFt}ft @ {Math.round(resolvedReading.periodS)}s {degToCompass(resolvedReading.directionDeg)}
                </SvgText>
                {resolvedReading.secondaryHeightFt != null && (
                  <SvgText
                    x={clampLabelX(xScale(resolvedReading.timestamp), PADDING.left + 80, chartWidth - PADDING.right - 80)}
                    y={25}
                    fontSize={9}
                    fill={SECONDARY_COLOR}
                    textAnchor="middle"
                    fontWeight="600">
                    {resolvedReading.secondaryHeightFt}ft @ {Math.round(resolvedReading.secondaryPeriodS!)}s {degToCompass(resolvedReading.secondaryDirectionDeg!)}
                  </SvgText>
                )}
              </>
            )}
          </>
        )}

        {/* Floating chart label */}
        {label && (
          <SvgText
            x={PADDING.left + 2}
            y={height - PADDING.bottom - 4}
            fontSize={10}
            fontWeight="700"
            fill={colors.chartSwell}
            opacity={0.7}
          >
            {label}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

function clampLabelX(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}
