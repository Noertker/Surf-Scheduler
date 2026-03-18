# Phase 6: Server-Side Swell Forecast Pipeline + Spectral Decomposition

## Context

The app currently fetches swell/wind data **client-side** from Open-Meteo on every screen load, limited to 7 days. Users see missing swell charts (data gaps), no data beyond day 7, and only aggregate swell (no multi-swell breakdown). The goal is to build a Surfline-like forecast pipeline:

1. Move all forecast fetching **server-side** via Supabase Edge Functions + pg_cron
2. Extend forecasts to **16 days** (Open-Meteo max)
3. Fetch **NDBC buoy spectral data** and decompose into primary/secondary/tertiary swells
4. Cache everything in the database — client reads from DB
5. Add a **swell detail view** with multi-swell breakdown when tapping a day card

West Coast only for initial implementation.

---

## Progress Tracker

- [x] **6a.1** — Database migration (`supabase/migrations/20260318000001_forecast_pipeline.sql`)
- [x] **6a.2** — `fetch-forecasts` Edge Function (`supabase/functions/fetch-forecasts/index.ts`)
- [x] **6a.3** — pg_cron schedule migration (`supabase/migrations/20260318000002_cron_schedules.sql`)
- [x] **6a.4** — `services/forecasts.ts` client service (DB-backed with fallback)
- [ ] **6a.5** — Update `useConditionsStore` + `calendar.tsx` to read from DB
- [ ] **6b.1** — `fetch-buoy-spectra` Edge Function with spectral decomposition
- [ ] **6b.2** — Add hourly cron schedule for spectra
- [ ] **6c.1** — New types (`SwellComponentReading`, `BuoyObservation`, `MultiSwellReading`) + `useSwellComponentStore`
- [ ] **6c.2** — `MultiSwellChart` component
- [ ] **6c.3** — `SwellDetailPanel` component
- [ ] **6c.4** — Wire into DayDetail + calendar.tsx

---

## Phase 6a: Database + Server-Side Open-Meteo Pipeline

### Migration: `supabase/migrations/20260318000001_forecast_pipeline.sql`

**New tables:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `regions` | Broad geographic regions | `name`, `slug` ("west-coast"), `display_order` |
| `forecast_cache` | Cached Open-Meteo hourly data per grid point | `lat_grid`, `lng_grid`, `forecast_hour`, swell/wind fields |
| `buoy_observations` | NDBC standard met data per station | `station_id`, `observed_at`, wave/wind/temp fields |
| `swell_components` | Decomposed swell trains (buoy spectral or forecast) | `source_type`, `station_id`/`lat_grid`, `component_index`, height/period/direction |

**Key design decisions:**
- `forecast_cache` uses rounded lat/lng (2 decimals) as Open-Meteo snaps to ~11km grid — deduplicates ~70 spots down to ~25 grid points
- `swell_components` supports both `buoy_spectral` and `forecast` source types
- Cleanup function removes data older than 18/30 days
- Add `region_id` FK to existing `spot_groups` table, assign all current groups to "West Coast"

### Edge Function: `supabase/functions/fetch-forecasts/index.ts`

Runs every 3 hours via pg_cron. Steps:
1. Query all spots → compute unique grid points + unique NDBC station IDs (~18 stations)
2. For each grid point: fetch Open-Meteo Marine (16-day swell) + Weather (16-day wind) in parallel
3. For each NDBC station: fetch `.txt` standard met file, parse observations
4. Batch upsert into `forecast_cache` and `buoy_observations` (500-row chunks, matching existing `tide_cache` pattern)
5. Also insert Open-Meteo primary/secondary swells into `swell_components` as `source_type='forecast'`
6. 200ms polite delay between API calls

### pg_cron: `supabase/migrations/20260318000002_cron_schedules.sql`

```
fetch-forecasts-every-3h    → */3 hours at :15
cleanup-stale-data-daily    → 4 AM UTC daily
```

Uses `pg_net` to HTTP POST to the Edge Function with service role key.

**Note on Supabase hosted:** `pg_cron` and `pg_net` are pre-installed on hosted Supabase. The Edge Function URL is `{SUPABASE_URL}/functions/v1/fetch-forecasts`. The service role key must be stored as a database setting or retrieved from Vault. For local dev, invoke the Edge Function manually via `curl`.

### Client: `services/forecasts.ts` (new)

