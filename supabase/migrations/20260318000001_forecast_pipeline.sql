-- ============================================================
-- REGIONS (broad geographic areas; West Coast first)
-- ============================================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on regions" ON regions FOR ALL USING (true) WITH CHECK (true);

INSERT INTO regions (name, slug, display_order) VALUES
  ('West Coast', 'west-coast', 1);

-- Link spot_groups to regions
ALTER TABLE spot_groups ADD COLUMN region_id UUID REFERENCES regions ON DELETE SET NULL;

UPDATE spot_groups
SET region_id = (SELECT id FROM regions WHERE slug = 'west-coast');

-- ============================================================
-- FORECAST_CACHE
-- Open-Meteo hourly forecast data, keyed per grid point.
-- Grid points use rounded lat/lng (2 decimals, ~1.1km) to
-- deduplicate requests for nearby spots.
-- ============================================================
CREATE TABLE forecast_cache (
  id BIGSERIAL PRIMARY KEY,
  lat_grid DECIMAL(5,2) NOT NULL,
  lng_grid DECIMAL(6,2) NOT NULL,
  forecast_hour TIMESTAMPTZ NOT NULL,
  -- Primary swell
  swell_height_m DECIMAL(4,2),
  swell_direction_deg SMALLINT,
  swell_period_s DECIMAL(4,1),
  swell_peak_period_s DECIMAL(4,1),
  -- Secondary swell
  secondary_swell_height_m DECIMAL(4,2),
  secondary_swell_direction_deg SMALLINT,
  secondary_swell_period_s DECIMAL(4,1),
  -- Combined wave
  wave_height_m DECIMAL(4,2),
  wave_direction_deg SMALLINT,
  wave_period_s DECIMAL(4,1),
  -- Wind
  wind_speed_kmh DECIMAL(5,1),
  wind_direction_deg SMALLINT,
  wind_gusts_kmh DECIMAL(5,1),
  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lat_grid, lng_grid, forecast_hour)
);

ALTER TABLE forecast_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on forecast_cache" ON forecast_cache FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_forecast_cache_grid_time
  ON forecast_cache (lat_grid, lng_grid, forecast_hour);

CREATE INDEX idx_forecast_cache_fetched_at
  ON forecast_cache (fetched_at);

-- ============================================================
-- BUOY_OBSERVATIONS (NDBC standard meteorological data)
-- ============================================================
CREATE TABLE buoy_observations (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  -- Wave
  wave_height_m DECIMAL(4,2),
  dominant_period_s DECIMAL(4,1),
  avg_period_s DECIMAL(4,1),
  mean_direction_deg SMALLINT,
  -- Wind at buoy
  wind_speed_mps DECIMAL(5,2),
  wind_direction_deg SMALLINT,
  wind_gust_mps DECIMAL(5,2),
  -- Other met
  pressure_hpa DECIMAL(6,1),
  air_temp_c DECIMAL(4,1),
  water_temp_c DECIMAL(4,1),
  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(station_id, observed_at)
);

ALTER TABLE buoy_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on buoy_observations" ON buoy_observations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_buoy_observations_station_time
  ON buoy_observations (station_id, observed_at DESC);

-- ============================================================
-- SWELL_COMPONENTS (decomposed swell trains)
-- Source: buoy spectral decomposition OR Open-Meteo forecast
-- ============================================================
CREATE TABLE swell_components (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('buoy_spectral', 'forecast')),
  station_id TEXT,
  lat_grid DECIMAL(5,2),
  lng_grid DECIMAL(6,2),
  valid_at TIMESTAMPTZ NOT NULL,
  component_index SMALLINT NOT NULL,
  height_m DECIMAL(4,2) NOT NULL,
  period_s DECIMAL(4,1) NOT NULL,
  direction_deg SMALLINT NOT NULL,
  -- Spectral analysis metadata (null for forecast-derived)
  energy_density DECIMAL(8,4),
  frequency_peak_hz DECIMAL(6,4),
  frequency_low_hz DECIMAL(6,4),
  frequency_high_hz DECIMAL(6,4),
  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE swell_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on swell_components" ON swell_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_swell_components_buoy
  ON swell_components (station_id, valid_at DESC)
  WHERE source_type = 'buoy_spectral';

CREATE INDEX idx_swell_components_forecast
  ON swell_components (lat_grid, lng_grid, valid_at)
  WHERE source_type = 'forecast';

-- ============================================================
-- CLEANUP function for stale data
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_stale_forecasts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM forecast_cache WHERE forecast_hour < now() - interval '18 days';
  DELETE FROM buoy_observations WHERE observed_at < now() - interval '30 days';
  DELETE FROM swell_components WHERE valid_at < now() - interval '30 days';
END;
$$;
