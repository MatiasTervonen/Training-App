-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup of notifications older than 30 days (runs at 3:00 AM UTC)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  $$DELETE FROM public.notifications WHERE created_at < now() - interval '30 days'$$
);
