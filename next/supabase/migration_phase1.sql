-- Ecogram Phase 1 Migration: New entities + Game field additions
-- Run this after schema.sql

-- ─── Add new columns to games table ────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'environment_tags') THEN
    ALTER TABLE games ADD COLUMN environment_tags TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'intensity') THEN
    ALTER TABLE games ADD COLUMN intensity VARCHAR(10) DEFAULT 'medium';
    ALTER TABLE games ADD CONSTRAINT valid_intensity CHECK (intensity IN ('low', 'medium', 'high'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'rule_constraints') THEN
    ALTER TABLE games ADD COLUMN rule_constraints JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'technique_ids') THEN
    ALTER TABLE games ADD COLUMN technique_ids UUID[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'last_played_at') THEN
    ALTER TABLE games ADD COLUMN last_played_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Update position constraint to include new positions
ALTER TABLE games DROP CONSTRAINT IF EXISTS valid_position;
ALTER TABLE games ADD CONSTRAINT valid_position CHECK (
  position IN ('guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing', 'open-guard', 'closed-guard', 'clinch', 'other')
);

-- ─── Techniques table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50) NOT NULL DEFAULT 'other',
  category VARCHAR(30) NOT NULL DEFAULT 'control',
  gi_nogi VARCHAR(10) NOT NULL DEFAULT 'both',
  belt_level_min VARCHAR(10) NOT NULL DEFAULT 'white',
  belt_level_max VARCHAR(10) NOT NULL DEFAULT 'black',
  prerequisite_ids UUID[] DEFAULT '{}',
  description TEXT,
  video_url TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_technique_position CHECK (
    position IN ('guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing', 'open-guard', 'closed-guard', 'clinch', 'other')
  ),
  CONSTRAINT valid_technique_category CHECK (
    category IN ('sweep', 'submission', 'pass', 'escape', 'control', 'takedown', 'guard-retention', 'transition', 'throw')
  ),
  CONSTRAINT valid_gi_nogi CHECK (gi_nogi IN ('gi', 'nogi', 'both')),
  CONSTRAINT valid_belt_min CHECK (belt_level_min IN ('white', 'blue', 'purple', 'brown', 'black')),
  CONSTRAINT valid_belt_max CHECK (belt_level_max IN ('white', 'blue', 'purple', 'brown', 'black'))
);

CREATE INDEX IF NOT EXISTS idx_techniques_position ON techniques(position);
CREATE INDEX IF NOT EXISTS idx_techniques_category ON techniques(category);
CREATE INDEX IF NOT EXISTS idx_techniques_gi_nogi ON techniques(gi_nogi);
CREATE INDEX IF NOT EXISTS idx_techniques_belt_min ON techniques(belt_level_min);

-- ─── Students table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  belt_rank VARCHAR(10) NOT NULL DEFAULT 'white',
  stripes INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  competition_goals TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  injury_notes TEXT,
  notes TEXT,
  environment_preference VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_belt_rank CHECK (belt_rank IN ('white', 'blue', 'purple', 'brown', 'black')),
  CONSTRAINT valid_stripes CHECK (stripes >= 0 AND stripes <= 4),
  CONSTRAINT valid_env_pref CHECK (
    environment_preference IS NULL OR environment_preference IN ('gi', 'nogi', 'wrestling', 'judo', 'mma')
  )
);

CREATE INDEX IF NOT EXISTS idx_students_belt_rank ON students(belt_rank);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- ─── Curricula table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  goal TEXT,
  target_belt_level VARCHAR(10) DEFAULT NULL,
  environment VARCHAR(20) DEFAULT NULL,
  session_ids UUID[] DEFAULT '{}',
  progression_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_curriculum_belt CHECK (
    target_belt_level IS NULL OR target_belt_level IN ('white', 'blue', 'purple', 'brown', 'black')
  ),
  CONSTRAINT valid_curriculum_env CHECK (
    environment IS NULL OR environment IN ('gi', 'nogi', 'wrestling', 'judo', 'mma')
  )
);

CREATE INDEX IF NOT EXISTS idx_curricula_target_belt ON curricula(target_belt_level);

-- ─── Class Logs table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS class_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID DEFAULT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  student_ids UUID[] DEFAULT '{}',
  coach_notes TEXT,
  techniques_drilled UUID[] DEFAULT '{}',
  intensity_level VARCHAR(10) NOT NULL DEFAULT 'medium',
  what_worked TEXT,
  what_to_revisit TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_log_intensity CHECK (intensity_level IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_class_logs_date ON class_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_class_logs_session ON class_logs(session_id);

-- ─── Triggers for new tables ───────────────────────────

DROP TRIGGER IF EXISTS update_techniques_updated_at ON techniques;
CREATE TRIGGER update_techniques_updated_at
  BEFORE UPDATE ON techniques
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
CREATE TRIGGER update_curricula_updated_at
  BEFORE UPDATE ON curricula
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_logs_updated_at ON class_logs;
CREATE TRIGGER update_class_logs_updated_at
  BEFORE UPDATE ON class_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── New indexes for game additions ────────────────────

CREATE INDEX IF NOT EXISTS idx_games_intensity ON games(intensity);
CREATE INDEX IF NOT EXISTS idx_games_last_played ON games(last_played_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_games_environment_tags ON games USING GIN(environment_tags);
