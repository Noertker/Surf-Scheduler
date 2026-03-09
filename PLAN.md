# Kairo Surf — Development Plan

## Overview

A mobile app that tracks surf spots and shows when tide/swell/wind conditions match user preferences. No more manually checking tide charts — set your spot preferences and see a calendar of surf windows.

## Milestones

### M1: Project Bootstrap & Data Pipeline (Current)
- Working Expo app with two tabs (Spots / Dashboard)
- Real tide data from NOAA, swell/wind from Open-Meteo
- Tide chart visualization per spot
- Supabase Local for persistence and caching

### M2: Dashboard & Tide Windows (Next)
- Monthly calendar view with tide window highlights
- Toggle spots on/off to filter
- Tide window calculation: find time ranges where tide is within user's preferred range
- Color-coded quality indicators

### M3: Deployed with Auth (Future)
- Supabase Cloud deployment
- User authentication
- Synced preferences across devices

### M4: Payments (Future)
- Premium features / payment integration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) + TypeScript |
| Routing | Expo Router (file-based tabs) |
| State Management | Zustand |
| Database | Supabase Local (Docker) → Supabase Cloud |
| Charts | react-native-svg + d3-shape + d3-scale |

## Data Sources

| Data | Source | Cost |
|---|---|---|
| Tides | NOAA CO-OPS API — station `9412110` (Port San Luis) | Free, no key |
| Swell | Open-Meteo Marine API (lat/lng based) | Free, no key |
| Wind | Open-Meteo Weather API | Free, no key |

### Why These Sources?
- **NOAA** is the authoritative US government source for tide predictions. Extremely accurate.
- **Open-Meteo** provides free 7-day marine forecasts using NOAA GFS-Wave and ECMWF models — the same underlying data that services like Surfline use.
- **NDBC buoy data** (stations 46215 Diablo Canyon, 46011 Santa Maria) available as a future enhancement for real-time observed swell vs forecast.

## Seed Spots (Pismo/SLO Area)

| Spot | Lat | Lng | NOAA Station | NDBC Buoy |
|---|---|---|---|---|
| Pismo Pier | 35.1428 | -120.6413 | 9412110 | 46215 |
| Morro Bay | 35.3658 | -120.8496 | 9412110 | 46011 |
| Avila Beach | 35.1797 | -120.7314 | 9412110 | 46215 |
| Shell Beach | 35.1611 | -120.6706 | 9412110 | 46215 |
| Cayucos | 35.4428 | -120.9019 | 9412110 | 46011 |
| Hazards | 35.1667 | -120.6833 | 9412110 | 46215 |

## Database Schema

```sql
-- Surf spots
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DECIMAL NOT NULL,
  lng DECIMAL NOT NULL,
  noaa_station_id TEXT,
  ndbc_station_id TEXT,
  swell_direction_window INT[]
);

-- User tide range preferences per spot
CREATE TABLE spot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  spot_id UUID REFERENCES spots ON DELETE CASCADE,
  tide_min_ft DECIMAL NOT NULL,
  tide_max_ft DECIMAL NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, spot_id)
);

-- Cached NOAA tide predictions
CREATE TABLE tide_cache (
  station_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  height_ft DECIMAL NOT NULL,
  type TEXT,
  PRIMARY KEY (station_id, timestamp)
);
```

## Project Structure (M1)

```
Surf-Scheduler/
  app/
    _layout.tsx              # Root layout
    (tabs)/
      _layout.tsx            # Tab navigator (Spots + Dashboard)
      spots.tsx              # Spot selection + conditions view
      dashboard.tsx          # Placeholder for M2
  components/
    SpotCard.tsx             # Spot selection card
    TideChart.tsx            # SVG tide curve
    SpotConditions.tsx       # Combined tide/swell/wind display
  services/
    supabase.ts              # Supabase client
    noaa.ts                  # NOAA tide API + caching
    openMeteo.ts             # Swell + wind API
  stores/
    useSpotStore.ts          # Spot list + selection
    useTideStore.ts          # Tide predictions
    useConditionsStore.ts    # Swell + wind data
  types/
    api.ts                   # Raw API response types
    tide.ts                  # TidePrediction, TideWindow
    conditions.ts            # SwellReading, WindReading
    spot.ts                  # Spot, SpotPreference
  constants/
    spots.ts                 # Seed spot data
  supabase/
    migrations/              # SQL migrations
    seed.sql                 # Seed data
```

## Known Gotchas
- NOAA returns tide heights as strings — must `parseFloat()`
- Open-Meteo returns metric — convert to imperial in service layer
- Open-Meteo hourly arrays can contain `null` for missing data points
- NOAA 6-minute interval has 31-day max per request
- Supabase Local port conflicts if another project is running
