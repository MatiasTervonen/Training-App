-- Add total_volume column to session_stats
ALTER TABLE session_stats ADD COLUMN total_volume numeric;

-- Backfill total_volume for existing gym sessions
UPDATE session_stats ss
SET total_volume = sub.vol
FROM (
  SELECT gse.session_id, coalesce(sum(gs.weight * gs.reps), 0) AS vol
  FROM gym_session_exercises gse
  JOIN gym_sets gs ON gs.session_exercise_id = gse.id
  WHERE gs.weight IS NOT NULL AND gs.reps IS NOT NULL
  GROUP BY gse.session_id
) sub
WHERE ss.session_id = sub.session_id;
