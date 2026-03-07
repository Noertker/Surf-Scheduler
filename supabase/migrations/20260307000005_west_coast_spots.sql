-- Add surf spots along the California, Oregon, and Washington coasts

-- ============================================================
-- SPOT GROUPS
-- ============================================================
INSERT INTO spot_groups (name, display_order) VALUES
  ('San Diego', 10),
  ('Orange County', 20),
  ('Los Angeles / South Bay', 30),
  ('Ventura / Santa Barbara', 40),
  ('Monterey', 50),
  -- Santa Cruz is display_order 2, Pismo/SLO is 1 (existing)
  ('San Francisco / Half Moon Bay', 70),
  ('Humboldt / North Coast', 80),
  ('Southern Oregon', 90),
  ('Central Oregon', 100),
  ('Northern Oregon', 110),
  ('Washington', 120);

-- ============================================================
-- SAN DIEGO
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Blacks Beach',      32.8894, -117.2530, '9410170', '46225', '{200,310}'),
  ('Windansea',         32.8306, -117.2810, '9410170', '46225', '{200,310}'),
  ('Ocean Beach SD',    32.7476, -117.2530, '9410170', '46225', '{190,310}'),
  ('Sunset Cliffs',     32.7200, -117.2560, '9410170', '46225', '{200,320}'),
  ('Imperial Beach',    32.5800, -117.1350, '9410170', '46225', '{190,280}'),
  ('Cardiff Reef',      33.0178, -117.2840, '9410170', '46225', '{200,300}'),
  ('Swamis',            33.0350, -117.2920, '9410170', '46225', '{200,310}');

-- ============================================================
-- ORANGE COUNTY
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Trestles',          33.3830, -117.5890, '9410580', '46225', '{180,300}'),
  ('San Clemente Pier', 33.4186, -117.6230, '9410580', '46225', '{180,290}'),
  ('Salt Creek',        33.4680, -117.7230, '9410580', '46225', '{180,290}'),
  ('Huntington Beach',  33.6553, -118.0050, '9410580', '46222', '{180,270}'),
  ('Newport Beach',     33.6097, -117.9297, '9410580', '46222', '{180,270}'),
  ('The Wedge',         33.5930, -117.8820, '9410580', '46222', '{150,240}');

-- ============================================================
-- LOS ANGELES / SOUTH BAY
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Malibu Surfrider',  34.0360, -118.6810, '9410660', '46221', '{200,280}'),
  ('Zuma Beach',        34.0190, -118.8230, '9410660', '46221', '{210,300}'),
  ('El Porto',          33.8950, -118.4190, '9410660', '46221', '{180,280}'),
  ('Manhattan Beach',   33.8840, -118.4130, '9410660', '46221', '{180,270}'),
  ('Hermosa Beach',     33.8630, -118.4020, '9410660', '46221', '{180,270}'),
  ('Torrance / RAT',    33.8180, -118.3970, '9410660', '46221', '{180,280}'),
  ('Palos Verdes Cove', 33.7600, -118.4070, '9410660', '46221', '{200,310}');

-- ============================================================
-- VENTURA / SANTA BARBARA
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Rincon',            34.3740, -119.4780, '9411340', '46054', '{200,310}'),
  ('Ventura Overhead',  34.2740, -119.3040, '9411340', '46054', '{200,310}'),
  ('C Street',          34.2760, -119.2930, '9411340', '46054', '{180,290}'),
  ('Santa Barbara Leadbetter', 34.4050, -119.7130, '9411340', '46054', '{180,250}'),
  ('Campus Point UCSB', 34.4060, -119.8430, '9411340', '46054', '{180,270}'),
  ('El Capitan',        34.4610, -120.0250, '9411340', '46054', '{200,300}'),
  ('Jalama',            34.5120, -120.5020, '9411340', '46054', '{200,330}');

-- ============================================================
-- MONTEREY
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Asilomar',          36.6190, -121.9390, '9413450', '46042', '{230,330}'),
  ('Carmel Beach',      36.5550, -121.9280, '9413450', '46042', '{210,320}'),
  ('Moss Landing',      36.8040, -121.7880, '9413450', '46042', '{200,300}'),
  ('Marina State Beach',36.6910, -121.8080, '9413450', '46042', '{210,310}');

-- ============================================================
-- SAN FRANCISCO / HALF MOON BAY
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Ocean Beach SF',    37.7600, -122.5110, '9414290', '46026', '{240,340}'),
  ('Pacifica / Linda Mar', 37.5920, -122.5010, '9414290', '46012', '{230,330}'),
  ('Mavericks',         37.4950, -122.4960, '9414290', '46012', '{260,340}'),
  ('Half Moon Bay Jetty', 37.5040, -122.4780, '9414290', '46012', '{230,320}'),
  ('Montara',           37.5410, -122.5150, '9414290', '46012', '{240,330}'),
  ('Fort Point',        37.8110, -122.4760, '9414290', '46026', '{260,310}'),
  ('Bolinas',           37.9090, -122.6870, '9414290', '46026', '{250,340}'),
  ('Stinson Beach',     37.8970, -122.6410, '9414290', '46026', '{250,330}');

