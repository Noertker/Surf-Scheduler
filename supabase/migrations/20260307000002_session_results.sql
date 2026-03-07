-- Extend surf_sessions with post-session result fields
CREATE TYPE wave_type AS ENUM ('punchy', 'hollow', 'mushy');

ALTER TABLE surf_sessions
  ADD COLUMN completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN board_id UUID REFERENCES surfboards ON DELETE SET NULL,
  ADD COLUMN wave_type wave_type,
  ADD COLUMN result_notes TEXT;
