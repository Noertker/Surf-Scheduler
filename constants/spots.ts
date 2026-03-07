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
];
