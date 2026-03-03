-- Add missing UPDATE policy for session_stats
-- Without this, the UPDATE to set total_volume in gym_save_session/gym_edit_session
-- was silently blocked by RLS (0 rows updated, no error).

CREATE POLICY "user can update own stats"
  ON session_stats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_stats.session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_stats.session_id
        AND s.user_id = auth.uid()
    )
  );

-- Backfill total_volume for any gym sessions saved after the feature was added
-- but before this RLS fix (these would have null total_volume)
UPDATE session_stats ss
SET total_volume = sub.vol
FROM (
  SELECT gse.session_id, coalesce(sum(gs.weight * gs.reps), 0) AS vol
  FROM gym_session_exercises gse
  JOIN gym_sets gs ON gs.session_exercise_id = gse.id
  WHERE gs.weight IS NOT NULL AND gs.reps IS NOT NULL
  GROUP BY gse.session_id
) sub
WHERE ss.session_id = sub.session_id
  AND ss.total_volume IS NULL;
