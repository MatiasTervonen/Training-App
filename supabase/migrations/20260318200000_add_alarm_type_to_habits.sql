-- Add alarm_type column for duration habits (normal notification vs full-screen priority alarm)
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS alarm_type TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE habits
ADD CONSTRAINT habits_alarm_type_check CHECK (alarm_type IN ('normal', 'priority'));
