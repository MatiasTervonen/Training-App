-- Add "duration" as a valid habit type
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_type_check;
ALTER TABLE habits ADD CONSTRAINT habits_type_check
  CHECK (type IN ('manual', 'steps', 'duration'));

-- Alarm type for duration habits (normal notification vs full-screen priority alarm)
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS alarm_type TEXT NOT NULL DEFAULT 'normal'
CHECK (alarm_type IN ('normal', 'priority'));

-- Accumulated seconds for duration habit logs
ALTER TABLE habit_logs
ADD COLUMN IF NOT EXISTS accumulated_seconds INTEGER DEFAULT NULL;
