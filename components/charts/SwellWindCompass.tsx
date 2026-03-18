import React, { useMemo } from 'react';
import Svg, { Circle, Line, Text as SvgText, Path } from 'react-native-svg';
import { View } from '@/components/shared/View';
import { useColors } from '@/hooks/useColors';
import { SwellComponentReading, WindReading } from '@/types/conditions';
import { localDateKey } from '@/utils/tideWindows';
import { COMPONENT_COLORS } from '@/components/calendar/SwellDetailPanel';

interface Props {
  swellComponents: SwellComponentReading[];
  wind: WindReading[];
  date: Date;
  size?: number;
  /** Hide NESW labels and arrow value labels (compact tooltip mode) */
  hideLabels?: boolean;
}

const CARDINAL = ['N', 'E', 'S', 'W'] as const;
const CARDINAL_ANGLES = [0, 90, 180, 270];

/**
 * Convert meteorological direction (where FROM, clockwise from N)
 * to SVG angle (0 = up/north, clockwise).
 */
function dirToXY(dirDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((dirDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/**
 * Build an arrow path from outer edge pointing toward center.
 * Arrow tip is at `tipRadius` from center, base is at `baseRadius`.
 * Width of arrow base scales with `thickness`.
 */
function arrowPath(
  dirDeg: number,
  baseRadius: number,
  tipRadius: number,
  thickness: number,
  cx: number,
  cy: number,
): string {
  // Tip point (toward center)
  const tip = dirToXY(dirDeg, tipRadius, cx, cy);
  // Base center (at compass edge)
  const baseCenter = dirToXY(dirDeg, baseRadius, cx, cy);
  // Perpendicular offset for arrow width
  const perpRad = ((dirDeg) * Math.PI) / 180;
  const halfW = thickness / 2;
  const baseLeft = {
    x: baseCenter.x + halfW * Math.cos(perpRad),
    y: baseCenter.y + halfW * Math.sin(perpRad),
  };
  const baseRight = {
    x: baseCenter.x - halfW * Math.cos(perpRad),
    y: baseCenter.y - halfW * Math.sin(perpRad),
  };

  return `M ${tip.x} ${tip.y} L ${baseLeft.x} ${baseLeft.y} L ${baseRight.x} ${baseRight.y} Z`;
}

export function SwellWindCompass({
  swellComponents,
  wind,
  date,
  size = 200,
  hideLabels = false,
}: Props) {
  const colors = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const outerR = hideLabels ? size / 2 - 4 : size / 2 - 20; // more space when no labels
  const innerRings = [outerR * 0.33, outerR * 0.66, outerR];

  const dayKey = localDateKey(date);

  // Get latest swell components for this day
  const latestSwellComps = useMemo(() => {
    const dayComps = swellComponents.filter((c) => localDateKey(c.validAt) === dayKey);
    if (dayComps.length === 0) return [];
    const latestTime = dayComps[0].validAt.getTime();
    return dayComps
      .filter((c) => c.validAt.getTime() === latestTime)
      .sort((a, b) => a.componentIndex - b.componentIndex);
  }, [swellComponents, dayKey]);

  // Get nearest wind reading to midday
  const nearestWind = useMemo(() => {
    const dayWind = wind.filter((w) => localDateKey(w.timestamp) === dayKey);
    if (dayWind.length === 0) return null;
    // Pick the one closest to noon
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    let best = dayWind[0];
    let bestDist = Math.abs(best.timestamp.getTime() - noon.getTime());
    for (const w of dayWind) {
      const dist = Math.abs(w.timestamp.getTime() - noon.getTime());
      if (dist < bestDist) { bestDist = dist; best = w; }
    }
    return best;
  }, [wind, dayKey, date]);

  // Compute max energy for scaling arrows
  const maxEnergy = useMemo(() => {
    let max = 1;
    for (const c of latestSwellComps) {
      const energy = c.heightFt * c.periodS;
      if (energy > max) max = energy;
    }
    if (nearestWind) {
      // Wind: use gusts * 3 to make comparable scale (gusts >= speed)
      const gustEnergy = nearestWind.gustsMph * 3;
      if (gustEnergy > max) max = gustEnergy;
    }
    return max;
  }, [latestSwellComps, nearestWind]);

  if (latestSwellComps.length === 0 && !nearestWind) return null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: hideLabels ? 0 : 8 }}>
      <Svg width={size} height={size}>
        {/* Concentric guide circles */}
        {innerRings.map((r, i) => (
          <Circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.chartGrid}
            strokeWidth={i === innerRings.length - 1 ? 1.5 : 0.5}
            fill="none"
          />
        ))}

        {/* Cardinal direction lines */}
        {CARDINAL_ANGLES.map((deg) => {
          const outer = dirToXY(deg, outerR, cx, cy);
          return (
            <Line
              key={`line-${deg}`}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke={colors.chartGrid}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Cardinal labels */}
        {!hideLabels && CARDINAL.map((label, i) => {
          const pos = dirToXY(CARDINAL_ANGLES[i], outerR + 14, cx, cy);
          return (
            <SvgText
              key={`label-${label}`}
              x={pos.x}
              y={pos.y + 4}
              fontSize={11}
              fontWeight="700"
              fill={colors.textDim}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Swell arrows (one per component) */}
        {latestSwellComps.map((comp) => {
          const energy = comp.heightFt * comp.periodS;
          const scale = Math.min(energy / maxEnergy, 1);
          const arrowLen = scale * outerR * 0.7; // how far toward center
          const thickness = Math.max(4, scale * 14);
          const tipR = outerR - arrowLen;
          const color = COMPONENT_COLORS[comp.componentIndex] ?? colors.textDim;

          // Label position — just outside the arrow base
          const labelPos = dirToXY(comp.directionDeg, outerR + 2, cx, cy);
          // Offset label slightly outward if near cardinal labels
          const labelR = outerR - arrowLen / 2;
          const midPos = dirToXY(comp.directionDeg, labelR, cx, cy);

          return (
            <React.Fragment key={`swell-${comp.componentIndex}`}>
              <Path
                d={arrowPath(comp.directionDeg, outerR, tipR, thickness, cx, cy)}
                fill={color}
                opacity={0.85}
              />
              {/* Value label at midpoint of arrow */}
              {!hideLabels && (
                <SvgText
                  x={midPos.x}
                  y={midPos.y + 3}
                  fontSize={9}
                  fontWeight="700"
                  fill={colors.text}
                  textAnchor="middle"
                >
                  {comp.heightFt}ft {comp.periodS}s
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Wind gust arrow (lighter, behind speed arrow) */}
        {nearestWind && nearestWind.gustsMph > nearestWind.speedMph && (() => {
          const gustEnergy = nearestWind.gustsMph * 3;
          const gustScale = Math.min(gustEnergy / maxEnergy, 1);
          const gustLen = gustScale * outerR * 0.6;
          const gustThickness = Math.max(4, gustScale * 12);
          const gustTipR = outerR - gustLen;

          return (
            <Path
              d={arrowPath(nearestWind.directionDeg, outerR, gustTipR, gustThickness, cx, cy)}
              fill={colors.chartWind}
              opacity={0.25}
            />
          );
        })()}

        {/* Wind speed arrow */}
        {nearestWind && nearestWind.speedMph > 0 && (() => {
          const windEnergy = nearestWind.speedMph * 3;
          const scale = Math.min(windEnergy / maxEnergy, 1);
          const arrowLen = scale * outerR * 0.6;
          const thickness = Math.max(3, scale * 10);
          const tipR = outerR - arrowLen;

          const midR = outerR - arrowLen / 2;
          const midPos = dirToXY(nearestWind.directionDeg, midR, cx, cy);

          return (
            <>
              <Path
                d={arrowPath(nearestWind.directionDeg, outerR, tipR, thickness, cx, cy)}
                fill={colors.chartWind}
                opacity={0.7}
              />
              {!hideLabels && (
                <SvgText
                  x={midPos.x}
                  y={midPos.y + 3}
                  fontSize={9}
                  fontWeight="700"
                  fill={colors.text}
                  textAnchor="middle"
                >
                  {Math.round(nearestWind.speedMph)}mph
                </SvgText>
              )}
            </>
          );
        })()}

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={3} fill={colors.textDim} />
      </Svg>
    </View>
  );
}
