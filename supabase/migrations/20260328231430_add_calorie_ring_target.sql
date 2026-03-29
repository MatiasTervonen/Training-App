-- Add calorie ring target preference: 'goal' (static calorie goal) or 'tdee' (daily energy expenditure)
ALTER TABLE nutrition_goals
  ADD COLUMN calorie_ring_target TEXT NOT NULL DEFAULT 'goal'
  CHECK (calorie_ring_target IN ('goal', 'tdee'));
