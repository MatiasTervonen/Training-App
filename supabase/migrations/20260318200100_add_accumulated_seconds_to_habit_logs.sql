-- Add accumulated_seconds column for duration habit logs
ALTER TABLE habit_logs
ADD COLUMN IF NOT EXISTS accumulated_seconds INTEGER DEFAULT NULL;
