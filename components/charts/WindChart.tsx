import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { line, area, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { WindReading } from '@/types/conditions';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { View } from '@/components/shared/View';
import { useChartTouch } from '@/hooks/useChartTouch';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';

interface Props {
  wind: WindReading[];
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

const degToCompass = (d: number) => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(d / 22.5) % 16];
};

export function WindChart({
  wind,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 140,
}: Props) {
  const colors = useColors();
  const chartWidth = Dimensions.get('window').width - 32;

  const { speedPath, gustArea, xScale, yScale, ticks, filtered } = useMemo(() => {
    if (wind.length === 0) {
      return { speedPath: '', gustArea: '', xScale: null, yScale: null, ticks: [], filtered: [] };
    }

    const refDate = wind[0].timestamp;
    const dayStart = new Date(refDate);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const f = wind.filter(
      (r) => r.timestamp >= dayStart && r.timestamp <= dayEnd
    );
    if (f.length === 0) {
      return { speedPath: '', gustArea: '', xScale: null, yScale: null, ticks: [], filtered: [] };
    }

    const maxGust = Math.max(...f.map((r) => r.gustsMph));
    const yMax = Math.ceil(maxGust / 5) * 5 + 5;

    const xS = scaleTime()
      .domain([dayStart, dayEnd])
      .range([PADDING.left, chartWidth - PADDING.right]);

    const yS = scaleLinear()
      .domain([0, yMax])
      .range([height - PADDING.bottom, PADDING.top]);

    const speedLine = line<WindReading>()
      .x((d) => xS(d.timestamp))
      .y((d) => yS(d.speedMph))
      .curve(curveNatural);

    const gustAreaGen = area<WindReading>()
      .x((d) => xS(d.timestamp))
      .y0((d) => yS(d.speedMph))
      .y1((d) => yS(d.gustsMph))
      .curve(curveNatural);

    const timeTicks: Date[] = [];
    const firstTick = Math.ceil(dayStartHour / 3) * 3;
    for (let h = firstTick; h <= dayEndHour; h += 3) {
      const tick = new Date(refDate);
      tick.setHours(h, 0, 0, 0);
      timeTicks.push(tick);
    }

    return {
      speedPath: speedLine(f) ?? '',
      gustArea: gustAreaGen(f) ?? '',
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
      filtered: f,
    };
  }, [wind, chartWidth, height, dayStartHour, dayEndHour]);

  const dataXPositions = useMemo(
    () => (xScale && filtered.length > 0 ? filtered.map((r) => xScale(r.timestamp)) : []),
    [xScale, filtered]
  );

  const { panHandlers, touchX, activeIndex } = useChartTouch(
    dataXPositions,
    PADDING.left,
    chartWidth - PADDING.right
  );

  if (!speedPath || !xScale || !yScale) {
    return null;
  }

  const activeReading = activeIndex != null ? filtered[activeIndex] : null;

  return (
    <View style={{ alignItems: 'center' }} {...panHandlers}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis labels (mph) */}
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

        {/* Gust area (shaded between speed and gusts) */}
        <Path d={gustArea} fill="rgba(248, 113, 113, 0.15)" />

        {/* Wind speed line */}
        <Path d={speedPath} fill="none" stroke={colors.chartWind} strokeWidth={2} />

        {/* Touch crosshair */}
        {touchX != null && activeReading && (
          <>
            <Line
              x1={dataXPositions[activeIndex!]}
              y1={PADDING.top}
              x2={dataXPositions[activeIndex!]}
              y2={height - PADDING.bottom}
              stroke={colors.crosshairStroke}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <Circle
              cx={dataXPositions[activeIndex!]}
              cy={yScale(activeReading.speedMph)}
              r={4}
              fill={colors.chartWind}
            />
            <Circle
              cx={dataXPositions[activeIndex!]}
              cy={yScale(activeReading.gustsMph)}
              r={3}
              fill="rgba(248, 113, 113, 0.5)"
            />
            {/* Label background */}
            <Rect
              x={clampLabelX(dataXPositions[activeIndex!] - 62, PADDING.left, chartWidth - PADDING.right - 124)}
              y={0}
              width={124}
              height={18}
              rx={4}
              fill={colors.chartLabelBg}
            />
            <SvgText
              x={clampLabelX(dataXPositions[activeIndex!], PADDING.left + 62, chartWidth - PADDING.right - 62)}
              y={13}
              fontSize={11}
              fill={colors.crosshairLabelText}
              textAnchor="middle"
              fontWeight="600">
              {Math.round(activeReading.speedMph)}mph {degToCompass(activeReading.directionDeg)} g{Math.round(activeReading.gustsMph)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

function clampLabelX(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}
