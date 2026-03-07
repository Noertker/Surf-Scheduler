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
