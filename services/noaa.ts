import { NOAAResponse } from '@/types/api';
import { TidePrediction } from '@/types/tide';
import { supabase } from './supabase';

const BASE_URL =
  'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Fetch tide predictions directly from NOAA.
 * interval: 'hilo' for high/low only, '6' for 6-minute intervals
 */
export async function fetchTidePredictions(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: 'hilo' | '6' = 'hilo'
): Promise<TidePrediction[]> {
  const params = new URLSearchParams({
    station: stationId,
    begin_date: formatDate(startDate),
    end_date: formatDate(endDate),
    product: 'predictions',
    datum: 'MLLW',
    interval,
    units: 'english',
    format: 'json',
    time_zone: 'lst_ldt',
    application: 'SurfScheduler',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`NOAA API error: ${res.status}`);

  const data: NOAAResponse = await res.json();

  if (!data.predictions) {
    throw new Error('No predictions returned from NOAA');
  }

  return data.predictions.map((p) => ({
    timestamp: new Date(p.t),
    heightFt: parseFloat(p.v),
    type: p.type as 'H' | 'L' | undefined,
  }));
}

/**
 * Get tide predictions with Supabase caching.
 * Checks cache first, fetches from NOAA if not available.
 */
export async function getTidePredictions(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: 'hilo' | '6' = 'hilo'
): Promise<TidePrediction[]> {
  // Check cache first
  const { data: cached } = await supabase
    .from('tide_cache')
    .select('*')
    .eq('station_id', stationId)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp');

  if (cached && cached.length > 10) {
    return cached.map((row) => ({
      timestamp: new Date(row.timestamp),
      heightFt: Number(row.height_ft),
      type: (row.type as 'H' | 'L') || undefined,
    }));
  }

  // Fetch from NOAA
  const predictions = await fetchTidePredictions(
    stationId,
    startDate,
    endDate,
    interval
  );

  // Cache in Supabase (upsert to handle overlapping requests)
  const rows = predictions.map((p) => ({
    station_id: stationId,
    timestamp: p.timestamp.toISOString(),
    height_ft: p.heightFt,
    type: p.type ?? null,
  }));

  if (rows.length > 0) {
    await supabase
      .from('tide_cache')
      .upsert(rows, { onConflict: 'station_id,timestamp' });
  }

  return predictions;
}
