// Database types for Supabase

export type Position =
  | 'guard'
  | 'half-guard'
  | 'mount'
  | 'side-control'
  | 'back'
  | 'turtle'
  | 'standing'
  | 'other';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type GameCategory = 'warmup' | 'main' | 'cooldown' | 'drill' | 'positional';

export interface Game {
  id: string;
  name: string;
  description: string | null;
  position: Position;
  topic: string;
  difficulty: Difficulty;
  category: GameCategory;
  duration_minutes: number;
  techniques: string[];
  variations: string[];
  is_favorite: boolean;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassPrep {
  id: string;
  name: string;
  description: string | null;
  date: string;
  duration_minutes: number;
  focus: string | null;
  skill_level: Difficulty | null;
  game_ids: string[];
  games?: Game[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  default_duration: number;
  default_difficulty: Difficulty;
  favorite_positions: Position[];
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}

// Form types
export interface GameFormData {
  name: string;
  description?: string;
  position: Position;
  topic: string;
  difficulty: Difficulty;
  category: GameCategory;
  duration_minutes: number;
  techniques: string[];
  variations: string[];
}

export interface ClassPrepFormData {
  name: string;
  description?: string;
  date: string;
  duration_minutes: number;
  focus?: string;
  skill_level?: Difficulty;
  game_ids: string[];
  notes?: string;
}

// Smart Builder types
export interface SmartBuilderConstraints {
  duration_minutes?: number;
  game_count?: number;
  position?: Position;
  difficulty?: Difficulty;
  topic?: string;
}

export interface SmartBuilderResult {
  warmup: Game[];
  main: Game[];
  cooldown: Game[];
  total_duration: number;
}

// Filter types
export interface GameFilters {
  search: string;
  position: Position | '';
  difficulty: Difficulty | '';
  category: GameCategory | '';
  topic: string;
  favorites_only: boolean;
}

export interface ClassPrepFilters {
  search: string;
  date_from: string;
  date_to: string;
  focus: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}
