-- Add nose and tail rocker profiles to surfboards
CREATE TYPE rocker_profile AS ENUM ('low', 'low-med', 'mid', 'mid-high', 'high');

ALTER TABLE surfboards
  ADD COLUMN nose_rocker rocker_profile NOT NULL DEFAULT 'mid',
  ADD COLUMN tail_rocker rocker_profile NOT NULL DEFAULT 'mid';
