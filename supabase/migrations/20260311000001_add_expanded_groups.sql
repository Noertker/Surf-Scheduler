ALTER TABLE user_settings
  ADD COLUMN expanded_groups TEXT[] NOT NULL DEFAULT '{}';
