-- Surf spots (seeded, not user-created in M1)
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DECIMAL NOT NULL,
  lng DECIMAL NOT NULL,
  noaa_station_id TEXT,
  ndbc_station_id TEXT,
  swell_direction_window INT[]
);

-- User preferences per spot
CREATE TABLE spot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  spot_id UUID REFERENCES spots ON DELETE CASCADE,
  tide_min_ft DECIMAL NOT NULL,
  tide_max_ft DECIMAL NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, spot_id)
);

-- Cached tide predictions from NOAA
CREATE TABLE tide_cache (
  station_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  height_ft DECIMAL NOT NULL,
  type TEXT,
  PRIMARY KEY (station_id, timestamp)
);

-- Enable RLS but allow all for local dev (no auth in M1)
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tide_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on spots" ON spots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spot_preferences" ON spot_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tide_cache" ON tide_cache FOR ALL USING (true) WITH CHECK (true);

-- Seed Pismo / SLO spots
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Pismo Pier', 35.1428, -120.6413, '9412110', '46215', ARRAY[180, 320]),
  ('Morro Bay', 35.3658, -120.8496, '9412110', '46011', ARRAY[250, 340]),
  ('Avila Beach', 35.1797, -120.7314, '9412110', '46215', ARRAY[180, 270]),
  ('Shell Beach', 35.1611, -120.6706, '9412110', '46215', ARRAY[180, 320]),
  ('Cayucos', 35.4428, -120.9019, '9412110', '46011', ARRAY[250, 340]),
  ('Hazards', 35.1667, -120.6833, '9412110', '46215', ARRAY[180, 310]);
