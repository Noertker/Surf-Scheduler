import React, { useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Line, Text as SvgText } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { TidePrediction } from '@/types/tide';
import { View } from '@/components/Themed';

interface Props {
  predictions: TidePrediction[];
  tideMin?: number;
  tideMax?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

export function TideChart({ predictions, tideMin, tideMax, height = 200 }: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  const { pathD, xScale, yScale, ticks } = useMemo(() => {
    if (predictions.length === 0) {
      return { pathD: '', xScale: null, yScale: null, ticks: [] };
    }

    // Fixed 5am–9pm window
    const refDate = predictions[0].timestamp;
    const dayStart = new Date(refDate);
    dayStart.setHours(5, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(21, 0, 0, 0);

    const filtered = predictions.filter(
      (p) => p.timestamp >= dayStart && p.timestamp <= dayEnd
    );
    if (filtered.length === 0) {
      return { pathD: '', xScale: null, yScale: null, ticks: [] };
    }

    const heights = filtered.map((p) => p.heightFt);
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

    // Ticks every 3 hours from 6am to 9pm
    const timeTicks: Date[] = [];
    for (let h = 6; h <= 21; h += 3) {
      const tick = new Date(refDate);
      tick.setHours(h, 0, 0, 0);
      timeTicks.push(tick);
    }

    return {
      pathD: lineGen(filtered) ?? '',
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
    };
  }, [predictions, chartWidth, height]);

  if (!pathD || !xScale || !yScale) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Preferred tide range shading */}
        {tideMin != null && tideMax != null && (
          <Rect
            x={PADDING.left}
            y={yScale(tideMax)}
            width={chartWidth - PADDING.left - PADDING.right}
            height={Math.max(0, yScale(tideMin) - yScale(tideMax))}
            fill="rgba(46, 204, 113, 0.15)"
          />
        )}

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
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
