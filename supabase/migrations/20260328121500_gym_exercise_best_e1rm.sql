-- Returns the all-time best estimated 1RM per exercise for the current user
-- Used for PB detection during workout sessions

DROP FUNCTION IF EXISTS gym_get_exercise_best_e1rm(uuid[]);

CREATE FUNCTION gym_get_exercise_best_e1rm(exercise_ids uuid[])
RETURNS TABLE(exercise_id uuid, best_e1rm numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT
    se.exercise_id,
    MAX(
      CASE
        WHEN COALESCE(gs.reps, 0) <= 1 THEN gs.weight
        ELSE gs.weight * (1 + gs.reps::numeric / 30)
      END
    ) AS best_e1rm
  FROM gym_session_exercises se
  JOIN sessions s ON s.id = se.session_id
  JOIN gym_sets gs ON gs.session_exercise_id = se.id
  WHERE se.exercise_id = ANY(exercise_ids)
    AND s.user_id = auth.uid()
    AND gs.weight IS NOT NULL
    AND gs.weight > 0
  GROUP BY se.exercise_id;
$$;
