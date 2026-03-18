import { supabase } from './supabase';
import { SwellReading, DetailedSwellReading, WindReading, SwellComponentReading, BuoyObservation } from '@/types/conditions';
import { degToCompass } from '@/utils/tideWindows';

const M_TO_FT = 3.28084;
const KMH_TO_MPH = 0.621371;
const ENERGY_COEFF = 0.49;

/** Round lat/lng to 2 decimals to match the forecast_cache grid. */
function toGrid(val: number): number {
  return Math.round(val * 100) / 100;
}

// ---------------------------------------------------------------------------
// Cached swell data (basic SwellReading)
// ---------------------------------------------------------------------------

export async function fetchCachedSwellData(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<SwellReading[]> {
  const latGrid = toGrid(lat);
  const lngGrid = toGrid(lng);
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + forecastDays);

  const { data, error } = await supabase
    .from('forecast_cache')
    .select('forecast_hour, swell_height_m, swell_direction_deg, swell_period_s, secondary_swell_height_m, secondary_swell_direction_deg, secondary_swell_period_s')
    .eq('lat_grid', latGrid)
    .eq('lng_grid', lngGrid)
    .gte('forecast_hour', now.toISOString())
    .lte('forecast_hour', end.toISOString())
    .order('forecast_hour');

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.swell_height_m != null)
    .map((row) => ({
      timestamp: new Date(row.forecast_hour),
      heightM: row.swell_height_m,
      heightFt: +(row.swell_height_m * M_TO_FT).toFixed(1),
      directionDeg: row.swell_direction_deg,
      periodS: row.swell_period_s,
      secondaryHeightFt: row.secondary_swell_height_m != null ? +(row.secondary_swell_height_m * M_TO_FT).toFixed(1) : null,
      secondaryDirectionDeg: row.secondary_swell_direction_deg ?? null,
      secondaryPeriodS: row.secondary_swell_period_s ?? null,
    }));
}

// ---------------------------------------------------------------------------
// Cached detailed swell data (DetailedSwellReading)
// ---------------------------------------------------------------------------

export async function fetchCachedDetailedSwellData(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<DetailedSwellReading[]> {
  const latGrid = toGrid(lat);
  const lngGrid = toGrid(lng);
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + forecastDays);

  const { data, error } = await supabase
    .from('forecast_cache')
    .select(`
      forecast_hour,
      swell_height_m, swell_direction_deg, swell_period_s, swell_peak_period_s,
      secondary_swell_height_m, secondary_swell_direction_deg, secondary_swell_period_s,
      wave_height_m, wave_direction_deg, wave_period_s
    `)
    .eq('lat_grid', latGrid)
    .eq('lng_grid', lngGrid)
    .gte('forecast_hour', now.toISOString())
    .lte('forecast_hour', end.toISOString())
    .order('forecast_hour');

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.swell_height_m != null && row.wave_height_m != null)
    .map((row) => {
      const primaryHFt = +(row.swell_height_m * M_TO_FT).toFixed(1);
      const combHFt = +(row.wave_height_m * M_TO_FT).toFixed(1);
      const secH = row.secondary_swell_height_m;

      return {
        timestamp: new Date(row.forecast_hour),
        heightFt: primaryHFt,
        directionDeg: row.swell_direction_deg,
        periodS: row.swell_period_s,
        peakPeriodS: row.swell_peak_period_s ?? null,
        secondaryHeightFt: secH != null ? +(secH * M_TO_FT).toFixed(1) : null,
        secondaryDirectionDeg: row.secondary_swell_direction_deg ?? null,
        secondaryPeriodS: row.secondary_swell_period_s ?? null,
        combinedHeightFt: combHFt,
        combinedDirectionDeg: row.wave_direction_deg ?? row.swell_direction_deg,
        combinedPeriodS: row.wave_period_s ?? row.swell_period_s,
        energyKj: +(ENERGY_COEFF * row.wave_height_m * row.wave_height_m * (row.wave_period_s ?? 0)).toFixed(0),
      } as DetailedSwellReading;
    });
}

// ---------------------------------------------------------------------------
// Cached wind data
// ---------------------------------------------------------------------------

