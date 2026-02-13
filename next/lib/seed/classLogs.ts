import type { ClassLogFormData } from '@/types/database'

// ═══════════════════════════════════════════════════════════
// SAMPLE CLASS LOGS - 5-week training history (Jan 5 – Feb 10, 2026)
// Schedule: Mon / Wed / Fri
// ═══════════════════════════════════════════════════════════

// Note: session_id, student_ids, and techniques_drilled will be
// populated after other entities are seeded

export const classLogs: ClassLogFormData[] = [
  // ───────────────────────────────────────────────────────
  // WEEK 5 — Feb 9–10 (Mon only so far)
  // ───────────────────────────────────────────────────────
  {
    date: '2026-02-10',
    coach_notes:
      'Great energy today. Focused on closed guard hip bump to kimura chain. Most students picked up the connection quickly.',
    techniques_drilled: ['hip bump sweep', 'kimura from guard', 'guillotine from guard'],
    intensity_level: 'medium',
    what_worked:
      'The hip bump to kimura chain clicked for most students. Having them drill it as a sequence rather than separate techniques made a big difference.',
    what_to_revisit:
      'Triangle setup from closed guard. Several students struggling with the angle. Need more hip escape drilling.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // WEEK 4 — Feb 2–8
  // ───────────────────────────────────────────────────────
  {
    date: '2026-02-08',
    coach_notes:
      'Nogi takedown class. Worked single legs and snap downs. Good intensity but need to slow down the drilling.',
    techniques_drilled: ['single leg', 'snap down', 'sprawl', 'front headlock'],
    intensity_level: 'high',
    what_worked:
      'Snap down to front headlock chain was very effective. Students liked the wrestling flow.',
    what_to_revisit:
      'Level change for single leg. Most students not dropping their hips enough. More penetration step drilling needed.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-06',
    coach_notes:
      'Half guard day. Focused on knee shield retention and underhook battle. Positional sparring was productive.',
    techniques_drilled: ['knee shield', 'underhook half guard', 'dog fight', 'knee cut pass'],
    intensity_level: 'medium',
    what_worked:
      'Positional sparring from half guard. Students got lots of reps. The underhook concept is starting to click.',
    what_to_revisit:
      'Deep half entries. Advanced students need more work on the transition from knee shield to deep half.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-03',
    coach_notes:
      'Mount attacks and escapes. Both perspectives. Good balance of offense and defense.',
    techniques_drilled: [
      'mount escape trap and roll',
      'mount escape elbow knee',
      'armbar from mount',
      'cross collar choke',
    ],
    intensity_level: 'medium',
    what_worked:
      'The trap & roll to elbow-knee sequence as a chain worked well. Students understood the priority system.',
    what_to_revisit:
      'Mount retention for top players. Too many students getting reversed immediately. Need more ride time drilling.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-01',
    coach_notes:
      'Nogi leg lock intro. Covered ashi garami positions and straight ankle lock only. Safety focused.',
    techniques_drilled: ['ashi garami', 'straight ankle lock', 'SLX entry', 'ankle lock defense'],
    intensity_level: 'low',
    what_worked:
      'Starting with positions before submissions was the right call. Students understood the map before the attacks.',
    what_to_revisit:
      'SLX entry from butterfly. Timing is off for most students. Need more seated guard to SLX flow drilling.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // WEEK 3 — Jan 26–30
  // ───────────────────────────────────────────────────────
  {
    date: '2026-01-30',
    coach_notes:
      'Competition prep — Friday live-training session. Five-minute rounds, rotating partners. Kept the atmosphere supportive but pushed pace. Emphasized starting on feet for at least the first minute of each round.',
    techniques_drilled: ['competition pacing', 'takedown to pass sequence', 'guard pull to sweep'],
    intensity_level: 'high',
    what_worked:
      'Having competitors pair with each other for the first three rounds raised the energy. The non-comp students got quality reps in the second wave.',
    what_to_revisit:
      'Recovery between rounds. Several competitors redlining by round three. Need to incorporate more shark-tank conditioning in the coming weeks.',
    duration_minutes: 120,
    student_ids: [],
  },
  {
    date: '2026-01-28',
    coach_notes:
      'Back attacks gi class. Seat-belt grip, body triangle vs hooks, and the bow-and-arrow choke. Used a constraint-based game: bottom player starts turtled, top player must establish hooks within 30 seconds or reset. Guided discovery of weight distribution and hook timing.',
    techniques_drilled: [
      'seat belt grip',
      'body triangle',
      'rear naked choke',
      'bow and arrow choke',
      'back take from turtle',
    ],
    intensity_level: 'medium',
    what_worked:
      'The constrained positional round forced students to problem-solve the hook-insertion timing on their own. Several found the hip-switch entry without being shown it explicitly — great CLA moment.',
    what_to_revisit:
      'Maintaining back control when the bottom player faces toward you. Need to drill the re-take cycle and chair-sit recovery.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-26',
    coach_notes:
      'Open guard fundamentals — focused on seated guard, feet on hips, and the concept of frames vs grips. Deliberately kept the technique count low and let students explore through positional play. CLA approach: manipulated the task constraint so the guard player could only score by sweeping, not submitting.',
    techniques_drilled: [
      'seated guard frames',
      'feet on hips guard',
      'technical stand up from guard',
      'collar sleeve guard intro',
    ],
    intensity_level: 'low',
    what_worked:
      'Limiting the guard player to sweeps-only shifted their attention to off-balancing rather than hunting submissions. Several white belts started naturally discovering collar-sleeve grips.',
    what_to_revisit:
      'Guard retention when opponent does a bull-rush pass. Students keep scooting instead of framing. Need a drill isolating the frame-and-recover cycle.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // WEEK 2 — Jan 19–23
  // ───────────────────────────────────────────────────────
  {
    date: '2026-01-23',
    coach_notes:
      'Nogi front headlock series. Covered the snap-down entry, then branched to anaconda, d\'arce, and guillotine finishes. Ran a small-sided game: attacker scores any front-headlock sub, defender scores by clearing the head and re-shooting.',
    techniques_drilled: [
      'snap down',
      'front headlock control',
      'guillotine from front headlock',
      'anaconda choke',
      'darce choke',
    ],
    intensity_level: 'high',
    what_worked:
      'The branching decision tree — which choke based on opponent\'s reaction — clicked once we framed it as "if they posture, guillotine; if they roll, anaconda; if they square, d\'arce." Students self-organized quickly.',
    what_to_revisit:
      'Chin strap positioning on the guillotine. Too many students cranking the neck rather than using the blade of the wrist. Safety concern — will revisit with slower isolated reps next week.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-21',
    coach_notes:
      'Butterfly guard day — gi. Covered the basic elevator sweep, arm-drag from butterfly, and transition to SLX when opponent posts wide. Used constraint-based game to guide discovery of the sweep timing: top player resists sweep but cannot use hands on the mat.',
    techniques_drilled: [
      'butterfly guard elevation',
      'butterfly sweep',
      'arm drag from butterfly',
      'butterfly to SLX transition',
    ],
    intensity_level: 'medium',
    what_worked:
      'The hand-posting constraint forced the top player to rely on base and posture, which in turn gave the bottom player clearer feedback about when the sweep was loaded correctly. Students felt the "click" moment rather than muscling it.',
    what_to_revisit:
      'Arm drag follow-through. Students are getting the initial off-balance but losing the angle on the second step. Need to isolate the seat-change after the drag.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-19',
    coach_notes:
      'Side control escapes and retention. Worked the escape side first — ghost escape, frame-and-shrimp to guard, and the running escape. Then let the top players drill crossface and knee-on-belly transitions. Finished with positional rounds from side control.',
    techniques_drilled: [
      'ghost escape',
      'frame and shrimp to guard',
      'running escape',
      'crossface from side control',
      'knee on belly transition',
    ],
    intensity_level: 'medium',
    what_worked:
      'Teaching escapes first gave bottom players agency before the positional sparring. They were more active and creative than when we start with the top game.',
    what_to_revisit:
      'Timing the ghost escape. Most students are waiting too long and trying it after the crossface is locked. Need a reaction-time drill that triggers the escape earlier.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // WEEK 1 — Jan 12–16
  // ───────────────────────────────────────────────────────
  {
    date: '2026-01-16',
    coach_notes:
      'Wrestling-focused Friday session — double leg and sprawl defense. Warmed up with level-change and penetration-step ladders. Main technique block was the classic double leg, then the counter-sprawl and re-shot. Finished with takedown-only rounds from feet.',
    techniques_drilled: [
      'double leg takedown',
      'sprawl',
      're-shot after sprawl',
      'level change drill',
      'penetration step',
    ],
    intensity_level: 'high',
    what_worked:
      'The penetration-step ladder as a warm-up paid off — students were much sharper on their first steps during the live rounds than last time we did double legs.',
    what_to_revisit:
      'Finishing the double leg after making contact. Most students stall at the legs and try to lift. Need to drill the corner-and-trip finish and the run-the-pipe option.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-14',
    coach_notes:
      'Closed guard fundamentals — posture breaking, overhook guard, and the armbar from guard. Kept it traditional gi class. Used a scaling constraint: newer students focused on breaking posture and holding, while advanced students worked the full armbar chain.',
    techniques_drilled: [
      'posture break from closed guard',
      'overhook guard',
      'armbar from closed guard',
      'pendulum sweep',
    ],
    intensity_level: 'low',
    what_worked:
      'Differentiating the task by experience level meant everyone was challenged appropriately. The newer students gained confidence in their posture-break, and the purple belts refined their hip angle on the armbar.',
    what_to_revisit:
      'Pendulum sweep. Only covered it briefly as a secondary option. Needs its own dedicated class — the hip elevation is a skill that takes lots of reps.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-12',
    coach_notes:
      'DLR guard intro — nogi adaptation. Covered the basic hook placement, off-balance mechanics, and the baby-bolo entry. Kept things exploratory: students played 3-minute positional rounds with only the DLR hook available.',
    techniques_drilled: [
      'de la riva hook',
      'DLR off-balance',
      'baby bolo',
      'DLR to single leg X',
    ],
    intensity_level: 'medium',
    what_worked:
      'Constraining to the single hook meant students had to discover how to generate off-balance from just the foot position. Good self-organization — some found the belt grip pull, others found the shin-push entry.',
    what_to_revisit:
      'Baby bolo timing. Most students inverting too early before they have the off-balance. Need a slow-motion partner drill to find the tipping point.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // WEEK 0 — Jan 5–9 (Program kick-off)
  // ───────────────────────────────────────────────────────
  {
    date: '2026-01-09',
    coach_notes:
      'Scrambles and transitions — nogi flow class. No fixed technique of the day. Instead, set up a series of positional rounds with quick resets: start standing, first takedown scores, immediately reset to turtle, escape or take back, reset to open guard, sweep or pass, done. Emphasized reading the moment rather than executing memorized sequences.',
    techniques_drilled: [
      'scramble awareness',
      'turtle escape to guard',
      'front headlock to go-behind',
      'stand up in base',
    ],
    intensity_level: 'high',
    what_worked:
      'The rapid positional resets kept heart rates up and forced students to adapt without thinking. Several students who usually freeze in transitions started making instinctive reads. The CLA lens of varying the starting conditions worked beautifully.',
    what_to_revisit:
      'Students defaulting to the same escape pattern from turtle every time. Need to add a constraint next time — e.g., no granby rolls allowed — to push exploration of alternative exits.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-07',
    coach_notes:
      'Turtle attacks and escapes — gi class. Offense: clock choke, crucifix entry, and seatbelt to back take. Defense: sit-out, granby roll, and Peterson roll. Used a game where the top player starts with a seatbelt and the bottom player earns a point by returning to guard or standing.',
    techniques_drilled: [
      'clock choke',
      'crucifix entry',
      'seatbelt to back take',
      'sit out from turtle',
      'granby roll',
      'Peterson roll',
    ],
    intensity_level: 'medium',
    what_worked:
      'Pairing the offense with the defense in the same class gave students both sides of the coin. The positional game was competitive and students naturally started chaining attacks and escapes.',
    what_to_revisit:
      'Crucifix entry. Most students are reaching too far for the far arm and losing chest pressure. Need to emphasize riding hip-to-hip before reaching.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-05',
    coach_notes:
      'First class of the new year — guard passing fundamentals. Covered the toreando pass, knee cut, and over-under pass. Focused on the shared concept of controlling the hips before moving to pass. Lots of rep-based drilling with low resistance to set the movement patterns.',
    techniques_drilled: [
      'toreando pass',
      'knee cut pass',
      'over under pass',
      'hip control concepts',
    ],
    intensity_level: 'low',
    what_worked:
      'Starting the year with a fundamentals class set a good tone. High attendance and the slower pace gave newer students time to absorb the hip-control concept. The "control hips first" mantra unified all three passes and gave students a mental model.',
    what_to_revisit:
      'Toreando footwork. Students are shuffling rather than using a decisive step-and-pivot. Will design a footwork-isolation drill for next passing class.',
    duration_minutes: 90,
    student_ids: [],
  },

  // ───────────────────────────────────────────────────────
  // ADDITIONAL CLASSES — filling out the 3x/week schedule
  // ───────────────────────────────────────────────────────
  {
    date: '2026-01-10',
    coach_notes:
      'Saturday open mat with a themed focus: leg locks (nogi). Ran an extended warm-up with leg-pummeling drills, then a 20-minute technique block on outside ashi to straight ankle and the transition to 50/50 for heel-hook exposure. Finished with sub-only rounds from seated guard. Kept heel hooks demo-only for safety — no live heel hooks for anyone below purple belt.',
    techniques_drilled: [
      'outside ashi garami',
      'straight ankle lock',
      '50/50 entry',
      'heel hook exposure (demo only)',
      'leg pummeling',
    ],
    intensity_level: 'medium',
    what_worked:
      'Leg pummeling as a warm-up built awareness of foot positioning that carried over into the technique block. Students were more precise with their hooks during the ashi entry.',
    what_to_revisit:
      'Escaping leg entanglements. We only touched on it briefly. Next leg-lock day should dedicate equal time to the boot-and-clear defense.',
    duration_minutes: 120,
    student_ids: [],
  },
  {
    date: '2026-01-17',
    coach_notes:
      'Saturday open mat — half guard deep dive (gi). Covered the Lucas Leite-style dog fight, the plan B sweep from deep half, and the waiter sweep. Used a representative practice design: guard player begins in half guard with an underhook already established, top player tries to flatten and pass.',
    techniques_drilled: [
      'dog fight from half guard',
      'deep half guard entry',
      'waiter sweep',
      'plan B sweep',
      'underhook recovery',
    ],
    intensity_level: 'medium',
    what_worked:
      'Starting the positional round with the underhook already won let students focus on what comes next rather than getting stuck on the underhook battle itself. Effective task simplification.',
    what_to_revisit:
      'Waiter sweep balance point. Students are kicking too soon before they have the leg fully loaded. Need to slow the lift phase down with pause reps.',
    duration_minutes: 120,
    student_ids: [],
  },
  {
    date: '2026-01-24',
    coach_notes:
      'Saturday open mat — mount mastery (gi). Dedicated session to developing the mount position from both sides. Top: s-mount, gift wrap, and mounted triangle setup. Bottom: updated the elbow-knee escape with the heel-drag detail. Positional king-of-the-hill format — winner stays on top.',
    techniques_drilled: [
      's-mount transition',
      'gift wrap from mount',
      'mounted triangle setup',
      'elbow knee escape with heel drag',
    ],
    intensity_level: 'high',
    what_worked:
      'King-of-the-hill from mount was electric. Students fought hard to keep top position. The competitive format naturally increased intensity without coach prompting.',
    what_to_revisit:
      's-mount leg positioning. Several students getting their foot caught under the bottom player. Need to drill the hip-switch entry more carefully.',
    duration_minutes: 120,
    student_ids: [],
  },
  {
    date: '2026-01-31',
    coach_notes:
      'Saturday extra session — nogi wrestling and takedowns. Revisited the single leg with a focus on finishes: run the pipe, trip, and lift. Added the high crotch as a new entry. Three-minute takedown rounds with reset on the ground.',
    techniques_drilled: [
      'single leg run the pipe',
      'single leg trip finish',
      'high crotch takedown',
      'underhook to high crotch',
    ],
    intensity_level: 'high',
    what_worked:
      'Breaking the single leg into three distinct finishes gave students options instead of just stalling at the leg. The run-the-pipe finish was the most natural for most of the group.',
    what_to_revisit:
      'High crotch setup. Entry is awkward for shorter students. Need to explore the underhook-to-high-crotch pathway as an alternative entry for different body types.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-07',
    coach_notes:
      'Saturday session — competition prep round two. Simulated tournament conditions: gi, six-minute matches with points, advantages, and penalties. Had a senior purple belt refereeing. Debriefed after each round with video review on the big screen.',
    techniques_drilled: [
      'match strategy',
      'grip fighting',
      'guard pull to immediate sweep',
      'clock management',
    ],
    intensity_level: 'high',
    what_worked:
      'Video review between rounds was a game-changer. Students could see their own patterns — rushing takedowns, forgetting to consolidate points. Self-awareness jumped significantly.',
    what_to_revisit:
      'Grip fighting. Most students conceding grips too easily in the first exchange. Need a dedicated grip-fighting class before the competition.',
    duration_minutes: 120,
    student_ids: [],
  },
  {
    date: '2026-02-04',
    coach_notes:
      'Nogi open guard — butterfly and seated guard combinations. Revisited the butterfly elevator sweep from two weeks ago, then added the arm-drag to back take and the guillotine from a failed butterfly sweep. Emphasized the decision tree: sweep first, if blocked then arm-drag, if they posture away then snap to guillotine.',
    techniques_drilled: [
      'butterfly sweep',
      'arm drag to back take',
      'guillotine from butterfly',
      'seated guard to butterfly transition',
    ],
    intensity_level: 'medium',
    what_worked:
      'Revisiting the butterfly sweep with added branches made the original technique feel more alive. Students who struggled two weeks ago now had the base sweep and were ready for the "what if" layer.',
    what_to_revisit:
      'Guillotine grip from butterfly. Students are leaning back rather than curling forward. Need an isolation drill for the crunch mechanic.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-22',
    coach_notes:
      'Gi class — side control top game. Covered the bread cutter choke, baseball bat choke from side control, and the transition to north-south for the kimura. Ran a constraint game where the top player could not use knee-on-belly, forcing them to find submissions from heavy side control or north-south.',
    techniques_drilled: [
      'bread cutter choke',
      'baseball bat choke',
      'north south kimura',
      'side control to north south transition',
    ],
    intensity_level: 'medium',
    what_worked:
      'Removing knee-on-belly as an option pushed students into the north-south transition, which many had been neglecting. Multiple students hit the kimura for the first time in live training.',
    what_to_revisit:
      'Bread cutter choke grip. Half the class was gripping too shallow and turning it into a neck crank. Need to emphasize the deep cross-collar feed.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-15',
    coach_notes:
      'Nogi class — guillotine defense and counter-attacks. Started with the von Flue choke as the primary counter, then covered the body-lock pass as a safe way to kill the guillotine threat. Used constraint-based game to guide discovery of the sweep timing: attacker can only attempt guillotines, defender must either escape or counter-submit.',
    techniques_drilled: [
      'von Flue choke',
      'body lock pass vs guillotine',
      'guillotine defense posture',
      'chin strap escape',
    ],
    intensity_level: 'medium',
    what_worked:
      'Dedicating an entire class to one submission defense let students deeply internalize the defensive posture. The von Flue choke as a counter was motivating — students loved having a "punish" option.',
    what_to_revisit:
      'Body-lock pass timing. Students are diving into the pass before securing the body lock, getting caught in the choke. Need to slow down the sequence and emphasize patience.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-08',
    coach_notes:
      'Gi class — collar and sleeve guard. Introduced the concept of the "home position" for collar-sleeve: cross-collar grip, same-side sleeve grip, one foot on hip, one foot on bicep. Drilled the triangle entry, omoplata entry, and the overhead sweep. Let students explore which attack felt most natural through repetition.',
    techniques_drilled: [
      'collar sleeve guard setup',
      'triangle from collar sleeve',
      'omoplata from collar sleeve',
      'overhead sweep from collar sleeve',
    ],
    intensity_level: 'low',
    what_worked:
      'Establishing the "home position" concept first meant students always had somewhere to return to when an attack failed. Reduced the feeling of being lost in open guard.',
    what_to_revisit:
      'Omoplata finish. Students are getting the leg over the shoulder but not controlling the hip to prevent the roll. Need to drill the scooting and hip-control finish.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-01-29',
    coach_notes:
      'Nogi leg locks — progressive session building on the Jan 10 intro. Covered the inside sankaku (411/honeyhole) position, transitioned to heel-hook mechanics for purple belts and above, and the knee-bar entry from ashi for everyone. Used a representative task: bottom player starts in butterfly, top player stands — bottom player must enter a leg entanglement within 30 seconds.',
    techniques_drilled: [
      'inside sankaku entry',
      'heel hook mechanics (purple+ only)',
      'knee bar from ashi garami',
      'butterfly to ashi entry',
    ],
    intensity_level: 'medium',
    what_worked:
      'The 30-second entry constraint created urgency and forced students to commit to the entry rather than fishing. Transition speed from butterfly to ashi improved dramatically by the end of the session.',
    what_to_revisit:
      'Inside sankaku control. Students are entering the position but not consolidating before attacking. Need to spend more time on the "position before submission" principle in this context.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-05',
    coach_notes:
      'Gi class — back defense and escape. Covered the priority system: protect the neck first, then fight the hooks, then turn to guard. Drilled the shoulder-walk escape, the boot-scoot to guard recovery, and the hand-fight sequences for stripping the seatbelt. Positional sparring: back mount with hooks, defender works escapes.',
    techniques_drilled: [
      'back escape shoulder walk',
      'back escape to guard recovery',
      'hand fighting vs seatbelt',
      'back defense neck protection',
    ],
    intensity_level: 'medium',
    what_worked:
      'Teaching the priority system (neck, hooks, turn) before any specific technique gave students a decision-making framework. They stopped panicking and started systematically working the escape steps.',
    what_to_revisit:
      'The turn-to-guard finish. Students are turning but ending up in bottom side control instead of recovering guard. Need to drill the knee-shield insertion as part of the turn.',
    duration_minutes: 90,
    student_ids: [],
  },
  {
    date: '2026-02-09',
    coach_notes:
      'Nogi class — wrestling-to-submission chains. Worked the Russian tie to arm drag to back take, and the two-on-one to duck under. Bridged the gap between standing and ground by emphasizing the moment of transition. Used CLA principle of task simplification: first drilled the standing entries at walking speed, then added resistance incrementally.',
    techniques_drilled: [
      'Russian tie',
      'arm drag from standing',
      'duck under',
      'two on one control',
      'standing back take',
    ],
    intensity_level: 'high',
    what_worked:
      'Incremental resistance scaling worked perfectly. By the time students hit full resistance, their movement patterns were smooth. The Russian tie to arm drag became a reliable chain for most of the class.',
    what_to_revisit:
      'Duck-under footwork. Students are stepping with the wrong foot and ending up squared with their opponent. Need a solo footwork drill to pattern the correct stepping sequence.',
    duration_minutes: 90,
    student_ids: [],
  },
]
