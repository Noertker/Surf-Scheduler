-- Disable the hourly buoy spectral decomposition cron job.
-- The forecast pipeline (Open-Meteo) provides sufficient swell data;
-- buoy spectra UI has been removed from the app.
SELECT cron.unschedule('fetch-buoy-spectra-hourly');
