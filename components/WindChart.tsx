import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { line, area, curveNatural } from 'd3-shape';
import { scaleLinear, scaleTime } from 'd3-scale';
import { WindReading } from '@/types/conditions';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { View } from '@/components/Themed';

interface Props {
  wind: WindReading[];
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 36 };

export function WindChart({
  wind,
  dayStartHour = DEFAULT_DAY_START,
  dayEndHour = DEFAULT_DAY_END,
  height = 140,
}: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  const { speedPath, gustArea, xScale, yScale, ticks } = useMemo(() => {
    if (wind.length === 0) {
      return { speedPath: '', gustArea: '', xScale: null, yScale: null, ticks: [] };
    }

    const refDate = wind[0].timestamp;
    const dayStart = new Date(refDate);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(refDate);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const filtered = wind.filter(
      (r) => r.timestamp >= dayStart && r.timestamp <= dayEnd
    );
    if (filtered.length === 0) {
      return { speedPath: '', gustArea: '', xScale: null, yScale: null, ticks: [] };
    }

    const maxGust = Math.max(...filtered.map((r) => r.gustsMph));
    const yMax = Math.ceil(maxGust / 5) * 5 + 5; // round up to nearest 5, plus padding

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
      speedPath: speedLine(filtered) ?? '',
      gustArea: gustAreaGen(filtered) ?? '',
      xScale: xS,
      yScale: yS,
      ticks: timeTicks,
    };
  }, [wind, chartWidth, height, dayStartHour, dayEndHour]);

  if (!speedPath || !xScale || !yScale) {
    return null;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis labels (mph) */}
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

        {/* Gust area (shaded between speed and gusts) */}
        <Path d={gustArea} fill="rgba(231, 76, 60, 0.15)" />

        {/* Wind speed line */}
        <Path d={speedPath} fill="none" stroke="#e74c3c" strokeWidth={2} />
      </Svg>
    </View>
  );
}
