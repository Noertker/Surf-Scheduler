-- Enable pg_cron and pg_net for scheduled Edge Function invocation.
-- On Supabase hosted, these are pre-installed. For local dev, test
-- Edge Functions manually via curl.
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Fetch Open-Meteo forecasts + NDBC standard met every 3 hours
SELECT cron.schedule(
  'fetch-forecasts-every-3h',
  '15 */3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-forecasts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Fetch NDBC spectral buoy data + decompose every hour
SELECT cron.schedule(
  'fetch-buoy-spectra-hourly',
  '45 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-buoy-spectra',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Clean up stale forecast/buoy data daily at 4 AM UTC
SELECT cron.schedule(
  'cleanup-stale-data-daily',
  '0 4 * * *',
  $$ SELECT cleanup_stale_forecasts(); $$
);
