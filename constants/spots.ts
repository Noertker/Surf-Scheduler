import { Spot } from '@/types/spot';

// Hardcoded seed data for offline/fallback use.
// Canonical data lives in the Supabase `spots` table.
export const SEED_SPOTS: Omit<Spot, 'id'>[] = [
  { name: 'Pismo Pier', lat: 35.1428, lng: -120.6413, noaa_station_id: '9412110', ndbc_station_id: '46215', swell_direction_window: [180, 320] },
  { name: 'Morro Bay', lat: 35.3658, lng: -120.8496, noaa_station_id: '9412110', ndbc_station_id: '46011', swell_direction_window: [250, 340] },
  { name: 'Avila Beach', lat: 35.1797, lng: -120.7314, noaa_station_id: '9412110', ndbc_station_id: '46215', swell_direction_window: [180, 270] },
  { name: 'Shell Beach', lat: 35.1611, lng: -120.6706, noaa_station_id: '9412110', ndbc_station_id: '46215', swell_direction_window: [180, 320] },
  { name: 'Cayucos', lat: 35.4428, lng: -120.9019, noaa_station_id: '9412110', ndbc_station_id: '46011', swell_direction_window: [250, 340] },
  { name: 'Hazards', lat: 35.1667, lng: -120.6833, noaa_station_id: '9412110', ndbc_station_id: '46215', swell_direction_window: [180, 310] },
  // Santa Cruz
  { name: 'Steamer Lane', lat: 36.9514, lng: -122.0263, noaa_station_id: '9413745', ndbc_station_id: '46269', swell_direction_window: [180, 315] },
  { name: 'Pleasure Point', lat: 36.9625, lng: -121.9750, noaa_station_id: '9413745', ndbc_station_id: '46269', swell_direction_window: [150, 270] },
  { name: 'Capitola', lat: 36.9722, lng: -121.9531, noaa_station_id: '9413745', ndbc_station_id: '46269', swell_direction_window: [140, 250] },
  { name: 'Natural Bridges', lat: 36.9519, lng: -122.0575, noaa_station_id: '9413745', ndbc_station_id: '46269', swell_direction_window: [200, 320] },
  { name: 'Manresa', lat: 36.9364, lng: -121.8594, noaa_station_id: '9413745', ndbc_station_id: '46042', swell_direction_window: [170, 280] },
];
