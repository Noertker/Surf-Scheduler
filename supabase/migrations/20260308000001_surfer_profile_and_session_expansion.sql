-- Phase 1: Surfer Profile table + Session model expansion

-- Enums for surfer profile
CREATE TYPE surfer_level AS ENUM (
  'beginner', 'developing', 'intermediate',
  'progressing_intermediate', 'advanced', 'expert'
);

CREATE TYPE stance AS ENUM ('regular', 'goofy');

-- Surfer profile (one per user)
CREATE TABLE surfer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  level surfer_level NOT NULL DEFAULT 'beginner',
  years_experience INT NOT NULL DEFAULT 0,
  stance stance NOT NULL DEFAULT 'regular',
  goals TEXT[] NOT NULL DEFAULT '{}',
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  session_focus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE surfer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own profile" ON surfer_profiles
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Session expansion: conditions snapshot frozen at feedback time
ALTER TABLE surf_sessions
  ADD COLUMN conditions_snapshot JSONB;

-- Session expansion: structured feedback object
ALTER TABLE surf_sessions
  ADD COLUMN feedback JSONB;

-- Expand rating range from 1-5 to 1-10
ALTER TABLE surf_sessions
  DROP CONSTRAINT IF EXISTS surf_sessions_rating_check;
ALTER TABLE surf_sessions
  ADD CONSTRAINT surf_sessions_rating_check CHECK (rating >= 1 AND rating <= 10);
