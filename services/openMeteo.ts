import { OpenMeteoMarineResponse, OpenMeteoWindResponse } from '@/types/api';
import { SwellReading, WindReading } from '@/types/conditions';

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
