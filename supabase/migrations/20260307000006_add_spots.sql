-- Add Newport/South Beach (OR), Cowells (Santa Cruz), The Hook (Santa Cruz)

INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Newport South Beach', 44.6190, -124.0630, '9435380', '46050', '{250,340}'),
  ('Cowells',             36.9620, -122.0230, '9413745', '46269', '{160,280}'),
  ('The Hook',            36.9580, -121.9670, '9413745', '46269', '{140,260}');

-- Newport South Beach -> Central Oregon
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Central Oregon' AND s.name = 'Newport South Beach';

-- Cowells and The Hook -> Santa Cruz
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Santa Cruz' AND s.name IN ('Cowells', 'The Hook');
