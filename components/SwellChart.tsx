import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { line, area, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { SwellReading } from '@/types/conditions';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { View } from '@/components/Themed';
import { useChartTouch } from '@/hooks/useChartTouch';

interface Props {
  swell: SwellReading[];
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

const degToCompass = (d: number) => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(d / 22.5) % 16];
};

export function SwellChart({
  swell,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 160,
}: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  const { heightPath, heightArea, xScale, yScale, ticks, filtered } = useMemo(() => {
    const empty = { heightPath: '', heightArea: '', xScale: null, yScale: null, ticks: [], filtered: [] as SwellReading[] };
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

    const maxH = Math.max(...f.map((r) => r.heightFt));
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
    chartWidth - PADDING.right
  );

  if (!heightPath || !xScale || !yScale) {
    return null;
  }

  const activeReading = activeIndex != null ? filtered[activeIndex] : null;

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
            fill="#999"
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
            fill="#999"
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
            stroke="#eee"
            strokeWidth={1}
          />
        ))}

        {/* Swell height area fill */}
        <Path d={heightArea} fill="rgba(52, 152, 219, 0.15)" />

        {/* Swell height line */}
        <Path d={heightPath} fill="none" stroke="#3498db" strokeWidth={2} />

        {/* Touch crosshair */}
        {touchX != null && activeReading && (
          <>
            <Line
              x1={dataXPositions[activeIndex!]}
              y1={PADDING.top}
              x2={dataXPositions[activeIndex!]}
              y2={height - PADDING.bottom}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <Circle
              cx={dataXPositions[activeIndex!]}
              cy={yScale(activeReading.heightFt)}
              r={4}
              fill="#3498db"
            />
            {/* Label background */}
            <Rect
              x={clampLabelX(dataXPositions[activeIndex!] - 70, PADDING.left, chartWidth - PADDING.right - 140)}
              y={0}
              width={140}
              height={18}
              rx={4}
              fill="rgba(0,0,0,0.75)"
            />
            <SvgText
              x={clampLabelX(dataXPositions[activeIndex!], PADDING.left + 70, chartWidth - PADDING.right - 70)}
              y={13}
              fontSize={11}
              fill="#fff"
              textAnchor="middle"
              fontWeight="600">
              {activeReading.heightFt}ft @ {Math.round(activeReading.periodS)}s {degToCompass(activeReading.directionDeg)}
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