export async function fetchCachedWindData(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<WindReading[]> {
  const latGrid = toGrid(lat);
  const lngGrid = toGrid(lng);
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + forecastDays);

  const { data, error } = await supabase
    .from('forecast_cache')
    .select('forecast_hour, wind_speed_kmh, wind_direction_deg, wind_gusts_kmh')
    .eq('lat_grid', latGrid)
    .eq('lng_grid', lngGrid)
    .gte('forecast_hour', now.toISOString())
    .lte('forecast_hour', end.toISOString())
    .order('forecast_hour');

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.wind_speed_kmh != null)
    .map((row) => ({
      timestamp: new Date(row.forecast_hour),
      speedKmh: row.wind_speed_kmh,
      speedMph: +(row.wind_speed_kmh * KMH_TO_MPH).toFixed(1),
      directionDeg: row.wind_direction_deg,
      gustsKmh: row.wind_gusts_kmh,
      gustsMph: +(row.wind_gusts_kmh * KMH_TO_MPH).toFixed(1),
    }));
}

// ---------------------------------------------------------------------------
// Fallback wrappers: try DB cache first, then direct Open-Meteo
// ---------------------------------------------------------------------------

export async function fetchSwellWithFallback(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<SwellReading[]> {
  try {
    const cached = await fetchCachedSwellData(lat, lng, forecastDays);
    if (cached.length > 0) return cached;
  } catch { /* fall through to direct API */ }

  const { fetchSwellData } = await import('./openMeteo');
  return fetchSwellData(lat, lng, Math.min(forecastDays, 7));
}

export async function fetchDetailedSwellWithFallback(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<DetailedSwellReading[]> {
  try {
    const cached = await fetchCachedDetailedSwellData(lat, lng, forecastDays);
    if (cached.length > 0) return cached;
  } catch { /* fall through to direct API */ }

  const { fetchDetailedSwellData } = await import('./openMeteo');
  return fetchDetailedSwellData(lat, lng, Math.min(forecastDays, 7));
}

export async function fetchWindWithFallback(
  lat: number,
  lng: number,
  forecastDays: number = 16,
): Promise<WindReading[]> {
  try {
    const cached = await fetchCachedWindData(lat, lng, forecastDays);
    if (cached.length > 0) return cached;
  } catch { /* fall through to direct API */ }

  const { fetchWindData } = await import('./openMeteo');
  return fetchWindData(lat, lng, Math.min(forecastDays, 7));
}

// ---------------------------------------------------------------------------
// Swell components (spectral decomposition or forecast-derived)
// ---------------------------------------------------------------------------

export async function fetchSwellComponents(
  stationId: string,
  hoursBack: number = 48,
): Promise<SwellComponentReading[]> {
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);

  const { data, error } = await supabase
    .from('swell_components')
    .select('*')
    .eq('station_id', stationId)
    .eq('source_type', 'buoy_spectral')
    .gte('valid_at', since.toISOString())
    .order('valid_at', { ascending: false })
    .order('component_index');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    validAt: new Date(row.valid_at),
    componentIndex: row.component_index,
    heightM: row.height_m,
    heightFt: +(row.height_m * M_TO_FT).toFixed(1),
    periodS: row.period_s,
    directionDeg: row.direction_deg,
    directionCompass: degToCompass(row.direction_deg),
    energyDensity: row.energy_density,
    sourceType: row.source_type,
  }));
}

// ---------------------------------------------------------------------------
// Buoy observations (NDBC standard meteorological)
// ---------------------------------------------------------------------------

const C_TO_F = (c: number) => +(c * 9 / 5 + 32).toFixed(1);

export async function fetchBuoyObservations(
  stationId: string,
  hoursBack: number = 24,
): Promise<BuoyObservation[]> {
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);

  const { data, error } = await supabase
    .from('buoy_observations')
    .select('*')
    .eq('station_id', stationId)
    .gte('observed_at', since.toISOString())
    .order('observed_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    stationId: row.station_id,
    observedAt: new Date(row.observed_at),
    waveHeightM: row.wave_height_m,
    waveHeightFt: row.wave_height_m != null ? +(row.wave_height_m * M_TO_FT).toFixed(1) : null,
    dominantPeriodS: row.dominant_period_s,
    meanDirectionDeg: row.mean_direction_deg,
    windSpeedMps: row.wind_speed_mps,
    windDirectionDeg: row.wind_direction_deg,
    waterTempC: row.water_temp_c,
    waterTempF: row.water_temp_c != null ? C_TO_F(row.water_temp_c) : null,
  }));
}
