-- Ecogram Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  position VARCHAR(50) NOT NULL DEFAULT 'other',
  topic VARCHAR(100) NOT NULL DEFAULT 'General',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
  category VARCHAR(20) NOT NULL DEFAULT 'main',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  techniques TEXT[] DEFAULT '{}',
  variations TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_position CHECK (position IN ('guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing', 'other')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT valid_category CHECK (category IN ('warmup', 'main', 'cooldown', 'drill', 'positional'))
);

-- Class preparations table
CREATE TABLE IF NOT EXISTS class_preps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  focus VARCHAR(100),
  skill_level VARCHAR(20),
  game_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_skill_level CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced'))
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_duration INTEGER DEFAULT 60,
  default_difficulty VARCHAR(20) DEFAULT 'intermediate',
  favorite_positions TEXT[] DEFAULT '{}',
  theme VARCHAR(10) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_position ON games(position);
CREATE INDEX IF NOT EXISTS idx_games_difficulty ON games(difficulty);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_topic ON games(topic);
CREATE INDEX IF NOT EXISTS idx_games_is_favorite ON games(is_favorite);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_class_preps_date ON class_preps(date);
CREATE INDEX IF NOT EXISTS idx_class_preps_focus ON class_preps(focus);
CREATE INDEX IF NOT EXISTS idx_class_preps_created_at ON class_preps(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_preps_updated_at ON class_preps;
CREATE TRIGGER update_class_preps_updated_at
  BEFORE UPDATE ON class_preps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default user preferences (skip if already exists)
INSERT INTO user_preferences (id)
SELECT uuid_generate_v4()
WHERE NOT EXISTS (SELECT 1 FROM user_preferences LIMIT 1);