```typescript
// Key exports:
fetchCachedSwellData(lat, lng, forecastDays = 16)   → SwellReading[]
fetchCachedWindData(lat, lng, forecastDays = 16)     → WindReading[]
fetchCachedDetailedSwellData(lat, lng, forecastDays = 16) → DetailedSwellReading[]
fetchSwellWithFallback(lat, lng, forecastDays = 16)  → SwellReading[]  // DB first, then direct API
fetchWindWithFallback(lat, lng, forecastDays = 16)   → WindReading[]
```

Grid-point mapping: `toGrid(val) = Math.round(val * 100) / 100` — maps a spot's lat/lng to the nearest cached grid point.

### Store: `stores/useConditionsStore.ts` (modify)

- Switch imports from `services/openMeteo` → `services/forecasts`
- Change forecast range from 7 → 16 days

### Calendar: `app/(tabs)/calendar.tsx` (modify)

- Lines 9, 66-68: switch from `fetchSwellData`/`fetchWindData` → `fetchSwellWithFallback`/`fetchWindWithFallback`

**Verification:** After deploying, manually invoke `fetch-forecasts` Edge Function. Check `forecast_cache` has rows. App should show swell/wind data for 16 days instead of 7, reading from DB.

---

## Phase 6b: NDBC Spectral Decomposition

### Edge Function: `supabase/functions/fetch-buoy-spectra/index.ts`

Runs every hour via pg_cron. The core Surfline-like capability:

1. For each NDBC station: fetch `.data_spec` (spectral density across ~47 frequency bins) + `.swdir` (direction per bin)
2. Parse the columnar data (timestamp + frequency bins)
3. Run **swell partition algorithm**:
   - Smooth spectrum (3-point moving average)
   - Find peaks above 5% threshold
   - Sort peaks by energy, take top 4
   - Find valleys between peaks to define partition boundaries
   - For each partition: compute Hs = 4√m₀, period = 1/f_peak, direction = energy-weighted circular mean
4. Store decomposed components in `swell_components` with `source_type='buoy_spectral'`

### Decomposition Algorithm Detail

```
decomposeSpectrum(frequencies[], densities[], directions[]) → SwellComponent[]

  1. Smooth densities with 3-point moving average to reduce noise
  2. Find local maxima where density[i] > density[i-1] AND density[i] > density[i+1]
     AND density[i] > 5% of max(density)
  3. Sort peaks by energy (density value) descending, take top 4
  4. Re-sort selected peaks by frequency (ascending)
  5. Find valleys (local minima) between adjacent peaks → partition boundaries
  6. For each partition [freqLow..freqHigh]:
     - m₀ = Σ S(f) × Δf  (zeroth spectral moment = total energy in partition)
     - Hs = 4 × √m₀       (significant wave height)
     - T_peak = 1 / f_peak  (peak period)
     - Direction = energy-weighted circular mean using atan2(Σ w·sin(θ), Σ w·cos(θ))
  7. Filter components with Hs < 0.05m (negligible)
  8. Sort by height descending → component_index 0=primary, 1=secondary, 2=tertiary
```

### NDBC Data File Formats

**`.data_spec`** (spectral density):
```
#YY  MM DD hh mm   0.0200  0.0325  0.0375  ...  0.4850
2026 03 18 12 00    0.12    0.45    0.89   ...   0.01
```
- Header row contains frequency bins in Hz
- Data rows: timestamp (5 cols) + density values (m²/Hz) per frequency bin

**`.swdir`** (spectral direction):
```
#YY  MM DD hh mm   0.0200  0.0325  0.0375  ...  0.4850
2026 03 18 12 00   285.0   270.0   265.0   ...  180.0
```
- Same format, values are mean direction (degrees) per frequency bin

**Missing value codes:** 999, 999.0, 9999.0

### pg_cron addition

```
fetch-buoy-spectra-hourly   → every hour at :45
```

**Verification:** Invoke `fetch-buoy-spectra` manually. Check `swell_components` table has 2-4 components per observation per station. Compare primary swell height/period/direction against Surfline or NDBC website for sanity check.

---

## Phase 6c: Enhanced UI — Swell Detail View

### New types in `types/conditions.ts`

