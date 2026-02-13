import type { ClassLogFormData } from '@/types/database'

// ═══════════════════════════════════════════════════════════
// SAMPLE CLASS LOGS - Recent training history
// ═══════════════════════════════════════════════════════════

// Note: session_id, student_ids, and techniques_drilled will be
// populated after other entities are seeded

export const classLogs: ClassLogFormData[] = [
  {
    date: '2026-02-10',
    coach_notes: 'Great energy today. Focused on closed guard hip bump to kimura chain. Most students picked up the connection quickly.',
    techniques_drilled: ['hip bump sweep', 'kimura from guard', 'guillotine from guard'],
    intensity_level: 'medium',
    what_worked: 'The hip bump to kimura chain clicked for most students. Having them drill it as a sequence rather than separate techniques made a big difference.',
    what_to_revisit: 'Triangle setup from closed guard. Several students struggling with the angle. Need more hip escape drilling.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-08',
    coach_notes: 'Nogi takedown class. Worked single legs and snap downs. Good intensity but need to slow down the drilling.',
    techniques_drilled: ['single leg', 'snap down', 'sprawl', 'front headlock'],
    intensity_level: 'high',
    what_worked: 'Snap down to front headlock chain was very effective. Students liked the wrestling flow.',
    what_to_revisit: 'Level change for single leg. Most students not dropping their hips enough. More penetration step drilling needed.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-06',
    coach_notes: 'Half guard day. Focused on knee shield retention and underhook battle. Positional sparring was productive.',
    techniques_drilled: ['knee shield', 'underhook half guard', 'dog fight', 'knee cut pass'],
    intensity_level: 'medium',
    what_worked: 'Positional sparring from half guard. Students got lots of reps. The underhook concept is starting to click.',
    what_to_revisit: 'Deep half entries. Advanced students need more work on the transition from knee shield to deep half.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-03',
    coach_notes: 'Mount attacks and escapes. Both perspectives. Good balance of offense and defense.',
    techniques_drilled: ['mount escape trap and roll', 'mount escape elbow knee', 'armbar from mount', 'cross collar choke'],
    intensity_level: 'medium',
    what_worked: 'The trap & roll to elbow-knee sequence as a chain worked well. Students understood the priority system.',
    what_to_revisit: 'Mount retention for top players. Too many students getting reversed immediately. Need more ride time drilling.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-01',
    coach_notes: 'Nogi leg lock intro. Covered ashi garami positions and straight ankle lock only. Safety focused.',
    techniques_drilled: ['ashi garami', 'straight ankle lock', 'SLX entry', 'ankle lock defense'],
    intensity_level: 'low',
    what_worked: 'Starting with positions before submissions was the right call. Students understood the map before the attacks.',
    what_to_revisit: 'SLX entry from butterfly. Timing is off for most students. Need more seated guard to SLX flow drilling.',
    duration_minutes: 90,
    student_ids: [],
  },
]
