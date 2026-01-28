// Position categories for grappling - organized by type
export const POSITIONS = {
  guard: [
    { value: 'closed-guard', label: 'Closed Guard' },
    { value: 'open-guard', label: 'Open Guard' },
    { value: 'half-guard', label: 'Half Guard' },
    { value: 'butterfly-guard', label: 'Butterfly Guard' },
    { value: 'x-guard', label: 'X-Guard' },
    { value: 'dlr', label: 'De La Riva' },
    { value: 'rdlr', label: 'Reverse DLR' },
    { value: 'spider-guard', label: 'Spider Guard' },
    { value: 'lasso-guard', label: 'Lasso Guard' },
    { value: 'collar-sleeve', label: 'Collar Sleeve' },
  ],
  top: [
    { value: 'mount', label: 'Mount' },
    { value: 'side-control', label: 'Side Control' },
    { value: 'north-south', label: 'North-South' },
    { value: 'knee-on-belly', label: 'Knee on Belly' },
    { value: 'back-control', label: 'Back Control' },
  ],
  neutral: [
    { value: 'turtle', label: 'Turtle' },
    { value: 'front-headlock', label: 'Front Headlock' },
    { value: 'standing', label: 'Standing' },
    { value: 'clinch', label: 'Clinch' },
  ],
  legLocks: [
    { value: '50-50', label: '50/50' },
    { value: 'saddle', label: 'Saddle/Honeyhole' },
    { value: 'ashi-garami', label: 'Ashi Garami' },
    { value: 'inside-sankaku', label: 'Inside Sankaku' },
  ]
};

// Flat list of all positions
export const ALL_POSITIONS = [
  ...POSITIONS.guard,
  ...POSITIONS.top,
  ...POSITIONS.neutral,
  ...POSITIONS.legLocks,
  { value: 'other', label: 'Other' }
];

// Technique categories
export const TECHNIQUES = {
  submissions: [
    { value: 'armbar', label: 'Armbar' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'kimura', label: 'Kimura' },
    { value: 'americana', label: 'Americana' },
    { value: 'omoplata', label: 'Omoplata' },
    { value: 'guillotine', label: 'Guillotine' },
    { value: 'darce', label: "D'arce" },
    { value: 'anaconda', label: 'Anaconda' },
    { value: 'rnc', label: 'RNC' },
    { value: 'ezekiel', label: 'Ezekiel' },
    { value: 'heel-hook', label: 'Heel Hook' },
    { value: 'knee-bar', label: 'Knee Bar' },
    { value: 'toe-hold', label: 'Toe Hold' },
    { value: 'calf-slicer', label: 'Calf Slicer' },
    { value: 'ankle-lock', label: 'Ankle Lock' },
  ],
  sweeps: [
    { value: 'scissor-sweep', label: 'Scissor Sweep' },
    { value: 'hip-bump', label: 'Hip Bump' },
    { value: 'flower-sweep', label: 'Flower Sweep' },
    { value: 'pendulum-sweep', label: 'Pendulum Sweep' },
    { value: 'elevator-sweep', label: 'Elevator Sweep' },
    { value: 'overhead-sweep', label: 'Overhead Sweep' },
  ],
  escapes: [
    { value: 'hip-escape', label: 'Hip Escape' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'elbow-knee', label: 'Elbow-Knee Escape' },
    { value: 'frame', label: 'Frame' },
  ],
  passes: [
    { value: 'knee-cut', label: 'Knee Cut' },
    { value: 'torreando', label: 'Torreando' },
    { value: 'stack-pass', label: 'Stack Pass' },
    { value: 'leg-drag', label: 'Leg Drag' },
    { value: 'body-lock-pass', label: 'Body Lock Pass' },
    { value: 'over-under', label: 'Over-Under' },
    { value: 'smash-pass', label: 'Smash Pass' },
  ],
  takedowns: [
    { value: 'single-leg', label: 'Single Leg' },
    { value: 'double-leg', label: 'Double Leg' },
    { value: 'ankle-pick', label: 'Ankle Pick' },
    { value: 'arm-drag', label: 'Arm Drag' },
    { value: 'snap-down', label: 'Snap Down' },
  ],
  control: [
    { value: 'crossface', label: 'Crossface' },
    { value: 'underhook', label: 'Underhook' },
    { value: 'overhook', label: 'Overhook' },
    { value: 'seatbelt', label: 'Seatbelt' },
    { value: 'body-triangle', label: 'Body Triangle' },
  ],
  movement: [
    { value: 'granby', label: 'Granby Roll' },
    { value: 'inversion', label: 'Inversion' },
    { value: 'berimbolo', label: 'Berimbolo' },
    { value: 'leg-pummeling', label: 'Leg Pummeling' },
  ]
};

// Flat list of all techniques
export const ALL_TECHNIQUES = [
  ...TECHNIQUES.submissions,
  ...TECHNIQUES.sweeps,
  ...TECHNIQUES.escapes,
  ...TECHNIQUES.passes,
  ...TECHNIQUES.takedowns,
  ...TECHNIQUES.control,
  ...TECHNIQUES.movement,
];

// Get label for a position value
export const getPositionLabel = (value) => {
  const pos = ALL_POSITIONS.find(p => p.value === value);
  return pos ? pos.label : value;
};

// Get label for a technique value
export const getTechniqueLabel = (value) => {
  const tech = ALL_TECHNIQUES.find(t => t.value === value);
  return tech ? tech.label : value;
};

// Topic categories for games
export const TOPICS = [
  { value: '', label: 'All Topics' },
  { value: 'offensive', label: 'Offensive', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-500' },
  { value: 'control', label: 'Control', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition', color: 'bg-green-500' }
];

// Topic colors for visual coding (solid colors for general use)
export const TOPIC_COLORS = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

// Topic labels
export const TOPIC_LABELS = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  control: 'Control',
  transition: 'Transition'
};

// Get topic label
export const getTopicLabel = (value) => TOPIC_LABELS[value] || value;

// Get topic color
export const getTopicColor = (value) => TOPIC_COLORS[value] || 'bg-gray-400';

// Position colors for visual coding
export const POSITION_COLORS = {
  'closed-guard': 'bg-blue-500',
  'open-guard': 'bg-blue-400',
  'half-guard': 'bg-blue-600',
  'butterfly-guard': 'bg-cyan-500',
  'x-guard': 'bg-cyan-600',
  'dlr': 'bg-teal-500',
  'rdlr': 'bg-teal-600',
  'spider-guard': 'bg-indigo-500',
  'lasso-guard': 'bg-indigo-600',
  'collar-sleeve': 'bg-violet-500',
  'mount': 'bg-red-500',
  'side-control': 'bg-orange-500',
  'north-south': 'bg-amber-500',
  'knee-on-belly': 'bg-yellow-500',
  'back-control': 'bg-rose-500',
  'turtle': 'bg-gray-500',
  'front-headlock': 'bg-gray-600',
  'standing': 'bg-green-500',
  'clinch': 'bg-green-600',
  '50-50': 'bg-purple-500',
  'saddle': 'bg-purple-600',
  'ashi-garami': 'bg-fuchsia-500',
  'inside-sankaku': 'bg-fuchsia-600',
  'other': 'bg-slate-500'
};
