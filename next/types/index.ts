export type GameCategory =
  | 'guard'
  | 'passing'
  | 'side-control'
  | 'mount'
  | 'back-control'
  | 'takedowns'
  | 'submissions'
  | 'pins'
  | 'scrambles'
  | 'turtle';

export type GuardSubcategory =
  | 'seated'
  | 'closed'
  | 'half'
  | 'open';

export type SubmissionSubcategory =
  | 'chokes'
  | 'arm-attacks'
  | 'leg-locks'
  | 'neck-cranks';

export type Subcategory = GuardSubcategory | SubmissionSubcategory | string;

export interface PlayerRole {
  label: string;
  objective: string;
  constraints: string[];
}

export interface WinConditions {
  playerA: string[];
  playerB: string[];
}

export interface ScalingFocuses {
  beginner?: string;
  intermediate?: string;
  advanced?: string;
}

export interface CLAGame {
  id: string;
  name: string;
  category: GameCategory;
  subcategory?: Subcategory;
  startingPosition: string;
  playerA: PlayerRole;
  playerB: PlayerRole;
  winConditions: WinConditions;
  scalingFocuses?: ScalingFocuses;
  coachingNotes?: string;
  duration?: number;
  tags: string[];
  source?: string;
  progressionIds?: string[];
  createdBy: string;
  createdAt: string;
  isCustom: boolean;
}

export interface Session {
  id: string;
  name: string;
  games: SessionGame[];
  notes?: string;
  duration?: number;
  createdAt: string;
}

export interface SessionGame {
  gameId: string;
  order: number;
  roundMinutes?: number;
  notes?: string;
}

export const CATEGORIES: { value: GameCategory; label: string }[] = [
  { value: 'guard', label: 'Guard' },
  { value: 'passing', label: 'Passing' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'mount', label: 'Mount' },
  { value: 'back-control', label: 'Back Control' },
  { value: 'takedowns', label: 'Takedowns' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'pins', label: 'Pins' },
  { value: 'scrambles', label: 'Scrambles' },
  { value: 'turtle', label: 'Turtle' },
];

export const CATEGORY_COLORS: Record<GameCategory, string> = {
  'guard': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'passing': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'side-control': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'mount': 'bg-red-500/20 text-red-400 border-red-500/30',
  'back-control': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'takedowns': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'submissions': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'pins': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'scrambles': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'turtle': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};
