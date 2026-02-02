import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const defaultGames = [
  // Warmup games
  {
    name: 'Guard Retention Flow',
    description: 'Partner attempts to pass while you focus on hip movement and frame retention. Light resistance, technical focus.',
    position: 'guard',
    topic: 'Guard',
    difficulty: 'beginner',
    category: 'warmup',
    duration_minutes: 5,
    techniques: ['hip escape', 'framing', 'guard retention'],
    variations: ['Add grips', 'Increase pace'],
  },
  {
    name: 'Movement Warm-up',
    description: 'Solo drills: shrimping, technical stand-ups, granby rolls, forward/backward rolls.',
    position: 'other',
    topic: 'Movement',
    difficulty: 'beginner',
    category: 'warmup',
    duration_minutes: 5,
    techniques: ['shrimp', 'technical stand-up', 'granby roll'],
    variations: ['Add partner', 'Competition pace'],
  },
  {
    name: 'Pummeling Drill',
    description: 'Underhook battle with partner. Focus on inside position and head position.',
    position: 'standing',
    topic: 'Clinch',
    difficulty: 'beginner',
    category: 'warmup',
    duration_minutes: 5,
    techniques: ['underhook', 'overhook', 'head position'],
    variations: ['Add takedown attempts', 'From knees'],
  },

  // Main games - Guard
  {
    name: 'Closed Guard Attack Chain',
    description: 'Start in closed guard. Work submissions and sweeps in a chain: armbar → triangle → omoplata → hip bump sweep.',
    position: 'guard',
    topic: 'Guard',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 10,
    techniques: ['armbar', 'triangle', 'omoplata', 'hip bump sweep'],
    variations: ['Add kimura option', 'Spider guard entries'],
  },
  {
    name: 'Open Guard Retention Game',
    description: 'Top player scores by passing. Guard player scores by sweeping or submitting. Reset on score.',
    position: 'guard',
    topic: 'Guard',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 8,
    techniques: ['collar sleeve', 'de la riva', 'lasso'],
    variations: ['No hands guard', 'Specific guard only'],
  },
  {
    name: 'Half Guard Battles',
    description: 'Positional sparring from half guard. Top works to pass, bottom works to sweep or take back.',
    position: 'half-guard',
    topic: 'Half Guard',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 8,
    techniques: ['underhook', 'knee shield', 'dogfight'],
    variations: ['Lockdown only', 'Deep half entries'],
  },

  // Main games - Top positions
  {
    name: 'Mount Escape Challenge',
    description: 'Bottom player must escape mount. Top player maintains and hunts submissions.',
    position: 'mount',
    topic: 'Escapes',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 8,
    techniques: ['trap and roll', 'elbow escape', 'heel drag'],
    variations: ['High mount start', 'S-mount transitions'],
  },
  {
    name: 'Side Control Battles',
    description: 'Top player maintains and attacks. Bottom escapes to guard or turtle.',
    position: 'side-control',
    topic: 'Pressure',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 8,
    techniques: ['kesa gatame', 'north-south', 'knee on belly'],
    variations: ['100 kilos only', 'No submissions top'],
  },
  {
    name: 'Back Attack Series',
    description: 'Back player hunts submissions. Defender works escapes. Reset after escape or submission.',
    position: 'back',
    topic: 'Back Control',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 10,
    techniques: ['rear naked choke', 'collar chokes', 'armbar'],
    variations: ['Body triangle only', 'Truck entries'],
  },

  // Main games - Takedowns
  {
    name: 'Takedown Entries',
    description: 'Light standup work focusing on entries. Single leg, double leg, and snap downs.',
    position: 'standing',
    topic: 'Takedowns',
    difficulty: 'intermediate',
    category: 'main',
    duration_minutes: 8,
    techniques: ['single leg', 'double leg', 'snap down'],
    variations: ['Gi grips only', 'No gi'],
  },
  {
    name: 'Guard Pull Counter',
    description: 'One player attempts guard pull, other counters with pass or takedown.',
    position: 'standing',
    topic: 'Takedowns',
    difficulty: 'advanced',
    category: 'main',
    duration_minutes: 8,
    techniques: ['guard pull', 'leg drag', 'toreando'],
    variations: ['Double guard pull', 'Imanari roll entries'],
  },

  // Positional drills
  {
    name: 'Knee Slice Passing Drill',
    description: 'Systematic knee slice passing against various guards. Focus on pressure and timing.',
    position: 'guard',
    topic: 'Passing',
    difficulty: 'intermediate',
    category: 'drill',
    duration_minutes: 10,
    techniques: ['knee slice', 'cross face', 'underhook'],
    variations: ['Add backstep', 'Long step combo'],
  },
  {
    name: 'Submission Chain Drill',
    description: 'Flow through submission chains: armbar → triangle → omoplata → back take.',
    position: 'guard',
    topic: 'Submissions',
    difficulty: 'advanced',
    category: 'drill',
    duration_minutes: 10,
    techniques: ['armbar', 'triangle', 'omoplata'],
    variations: ['Add kimura', 'Gogoplata finish'],
  },

  // Cooldown
  {
    name: 'Flow Rolling',
    description: 'Light rolling at 50% intensity. Focus on movement and transitions, not winning.',
    position: 'other',
    topic: 'Movement',
    difficulty: 'beginner',
    category: 'cooldown',
    duration_minutes: 5,
    techniques: ['transitions', 'movement'],
    variations: ['Submission only', 'Position only'],
  },
  {
    name: 'Stretch and Review',
    description: 'Partner stretching and discussion of key techniques from class.',
    position: 'other',
    topic: 'Recovery',
    difficulty: 'beginner',
    category: 'cooldown',
    duration_minutes: 5,
    techniques: ['stretching', 'mobility'],
    variations: ['Add breathing exercises'],
  },
]

async function seed() {
  console.log('Seeding database...')

  // Insert games
  const { data, error } = await supabase
    .from('games')
    .insert(defaultGames)
    .select()

  if (error) {
    console.error('Error seeding games:', error)
    process.exit(1)
  }

  console.log(`Inserted ${data.length} games`)
  console.log('Seeding complete!')
}

seed()
