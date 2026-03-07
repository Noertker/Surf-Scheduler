/**
 * Local tide prediction using harmonic constituents.
 * Uses @neaps/tide-predictor for the math — no external API needed.
 */
import { createTidePredictor } from '@neaps/tide-predictor';
import { TidePrediction } from '@/types/tide';
import { getStationConstituents } from '@/constants/harmonics';

/**
 * Compute 6-minute interval predictions locally from harmonic constituents.
 * Heights are in feet relative to MLLW.
 */
export function computeTimelinePredictions(
  stationId: string,
  startDate: Date,
  endDate: Date
): TidePrediction[] {
  const stationData = getStationConstituents(stationId);
  if (!stationData) {
    throw new Error(`No harmonic data for station ${stationId}`);
  }

  const predictor = createTidePredictor(stationData.constituents, {
    offset: stationData.mslToMllwFt,
  });

  const timeline = predictor.getTimelinePrediction({
    start: startDate,
    end: endDate,
    timeFidelity: 360, // 6 minutes in seconds
  });

  return timeline.map((point) => ({
    timestamp: point.time,
    heightFt: point.level,
  }));
}

/**
 * Compute high/low tide predictions locally from harmonic constituents.
 * Heights are in feet relative to MLLW.
 */
export function computeHiLoPredictions(
  stationId: string,
  startDate: Date,
  endDate: Date
): TidePrediction[] {
  const stationData = getStationConstituents(stationId);
  if (!stationData) {
    throw new Error(`No harmonic data for station ${stationId}`);
  }

  const predictor = createTidePredictor(stationData.constituents, {
    offset: stationData.mslToMllwFt,
  });

  const extremes = predictor.getExtremesPrediction({
    start: startDate,
    end: endDate,
    ...(stationData.offsets ? { offsets: stationData.offsets } : {}),
  });

  return extremes.map((point) => ({
    timestamp: point.time,
    heightFt: point.level,
    type: point.high ? 'H' : 'L',
  }));
}
