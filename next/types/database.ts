// Database types for Supabase

// ─── Enums ───────────────────────────────────────────────

export type Position =
  | 'guard'
  | 'half-guard'
  | 'mount'
  | 'side-control'
  | 'back'
  | 'turtle'
  | 'standing'
  | 'open-guard'
  | 'closed-guard'
  | 'clinch'
  | 'other';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type GameCategory = 'warmup' | 'main' | 'cooldown' | 'drill' | 'positional';

export type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export type EnvironmentTag = 'gi' | 'nogi' | 'wrestling' | 'judo' | 'mma';

export type Intensity = 'low' | 'medium' | 'high';

export type TechniqueCategory =
  | 'sweep'
  | 'submission'
  | 'pass'
  | 'escape'
  | 'control'
  | 'takedown'
  | 'guard-retention'
  | 'transition'
  | 'throw';

export type ConstraintType = 'task' | 'environmental' | 'performer';

export type ClassArcPhase =
  | 'movement-prep'
  | 'technique-intro'
  | 'guided-discovery'
  | 'open-play'
  | 'cool-down';

// ─── CLA Constraint ─────────────────────────────────────

export interface RuleConstraint {
  type: ConstraintType;
  description: string;
}

// ─── Game (updated) ─────────────────────────────────────

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
  rating: number | null;
  video_url: string | null;
  // Phase 1 additions
  environment_tags: EnvironmentTag[];
  intensity: Intensity;
  rule_constraints: RuleConstraint[];
  technique_ids: string[];
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Technique ──────────────────────────────────────────

export interface Technique {
  id: string;
  name: string;
  position: Position;
  category: TechniqueCategory;
  gi_nogi: 'gi' | 'nogi' | 'both';
  belt_level_min: BeltLevel;
  belt_level_max: BeltLevel;
  prerequisite_ids: string[];
  description: string | null;
  video_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Student / Athlete ──────────────────────────────────

export interface Student {
  id: string;
  name: string;
  belt_rank: BeltLevel;
  stripes: number;
  start_date: string;
  competition_goals: string | null;
  strengths: string[];
  weaknesses: string[];
  injury_notes: string | null;
  notes: string | null;
  environment_preference: EnvironmentTag | null;
  created_at: string;
  updated_at: string;
}

// ─── Curriculum ─────────────────────────────────────────

export interface Curriculum {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  goal: string | null;
  target_belt_level: BeltLevel | null;
  environment: EnvironmentTag | null;
  session_ids: string[];
  progression_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Class Log ──────────────────────────────────────────

export interface ClassLog {
  id: string;
  session_id: string | null;
  date: string;
  student_ids: string[];
  coach_notes: string | null;
  techniques_drilled: string[];
  intensity_level: Intensity;
  what_worked: string | null;
  what_to_revisit: string | null;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

// ─── Form Data Types ────────────────────────────────────

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
  video_url?: string;
  environment_tags?: EnvironmentTag[];
  intensity?: Intensity;
  rule_constraints?: RuleConstraint[];
  technique_ids?: string[];
}

// ─── Class Prep (Session) ──────────────────────────────

export interface ClassPrep {
  id: string;
  name: string;
  description: string | null;
  date: string;
  duration_minutes: number;
  focus: string | null;
  skill_level: Difficulty | null;
  game_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
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

export interface TechniqueFormData {
  name: string;
  position: Position;
  category: TechniqueCategory;
  gi_nogi: 'gi' | 'nogi' | 'both';
  belt_level_min: BeltLevel;
  belt_level_max: BeltLevel;
  prerequisite_ids?: string[];
  description?: string;
  video_url?: string;
  tags?: string[];
}

export interface StudentFormData {
  name: string;
  belt_rank: BeltLevel;
  stripes: number;
  start_date: string;
  competition_goals?: string;
  strengths?: string[];
  weaknesses?: string[];
  injury_notes?: string;
  notes?: string;
  environment_preference?: EnvironmentTag;
}

export interface CurriculumFormData {
  name: string;
  description?: string;
  duration_weeks: number;
  goal?: string;
  target_belt_level?: BeltLevel;
  environment?: EnvironmentTag;
  session_ids?: string[];
  progression_notes?: string;
}

export interface ClassLogFormData {
  session_id?: string;
  date: string;
  student_ids?: string[];
  coach_notes?: string;
  techniques_drilled?: string[];
  intensity_level: Intensity;
  what_worked?: string;
  what_to_revisit?: string;
  duration_minutes: number;
}

// ─── Smart Builder Types (Phase 2 upgrade) ──────────────

export interface SmartBuilderConstraints {
  duration_minutes?: number;
  game_count?: number;
  position?: Position;
  difficulty?: Difficulty;
  topic?: string;
  // Phase 2 additions
  environment?: EnvironmentTag;
  intensity_target?: Intensity;
  class_arc?: boolean;
  avoid_recent_days?: number;
  positional_flow?: boolean;
}

export interface SmartBuilderResult {
  warmup: Game[];
  main: Game[];
  cooldown: Game[];
  total_duration: number;
}

export interface ClassArcResult {
  movement_prep: Game[];
  technique_intro: Game[];
  guided_discovery: Game[];
  open_play: Game[];
  cool_down: Game[];
  total_duration: number;
}

// ─── Filter Types ───────────────────────────────────────

export interface GameFilters {
  search: string;
  position: Position | '';
  difficulty: Difficulty | '';
  category: GameCategory | '';
  topic: string;
  favorites_only: boolean;
  environment: EnvironmentTag | '';
  intensity: Intensity | '';
}

export interface ClassPrepFilters {
  search: string;
  date_from: string;
  date_to: string;
  focus: string;
}

export interface TechniqueFilters {
  search: string;
  position: Position | '';
  category: TechniqueCategory | '';
  gi_nogi: 'gi' | 'nogi' | 'both' | '';
  belt_level: BeltLevel | '';
}

export interface StudentFilters {
  search: string;
  belt_rank: BeltLevel | '';
}

// ─── Positional Flow Order (Phase 2) ───────────────────

export const POSITIONAL_FLOW_ORDER: Position[] = [
  'standing',
  'clinch',
  'turtle',
  'guard',
  'open-guard',
  'closed-guard',
  'half-guard',
  'side-control',
  'mount',
  'back',
  'other',
];

export const BELT_ORDER: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black'];

export const INTENSITY_ORDER: Record<Intensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// ─── API Response Types ─────────────────────────────────

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

// ─── User Preferences ───────────────────────────────────

export interface UserPreferences {
  id: string;
  default_duration: number;
  default_difficulty: Difficulty;
  favorite_positions: Position[];
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}