```typescript
export interface SwellComponentReading {
  validAt: Date;
  componentIndex: number;  // 0=primary, 1=secondary, 2=tertiary
  heightM: number;
  heightFt: number;
  periodS: number;
  directionDeg: number;
  directionCompass: string;
  energyDensity: number | null;
  sourceType: 'buoy_spectral' | 'forecast';
}

export interface BuoyObservation {
  stationId: string;
  observedAt: Date;
  waveHeightM: number | null;
  dominantPeriodS: number | null;
  meanDirectionDeg: number | null;
  windSpeedMps: number | null;
  windDirectionDeg: number | null;
  waterTempC: number | null;
}

export interface MultiSwellReading {
  timestamp: Date;
  components: {
    index: number;
    heightFt: number;
    periodS: number;
    directionDeg: number;
    directionCompass: string;
    label: string;  // "Primary", "Secondary", "Tertiary"
  }[];
  combinedHeightFt: number;
  combinedDirectionDeg: number;
  combinedPeriodS: number;
  energyKj: number;
}
```

### New: `components/charts/MultiSwellChart.tsx`

Stacked/layered swell chart showing distinct components in different colors:
- Primary = cyan (`#06b6d4`), Secondary = orange (`#f59e0b`), Tertiary = purple (`#a855f7`)
- Same D3/SVG pattern as existing `SwellChart.tsx`
- Supports `activeTime`/`onTimeChange` for crosshair sync
- Falls back to basic `SwellChart` when only aggregate data available

```typescript
interface MultiSwellChartProps {
  swellComponents: MultiSwellReading[];
  swell?: SwellReading[];              // fallback basic data
  dayStartHour?: number;
  dayEndHour?: number;
  height?: number;
  interactive?: boolean;
  activeTime?: Date | null;
  onTimeChange?: (time: Date | null) => void;
}
```

### New: `components/calendar/SwellDetailPanel.tsx`

Renders below DayCard content in the detail view:
1. **Current Buoy Observations** — latest wave height, period, direction, water temp (if < 3hrs old)
2. **Multi-Swell Breakdown Table** — one row per component with colored indicator dot, height (ft), period (s), direction (compass + arrow)
3. **Multi-Swell Timeline Chart** — buoy spectral data transitions into forecast data
4. **Source Badge** — "Buoy 46225" vs "Forecast" with confidence indicator

### Modify: `components/calendar/DayDetail.tsx`

- Add `spotNdbcStationId`, `spotLat`, `spotLng` props
- Render `<SwellDetailPanel>` below `<DayCard>` inside the ScrollView

### New: `stores/useSwellComponentStore.ts`

```typescript
interface SwellComponentState {
  components: SwellComponentReading[];
  buoyObs: BuoyObservation[];
  loading: boolean;
  error: string | null;
  fetchComponents: (stationId: string) => Promise<void>;
}
```

### Modify: `app/(tabs)/calendar.tsx`

- Pass `groupSpots[0]?.ndbc_station_id`, `.lat`, `.lng` through to DayDetail

---

## Files Summary

### New Files (8)
| File | Phase | Status |
|------|-------|--------|
| `supabase/migrations/20260318000001_forecast_pipeline.sql` | 6a | Done |
| `supabase/migrations/20260318000002_cron_schedules.sql` | 6a+6b | TODO |
| `supabase/functions/fetch-forecasts/index.ts` | 6a | Done |
| `supabase/functions/fetch-buoy-spectra/index.ts` | 6b | TODO |
| `services/forecasts.ts` | 6a | TODO |
| `stores/useSwellComponentStore.ts` | 6c | TODO |
| `components/charts/MultiSwellChart.tsx` | 6c | TODO |
| `components/calendar/SwellDetailPanel.tsx` | 6c | TODO |

### Modified Files (6)
| File | Changes | Status |
|------|---------|--------|
| `supabase/config.toml` | Add `[functions.fetch-forecasts]` and `[functions.fetch-buoy-spectra]` | TODO |
| `types/conditions.ts` | Add `SwellComponentReading`, `BuoyObservation`, `MultiSwellReading` | TODO |
| `types/group.ts` | Add `region_id` to `SpotGroup` | TODO |
| `stores/useConditionsStore.ts` | Switch to `services/forecasts`, 16-day range | TODO |
| `app/(tabs)/calendar.tsx` | Use cached forecasts, pass station ID to DayDetail | TODO |
| `components/calendar/DayDetail.tsx` | Add `SwellDetailPanel`, accept station/lat/lng props | TODO |

---

## Execution Order

1. **6a.1** — Database migration (regions, forecast_cache, buoy_observations, swell_components) ✅
2. **6a.2** — `fetch-forecasts` Edge Function + config ✅
3. **6a.3** — pg_cron schedule migration
4. **6a.4** — `services/forecasts.ts` client service
5. **6a.5** — Update `useConditionsStore` + `calendar.tsx` to read from DB
6. **6b.1** — `fetch-buoy-spectra` Edge Function with spectral decomposition algorithm
7. **6b.2** — Add hourly cron schedule for spectra
8. **6c.1** — New types + `useSwellComponentStore`
9. **6c.2** — `MultiSwellChart` component
10. **6c.3** — `SwellDetailPanel` component
11. **6c.4** — Wire into DayDetail + calendar.tsx

