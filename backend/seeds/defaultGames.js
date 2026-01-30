/**
 * Default BJJ No-Gi Games for Ecogram
 * Balanced collection covering all positions and topics
 * Based on Constraints-Led Approach (CLA) principles
 */

const defaultGames = [
  // ==================== CLOSED GUARD ====================
  {
    name: "Closed Guard Hip Bump Attack",
    topic: "offensive",
    position: "closed-guard",
    techniques: ["hip-bump", "kimura", "triangle"],
    topPlayer: "Stay postured. If you get broken down, work to posture back up. Hands on hips or in armpits.",
    bottomPlayer: "Break posture and attack with hip bump. If defended, transition to kimura or triangle setup.",
    coaching: "Focus on the chain reaction. Hip bump creates space that can lead to kimura grip or triangle angle.",
    difficulty: "beginner",
    gameType: "main"
  },
  {
    name: "Closed Guard Posture Battle",
    topic: "control",
    position: "closed-guard",
    techniques: ["frame", "underhook"],
    topPlayer: "Establish and maintain posture. Hands on hips, elbows in. Stand up when you have good base.",
    bottomPlayer: "Break posture using collar tie, overhooks, or wrist control. Keep opponent's head below your chest.",
    coaching: "This is a fundamental battle. Winner is whoever controls the posture for 30 seconds.",
    difficulty: "beginner",
    gameType: "warmup"
  },
  {
    name: "Closed Guard Armbar Hunt",
    topic: "offensive",
    position: "closed-guard",
    techniques: ["armbar", "triangle"],
    topPlayer: "Defend arm attacks by keeping elbows tight. Don't let opponent isolate an arm.",
    bottomPlayer: "Hunt for armbar using angle creation. When armbar is defended, look for triangle.",
    coaching: "Emphasize hip movement to create the angle. The armbar comes from hip position, not arm pulling.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== HALF GUARD ====================
  {
    name: "Half Guard Underhook War",
    topic: "control",
    position: "half-guard",
    techniques: ["underhook", "crossface"],
    topPlayer: "Establish crossface and underhook. Flatten opponent and work to pass.",
    bottomPlayer: "Fight for the underhook. Use it to come to your side and threaten back take or sweep.",
    coaching: "The underhook is king in half guard. Whoever gets it first usually wins the exchange.",
    difficulty: "beginner",
    gameType: "main"
  },
  {
    name: "Half Guard Sweep Series",
    topic: "offensive",
    position: "half-guard",
    techniques: ["underhook", "elevator-sweep"],
    topPlayer: "Maintain heavy top pressure. Keep head low and hips driving forward.",
    bottomPlayer: "Use deep half, underhook sweep, or old school sweep. Chain attacks when first is defended.",
    coaching: "Sweeps come from off-balancing. Focus on getting opponent's weight over their trapped knee.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Half Guard Escape",
    topic: "defensive",
    position: "half-guard",
    techniques: ["hip-escape", "frame"],
    topPlayer: "Pass the half guard using knee cut, backstep, or smash. Prevent bottom player from recovering.",
    bottomPlayer: "If flattened, focus on reguarding to full guard. Create frames and make space.",
    coaching: "Bottom player wins by recovering full guard or getting back to knees. Top wins by passing.",
    difficulty: "beginner",
    gameType: "main"
  },

  // ==================== OPEN GUARD ====================
  {
    name: "Open Guard Retention",
    topic: "defensive",
    position: "open-guard",
    techniques: ["frame", "hip-escape"],
    topPlayer: "Pass the guard using any method. Focus on controlling feet and nullifying hooks.",
    bottomPlayer: "Retain guard at all costs. Use frames, hip movement, and recomposition.",
    coaching: "Guard retention is about staying connected and creating problems. Never give up the fight.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Open Guard Sweep Game",
    topic: "offensive",
    position: "open-guard",
    techniques: ["scissor-sweep", "overhead-sweep"],
    topPlayer: "Stay balanced and work to pass. Don't let feet get to hips.",
    bottomPlayer: "Sweep to top position. Use collar ties, sleeve grips (bodylock in no-gi) to off-balance.",
    coaching: "Sweeps require kuzushi (off-balancing). Time your sweep as opponent shifts weight.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== BUTTERFLY GUARD ====================
  {
    name: "Butterfly Guard Elevator",
    topic: "offensive",
    position: "butterfly-guard",
    techniques: ["elevator-sweep", "underhook"],
    topPlayer: "Base wide and stay heavy on hips. Deny the underhook and overhook grips.",
    bottomPlayer: "Get underhook or double underhooks. Use hooks to elevate and sweep.",
    coaching: "The sweep comes from lifting with the hook while pulling with the arms. Timing is key.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Butterfly Guard to Single Leg",
    topic: "transition",
    position: "butterfly-guard",
    techniques: ["single-leg", "arm-drag"],
    topPlayer: "Don't let opponent get under you. Sprawl if they shoot.",
    bottomPlayer: "Use arm drag or underhook to transition to single leg. Get your head to the outside.",
    coaching: "This game connects guard to wrestling. Great for developing smooth transitions.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== X-GUARD ====================
  {
    name: "X-Guard Entry Drill",
    topic: "transition",
    position: "x-guard",
    techniques: ["leg-pummeling", "overhead-sweep"],
    topPlayer: "Stay mobile, don't let opponent get under your base. Control legs.",
    bottomPlayer: "Enter X-guard from seated or butterfly. Immediately threaten sweep.",
    coaching: "X-guard is about getting under the opponent's center of gravity. The sweep should be immediate.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "X-Guard Sweep Battle",
    topic: "offensive",
    position: "x-guard",
    techniques: ["overhead-sweep", "single-leg"],
    topPlayer: "Base out and prevent elevation. Work to extract legs.",
    bottomPlayer: "Sweep using technical standup, overhead, or single leg finish. Chain attacks.",
    coaching: "From X-guard you should always be threatening. If one sweep is defended, go to the next.",
    difficulty: "advanced",
    gameType: "main"
  },

  // ==================== DE LA RIVA ====================
  {
    name: "DLR to Back Take",
    topic: "offensive",
    position: "dlr",
    techniques: ["berimbolo", "arm-drag"],
    topPlayer: "Pressure forward and work to clear the hook. Don't expose your back.",
    bottomPlayer: "Use DLR hook to off-balance. Invert or arm drag to take the back.",
    coaching: "DLR is a dynamic guard. Keep opponent reacting and create opportunities for back takes.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "DLR Retention vs Pass",
    topic: "defensive",
    position: "dlr",
    techniques: ["leg-pummeling", "frame"],
    topPlayer: "Pass using knee cut, long step, or torreando. Clear the DLR hook first.",
    bottomPlayer: "Retain DLR guard. If hook is cleared, transition to RDLR, X-guard, or collar sleeve.",
    coaching: "This develops the ability to flow between guards when one is threatened.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== MOUNT ====================
  {
    name: "Mount Maintenance",
    topic: "control",
    position: "mount",
    techniques: ["crossface", "body-triangle"],
    topPlayer: "Stay mounted for 60 seconds. Use grapevines, high mount, or S-mount to maintain.",
    bottomPlayer: "Escape the mount using elbow-knee escape, bridge, or trap and roll.",
    coaching: "Mount control is about hip positioning and weight distribution. Stay heavy!",
    difficulty: "beginner",
    gameType: "main"
  },
  {
    name: "Mount Attack Flow",
    topic: "offensive",
    position: "mount",
    techniques: ["armbar", "americana", "triangle"],
    topPlayer: "Attack with submissions. Use high mount for arm attacks, low mount for collar attacks.",
    bottomPlayer: "Defend submissions while working to escape. Don't give up position.",
    coaching: "Mount attacks should flow together. When one is defended, the next becomes available.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Mount Escape Priority",
    topic: "defensive",
    position: "mount",
    techniques: ["elbow-knee", "bridge", "frame"],
    topPlayer: "Submit or maintain. Don't let bottom player create space.",
    bottomPlayer: "Escape is the only goal. Use frames, hip escapes, and bridging.",
    coaching: "Bottom player wins by escaping to guard or getting on top. Survival is not winning.",
    difficulty: "beginner",
    gameType: "main"
  },

  // ==================== SIDE CONTROL ====================
  {
    name: "Side Control Pin",
    topic: "control",
    position: "side-control",
    techniques: ["crossface", "underhook"],
    topPlayer: "Maintain side control for 60 seconds. Use chest pressure and control arms.",
    bottomPlayer: "Create frames and make space. Goal is to recover guard or come to knees.",
    coaching: "Side control is about controlling the hips and head. Crossface prevents escape.",
    difficulty: "beginner",
    gameType: "main"
  },
  {
    name: "Side Control Submission Hunt",
    topic: "offensive",
    position: "side-control",
    techniques: ["kimura", "americana", "darce"],
    topPlayer: "Attack with submissions. Nearside kimura, farside americana, darce, or north-south attacks.",
    bottomPlayer: "Defend while working to escape. Keep elbows tight.",
    coaching: "Submissions from side control come from isolating limbs. Position before submission.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Side Control Escape Drill",
    topic: "defensive",
    position: "side-control",
    techniques: ["hip-escape", "frame", "underhook"],
    topPlayer: "Maintain position or progress to mount/back. Don't let bottom player recover.",
    bottomPlayer: "Escape using frames to guard, or get underhook to come to knees.",
    coaching: "Create frames first, then make space with hip movement. Never flatten completely.",
    difficulty: "beginner",
    gameType: "main"
  },

  // ==================== BACK CONTROL ====================
  {
    name: "Back Control Submission Series",
    topic: "offensive",
    position: "back-control",
    techniques: ["rnc", "armbar"],
    topPlayer: "Attack the RNC. Use collar ties and trap the arm. Finish the choke.",
    bottomPlayer: "Defend the choke by controlling hands. Work to escape by getting shoulders to mat.",
    coaching: "Back attacks are methodical. Control the body, trap an arm, attack the neck.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Back Control Maintenance",
    topic: "control",
    position: "back-control",
    techniques: ["seatbelt", "body-triangle"],
    topPlayer: "Keep back control for 60 seconds. Use seatbelt grip and body triangle or hooks.",
    bottomPlayer: "Escape by getting shoulders to mat and fighting the grip.",
    coaching: "Back control is about hip-to-hip connection. If they get to the side, you've lost.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Back Escape",
    topic: "defensive",
    position: "back-control",
    techniques: ["hip-escape", "frame"],
    topPlayer: "Keep back and submit. Reattack if they escape hooks.",
    bottomPlayer: "Get shoulders to mat, fight the seatbelt, escape to guard or top.",
    coaching: "Escape direction is key - usually toward the underhook arm. Create space to turn.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== KNEE ON BELLY ====================
  {
    name: "Knee on Belly Transition",
    topic: "transition",
    position: "knee-on-belly",
    techniques: ["crossface"],
    topPlayer: "Transition from side control to knee on belly to mount. Flow between positions.",
    bottomPlayer: "Create frames and recover guard. Don't let opponent settle.",
    coaching: "KOB is a transition position. Use it to create reactions, not to hold.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== NORTH-SOUTH ====================
  {
    name: "North-South Kimura",
    topic: "offensive",
    position: "north-south",
    techniques: ["kimura"],
    topPlayer: "Attack the kimura from north-south. Control the arm and rotate for the finish.",
    bottomPlayer: "Defend the kimura while working to escape to guard.",
    coaching: "The north-south kimura is all about hip rotation. Walk your hips around for the tap.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== TURTLE ====================
  {
    name: "Turtle Attack",
    topic: "offensive",
    position: "turtle",
    techniques: ["seatbelt", "rnc"],
    topPlayer: "Take the back or break turtle down. Seatbelt grip is priority.",
    bottomPlayer: "Stay in turtle and look to escape or reguard. Don't give up back.",
    coaching: "Clock choke, crucifix, and back take are all options. Create a dilemma.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Turtle Defense & Escape",
    topic: "defensive",
    position: "turtle",
    techniques: ["granby", "hip-escape"],
    topPlayer: "Take back or attack with submissions. Don't let them escape.",
    bottomPlayer: "Escape turtle to guard using sit-out, granby, or Peterson roll.",
    coaching: "Turtle should be temporary. Always be working toward a better position.",
    difficulty: "beginner",
    gameType: "main"
  },

  // ==================== FRONT HEADLOCK ====================
  {
    name: "Front Headlock Guillotine Series",
    topic: "offensive",
    position: "front-headlock",
    techniques: ["guillotine", "darce", "anaconda"],
    topPlayer: "Attack with guillotine, darce, or anaconda. Chain attacks together.",
    bottomPlayer: "Defend by posting head, fighting hands, and working to clear head.",
    coaching: "The front headlock series is about feeling which attack is available. Be water.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Front Headlock Escape",
    topic: "defensive",
    position: "front-headlock",
    techniques: ["underhook", "frame"],
    topPlayer: "Maintain front headlock and attack. Sprawl to prevent head clearing.",
    bottomPlayer: "Clear head and attack legs, or come to feet. Get underhook when possible.",
    coaching: "Head position is everything. Fight to get head free while protecting neck.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== STANDING ====================
  {
    name: "Takedown Battle",
    topic: "offensive",
    position: "standing",
    techniques: ["single-leg", "double-leg", "arm-drag"],
    topPlayer: "N/A - This is standing exchange",
    bottomPlayer: "N/A - This is standing exchange",
    coaching: "Free wrestling with submissions allowed on the ground. Reset standing after each exchange.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Clinch Entry to Takedown",
    topic: "transition",
    position: "clinch",
    techniques: ["underhook", "double-leg", "snap-down"],
    topPlayer: "From clinch, work to off-balance and take down. Control ties.",
    bottomPlayer: "From clinch, work to off-balance and take down. Control ties.",
    coaching: "The clinch is about feeling balance and timing. Strike when opponent is moving.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Takedown Defense to Guard Pull",
    topic: "defensive",
    position: "standing",
    techniques: ["frame"],
    topPlayer: "Shoot takedowns. Score points by getting opponent down.",
    bottomPlayer: "Defend takedowns and pull guard. Don't get taken down to bad position.",
    coaching: "In competition, sometimes pulling guard is the right choice. Make it intentional.",
    difficulty: "beginner",
    gameType: "main"
  },

  // ==================== LEG LOCK POSITIONS ====================
  {
    name: "Ashi Garami Attack",
    topic: "offensive",
    position: "ashi-garami",
    techniques: ["heel-hook", "ankle-lock"],
    topPlayer: "N/A - Both in leg entanglement",
    bottomPlayer: "N/A - Both in leg entanglement",
    coaching: "From standard ashi, attack straight ankle or transition to saddle for heel hook. Control the knee line.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "Saddle Heel Hook Game",
    topic: "offensive",
    position: "saddle",
    techniques: ["heel-hook", "knee-bar"],
    topPlayer: "N/A - Both in leg entanglement",
    bottomPlayer: "N/A - Both in leg entanglement",
    coaching: "Inside heel hook from saddle. Control triangle and bite, then rotate for finish.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "50/50 Sweep and Submit",
    topic: "transition",
    position: "50-50",
    techniques: ["heel-hook", "ankle-lock"],
    topPlayer: "N/A - 50/50 position",
    bottomPlayer: "N/A - 50/50 position",
    coaching: "50/50 is a chess match. Attack legs or sweep to top position. Winner is who controls position.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "Leg Lock Defense",
    topic: "defensive",
    position: "ashi-garami",
    techniques: ["leg-pummeling"],
    topPlayer: "Attack leg locks aggressively",
    bottomPlayer: "Defend and escape leg entanglements",
    coaching: "Clear knee line, fight hands, get back on top. Don't just roll - be technical.",
    difficulty: "advanced",
    gameType: "main"
  },

  // ==================== TRANSITION GAMES ====================
  {
    name: "Positional Sparring Flow",
    topic: "transition",
    position: "other",
    techniques: [],
    topPlayer: "Start in side control. Win by submitting or maintaining for 2 minutes.",
    bottomPlayer: "Start under side control. Win by escaping, sweeping, or submitting.",
    coaching: "This develops flowing between positions. Reset if submission occurs or time runs out.",
    difficulty: "beginner",
    gameType: "main"
  },
  {
    name: "Guard Pull to Sweep",
    topic: "transition",
    position: "standing",
    techniques: ["scissor-sweep", "hip-bump"],
    topPlayer: "Stay on top when guard is pulled. Pass immediately.",
    bottomPlayer: "Pull guard and immediately sweep. No settling in guard.",
    coaching: "The guard pull should be an attack, not a stalling position. Sweep within 10 seconds.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Pass to Mount Progression",
    topic: "transition",
    position: "open-guard",
    techniques: ["knee-cut", "crossface"],
    topPlayer: "Pass guard and establish mount. Complete the full progression.",
    bottomPlayer: "Defend the pass. If passed, immediately work to recover.",
    coaching: "Don't stop at side control. The goal is mount or back. Keep progressing.",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== COMPETITION GAMES ====================
  {
    name: "ADCC Rules Sparring",
    topic: "competition",
    position: "standing",
    techniques: [],
    topPlayer: "First 5 min: no points. After: points apply. Win by sub or points.",
    bottomPlayer: "First 5 min: no points. After: points apply. Win by sub or points.",
    coaching: "Simulate competition environment. Use ADCC scoring after 5 minute mark.",
    difficulty: "advanced",
    gameType: "main"
  },
  {
    name: "Submission Only Rounds",
    topic: "competition",
    position: "other",
    techniques: [],
    topPlayer: "Win by submission only. No points, no advantages.",
    bottomPlayer: "Win by submission only. No points, no advantages.",
    coaching: "This forces constant offense. Stalling = losing. Always attack.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Points Match Simulation",
    topic: "competition",
    position: "standing",
    techniques: [],
    topPlayer: "Use IBJJF points. Takedowns = 2, Sweep = 2, Pass = 3, Mount/Back = 4",
    bottomPlayer: "Use IBJJF points. Takedowns = 2, Sweep = 2, Pass = 3, Mount/Back = 4",
    coaching: "Focus on accumulating points while defending. Time pressure at end.",
    difficulty: "intermediate",
    gameType: "main"
  },
  {
    name: "Overtime Escape Drill",
    topic: "competition",
    position: "back-control",
    techniques: ["seatbelt", "hip-escape"],
    topPlayer: "Maintain back control or submit in 60 seconds.",
    bottomPlayer: "Escape back control in 60 seconds.",
    coaching: "Simulates EBI overtime rules. Time pressure is key. Go hard!",
    difficulty: "intermediate",
    gameType: "main"
  },

  // ==================== WARMUP GAMES ====================
  {
    name: "Pummeling Flow",
    topic: "control",
    position: "clinch",
    techniques: ["underhook", "overhook"],
    topPlayer: "N/A - Both standing",
    bottomPlayer: "N/A - Both standing",
    coaching: "Light flow pummeling. Work for underhooks without takedowns. Feel the rhythm.",
    difficulty: "beginner",
    gameType: "warmup"
  },
  {
    name: "Leg Pummeling Warmup",
    topic: "transition",
    position: "other",
    techniques: ["leg-pummeling"],
    topPlayer: "N/A - Both seated",
    bottomPlayer: "N/A - Both seated",
    coaching: "Seated leg pummeling. Flow between leg positions without submissions.",
    difficulty: "beginner",
    gameType: "warmup"
  },
  {
    name: "Guard Retention Warmup",
    topic: "defensive",
    position: "open-guard",
    techniques: ["hip-escape", "frame"],
    topPlayer: "Light passing pressure. Don't smash.",
    bottomPlayer: "Retain guard using all guards. Flow between them.",
    coaching: "Light intensity. Focus on movement patterns and hip mobility.",
    difficulty: "beginner",
    gameType: "warmup"
  }
];

module.exports = defaultGames;
