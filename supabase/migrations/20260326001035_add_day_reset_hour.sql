-- Add day_reset_hour setting to user_settings
-- Controls when the tracking day resets (0-8, default 5 = 05:00)
ALTER TABLE user_settings
ADD COLUMN day_reset_hour SMALLINT NOT NULL DEFAULT 5
CHECK (day_reset_hour >= 0 AND day_reset_hour <= 8);
