import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const NDBC_BASE = 'https://www.ndbc.noaa.gov/data/realtime2';

const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Spot {
  lat: number;
  lng: number;
  ndbc_station_id: string | null;
}

interface ForecastRow {
  lat_grid: number;
  lng_grid: number;
  forecast_hour: string;
  swell_height_m: number | null;
  swell_direction_deg: number | null;
  swell_period_s: number | null;
  swell_peak_period_s: number | null;
  secondary_swell_height_m: number | null;
  secondary_swell_direction_deg: number | null;
  secondary_swell_period_s: number | null;
  wave_height_m: number | null;
  wave_direction_deg: number | null;
  wave_period_s: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  wind_gusts_kmh: number | null;
}

interface BuoyRow {
  station_id: string;
  observed_at: string;
  wave_height_m: number | null;
  dominant_period_s: number | null;
  avg_period_s: number | null;
  mean_direction_deg: number | null;
  wind_speed_mps: number | null;
  wind_direction_deg: number | null;
  wind_gust_mps: number | null;
  pressure_hpa: number | null;
  air_temp_c: number | null;
  water_temp_c: number | null;
}

interface SwellComponentRow {
  source_type: 'forecast';
  lat_grid: number;
  lng_grid: number;
  valid_at: string;
  component_index: number;
  height_m: number;
  period_s: number;
  direction_deg: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toGrid(val: number): number {
  return Math.round(val * 100) / 100;
}

function isMissing(v: number, threshold: number): boolean {
  return v == null || isNaN(v) || v >= threshold;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Open-Meteo fetchers
// ---------------------------------------------------------------------------

async function fetchMarineForGrid(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: [
      'swell_wave_height', 'swell_wave_direction',
      'swell_wave_period', 'swell_wave_peak_period',
      'secondary_swell_wave_height', 'secondary_swell_wave_direction',
      'secondary_swell_wave_period',
      'wave_height', 'wave_direction', 'wave_period',
    ].join(','),
    forecast_days: '16',
  });

  const res = await fetch(`${MARINE_URL}?${params}`);
  if (!res.ok) throw new Error(`Marine API ${res.status}`);
  return await res.json();
}

