-- Add visible_nutrients toggle array and micro-nutrient goal columns to nutrition_goals

ALTER TABLE nutrition_goals
  ADD COLUMN IF NOT EXISTS visible_nutrients TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fiber_goal NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS sugar_goal NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS sodium_goal NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS saturated_fat_goal NUMERIC(7,1);
