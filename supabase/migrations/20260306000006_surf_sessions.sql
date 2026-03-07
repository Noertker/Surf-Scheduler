CREATE TABLE surf_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  spot_id UUID NOT NULL REFERENCES spots ON DELETE CASCADE,
  spot_name TEXT NOT NULL,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  tide_start_ft DECIMAL,
  tide_end_ft DECIMAL,
  avg_wind_mph DECIMAL,
  avg_gusts_mph DECIMAL,
  avg_swell_ft DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE surf_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on surf_sessions" ON surf_sessions FOR ALL USING (true) WITH CHECK (true);
