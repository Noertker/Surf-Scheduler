-- Add interval column to distinguish hilo vs 6-minute cached data
ALTER TABLE tide_cache DROP CONSTRAINT tide_cache_pkey;
ALTER TABLE tide_cache ADD COLUMN interval TEXT NOT NULL DEFAULT '6';
ALTER TABLE tide_cache ADD PRIMARY KEY (station_id, timestamp, interval);
