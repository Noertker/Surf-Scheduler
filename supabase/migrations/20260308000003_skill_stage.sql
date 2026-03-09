-- Add granular skill stage to surfer profiles
ALTER TABLE surfer_profiles
  ADD COLUMN IF NOT EXISTS skill_stage TEXT;

ALTER TABLE surfer_profiles
  ADD CONSTRAINT surfer_profiles_skill_stage_check
  CHECK (skill_stage IS NULL OR skill_stage IN (
    '1a', '1b',
    '2a', '2b', '2c',
    '3a', '3b', '3c', '3d', '3e',
    '4a', '4b', '4c', '4d',
    '5a', '5b'
  ));
