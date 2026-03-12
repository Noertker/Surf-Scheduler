import { useRef, useState, useMemo } from 'react';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';

/**
 * Shared hook for touch-and-drag crosshair on SVG charts.
 * Returns panHandlers to spread on a wrapper View, plus the active touch X
 * and the index of the nearest data point.
 *
 * Uses a horizontal-bias gesture check so that horizontal scrubbing claims
 * the touch from a parent ScrollView/FlatList, while vertical swipes
 * pass through to allow scrolling.
 */
const EMPTY_PAN_HANDLERS = {};

export function useChartTouch(
  dataXPositions: number[],
  paddingLeft: number,
  paddingRight: number,
  enabled: boolean = true,
) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const claimed = useRef(false);

  const findNearest = (x: number) => {
    if (dataXPositions.length === 0) return -1;
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

  const isHorizontalGesture = (_: GestureResponderEvent, gs: PanResponderGestureState) =>
    Math.abs(gs.dx) > 4 && Math.abs(gs.dx) > Math.abs(gs.dy * 1.5);

  const panResponder = useMemo(
    () =>
      enabled
        ? PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: isHorizontalGesture,
            onMoveShouldSetPanResponderCapture: isHorizontalGesture,
            onPanResponderGrant: (evt) => {
              claimed.current = true;
              handleTouch(evt);
            },
            onPanResponderMove: handleTouch,
            // Refuse to release the gesture once we've claimed it
            onPanResponderTerminationRequest: () => !claimed.current,
            onPanResponderRelease: () => {
              claimed.current = false;
              setTouchX(null);
              setActiveIndex(null);
            },
            onPanResponderTerminate: () => {
              claimed.current = false;
              setTouchX(null);
              setActiveIndex(null);
            },
          })
        : null,
    [dataXPositions, paddingLeft, paddingRight, enabled]
  );

  return {
    panHandlers: panResponder ? panResponder.panHandlers : EMPTY_PAN_HANDLERS,
    touchX: enabled ? touchX : null,
    activeIndex: enabled ? activeIndex : null,
  };
}
