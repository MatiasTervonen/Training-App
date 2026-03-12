-- ============================================================
-- Gym Session Phases: warm-up & cool-down tracking tables
-- ============================================================

-- Session phases (actual tracked data)
CREATE TABLE gym_session_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phase_type      TEXT NOT NULL CHECK (phase_type IN ('warmup', 'cooldown')),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  duration_seconds INTEGER NOT NULL,
  steps           INTEGER,
  distance_meters NUMERIC,
  calories        NUMERIC,
  is_manual       BOOLEAN DEFAULT false,
  user_id         UUID NOT NULL DEFAULT auth.uid(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_session_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session phases"
  ON gym_session_phases FOR ALL
  USING (user_id = auth.uid());

-- Template phases (just activity type, no tracking data)
CREATE TABLE gym_template_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES gym_templates(id) ON DELETE CASCADE,
  phase_type      TEXT NOT NULL CHECK (phase_type IN ('warmup', 'cooldown')),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  user_id         UUID NOT NULL DEFAULT auth.uid(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_template_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own template phases"
  ON gym_template_phases FOR ALL
  USING (user_id = auth.uid());