---

## Data Sources

### Open-Meteo Marine API (Free, no auth)
- URL: `https://marine-api.open-meteo.com/v1/marine`
- Up to 16-day hourly forecast
- Primary swell: height, direction, period, peak period
- Secondary swell: height, direction, period
- Combined wave: height, direction, period
- **Limitation**: Only 2 swell components (primary + secondary). No spectral decomposition.

### Open-Meteo Weather API (Free, no auth)
- URL: `https://api.open-meteo.com/v1/forecast`
- Wind: speed, direction, gusts at 10m
- Matches forecast range of marine API

### NDBC Standard Meteorological Data
- URL: `https://www.ndbc.noaa.gov/data/realtime2/{station}.txt`
- Real-time observations (not forecasts)
- Wave height (Hs), dominant period, average period, mean direction
- Wind speed, direction, gusts
- Pressure, air temp, water temp
- Updated every 30-60 minutes
- ~18 unique stations covering West Coast spots

### NDBC Spectral Data (for decomposition)
- Spectral density: `https://www.ndbc.noaa.gov/data/realtime2/{station}.data_spec`
- Wave direction: `https://www.ndbc.noaa.gov/data/realtime2/{station}.swdir`
- ~47 frequency bins from 0.02 to 0.485 Hz
- Real-time observations only
- This is the raw data that enables Surfline-like multi-swell decomposition

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Edge Function timeout (150s free / 400s Pro) | Incomplete data fetch | Split into separate forecast vs buoy functions (already planned). Can further split by region if needed. |
| NDBC buoy outages | Missing buoy observations | Per-station error handling continues on failure. Fallback to Open-Meteo primary/secondary. |
| Empty cache on first run | No data displayed | `fetchSwellWithFallback` falls back to direct Open-Meteo client-side fetcher. |
| pg_cron unavailable locally | Can't test scheduling | Test via manual `curl` to Edge Function endpoint during development. |
| Spectral algorithm accuracy | Incorrect swell decomposition | Tune smoothing window + threshold iteratively. Compare against Surfline published data. Start with conservative settings. |
| Open-Meteo rate limits | Fetch failures | 200ms delay between requests + 3-hour cron interval keeps request rate very low (~25 requests per cycle). |
| Database storage growth | Cost increase | Cleanup function runs daily, removes data >18/30 days old. Forecast cache is ~25 grid points × 384 hours × 3h refresh = manageable. |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ DATA SOURCES                                                 │
├──────────────────┬──────────────────┬───────────────────────┤
│ Open-Meteo       │ NDBC Standard    │ NDBC Spectral         │
│ Marine + Weather │ Met (.txt)       │ (.data_spec + .swdir) │
│ 16-day forecast  │ Real-time obs    │ Real-time spectra     │
└────────┬─────────┴────────┬─────────┴───────────┬───────────┘
         │                  │                     │
    ┌────▼──────────────────▼─────┐    ┌──────────▼──────────┐
    │ fetch-forecasts             │    │ fetch-buoy-spectra   │
    │ Edge Function (every 3h)   │    │ Edge Function (1h)   │
    │ • Dedup grid points        │    │ • Parse spectra      │
    │ • Batch upsert             │    │ • Decompose swells   │
    └────┬──────────┬────────────┘    └──────────┬───────────┘
         │          │                            │
    ┌────▼───┐ ┌────▼──────────┐  ┌──────────────▼───────────┐
    │forecast│ │buoy_          │  │swell_components           │
    │_cache  │ │observations   │  │(buoy_spectral + forecast) │
    └────┬───┘ └────┬──────────┘  └──────────────┬───────────┘
         │          │                            │
         └──────────┼────────────────────────────┘
                    │
         ┌──────────▼──────────────┐
         │ services/forecasts.ts   │
         │ (DB reads + fallback)   │
         └──────────┬──────────────┘
                    │
         ┌──────────▼──────────────┐
         │ useConditionsStore      │
         │ useSwellComponentStore  │
         └──────────┬──────────────┘
                    │
    ┌───────────────┼───────────────────────┐
    │               │                       │
    ▼               ▼                       ▼
 DayCard      SwellDetailPanel        MultiSwellChart
 (timeline)   (expanded detail)       (stacked chart)
```
