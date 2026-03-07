import React, { useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Line, Text as SvgText, Circle } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { TidePrediction } from '@/types/tide';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { View } from '@/components/Themed';
import { useChartTouch } from '@/hooks/useChartTouch';

interface HighlightWindow {
  start: Date;
  end: Date;
  tideMin: number;
  tideMax: number;
}

interface Props {
  predictions: TidePrediction[];
  tideMin?: number;
  tideMax?: number;
  highlightWindow?: HighlightWindow;
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

export function TideChart({
  predictions,
  tideMin,
  tideMax,
  highlightWindow,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 200,
}: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  const { pathD, xScale, yScale, ticks, filtered } = useMemo(() => {
    if (predictions.length === 0) {
      return { pathD: '', xScale: null, yScale: null, ticks: [], filtered: [] };
    }

    const refDate = predictions[0].timestamp;
    const dayStart = new Date(refDate);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const f = predictions.filter(
      (p) => p.timestamp >= dayStart && p.timestamp <= dayEnd
    );
    if (f.length === 0) {
      return { pathD: '', xScale: null, yScale: null, ticks: [], filtered: [] };
    }

    const heights = f.map((p) => p.heightFt);
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    const yPad = (maxH - minH) * 0.15 || 0.5;

    const xS = scaleTime()
      .domain([dayStart, dayEnd])
      .range([PADDING.left, chartWidth - PADDING.right]);

    const yS = scaleLinear()
      .domain([minH - yPad, maxH + yPad])
      .range([height - PADDING.bottom, PADDING.top]);

    const lineGen = line<TidePrediction>()
      .x((d) => xS(d.timestamp))
      .y((d) => yS(d.heightFt))
      .curve(curveNatural);

    // Ticks every 3 hours within the visible range
    const timeTicks: Date[] = [];
    const firstTick = Math.ceil(dayStartHour / 3) * 3;
    for (let h = firstTick; h <= dayEndHour; h += 3) {
      const tick = new Date(refDate);
      tick.setHours(h, 0, 0, 0);
      timeTicks.push(tick);
    }

    return {
      pathD: lineGen(f) ?? '',
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
      filtered: f,
    };
  }, [predictions, chartWidth, height, dayStartHour, dayEndHour]);

  // Tide has many 6-min points — sample every ~4th for faster nearest lookup
  const { sampledPositions, sampledIndices } = useMemo(() => {
    if (!xScale || filtered.length === 0) return { sampledPositions: [], sampledIndices: [] };
    const step = Math.max(1, Math.floor(filtered.length / 160));
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < filtered.length; i += step) {
      positions.push(xScale(filtered[i].timestamp));
      indices.push(i);
    }
    return { sampledPositions: positions, sampledIndices: indices };
  }, [xScale, filtered]);

  const { panHandlers, touchX, activeIndex: sampledActiveIdx } = useChartTouch(
    sampledPositions,
    PADDING.left,
    chartWidth - PADDING.right
  );

  if (!pathD || !xScale || !yScale) {
    return null;
  }

  const activeIdx = sampledActiveIdx != null ? sampledIndices[sampledActiveIdx] : null;
  const activeReading = activeIdx != null ? filtered[activeIdx] : null;

  return (
    <View style={styles.container} {...panHandlers}>
      <Svg width={chartWidth} height={height}>
        {/* Preferred tide range shading — scoped to window if selected */}
        {highlightWindow && xScale ? (
          <Rect
            x={Math.max(PADDING.left, xScale(highlightWindow.start))}
            y={yScale(highlightWindow.tideMax)}
            width={Math.max(0,
              Math.min(xScale(highlightWindow.end), chartWidth - PADDING.right) -
              Math.max(xScale(highlightWindow.start), PADDING.left)
            )}
            height={Math.max(0, yScale(highlightWindow.tideMin) - yScale(highlightWindow.tideMax))}
            fill="rgba(46, 204, 113, 0.25)"
          />
        ) : tideMin != null && tideMax != null ? (
          <Rect
            x={PADDING.left}
            y={yScale(tideMax)}
            width={chartWidth - PADDING.left - PADDING.right}
            height={Math.max(0, yScale(tideMin) - yScale(tideMax))}
            fill="rgba(46, 204, 113, 0.15)"
          />
        ) : null}

        {/* Y-axis labels */}
        {yScale.ticks(4).map((tick) => (
          <SvgText
            key={`y-${tick}`}
            x={PADDING.left - 4}
            y={yScale(tick) + 4}
            fontSize={10}
            fill="#999"
            textAnchor="end">
            {tick.toFixed(1)}
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

        {/* Tide curve */}
        <Path d={pathD} fill="none" stroke="#2f95dc" strokeWidth={2.5} />

        {/* Touch crosshair */}
        {touchX != null && activeReading && activeIdx != null && (
          <>
            <Line
              x1={xScale(activeReading.timestamp)}
              y1={PADDING.top}
              x2={xScale(activeReading.timestamp)}
              y2={height - PADDING.bottom}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <Circle
              cx={xScale(activeReading.timestamp)}
              cy={yScale(activeReading.heightFt)}
              r={4}
              fill="#2f95dc"
            />
            {/* Label background */}
            <Rect
              x={clampLabelX(xScale(activeReading.timestamp) - 56, PADDING.left, chartWidth - PADDING.right - 112)}
              y={0}
              width={112}
              height={18}
              rx={4}
              fill="rgba(0,0,0,0.75)"
            />
            <SvgText
              x={clampLabelX(xScale(activeReading.timestamp), PADDING.left + 56, chartWidth - PADDING.right - 56)}
              y={13}
              fontSize={11}
              fill="#fff"
              textAnchor="middle"
              fontWeight="600">
              {activeReading.heightFt.toFixed(1)}ft @ {activeReading.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