async function fetchWeatherForGrid(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    forecast_days: '16',
    timezone: 'UTC',
  });

  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather API ${res.status}`);
  return await res.json();
}

// ---------------------------------------------------------------------------
// NDBC standard meteorological parser
// ---------------------------------------------------------------------------

function parseNdbcStandardData(text: string, stationId: string): BuoyRow[] {
  const lines = text.split('\n');
  const rows: BuoyRow[] = [];

  // Skip 2 header lines
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].trim().split(/\s+/);
    if (cols.length < 13) continue;

    const yr = parseInt(cols[0]);
    const mo = parseInt(cols[1]);
    const dy = parseInt(cols[2]);
    const hr = parseInt(cols[3]);
    const mn = parseInt(cols[4]);
    const wdir = parseFloat(cols[5]);
    const wspd = parseFloat(cols[6]);
    const gst = parseFloat(cols[7]);
    const wvht = parseFloat(cols[8]);
    const dpd = parseFloat(cols[9]);
    const apd = parseFloat(cols[10]);
    const mwd = parseFloat(cols[11]);
    const pres = parseFloat(cols[12]);
    const atmp = cols.length > 13 ? parseFloat(cols[13]) : 999;
    const wtmp = cols.length > 14 ? parseFloat(cols[14]) : 999;

    if (isNaN(yr) || isNaN(mo)) continue;

    const observed_at = new Date(Date.UTC(yr, mo - 1, dy, hr, mn));

    // Only keep last 48 hours of observations
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);
    if (observed_at < cutoff) continue;

    rows.push({
      station_id: stationId,
      observed_at: observed_at.toISOString(),
      wave_height_m: isMissing(wvht, 99) ? null : wvht,
      dominant_period_s: isMissing(dpd, 99) ? null : dpd,
      avg_period_s: isMissing(apd, 99) ? null : apd,
      mean_direction_deg: isMissing(mwd, 999) ? null : Math.round(mwd),
      wind_speed_mps: isMissing(wspd, 99) ? null : wspd,
      wind_direction_deg: isMissing(wdir, 999) ? null : Math.round(wdir),
      wind_gust_mps: isMissing(gst, 99) ? null : gst,
      pressure_hpa: isMissing(pres, 9999) ? null : pres,
      air_temp_c: isMissing(atmp, 999) ? null : atmp,
      water_temp_c: isMissing(wtmp, 999) ? null : wtmp,
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stats = {
    gridPoints: 0,
    forecastRows: 0,
    buoyStations: 0,
    buoyRows: 0,
    swellComponents: 0,
    errors: [] as string[],
  };

  try {
    // 1. Get all spots to determine unique grid points and NDBC stations
    const { data: spots, error: spotsErr } = await supabase
      .from('spots')
      .select('lat, lng, ndbc_station_id');

    if (spotsErr) throw spotsErr;

    // 2. Compute unique grid points
    const gridPoints = new Map<string, { lat: number; lng: number }>();
    for (const spot of (spots as Spot[]) ?? []) {
      const latGrid = toGrid(spot.lat);
      const lngGrid = toGrid(spot.lng);
      const key = `${latGrid},${lngGrid}`;
      if (!gridPoints.has(key)) {
        gridPoints.set(key, { lat: latGrid, lng: lngGrid });
      }
    }
    stats.gridPoints = gridPoints.size;

    // 3. Compute unique NDBC stations
    const stationIds = [
      ...new Set(
        ((spots as Spot[]) ?? [])
          .map((s) => s.ndbc_station_id)
          .filter((id): id is string => id != null)
      ),
    ];
    stats.buoyStations = stationIds.length;

    // 4. Fetch Open-Meteo for each grid point
    const forecastRows: ForecastRow[] = [];
    const swellComponents: SwellComponentRow[] = [];

    for (const [key, point] of gridPoints) {
      try {
        const [marine, weather] = await Promise.all([
          fetchMarineForGrid(point.lat, point.lng),
          fetchWeatherForGrid(point.lat, point.lng),
        ]);

        const mh = marine.hourly;
        const wh = weather.hourly;

        for (let i = 0; i < mh.time.length; i++) {
          const row: ForecastRow = {
            lat_grid: point.lat,
            lng_grid: point.lng,
            forecast_hour: mh.time[i],
            swell_height_m: mh.swell_wave_height?.[i] ?? null,
            swell_direction_deg: mh.swell_wave_direction?.[i] ?? null,
            swell_period_s: mh.swell_wave_period?.[i] ?? null,
            swell_peak_period_s: mh.swell_wave_peak_period?.[i] ?? null,
            secondary_swell_height_m: mh.secondary_swell_wave_height?.[i] ?? null,
            secondary_swell_direction_deg: mh.secondary_swell_wave_direction?.[i] ?? null,
            secondary_swell_period_s: mh.secondary_swell_wave_period?.[i] ?? null,
            wave_height_m: mh.wave_height?.[i] ?? null,
            wave_direction_deg: mh.wave_direction?.[i] ?? null,
            wave_period_s: mh.wave_period?.[i] ?? null,
            wind_speed_kmh: wh.wind_speed_10m?.[i] ?? null,
            wind_direction_deg: wh.wind_direction_10m?.[i] ?? null,
            wind_gusts_kmh: wh.wind_gusts_10m?.[i] ?? null,
          };
          forecastRows.push(row);

          // Also create swell_components from forecast primary/secondary
          if (row.swell_height_m != null && row.swell_period_s != null && row.swell_direction_deg != null) {
            swellComponents.push({
              source_type: 'forecast',
              lat_grid: point.lat,
              lng_grid: point.lng,
              valid_at: mh.time[i],
              component_index: 0,
              height_m: row.swell_height_m,
              period_s: row.swell_period_s,
              direction_deg: row.swell_direction_deg,
            });
          }
          if (row.secondary_swell_height_m != null && row.secondary_swell_period_s != null && row.secondary_swell_direction_deg != null) {
            swellComponents.push({
              source_type: 'forecast',
              lat_grid: point.lat,
              lng_grid: point.lng,
              valid_at: mh.time[i],
              component_index: 1,
              height_m: row.secondary_swell_height_m,
              period_s: row.secondary_swell_period_s,
              direction_deg: row.secondary_swell_direction_deg,
            });
          }
        }
      } catch (err) {
        stats.errors.push(`Grid ${key}: ${(err as Error).message}`);
      }

      await delay(200);
    }

    stats.forecastRows = forecastRows.length;

    // 5. Batch upsert forecast_cache
    for (let i = 0; i < forecastRows.length; i += BATCH_SIZE) {
      const { error } = await supabase.from('forecast_cache')
        .upsert(forecastRows.slice(i, i + BATCH_SIZE), {
          onConflict: 'lat_grid,lng_grid,forecast_hour',
        });
      if (error) stats.errors.push(`Forecast upsert: ${error.message}`);
    }

    // 6. Delete old forecast swell components, then insert new ones
    //    (Use a single delete for all forecast-sourced components older than now)
    const oldestForecast = forecastRows.length > 0 ? forecastRows[0].forecast_hour : null;
    if (oldestForecast) {
      await supabase.from('swell_components')
        .delete()
        .eq('source_type', 'forecast');
    }

    stats.swellComponents = swellComponents.length;
    for (let i = 0; i < swellComponents.length; i += BATCH_SIZE) {
      const { error } = await supabase.from('swell_components')
        .insert(swellComponents.slice(i, i + BATCH_SIZE));
      if (error) stats.errors.push(`Swell component insert: ${error.message}`);
    }

    // 7. Fetch NDBC standard meteorological data for each station
    const buoyRows: BuoyRow[] = [];
    for (const stationId of stationIds) {
      try {
        const res = await fetch(`${NDBC_BASE}/${stationId}.txt`);
        if (!res.ok) {
          stats.errors.push(`NDBC ${stationId}: HTTP ${res.status}`);
          continue;
        }
        const text = await res.text();
        const rows = parseNdbcStandardData(text, stationId);
        buoyRows.push(...rows);
      } catch (err) {
        stats.errors.push(`NDBC ${stationId}: ${(err as Error).message}`);
      }
      await delay(100);
    }

    stats.buoyRows = buoyRows.length;

    // 8. Batch upsert buoy_observations
    for (let i = 0; i < buoyRows.length; i += BATCH_SIZE) {
      const { error } = await supabase.from('buoy_observations')
        .upsert(buoyRows.slice(i, i + BATCH_SIZE), {
          onConflict: 'station_id,observed_at',
        });
      if (error) stats.errors.push(`Buoy upsert: ${error.message}`);
    }

    return new Response(JSON.stringify({ ok: true, ...stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message, stats }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