-- ============================================================
-- HUMBOLDT / NORTH COAST
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Crescent City',     41.7450, -124.2010, '9419750', '46027', '{240,340}'),
  ('Trinidad',          41.0580, -124.1500, '9418767', '46022', '{250,340}'),
  ('Humboldt Jetty',    40.7680, -124.2270, '9418767', '46022', '{250,340}'),
  ('Shelter Cove',      40.0270, -124.0740, '9418767', '46022', '{250,330}');

-- ============================================================
-- SOUTHERN OREGON
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Brookings',         42.0510, -124.2720, '9431647', '46015', '{250,340}'),
  ('Gold Beach',        42.4070, -124.4240, '9431647', '46015', '{250,340}'),
  ('Port Orford',       42.7390, -124.5050, '9431647', '46015', '{240,340}'),
  ('Bandon',            43.1170, -124.4200, '9432780', '46015', '{250,340}');

-- ============================================================
-- CENTRAL OREGON
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Florence / Heceta', 43.9800, -124.1270, '9432780', '46050', '{250,340}'),
  ('Newport / Agate Beach', 44.6560, -124.0620, '9435380', '46050', '{250,340}'),
  ('Otter Rock',        44.7490, -124.0690, '9435380', '46050', '{250,340}'),
  ('Lincoln City',      44.9580, -124.0170, '9435380', '46050', '{250,340}'),
  ('Pacific City / Cape Kiwanda', 45.2170, -123.9720, '9435380', '46050', '{260,340}');

-- ============================================================
-- NORTHERN OREGON
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Short Sands / Oswald West', 45.7630, -123.9690, '9439040', '46029', '{260,340}'),
  ('Cannon Beach',      45.8920, -123.9620, '9439040', '46029', '{260,340}'),
  ('Seaside',           45.9880, -123.9280, '9439040', '46029', '{260,340}'),
  ('Indian Beach',      45.9210, -123.9740, '9439040', '46029', '{260,340}');

-- ============================================================
-- WASHINGTON
-- ============================================================
INSERT INTO spots (name, lat, lng, noaa_station_id, ndbc_station_id, swell_direction_window) VALUES
  ('Long Beach',        46.3510, -124.0640, '9440910', '46029', '{250,340}'),
  ('Westport',          46.8900, -124.1140, '9441102', '46211', '{250,340}'),
  ('La Push',           47.9100, -124.6380, '9442396', '46041', '{250,340}'),
  ('Rialto Beach',      47.9200, -124.6360, '9442396', '46041', '{250,330}');

-- ============================================================
-- GROUP MEMBERSHIPS
-- ============================================================

-- San Diego
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'San Diego'
  AND s.name IN ('Blacks Beach','Windansea','Ocean Beach SD','Sunset Cliffs','Imperial Beach','Cardiff Reef','Swamis');

-- Orange County
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Orange County'
  AND s.name IN ('Trestles','San Clemente Pier','Salt Creek','Huntington Beach','Newport Beach','The Wedge');

-- Los Angeles / South Bay
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Los Angeles / South Bay'
  AND s.name IN ('Malibu Surfrider','Zuma Beach','El Porto','Manhattan Beach','Hermosa Beach','Torrance / RAT','Palos Verdes Cove');

-- Ventura / Santa Barbara
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Ventura / Santa Barbara'
  AND s.name IN ('Rincon','Ventura Overhead','C Street','Santa Barbara Leadbetter','Campus Point UCSB','El Capitan','Jalama');

-- Monterey
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Monterey'
  AND s.name IN ('Asilomar','Carmel Beach','Moss Landing','Marina State Beach');

-- San Francisco / Half Moon Bay
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'San Francisco / Half Moon Bay'
  AND s.name IN ('Ocean Beach SF','Pacifica / Linda Mar','Mavericks','Half Moon Bay Jetty','Montara','Fort Point','Bolinas','Stinson Beach');

-- Humboldt / North Coast
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Humboldt / North Coast'
  AND s.name IN ('Crescent City','Trinidad','Humboldt Jetty','Shelter Cove');

-- Southern Oregon
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Southern Oregon'
  AND s.name IN ('Brookings','Gold Beach','Port Orford','Bandon');

-- Central Oregon
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Central Oregon'
  AND s.name IN ('Florence / Heceta','Newport / Agate Beach','Otter Rock','Lincoln City','Pacific City / Cape Kiwanda');

-- Northern Oregon
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Northern Oregon'
  AND s.name IN ('Short Sands / Oswald West','Cannon Beach','Seaside','Indian Beach');

-- Washington
INSERT INTO spot_group_members (group_id, spot_id)
SELECT g.id, s.id FROM spot_groups g, spots s
WHERE g.name = 'Washington'
  AND s.name IN ('Long Beach','Westport','La Push','Rialto Beach');
