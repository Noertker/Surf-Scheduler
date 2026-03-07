-- Spot groups
CREATE TABLE spot_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0
);
ALTER TABLE spot_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on spot_groups" ON spot_groups FOR ALL USING (true) WITH CHECK (true);

-- Join table: spots <-> groups (many-to-many)
CREATE TABLE spot_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES spot_groups ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots ON DELETE CASCADE,
  UNIQUE(group_id, spot_id)
);
ALTER TABLE spot_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on spot_group_members" ON spot_group_members FOR ALL USING (true) WITH CHECK (true);

-- Santa Cruz spots
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Steamer Lane',    36.9514, -122.0263, '9413745', '46269', ARRAY[180, 315]),
  ('Pleasure Point',  36.9625, -121.9750, '9413745', '46269', ARRAY[150, 270]),
  ('Capitola',        36.9722, -121.9531, '9413745', '46269', ARRAY[140, 250]),
  ('Natural Bridges', 36.9519, -122.0575, '9413745', '46269', ARRAY[200, 320]),
  ('Manresa',         36.9364, -121.8594, '9413745', '46042', ARRAY[170, 280]);

-- Seed groups
INSERT INTO spot_groups (name, display_order) VALUES
  ('Pismo / SLO', 1),
  ('Santa Cruz',  2);

-- Assign Pismo-area spots to the Pismo / SLO group
INSERT INTO spot_group_members (group_id, spot_id)
  SELECT g.id, s.id FROM spot_groups g, spots s
  WHERE g.name = 'Pismo / SLO'
    AND s.name IN ('Pismo Pier','Morro Bay','Avila Beach','Shell Beach','Cayucos','Hazards');

-- Assign Santa Cruz spots to the Santa Cruz group
INSERT INTO spot_group_members (group_id, spot_id)
  SELECT g.id, s.id FROM spot_groups g, spots s
  WHERE g.name = 'Santa Cruz'
    AND s.name IN ('Steamer Lane','Pleasure Point','Capitola','Natural Bridges','Manresa');
