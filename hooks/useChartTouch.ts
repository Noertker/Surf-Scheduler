import { useRef, useState, useMemo } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';

/**
 * Shared hook for touch-and-drag crosshair on SVG charts.
 * Returns panHandlers to spread on a wrapper View, plus the active touch X
 * and the index of the nearest data point.
 *
 * @param dataXPositions - array of pixel X positions for each data point (must be sorted ascending)
 * @param paddingLeft - left padding of the chart area
 * @param paddingRight - right edge of the chart area (chartWidth - padding.right)
 */
export function useChartTouch(
  dataXPositions: number[],
  paddingLeft: number,
  paddingRight: number
) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const findNearest = (x: number) => {
    if (dataXPositions.length === 0) return -1;
    // Clamp to chart area
    const clamped = Math.max(paddingLeft, Math.min(paddingRight, x));
    let bestIdx = 0;
    let bestDist = Math.abs(dataXPositions[0] - clamped);
    for (let i = 1; i < dataXPositions.length; i++) {
      const dist = Math.abs(dataXPositions[i] - clamped);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const handleTouch = (evt: GestureResponderEvent) => {
    const x = evt.nativeEvent.locationX;
    setTouchX(x);
    setActiveIndex(findNearest(x));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleTouch,
        onPanResponderMove: handleTouch,
        onPanResponderRelease: () => {
          setTouchX(null);
          setActiveIndex(null);
        },
        onPanResponderTerminate: () => {
          setTouchX(null);
          setActiveIndex(null);
        },
      }),
    [dataXPositions, paddingLeft, paddingRight]
  );

  return { panHandlers: panResponder.panHandlers, touchX, activeIndex };
}
