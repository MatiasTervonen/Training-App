-- Add habit type and target_value columns for step habits
ALTER TABLE habits ADD COLUMN type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE habits ADD COLUMN target_value INTEGER;

-- Ensure step habits always have a target
ALTER TABLE habits ADD CONSTRAINT habits_step_target_check
  CHECK (type = 'manual' OR target_value IS NOT NULL);
