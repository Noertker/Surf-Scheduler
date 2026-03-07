-- Surfboard quiver management
CREATE TYPE nose_shape AS ENUM ('pointed', 'round', 'hybrid');
CREATE TYPE tail_shape AS ENUM ('squash', 'round', 'swallow', 'pin', 'fish');
CREATE TYPE fin_setup AS ENUM ('thruster', 'quad', 'twin', 'single', '5-fin');

CREATE TABLE surfboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  length_ft DECIMAL NOT NULL,
  width_in DECIMAL NOT NULL,
  thickness_in DECIMAL NOT NULL,
  volume_l DECIMAL,
  nose_shape nose_shape NOT NULL DEFAULT 'round',
  tail_shape tail_shape NOT NULL DEFAULT 'squash',
  fin_setup fin_setup NOT NULL DEFAULT 'thruster',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE surfboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on surfboards" ON surfboards FOR ALL USING (true) WITH CHECK (true);
