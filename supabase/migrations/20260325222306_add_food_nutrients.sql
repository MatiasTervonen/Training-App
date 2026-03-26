-- Add English name column for multilingual food names (e.g. Fineli dataset)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Update local search to also match English names
CREATE INDEX IF NOT EXISTS idx_foods_name_en ON foods (name_en) WHERE name_en IS NOT NULL;

-- Extended nutrient data (vitamins, minerals, fatty acids, etc.)
-- Stores per-100g values in a key-value format
CREATE TABLE food_nutrients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  nutrient_code TEXT NOT NULL,
  value NUMERIC(10,3) NOT NULL,
  unit TEXT NOT NULL,
  UNIQUE(food_id, nutrient_code)
);

CREATE INDEX idx_food_nutrients_food_id ON food_nutrients (food_id);

ALTER TABLE food_nutrients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_nutrients_select" ON food_nutrients FOR SELECT TO authenticated USING (true);
