import type { CurriculumFormData } from '@/types/database'

// ═══════════════════════════════════════════════════════════
// CURRICULA - Modern Grappling Programs
// Gi and Nogi tracks with progressive skill building
// ═══════════════════════════════════════════════════════════

// Note: session_ids will be populated after sessions are seeded

export const curricula: CurriculumFormData[] = [
  {
    name: 'Modern Gi Fundamentals (8-Week Cycle)',
    description: 'Complete gi curriculum covering closed guard, half guard, passing, back attacks, side control, and competition prep. Built on Danaher systems with traditional gi techniques.',
    duration_weeks: 8,
    goal: 'Build a complete gi game from guard to top control. Students should have a functional closed guard, basic passing sequence, and 2-3 reliable submissions by the end.',
    target_belt_level: 'white',
    environment: 'gi',
    session_ids: [],
    progression_notes: 'Week 1-2: Guard & Escapes (survival first). Week 3-4: Attacks & Passing. Week 5-6: Advanced positions. Week 7-8: Competition prep & review. Each week builds on the last. White and blue belts focus on core techniques, purple+ add advanced variations.',
  },
  {
    name: 'Modern Nogi Grappling (8-Week Cycle)',
    description: 'Complete nogi curriculum based on New Wave / Danaher system. Takedowns, body lock passing, leg locks, back attacks, and modern guard play.',
    duration_weeks: 8,
    goal: 'Develop a systematic nogi game. Students will have entries into leg entanglements, pressure passing chains, and back attack sequences.',
    target_belt_level: 'blue',
    environment: 'nogi',
    session_ids: [],
    progression_notes: 'Week 1-2: Takedowns & Closed Guard. Week 3-4: Open Guard & Passing. Week 5: Leg Locks. Week 6: Front Headlock. Week 7: Scrambles. Week 8: Competition. Blue belts focus on systems, purple+ refine timing and chains.',
  },
  {
    name: 'Competition Preparation (4-Week Camp)',
    description: 'Intensive 4-week camp for upcoming competition. High-intensity positional sparring, takedown drilling, and mental preparation.',
    duration_weeks: 4,
    goal: 'Peak physical and technical readiness for competition. Sharpen A-game, improve cardio, develop competition mindset.',
    target_belt_level: 'blue',
    environment: 'nogi',
    session_ids: [],
    progression_notes: 'Week 1: Identify and drill A-game. Week 2: Positional sparring focused on weak spots. Week 3: Full competition simulation. Week 4: Taper - light technique, mental prep, weight management.',
  },
  {
    name: 'Leg Lock Mastery (6-Week Program)',
    description: 'Dedicated leg lock curriculum. Ashi garami positions, entries from guard and passing, heel hooks, knee bars, and defensive escapes. Danaher / Craig Jones system.',
    duration_weeks: 6,
    goal: 'Complete understanding of the leg lock game. Students will know all major entanglement positions, entries, finishes, and defenses.',
    target_belt_level: 'purple',
    environment: 'nogi',
    session_ids: [],
    progression_notes: 'Week 1: Positional hierarchy (SLX, ashi, inside sankaku, 50/50). Week 2: Entries from guard. Week 3: Entries from passing/top. Week 4: Inside heel hook & outside heel hook finishing. Week 5: Knee bar & toe hold. Week 6: Defense, escapes, and live drilling.',
  },
  {
    name: 'Back Attack Specialist (4-Week Program)',
    description: 'Deep dive into the back attack system. Entries from every position, seatbelt & body triangle control, RNC system, and gi-specific back attacks.',
    duration_weeks: 4,
    goal: 'Make the back your home. Multiple entries, unbreakable control, and systematic finishing sequences.',
    target_belt_level: 'blue',
    environment: 'nogi',
    session_ids: [],
    progression_notes: 'Week 1: Back take entries (arm drag, turtle, mount, guard). Week 2: Back retention (seatbelt, body triangle, ride the escape). Week 3: Finishing (RNC short choke, armbar, triangle). Week 4: Defense & live rounds.',
  },
  {
    name: 'Guard Passing Masterclass (6-Week Program)',
    description: 'Comprehensive passing curriculum. Speed passing, pressure passing, and leg drag system. Both gi and nogi applications.',
    duration_weeks: 6,
    goal: 'Systematic approach to passing any guard. Students will have answers for every guard they encounter.',
    target_belt_level: 'blue',
    environment: 'nogi',
    session_ids: [],
    progression_notes: 'Week 1: Headquarters & toreando. Week 2: Knee cut & long step. Week 3: Body lock & over-under (pressure). Week 4: Leg drag system. Week 5: Guard-specific solutions (DLR, half, butterfly). Week 6: Live passing rounds & competition passing.',
  },
  {
    name: 'White Belt Survival Guide (12-Week Program)',
    description: 'Complete beginner curriculum. Escapes from every bad position, basic guard, fundamental submissions. Build confidence and safety awareness.',
    duration_weeks: 12,
    goal: 'Survive against higher belts. Know escapes from mount, side control, and back. Have 1-2 sweeps and 1-2 submissions.',
    target_belt_level: 'white',
    environment: 'gi',
    session_ids: [],
    progression_notes: 'Weeks 1-3: Escapes (mount escape, side control escape, back escape). Weeks 4-6: Closed guard (hip bump, scissor sweep, armbar, triangle). Weeks 7-9: Half guard & side control top. Weeks 10-12: Standing & open guard basics. Repeat cycle for 2nd stripe+.',
  },
  {
    name: 'Gi Guard Specialist (6-Week Program)',
    description: 'Deep dive into gi-specific guards. Collar sleeve, spider, lasso, DLR, RDLR. Build a complete gi guard system with sweeps and submissions from each.',
    duration_weeks: 6,
    goal: 'Develop an impassable guard in the gi. Chain between guards, sweep from any position, submit from guard.',
    target_belt_level: 'blue',
    environment: 'gi',
    session_ids: [],
    progression_notes: 'Week 1: Collar sleeve fundamentals. Week 2: Spider & lasso. Week 3: DLR system. Week 4: RDLR & berimbolo. Week 5: Guard transitions & chaining. Week 6: Live guard play & troubleshooting.',
  },
]
