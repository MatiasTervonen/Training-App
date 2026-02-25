-- Add onboarding completion flag to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Set existing users as having completed onboarding (they don't need to see it)
UPDATE user_settings SET has_completed_onboarding = TRUE WHERE has_completed_onboarding = FALSE;
