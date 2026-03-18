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

  const url = `${BASE_URL}?${params}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(
      `Network error fetching ${interval} tides for station ${stationId}: ${(err as Error).message}`
    );
  }

  if (!res.ok) throw new Error(`NOAA API error: ${res.status}`);

  const data: NOAAResponse = await res.json();

  if (!data.predictions) {
    throw new Error(
      `No predictions returned from NOAA for station ${stationId}`
    );
  }

  return data.predictions.map((p) => ({
    // NOAA returns "2026-03-06 05:00" — replace space with T
    // so JS parses as local time per spec (without T, some engines use UTC)
    timestamp: new Date(p.t.replace(' ', 'T')),
    heightFt: parseFloat(p.v),
    type: p.type as 'H' | 'L' | undefined,
  }));
}

/**
 * Get tide predictions with Supabase caching.
 * Checks cache first, fetches from NOAA if not available.
 * For 6-minute data, expects ~240 points/day. For hilo, ~4 points/day.
 */
export async function getTidePredictions(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: 'hilo' | '6' = 'hilo'
): Promise<TidePrediction[]> {
  // Check cache first (non-fatal — if cache fails, just fetch from NOAA)
  try {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    // 6-minute data: ~240 rows/day; default Supabase limit is 1000 rows
    const queryLimit = interval === '6' ? days * 250 : days * 10;
    const { data: cached, error: cacheErr } = await supabase
      .from('tide_cache')
      .select('*')
      .eq('station_id', stationId)
      .eq('interval', interval)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp')
      .limit(queryLimit);

    if (!cacheErr && cached && cached.length > 0) {
      // Verify cached data actually spans the requested date range
      const firstTs = new Date(cached[0].timestamp).getTime();
      const lastTs = new Date(cached[cached.length - 1].timestamp).getTime();
      const coverageDays = (lastTs - firstTs) / (1000 * 60 * 60 * 24);

      if (coverageDays >= days - 1) {
        return cached.map((row) => ({
          timestamp: new Date(row.timestamp),
          heightFt: Number(row.height_ft),
          type: (row.type as 'H' | 'L') || undefined,
        }));
      }
    }
  } catch {
    console.warn('Cache check failed, fetching from NOAA directly');
  }

  // Fetch from NOAA (batch into 30-day chunks for 6-minute data)
  const maxDaysPerRequest = interval === '6' ? 30 : 365;
  const allPredictions: TidePrediction[] = [];

  let chunkStart = new Date(startDate);
  while (chunkStart < endDate) {
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setDate(chunkEnd.getDate() + maxDaysPerRequest);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());

    const chunk = await fetchTidePredictions(
      stationId,
      chunkStart,
      chunkEnd,
      interval
    );
    allPredictions.push(...chunk);

    chunkStart = new Date(chunkEnd);
    chunkStart.setDate(chunkStart.getDate() + 1);
  }

  // Cache in Supabase (non-fatal — data is still returned even if caching fails)
  try {
    const rows = allPredictions.map((p) => ({
      station_id: stationId,
      timestamp: p.timestamp.toISOString(),
      height_ft: p.heightFt,
      type: p.type ?? null,
      interval,
    }));

    if (rows.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await supabase
          .from('tide_cache')
          .upsert(rows.slice(i, i + BATCH_SIZE), {
            onConflict: 'station_id,timestamp,interval',
          });
      }
    }
  } catch {
    console.warn('Cache write failed, data still available');
  }

  return allPredictions;
}
