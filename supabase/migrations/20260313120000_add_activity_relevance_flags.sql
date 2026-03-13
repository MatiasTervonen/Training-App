ALTER TABLE activities
  ADD COLUMN is_gps_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_step_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_calories_relevant BOOLEAN NOT NULL DEFAULT true;
