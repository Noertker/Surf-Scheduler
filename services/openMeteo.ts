import { OpenMeteoMarineResponse, OpenMeteoDetailedMarineResponse, OpenMeteoWindResponse } from '@/types/api';
import { SwellReading, DetailedSwellReading, WindReading } from '@/types/conditions';

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const M_TO_FT = 3.28084;
const KMH_TO_MPH = 0.621371;

export async function fetchSwellData(
  lat: number,
  lng: number,
  forecastDays: number = 7
): Promise<SwellReading[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'swell_wave_height,swell_wave_direction,swell_wave_period',
    forecast_days: forecastDays.toString(),
  });

  const res = await fetch(`${MARINE_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo Marine error: ${res.status}`);

  const data: OpenMeteoMarineResponse = await res.json();

  return data.hourly.time
    .map((t, i) => {
      const height = data.hourly.swell_wave_height[i];
      const dir = data.hourly.swell_wave_direction[i];
      const period = data.hourly.swell_wave_period[i];
      if (height == null || dir == null || period == null) return null;

      return {
        timestamp: new Date(t),
        heightM: height,
        heightFt: +(height * M_TO_FT).toFixed(1),
        directionDeg: dir,
        periodS: period,
      };
    })
    .filter((r): r is SwellReading => r !== null);
}

// Wave energy constant: E ≈ (ρ * g² / 64π) * H² * T ≈ 0.49 * H² * T (kJ/m per m² s)
const ENERGY_COEFF = 0.49;

export async function fetchDetailedSwellData(
  lat: number,
  lng: number,
  forecastDays: number = 7
): Promise<DetailedSwellReading[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: [
      'swell_wave_height', 'swell_wave_direction', 'swell_wave_period', 'swell_wave_peak_period',
      'secondary_swell_wave_height', 'secondary_swell_wave_direction', 'secondary_swell_wave_period',
      'wave_height', 'wave_direction', 'wave_period',
    ].join(','),
    forecast_days: forecastDays.toString(),
  });

  const res = await fetch(`${MARINE_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo Marine error: ${res.status}`);

  const data: OpenMeteoDetailedMarineResponse = await res.json();
  const h = data.hourly;

  return h.time
    .map((t, i) => {
      const primaryH = h.swell_wave_height[i];
      const primaryDir = h.swell_wave_direction[i];
      const primaryPer = h.swell_wave_period[i];
      const combH = h.wave_height[i];
      if (primaryH == null || primaryDir == null || primaryPer == null || combH == null) return null;

      const primaryHFt = +(primaryH * M_TO_FT).toFixed(1);
      const combHFt = +(combH * M_TO_FT).toFixed(1);
      const combDir = h.wave_direction[i] ?? primaryDir;
      const combPer = h.wave_period[i] ?? primaryPer;

      const secH = h.secondary_swell_wave_height[i];

      return {
        timestamp: new Date(t),
        heightFt: primaryHFt,
        directionDeg: primaryDir,
        periodS: primaryPer,
        peakPeriodS: h.swell_wave_peak_period[i] ?? null,
        secondaryHeightFt: secH != null ? +(secH * M_TO_FT).toFixed(1) : null,
        secondaryDirectionDeg: h.secondary_swell_wave_direction[i] ?? null,
        secondaryPeriodS: h.secondary_swell_wave_period[i] ?? null,
        combinedHeightFt: combHFt,
        combinedDirectionDeg: combDir,
        combinedPeriodS: combPer,
        energyKj: +(ENERGY_COEFF * combH * combH * combPer).toFixed(0),
      } as DetailedSwellReading;
    })
    .filter((r): r is DetailedSwellReading => r !== null);
}

export async function fetchWindData(
  lat: number,
  lng: number,
  forecastDays: number = 7
): Promise<WindReading[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    forecast_days: forecastDays.toString(),
    timezone: 'America/Los_Angeles',
  });

  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo Weather error: ${res.status}`);

  const data: OpenMeteoWindResponse = await res.json();

  return data.hourly.time
    .map((t, i) => {
      const speed = data.hourly.wind_speed_10m[i];
      const dir = data.hourly.wind_direction_10m[i];
      const gusts = data.hourly.wind_gusts_10m[i];
      if (speed == null || dir == null || gusts == null) return null;

      return {
        timestamp: new Date(t),
        speedKmh: speed,
        speedMph: +(speed * KMH_TO_MPH).toFixed(1),
        directionDeg: dir,
        gustsKmh: gusts,
        gustsMph: +(gusts * KMH_TO_MPH).toFixed(1),
      };
    })
    .filter((r): r is WindReading => r !== null);
}
