-- Set sensible relevance flag defaults for global activities
-- Activities not listed here keep all flags as true (the default)

-- GPS off: indoor activities
UPDATE activities SET is_gps_relevant = false
WHERE slug IN ('stretching', 'climbing', 'swimming', 'gym', 'pilates', 'dancing', 'weight_training', 'breathing_exercises', 'meditation', 'bodyweight_training', 'cross_training', 'yoga');

-- Steps off: activities where step count is not meaningful
UPDATE activities SET is_step_relevant = false
WHERE slug IN ('stretching', 'climbing', 'swimming', 'cycling', 'gym', 'pilates', 'dancing', 'weight_training', 'breathing_exercises', 'meditation', 'bodyweight_training', 'cross_training', 'driving', 'yoga');

-- Calories off: activities where calorie tracking is not meaningful
UPDATE activities SET is_calories_relevant = false
WHERE slug IN ('breathing_exercises', 'meditation', 'driving');

-- Rename existing Cycling to Cycling (outdoor) and update slug
UPDATE activities SET name = 'Cycling (outdoor)', slug = 'cycling_outdoor'
WHERE slug = 'cycling';

-- Add new activities
-- Categories:
--   Cardio:   1591994c-72a5-4457-a425-9d0dcbe3c4f2
--   Sports:   21afdca8-6ea9-489f-bc4e-3afc91240c22
--   Outdoor:  8ad3355b-f040-40b2-b75a-d17d240d2523

INSERT INTO activities (name, slug, base_met, category_id, is_gps_relevant, is_step_relevant, is_calories_relevant)
VALUES
  -- Gym cardio machines
  ('Cycling (indoor)',     'cycling_indoor',     6.80, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true),
  ('Walking (treadmill)',  'walking_treadmill',  3.50, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, true,  true),
  ('Running (treadmill)',  'running_treadmill',  7.50, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, true,  true),
  ('Stair Climber',        'stair_climber',      9.00, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, true,  true),
  ('Cross Trainer',        'cross_trainer_machine', 5.00, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true),
  ('Rowing Machine',       'rowing_machine',     7.00, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true),
  ('Ski Erg',              'ski_erg',            6.50, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true),
  ('Assault Bike',         'assault_bike',       8.00, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true),
  -- Outdoor activities
  ('Nordic Walking',       'nordic_walking',     4.50, '8ad3355b-f040-40b2-b75a-d17d240d2523', true,  true,  true),
  ('Roller Skating',       'roller_skating',     7.00, '21afdca8-6ea9-489f-bc4e-3afc91240c22', true,  false, true),
  ('Skiing (cross-country)', 'skiing_cross_country', 8.00, '8ad3355b-f040-40b2-b75a-d17d240d2523', true,  false, true),
  ('Skiing (downhill)',    'skiing_downhill',     5.00, '8ad3355b-f040-40b2-b75a-d17d240d2523', true,  false, true),
  ('Ice Skating',          'ice_skating',        5.50, '21afdca8-6ea9-489f-bc4e-3afc91240c22', true,  false, true),
  ('Skateboarding',        'skateboarding',      5.00, '21afdca8-6ea9-489f-bc4e-3afc91240c22', true,  false, true),
  -- Combat / indoor sports
  ('Kickboxing',           'kickboxing',         7.00, '21afdca8-6ea9-489f-bc4e-3afc91240c22', false, false, true),
  ('Martial Arts',         'martial_arts',       6.00, '21afdca8-6ea9-489f-bc4e-3afc91240c22', false, false, true),
  ('Jump Rope',            'jump_rope',         10.00, '1591994c-72a5-4457-a425-9d0dcbe3c4f2', false, false, true);
