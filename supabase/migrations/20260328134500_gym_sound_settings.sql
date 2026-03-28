-- Add gym sound settings to user_settings table
ALTER TABLE user_settings
  ADD COLUMN pb_sound_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN rest_timer_sound_enabled boolean NOT NULL DEFAULT true;
