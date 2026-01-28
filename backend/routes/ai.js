const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// System prompt for game generation
const SYSTEM_PROMPT = `You are an expert BJJ/NoGi grappling coach specializing in constraint-led training and ecological dynamics approach to skill development. You design training games that:

1. Create specific constraints that guide skill development without prescribing exact techniques
2. Encourage problem-solving and adaptability
3. Build perception-action coupling through repetition
4. Progress systematically from simple to complex

When generating a training game, you MUST return a valid JSON object with this exact structure:
{
  "name": "Game name (concise, descriptive)",
  "topic": "offensive|defensive|control|transition",
  "topPlayer": "Instructions for the top/attacking player including win condition and focus areas",
  "bottomPlayer": "Instructions for the bottom/defending player including win condition and focus areas",
  "coaching": "Key coaching points and cues for the instructor",
  "skills": ["skill1", "skill2", "skill3"],
  "gameType": "warmup|main|cooldown",
  "difficulty": "beginner|intermediate|advanced",
  "aiMetadata": {
    "startPosition": "Detailed starting position description",
    "constraints": ["Constraint 1", "Constraint 2", "Constraint 3"],
    "winConditions": {
      "top": "Win condition for top player",
      "bottom": "Win condition for bottom player"
    },
    "progressions": ["Level 1 description", "Level 2 description", "Level 3 description"],
    "pedagogicalNote": "Explanation of why this game develops the target skills"
  }
}

Topic guidelines:
- offensive: Submissions, attacks, finishing sequences
- defensive: Escapes, survival, recovery
- control: Passing, pinning, pressure, maintaining position
- transition: Scrambles, takedowns, sweeps, reversals

Always ensure:
- Clear, measurable win conditions for both players
- Constraints that create the desired learning environment without being overly restrictive
- Progressions that gradually increase complexity
- Coaching notes that help instructors guide without over-coaching

Return ONLY the JSON object, no additional text or explanation.`;

// @route   POST /api/ai/generate
// @desc    Generate a training game using Claude AI
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback to template-based generation if no API key
      console.log('No ANTHROPIC_API_KEY found, using template generation');
      const game = generateTemplateGame(prompt);
      return res.json({ game, source: 'template' });
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Create a constraint-led training game for the following focus area or problem:\n\n${prompt}\n\nReturn only the JSON object.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', response.status, errorData);

      // Fallback to template on API error
      const game = generateTemplateGame(prompt);
      return res.json({ game, source: 'template', apiError: true });
    }

    const data = await response.json();

    // Extract the text content from Claude's response
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    if (!textContent) {
      throw new Error('No text content in response');
    }

    // Parse the JSON from the response
    let game;
    try {
      // Try to extract JSON from the response (in case there's any extra text)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        game = JSON.parse(jsonMatch[0]);
      } else {
        game = JSON.parse(textContent);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent);
      // Fallback to template on parse error
      const fallbackGame = generateTemplateGame(prompt);
      return res.json({ game: fallbackGame, source: 'template', parseError: true });
    }

    // Validate required fields
    if (!game.name || !game.topic || !game.topPlayer || !game.bottomPlayer) {
      const fallbackGame = generateTemplateGame(prompt);
      return res.json({ game: fallbackGame, source: 'template', validationError: true });
    }

    // Add AI generated flag
    game.aiGenerated = true;

    res.json({ game, source: 'claude' });
  } catch (error) {
    console.error('AI generation error:', error);

    // Always provide a fallback
    try {
      const game = generateTemplateGame(req.body.prompt || 'general training');
      return res.json({ game, source: 'template', error: error.message });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Failed to generate game', error: error.message });
    }
  }
});

// Comprehensive game library for template-based generation
const GAME_LIBRARY = {
  // OFFENSIVE GAMES - Submissions and attacks
  offensive: [
    {
      name: 'RNC Hunting from Back',
      startPosition: 'Back control with seatbelt grip, both hooks in',
      topPlayer: 'Hunt for the rear naked choke. Use hand fighting to clear the chin defense. Win by submitting or maintaining back control for 2 minutes.',
      bottomPlayer: 'Defend the choke using chin tuck and hand fighting. Win by escaping to turtle or guard 3 times.',
      coaching: 'Focus on chest-to-back connection. Top player: "squeeze and shift" to create openings. Bottom: protect neck, fight hands systematically.',
      constraints: ['Attacker cannot release seatbelt', 'Defender escapes reset to start', 'No leg attacks allowed'],
      progressions: ['Basic: Both hooks, moderate defense', 'Add body triangle option', 'Start from one hook with hand fight'],
      skills: ['back control', 'RNC', 'hand fighting', 'back escapes'],
      keywords: ['back', 'rnc', 'choke', 'rear naked', 'strangle', 'body triangle', 'seatbelt', 'back control', 'back take', 'hooks', 'short choke', 'arm trap']
    },
    {
      name: 'Guillotine Game',
      startPosition: 'Standing clinch with head position battle',
      topPlayer: 'Secure front headlock and work to guillotine finish. Win by submission or achieving 3 clean front headlock entries.',
      bottomPlayer: 'Defend the guillotine and complete takedowns. Win by 3 successful takedowns without getting submitted.',
      coaching: 'Attackers: chin strap grip, arm in vs arm out options. Defenders: posture up, circle away from choking arm.',
      constraints: ['Reset after each submission attempt or takedown', '30 second time limit per exchange', 'No pulling guard'],
      progressions: ['Standing only', 'Allow guard pull after headlock', 'Full transition to ground'],
      skills: ['guillotine', 'front headlock', 'takedown defense', 'head position'],
      keywords: ['guillotine', 'front headlock', 'choke', 'standing', 'arm in', 'high elbow', 'marcelotine', 'snap down', 'chin strap', 'power guillotine']
    },
    {
      name: 'Armbar Chain Drill',
      startPosition: 'Closed guard with overhook/wrist control',
      topPlayer: 'Defend armbar attempts and work to pass guard. Win by passing to side control.',
      bottomPlayer: 'Attack with armbar, transition to triangle if defended, then omoplata. Win by submission or 5 clean armbar attempts.',
      coaching: 'Guard player: hip angle is everything, cut the angle before attacking. Top: keep elbows tight, posture when possible.',
      constraints: ['Guard player attacks only (no sweeps)', 'Reset if guard is passed', 'Top player defends only'],
      progressions: ['Armbar only', 'Add triangle option', 'Full chain: armbar-triangle-omoplata'],
      skills: ['armbar', 'triangle', 'omoplata', 'submission chains'],
      keywords: ['armbar', 'arm bar', 'arm attack', 'triangle', 'omoplata', 'chain']
    },
    {
      name: 'Leg Lock Entry Game',
      startPosition: 'Open guard with shin-to-shin contact',
      topPlayer: 'Pass the guard without getting caught in leg entanglements. Win by passing to side control.',
      bottomPlayer: 'Enter ashi garami positions (outside ashi, 50/50, inside sankaku). Win by achieving 3 clean entries with control.',
      coaching: 'Guard player: off-balance first, then enter. Top: keep knees together, avoid extended legs.',
      constraints: ['No heel hooks (control entries only)', 'Reset after each entry or pass', 'Standing allowed'],
      progressions: ['Single entry type', 'Multiple entry options', 'Add finishing (toe holds only for safety)'],
      skills: ['leg locks', 'ashi garami', 'leg entanglement', 'guard passing'],
      keywords: ['leg lock', 'heel hook', 'ashi', '50/50', 'leg entanglement', 'sankaku', 'honey hole', 'saddle', 'inside sankaku', 'outside ashi', 'calf slicer', 'knee bar', 'toe hold']
    },
    {
      name: 'Kimura Trap System',
      startPosition: 'Half guard bottom with kimura grip secured',
      topPlayer: 'Free your arm from the kimura grip and work to pass. Win by freeing arm and passing or maintaining top for 90 seconds.',
      bottomPlayer: 'Use kimura grip to sweep, take back, or submit. Win by sweep, back take, or submission.',
      coaching: 'Bottom: the grip is control, use it to off-balance before attacking. Top: elbow tight, posture to reduce leverage.',
      constraints: ['Bottom must maintain kimura grip', 'Top cannot disengage to standing', 'Reset if grip is lost'],
      progressions: ['Sweep focus only', 'Add back take option', 'Full system with submissions'],
      skills: ['kimura', 'half guard', 'sweeps', 'back takes'],
      keywords: ['kimura', 'half guard', 'sweep', 'americana', 'kimura trap', 'tarikoplata', 'double wrist lock']
    },
    {
      name: 'Modern Back Attack System',
      startPosition: 'Back control with body triangle',
      topPlayer: 'Systematically attack using arm trap, short choke, and RNC sequences. Win by submission.',
      bottomPlayer: 'Defend intelligently and work systematic escapes. Win by escaping 3 times.',
      coaching: 'Attacker: trap the arm before choking, use the body triangle to control hip escape. Defender: protect neck, clear body triangle first.',
      constraints: ['Attacker uses body triangle', 'Focus on systematic attacks', 'Reset after escape or submission'],
      progressions: ['Basic body triangle attacks', 'Add arm trap system', 'Full Danaher back attack sequence'],
      skills: ['back attacks', 'body triangle', 'short choke', 'arm trap', 'back escapes'],
      keywords: ['back', 'body triangle', 'short choke', 'arm trap', 'straight jacket', 'mata leao', 'rnc', 'danaher', 'back attack system']
    },
    {
      name: 'Darce/Anaconda Flow',
      startPosition: 'Front headlock position after sprawl',
      topPlayer: 'Work darce, anaconda, and peruvian necktie entries. Win by submission or 5 clean entries.',
      bottomPlayer: 'Defend front headlock attacks, work to reguard or single leg. Win by escaping 3 times.',
      coaching: 'Attacker: head on hip side, lock before squeezing. Defender: posture up, arm inside.',
      constraints: ['Start from front headlock', 'Reset after submission or escape', 'No guillotine (darce/anaconda only)'],
      progressions: ['Darce only', 'Add anaconda', 'Full front headlock series'],
      skills: ['darce', 'anaconda', 'front headlock', 'peruvian necktie'],
      keywords: ['darce', 'anaconda', 'brabo', 'peruvian necktie', 'front headlock', 'd\'arce', 'arm triangle']
    }
  ],

  // DEFENSIVE GAMES - Escapes and survival
  defensive: [
    {
      name: 'Side Control Escape Drill',
      startPosition: 'Bottom of side control, opponent with crossface and underhook',
      topPlayer: 'Maintain side control using pressure and transitions. Win by holding position for 90 seconds or submitting.',
      bottomPlayer: 'Escape to guard, turtle, or standing. Win by escaping 3 times.',
      coaching: 'Bottom: frames before movement, timing with opponent transitions. Top: heavy hips, control the near arm.',
      constraints: ['No submissions for first 30 seconds', 'Reset after each escape', 'Top cannot mount'],
      progressions: ['Moderate pressure', 'Heavy pressure with transitions', 'Add mount threat'],
      skills: ['escapes', 'framing', 'hip movement', 'side control'],
      keywords: ['escape', 'side control', 'frames', 'shrimp', 'hip escape']
    },
    {
      name: 'Mount Survival and Escape',
      startPosition: 'Bottom of mount, opponent in low mount with grapevines',
      topPlayer: 'Maintain mount and hunt for submissions. Win by submitting or holding mount for 2 minutes.',
      bottomPlayer: 'Escape mount using trap and roll, elbow-knee, or other methods. Win by escaping 3 times.',
      coaching: 'Bottom: elbows tight, bridge to create space, time your escapes. Top: heavy hips, hands on mat for base.',
      constraints: ['Bottom player defensive only', 'Reset after each escape', 'Top must stay in mount (no S-mount)'],
      progressions: ['Low mount only', 'Add high mount', 'Include submission threats'],
      skills: ['mount escapes', 'bridging', 'trap and roll', 'mount retention'],
      keywords: ['mount', 'escape', 'bridge', 'trap and roll', 'upa']
    },
    {
      name: 'Guard Retention Battle',
      startPosition: 'Open guard vs standing passer',
      topPlayer: 'Pass the guard using any method. Win by achieving side control.',
      bottomPlayer: 'Retain guard using frames, hip movement, and re-guarding. Win by retaining guard for 2 minutes or sweeping.',
      coaching: 'Bottom: always face opponent, use feet and hands as frames. Top: control the legs, pressure forward.',
      constraints: ['Bottom cannot stand up', 'Top must attempt to pass (no stalling)', 'Reset if guard is fully passed'],
      progressions: ['Slow passing only', 'Normal speed', 'Explosive passing allowed'],
      skills: ['guard retention', 'hip movement', 'framing', 'guard passing'],
      keywords: ['guard retention', 'retain', 'reguard', 'hip movement']
    },
    {
      name: 'Back Defense Shell',
      startPosition: 'Opponent has back with seatbelt, you are in defensive shell (chin tucked, hands protecting neck)',
      topPlayer: 'Break through the defensive shell and submit. Win by RNC or arm attack.',
      bottomPlayer: 'Escape the back using hand fighting and hip movement. Win by escaping to guard or top position.',
      coaching: 'Bottom: fight the hands, not the choke. Clear one hook, turn toward remaining hook. Top: patience, trap an arm.',
      constraints: ['Bottom stays defensive first 30 sec', 'Top cannot switch to body triangle', 'Reset after escape'],
      progressions: ['Both hooks only', 'Add body triangle option', 'Start with one arm trapped'],
      skills: ['back defense', 'hand fighting', 'back escapes', 'back attacks'],
      keywords: ['back escape', 'back defense', 'shell', 'hand fighting', 'defend back']
    },
    {
      name: 'Turtle Recovery Game',
      startPosition: 'Turtle position with opponent controlling from side',
      topPlayer: 'Take the back, flatten, or submit from turtle. Win by back take or submission.',
      bottomPlayer: 'Recover to guard, sit out to top, or stand up. Win by 3 successful recoveries.',
      coaching: 'Bottom: protect neck, keep elbows tight, timing is key. Top: break down posture, heavy chest pressure.',
      constraints: ['Bottom must recover (no stalling in turtle)', 'Top cannot cross-face flatten', 'Reset after each recovery or back take'],
      progressions: ['Recovery only', 'Add sit-out counters', 'Include Granby rolls'],
      skills: ['turtle', 'guard recovery', 'sit out', 'back takes'],
      keywords: ['turtle', 'recovery', 'sit out', 'granby', 'guard pull']
    }
  ],

  // CONTROL GAMES - Passing and top position
  control: [
    {
      name: 'Pressure Passing Fundamentals',
      startPosition: 'Standing vs seated guard',
      topPlayer: 'Pass using knee cut, over-under, or body lock. Win by passing to side control and holding 3 seconds.',
      bottomPlayer: 'Retain guard, sweep, or stand up. Win by sweeping or standing 3 times.',
      coaching: 'Top: posture, grips, then pressure. Connect chest to opponent. Bottom: never let them settle, always be moving.',
      constraints: ['No jumping passes', 'Top must maintain contact', 'Reset after pass or sweep'],
      progressions: ['Single pass type', 'Chain 2 passes', 'Full passing game'],
      skills: ['guard passing', 'knee cut', 'pressure passing', 'guard retention'],
      keywords: ['pass', 'passing', 'knee cut', 'pressure', 'over under', 'smash pass', 'stack pass', 'torreando', 'bullfighter']
    },
    {
      name: 'Body Lock Passing',
      startPosition: 'Half guard with passer having body lock',
      topPlayer: 'Complete the pass using body lock pressure. Win by achieving side control.',
      bottomPlayer: 'Escape the body lock and recover full guard. Win by recovering guard or sweeping.',
      coaching: 'Top: squeeze tight, walk hips around, be patient. Bottom: create frames, fight for underhook.',
      constraints: ['Top must maintain body lock', 'Bottom cannot stand', 'Reset if body lock is broken'],
      progressions: ['Basic pass', 'Add mount transition', 'Include back take option'],
      skills: ['body lock', 'half guard passing', 'half guard defense', 'pressure'],
      keywords: ['body lock', 'half guard', 'pass', 'squeeze', 'gordon ryan', 'body lock pass', 'bear hug', 'body lock system']
    },
    {
      name: 'Pin Transitions Drill',
      startPosition: 'Side control with crossface',
      topPlayer: 'Transition between side control, north-south, mount, and knee-on-belly. Win by visiting all 4 positions.',
      bottomPlayer: 'Escape during transitions. Win by escaping to guard or standing.',
      coaching: 'Top: smooth transitions, never give space. Bottom: attack during the transition, not the settled position.',
      constraints: ['Top must attempt all positions', 'No submissions allowed', 'Reset after escape or completing circuit'],
      progressions: ['2 positions', '3 positions', 'All 4 with timing pressure'],
      skills: ['transitions', 'side control', 'mount', 'north south', 'knee on belly'],
      keywords: ['pin', 'transition', 'side control', 'mount', 'north south', 'knee on belly']
    },
    {
      name: 'Headquarters Passing Game',
      startPosition: 'Passer in headquarters position (one leg trapped between knees)',
      topPlayer: 'Pass from headquarters using knee cut, leg drag, or long step. Win by passing.',
      bottomPlayer: 'Recover guard or sweep from headquarters. Win by recovery or sweep.',
      coaching: 'Top: control the far leg, stay heavy on trapped leg. Bottom: free trapped leg, create angles.',
      constraints: ['Top must stay in headquarters start', 'Bottom cannot fully disengage', 'Reset after pass or recovery'],
      progressions: ['Knee cut only', 'Add leg drag', 'Full headquarters game'],
      skills: ['headquarters', 'knee cut', 'leg drag', 'guard recovery'],
      keywords: ['headquarters', 'knee cut', 'leg drag', 'long step', 'half guard pass']
    },
    {
      name: 'Leg Drag Control',
      startPosition: 'Passer has leg drag grip (controlling one leg across body)',
      topPlayer: 'Complete the leg drag pass and secure side control. Win by passing and holding 3 seconds.',
      bottomPlayer: 'Clear the leg drag and recover guard. Win by recovering guard 3 times.',
      coaching: 'Top: heavy on the hip, head low, work around. Bottom: pummel the leg free, face the opponent.',
      constraints: ['Top maintains leg drag control', 'Bottom focuses on recovery', 'Reset after pass or recovery'],
      progressions: ['Basic leg drag', 'Add backstep option', 'Include mount transition'],
      skills: ['leg drag', 'guard passing', 'guard recovery', 'hip movement'],
      keywords: ['leg drag', 'pass', 'torreando', 'guard pass']
    }
  ],

  // TRANSITION GAMES - Wrestling, sweeps, scrambles
  transition: [
    {
      name: 'Takedown Battle',
      startPosition: 'Standing, collar tie clinch',
      topPlayer: 'Score takedown using wrestling or judo techniques. Win by 3 takedowns.',
      bottomPlayer: 'Same goal - compete for takedowns. First to 3 wins.',
      coaching: 'Level change for shots, off-balance for throws. Sprawl immediately on defense.',
      constraints: ['No guard pulling', '30 second time limit per exchange', 'Reset after each takedown'],
      progressions: ['Singles and doubles only', 'Add trips', 'Full standup arsenal'],
      skills: ['takedowns', 'wrestling', 'sprawl', 'clinch'],
      keywords: ['takedown', 'wrestling', 'shot', 'double leg', 'single leg', 'standup', 'level change', 'penetration step', 'collar tie', 'underhook', 'russian tie', '2 on 1', 'arm drag', 'duck under', 'go behind', 'body lock takedown']
    },
    {
      name: 'Sweep or Pass',
      startPosition: 'Closed guard',
      topPlayer: 'Pass the guard. Win by passing to side control.',
      bottomPlayer: 'Sweep to top position. Win by achieving mount or side control.',
      coaching: 'Top: posture and patience. Bottom: break posture, attack immediately.',
      constraints: ['No submissions', 'Guard player must attempt sweeps', 'Reset if guard opened without pass'],
      progressions: ['Basic sweeps only', 'Add hip bump and scissor', 'Technical standup allowed'],
      skills: ['sweeps', 'guard passing', 'closed guard', 'posture'],
      keywords: ['sweep', 'closed guard', 'scissor', 'hip bump', 'flower']
    },
    {
      name: 'Scramble Rounds',
      startPosition: 'Both players on knees facing each other',
      topPlayer: 'Achieve dominant position (back, mount, or side control). Same goal for both.',
      bottomPlayer: 'Same objective - first to achieve and hold dominant position for 3 seconds.',
      coaching: 'Stay heavy, fight for underhooks, never stop moving. The one who keeps going wins scrambles.',
      constraints: ['Start on knees', 'No pulling guard', 'Must achieve positional control'],
      progressions: ['Knees only', 'One can stand', 'Both can stand'],
      skills: ['scrambles', 'wrestling', 'transitions', 'underhooks'],
      keywords: ['scramble', 'battle', 'transition', 'underhook', 'position']
    },
    {
      name: 'Get Up Game',
      startPosition: 'Bottom of side control',
      topPlayer: 'Maintain control and prevent standup. Win by holding for 90 seconds.',
      bottomPlayer: 'Get to your feet. Win by standing up 3 times.',
      coaching: 'Bottom: frames, hip movement, technical standup. Top: heavy pressure, control the hips.',
      constraints: ['Bottom goal is standing only', 'Guard recovery does not count', 'Top cannot submit'],
      progressions: ['Side control only', 'Add mount start option', 'Include back control'],
      skills: ['technical standup', 'wrestling up', 'top pressure', 'escapes'],
      keywords: ['stand up', 'get up', 'wrestling', 'technical standup', 'base']
    },
    {
      name: 'Butterfly Sweep Wars',
      startPosition: 'Butterfly guard vs kneeling opponent',
      topPlayer: 'Smash or pass the butterfly guard. Win by flattening or passing.',
      bottomPlayer: 'Sweep using butterfly hooks. Win by sweeping to top 3 times.',
      coaching: 'Bottom: underhook and head position, elevate and turn. Top: heavy hips, deny the underhook.',
      constraints: ['Bottom must use butterfly hooks', 'Top cannot stand fully', 'Reset after sweep or pass'],
      progressions: ['Basic hook sweep', 'Add arm drag', 'Include single leg X entries'],
      skills: ['butterfly guard', 'sweeps', 'guard passing', 'hooks'],
      keywords: ['butterfly', 'sweep', 'hook', 'arm drag', 'elevate', 'marcelo garcia', 'x guard', 'slx entry', 'single leg x']
    },
    {
      name: 'Front Headlock Flow',
      startPosition: 'Standing with snap down opportunity',
      topPlayer: 'Snap to front headlock, work guillotine, darce, or anaconda. Win by submission or 3 clean go-behinds.',
      bottomPlayer: 'Defend the front headlock, work to reguard or stand. Win by escaping 3 times.',
      coaching: 'Attacker: keep head on hip side, constant pressure forward. Defender: posture up, clear the head.',
      constraints: ['Start from standing', 'Reset after submission attempt or escape', 'No jumping guard'],
      progressions: ['Snap down only', 'Add go-behind', 'Full front headlock series'],
      skills: ['front headlock', 'guillotine', 'darce', 'anaconda', 'wrestling'],
      keywords: ['front headlock', 'snap', 'guillotine', 'darce', 'anaconda', 'choke', 'snap down', 'go behind', 'cradle', 'cement mixer', 'drag', 'arm drag']
    },
    {
      name: 'Single Leg X Entry Game',
      startPosition: 'Open guard with feet on hips',
      topPlayer: 'Pass without getting caught in leg entanglements. Win by passing to side control.',
      bottomPlayer: 'Enter single leg X (ashi garami) position. Win by 3 clean entries with heel exposure.',
      coaching: 'Guard player: control the knee line, elevate to off-balance. Top: keep knees together, posture.',
      constraints: ['No submissions (positional only)', 'Reset after entry or pass', 'Top can stand'],
      progressions: ['Basic entry only', 'Add outside ashi transition', 'Full leg lock flow'],
      skills: ['single leg x', 'ashi garami', 'leg entanglement', 'guard retention'],
      keywords: ['single leg x', 'slx', 'ashi', 'leg lock', 'heel hook', 'outside ashi', 'x-guard', 'irimi ashi']
    },
    {
      name: 'K-Guard Entry System',
      startPosition: 'Seated guard vs standing passer',
      topPlayer: 'Pass the K-guard without getting swept or caught in leg entanglements. Win by passing.',
      bottomPlayer: 'Enter K-guard position, off-balance and sweep or enter leg entanglements. Win by 3 sweeps or entries.',
      coaching: 'Guard player: control the far leg, use cross grip. Top: stay tight, deny the cross grip.',
      constraints: ['Guard player must use K-guard', 'Top cannot disengage to distance', 'Reset after sweep or pass'],
      progressions: ['K-guard entries only', 'Add leg lock entries', 'Full K-guard system'],
      skills: ['k-guard', 'sweeps', 'leg entanglements', 'guard passing'],
      keywords: ['k guard', 'k-guard', 'lachlan giles', 'matrix', 'leg entanglement', 'modern guard', 'reverse x']
    },
    {
      name: '50-50 Battle',
      startPosition: '50-50 position, both players with inside heel hook grip available',
      topPlayer: 'Win the 50-50 exchange through sweeps, back takes, or positional advancement. First to escape on top or submit.',
      bottomPlayer: 'Same objective - control the position, attack heel hooks (training safe) or escape on top.',
      coaching: 'Control the knee line, fight for inside position, use boot defense. The battle is won with hip position.',
      constraints: ['Heel hooks for positional training only', 'Focus on control and sweeps', 'Reset after escape or sweep'],
      progressions: ['Positional control only', 'Add sweeping', 'Full 50-50 with light submissions'],
      skills: ['50-50', 'leg locks', 'heel hook defense', 'sweeps'],
      keywords: ['50-50', 'fifty fifty', 'heel hook', 'inside heel hook', 'leg lock', 'saddle', 'honey hole']
    },
    {
      name: 'Saddle/Inside Sankaku Game',
      startPosition: 'Attacker in inside sankaku (saddle/honey hole) with heel exposed',
      topPlayer: 'Defend the heel hook using boot defense, clearing, and escape. Win by escaping 3 times.',
      bottomPlayer: 'Maintain saddle control and work heel hook finishes. Win by clean heel hook control (training) or maintaining 60 seconds.',
      coaching: 'Attacker: control the knee line, keep the triangle tight. Defender: boot defense, dont let them straighten the leg.',
      constraints: ['Focus on control and defense', 'Heel hook finish is positional control', 'Reset after escape'],
      progressions: ['Basic saddle control', 'Add heel hook attacks', 'Full saddle system'],
      skills: ['saddle', 'inside sankaku', 'honey hole', 'heel hook', 'leg lock defense'],
      keywords: ['saddle', 'honey hole', 'inside sankaku', '411', '4-11', 'heel hook', 'danaher', 'craig jones', 'leg lock']
    },
    {
      name: 'Wrestling Up vs Leg Locks',
      startPosition: 'Guard player seated, passer standing at close range',
      topPlayer: 'Avoid leg lock entries while working to pass. Use distance management and leg pummeling.',
      bottomPlayer: 'Enter leg entanglements from seated guard using shin-to-shin, K-guard, or SLX entries.',
      coaching: 'Top: knees together, pressure forward, deny grips. Bottom: off-balance first, then enter.',
      constraints: ['No guard pulling allowed', 'Top must engage at close range', 'Reset after entry or pass'],
      progressions: ['Single entry type', 'Multiple entry options', 'Add standing leg lock defense'],
      skills: ['leg lock defense', 'leg lock entries', 'guard passing', 'distance management'],
      keywords: ['leg lock', 'shin to shin', 'k guard', 'slx', 'imanari', 'rolling entry', 'leg pummeling']
    }
  ],

  // WARMUP GAMES - Flow and movement focused
  warmup: [
    {
      name: 'Position Flow Drill',
      startPosition: 'Any position, partners take turns',
      topPlayer: 'Flow through positions: side control, mount, back, north-south. Move at 50% with control.',
      bottomPlayer: 'Allow movement but maintain frames. Practice defensive positioning without resistance.',
      coaching: 'Focus on smooth transitions, proper weight distribution, and correct body positioning.',
      constraints: ['50% speed maximum', 'No submissions', 'Move through all major positions'],
      progressions: ['Attacker only moves', 'Add light frames', 'Both players active at 50%'],
      skills: ['transitions', 'movement', 'body awareness', 'positioning'],
      keywords: ['warmup', 'flow', 'drill', 'movement', 'transitions', 'warm up']
    },
    {
      name: 'Guard Retention Flow',
      startPosition: 'Open guard vs standing passer',
      topPlayer: 'Walk around the guard slowly, testing entries. No explosive passes.',
      bottomPlayer: 'Maintain guard using hip movement and frames. Focus on staying connected.',
      coaching: 'This is about movement quality, not winning. Both players work on their movement patterns.',
      constraints: ['30% speed', 'No passing or sweeping', 'Focus on connection and movement'],
      progressions: ['Passer walks only', 'Add light pressure', 'Increase to 50% speed'],
      skills: ['guard retention', 'hip movement', 'framing', 'body awareness'],
      keywords: ['warmup', 'guard retention', 'flow', 'hip movement', 'warm up']
    },
    {
      name: 'Grip Fighting Warm Up',
      startPosition: 'Standing, neutral position',
      topPlayer: 'Work for dominant grips: collar ties, wrist control, underhooks. Reset every 15 seconds.',
      bottomPlayer: 'Same objective. Fight for grip dominance while staying relaxed.',
      coaching: 'Focus on grip fighting principles: inside position, breaking grips efficiently, constant movement.',
      constraints: ['No takedowns', '15 second rounds', 'Stay standing'],
      progressions: ['Single grip focus', 'Two grip combinations', 'Add collar ties'],
      skills: ['grip fighting', 'pummeling', 'underhooks', 'hand fighting'],
      keywords: ['warmup', 'grip', 'pummel', 'hand fighting', 'warm up', 'standing']
    }
  ]
};

// Template-based generation as fallback
function generateTemplateGame(prompt) {
  const promptLower = prompt.toLowerCase();

  // Determine topic from prompt
  let topic = 'transition';
  let gameType = 'main';
  let difficulty = 'intermediate';

  // Check keywords to determine best topic
  const topicScores = { offensive: 0, defensive: 0, control: 0, transition: 0 };

  // Score each topic based on keyword matches
  for (const [topicName, games] of Object.entries(GAME_LIBRARY)) {
    if (topicName === 'warmup') continue; // Handle warmup separately
    for (const game of games) {
      for (const keyword of game.keywords) {
        if (promptLower.includes(keyword)) {
          topicScores[topicName] += 2;
        }
      }
      // Also check game name
      if (promptLower.includes(game.name.toLowerCase().split(' ')[0])) {
        topicScores[topicName] += 1;
      }
    }
  }

  // Check for warmup specific keywords
  const isWarmup = promptLower.includes('warmup') || promptLower.includes('warm up') ||
                   promptLower.includes('flow') || promptLower.includes('light') ||
                   promptLower.includes('easy') || promptLower.includes('beginner drill');

  // Find highest scoring topic
  let maxScore = 0;
  for (const [topicName, score] of Object.entries(topicScores)) {
    if (score > maxScore) {
      maxScore = score;
      topic = topicName;
    }
  }

  // Fallback keyword detection if no matches
  if (maxScore === 0) {
    if (promptLower.includes('submit') || promptLower.includes('finish') || promptLower.includes('attack') || promptLower.includes('choke') || promptLower.includes('armbar') || promptLower.includes('leg lock')) {
      topic = 'offensive';
    } else if (promptLower.includes('escape') || promptLower.includes('defend') || promptLower.includes('survival') || promptLower.includes('recover')) {
      topic = 'defensive';
    } else if (promptLower.includes('pass') || promptLower.includes('control') || promptLower.includes('pressure') || promptLower.includes('pin') || promptLower.includes('top')) {
      topic = 'control';
    }
  }

  // Find the best matching game from the library
  let bestGame = null;
  let bestMatchScore = 0;

  // If warmup requested, search warmup games first
  if (isWarmup && GAME_LIBRARY.warmup) {
    for (const game of GAME_LIBRARY.warmup) {
      let matchScore = 1; // Base score for warmup match
      for (const keyword of game.keywords) {
        if (promptLower.includes(keyword)) {
          matchScore += 2;
        }
      }
      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestGame = game;
        gameType = 'warmup';
      }
    }
  }

  // Search topic-specific games
  if (GAME_LIBRARY[topic]) {
    for (const game of GAME_LIBRARY[topic]) {
      let matchScore = 0;
      for (const keyword of game.keywords) {
        if (promptLower.includes(keyword)) {
          matchScore += 1;
        }
      }
      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestGame = game;
      }
    }
  }

  // If no good match, pick random from topic
  if (!bestGame || bestMatchScore === 0) {
    const games = GAME_LIBRARY[topic] || GAME_LIBRARY.transition;
    bestGame = games[Math.floor(Math.random() * games.length)];
  }

  // Determine game type
  if (promptLower.includes('warmup') || promptLower.includes('warm up') || promptLower.includes('flow') || promptLower.includes('light')) {
    gameType = 'warmup';
  } else if (promptLower.includes('cooldown') || promptLower.includes('cool down')) {
    gameType = 'cooldown';
  }

  // Determine difficulty
  if (promptLower.includes('beginner') || promptLower.includes('basic') || promptLower.includes('fundamental') || promptLower.includes('white belt')) {
    difficulty = 'beginner';
  } else if (promptLower.includes('advanced') || promptLower.includes('competition') || promptLower.includes('expert') || promptLower.includes('black belt')) {
    difficulty = 'advanced';
  }

  // Extract game name from prompt - look for patterns like "variation of: GameName" or "Create a X game"
  let gameName = bestGame.name;
  let customDescription = null;

  // Check if this is a suggestion-based prompt (has specific patterns)
  const variationMatch = prompt.match(/variation of[:\s]+["']?([^"'\n.]+)["']?/i);
  const createMatch = prompt.match(/create (?:a|an) ([^.]+) game/i);
  const colonMatch = prompt.match(/^([^:]+):/);

  if (variationMatch) {
    // This is a variation request - use the base game name with modification
    const baseName = variationMatch[1].trim();
    gameName = `${baseName} - Competition Variant`;
    customDescription = `Advanced variation of ${baseName} with added pressure and time constraints.`;
  } else if (createMatch) {
    gameName = createMatch[1].trim();
    if (!gameName.toLowerCase().includes('game')) {
      gameName += ' Game';
    }
  } else if (colonMatch && prompt.length > 20) {
    // Format like "Game Name: description"
    gameName = colonMatch[1].trim();
  } else if (prompt.length > 10 && prompt.length < 100) {
    // Use first meaningful part of prompt as name
    const firstSentence = prompt.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 5 && firstSentence.length < 60) {
      gameName = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
      if (!gameName.toLowerCase().includes('game') && !gameName.toLowerCase().includes('drill')) {
        gameName += ' Game';
      }
    }
  }

  // Generate custom coaching based on prompt keywords
  let customCoaching = bestGame.coaching;
  if (promptLower.includes('advanced') || promptLower.includes('competition')) {
    customCoaching = `Competition-level focus: ${bestGame.coaching} Add time pressure and chain requirements.`;
  }

  return {
    name: gameName,
    topic,
    topPlayer: bestGame.topPlayer,
    bottomPlayer: bestGame.bottomPlayer,
    coaching: customCoaching,
    skills: bestGame.skills,
    gameType,
    difficulty,
    aiGenerated: true,
    aiMetadata: {
      startPosition: bestGame.startPosition,
      constraints: bestGame.constraints,
      description: customDescription || `Training game focused on ${topic} skills.`,
      winConditions: {
        top: bestGame.topPlayer.split('.')[0],
        bottom: bestGame.bottomPlayer.split('.')[0]
      },
      progressions: bestGame.progressions,
      pedagogicalNote: `This game focuses on ${bestGame.skills.join(', ')}. ${bestGame.coaching}`
    }
  };
}

// @route   GET /api/ai/status
// @desc    Check if AI generation is available
// @access  Public
router.get('/status', async (req, res) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    available: true,
    provider: hasApiKey ? 'claude' : 'template',
    message: hasApiKey ? 'Claude AI is configured' : 'Using template-based generation (add ANTHROPIC_API_KEY for AI)',
    features: {
      gameGeneration: true,
      webSearch: hasApiKey,
      problemSolver: hasApiKey,
      topicSuggestion: hasApiKey
    }
  });
});

// @route   POST /api/ai/suggest-topic
// @desc    Suggest next training topic based on history
// @access  Private
router.post('/suggest-topic', protect, async (req, res) => {
  try {
    const { recentTopics, recentGames, preferences } = req.body;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Comprehensive fallback suggestions for NoGi grappling
    const allFallbackSuggestions = [
      // Defensive topics
      {
        name: 'Guard Retention & Recovery',
        category: 'defensive',
        description: 'Develop strong guard retention against aggressive passers using frames, hip movement, and re-guarding techniques',
        reasoning: 'Guard retention is the foundation of defensive grappling - without it, you spend all your time escaping bad positions',
        goals: ['Master the pummel and re-pummeling', 'Develop strong knee-elbow connection', 'Work on granby rolls and inversions for recovery']
      },
      {
        name: 'Escapes from Bottom',
        category: 'defensive',
        description: 'Focus on escaping side control, mount, and back control with efficient movements',
        reasoning: 'Solid escapes give you confidence to take risks in other areas knowing you can recover',
        goals: ['Hip escapes from side control', 'Trap and roll from mount', 'Hand fighting and shell position from back']
      },
      {
        name: 'Defensive Body Lock Defense',
        category: 'defensive',
        description: 'Learn to defend and escape body locks, bear hugs, and tight waist control',
        reasoning: 'Body locks are increasingly common in modern NoGi - defending them is essential',
        goals: ['Peel grips systematically', 'Create space with frames', 'Counter with leg attacks']
      },
      // Offensive topics
      {
        name: 'Submission Chains from Guard',
        category: 'offensive',
        description: 'Build connected attack sequences from closed guard, butterfly, and half guard',
        reasoning: 'Single attacks are easy to defend - chains create dilemmas for your opponent',
        goals: ['Triangle to armbar to omoplata chain', 'Guillotine to darce to anaconda', 'Kimura trap sequences']
      },
      {
        name: 'Back Attack System',
        category: 'offensive',
        description: 'Develop a complete back attack game including entries, control, and finishes',
        reasoning: 'The back is the highest percentage finishing position in grappling',
        goals: ['Rear naked choke mechanics', 'Arm trap systems', 'Staying on the back when they defend']
      },
      {
        name: 'Leg Lock Entries',
        category: 'offensive',
        description: 'Learn safe entries into ashi garami positions for heel hooks and kneebars',
        reasoning: 'Leg locks are essential for modern NoGi and create threats from many positions',
        goals: ['Outside ashi entries', 'Inside sankaku control', 'Backside 50/50 attacks']
      },
      // Control topics
      {
        name: 'Pressure Passing',
        category: 'control',
        description: 'Develop heavy pressure passing using body weight, head position, and systematic progressions',
        reasoning: 'Pressure passing is effective against flexible guard players and builds top control',
        goals: ['Headquarters position mastery', 'Knee cut to mount transitions', 'Shoulder pressure concepts']
      },
      {
        name: 'Pin Escapes Prevention',
        category: 'control',
        description: 'Learn to maintain top positions and shut down common escape attempts',
        reasoning: 'Holding position allows you to rest, accumulate damage, and set up submissions',
        goals: ['Cross-face and hip control', 'Transition between pins', 'Reading and countering escape attempts']
      },
      {
        name: 'Guard Passing Combinations',
        category: 'control',
        description: 'Chain multiple passes together to beat stubborn guard players',
        reasoning: 'Modern guards require multi-step passing strategies rather than single techniques',
        goals: ['Torreando to knee cut', 'Long step to leg drag', 'Body lock passing sequences']
      },
      // Transition topics
      {
        name: 'Wrestling for BJJ',
        category: 'transition',
        description: 'Develop takedowns, clinch work, and wrestling ties specifically for NoGi grappling',
        reasoning: 'Strong wrestling lets you choose where the fight happens and scores points',
        goals: ['Single and double leg shots', 'Snap downs and front headlock', 'Underhook battles']
      },
      {
        name: 'Scramble Situations',
        category: 'transition',
        description: 'Train common scramble positions and learn to come out on top',
        reasoning: 'Scrambles determine who wins many grappling exchanges - train them specifically',
        goals: ['Turtle attacks and defenses', 'Standing up from bottom', 'Re-shot and chase wrestling']
      },
      {
        name: 'Guard Pull to Sweep',
        category: 'transition',
        description: 'Connect guard pulls directly to sweep attempts for immediate offense',
        reasoning: 'Passive guard pulls give up 2 points - active pulls create immediate opportunities',
        goals: ['Collar drag to single leg', 'Snap down to front headlock', 'Ankle pick entries']
      },
      // Competition topics
      {
        name: 'Competition Game Planning',
        category: 'competition',
        description: 'Develop A-game sequences and backup plans for tournament performance',
        reasoning: 'Competition requires focused preparation on highest percentage techniques',
        goals: ['Define your A-game path', 'Train specific time scenarios', 'Develop backup positions']
      },
      // Fundamentals topics
      {
        name: 'Movement & Mobility',
        category: 'fundamentals',
        description: 'Build fundamental movement patterns like shrimping, bridging, and technical standup',
        reasoning: 'Better movement makes everything else easier and prevents injuries',
        goals: ['Solo drills routine', 'Partner flow drilling', 'Position-specific mobility']
      },
      {
        name: 'Grip Fighting Fundamentals',
        category: 'fundamentals',
        description: 'Master hand fighting, wrist control, and establishing dominant grips',
        reasoning: 'Grip fighting is often where matches are won or lost before techniques even begin',
        goals: ['2-on-1 control', 'Wrist riding', 'Breaking grips systematically']
      }
    ];

    // Select 3 suggestions that balance different categories
    const getBalancedSuggestions = () => {
      const categories = ['offensive', 'defensive', 'control', 'transition'];
      const selected = [];
      const shuffled = [...allFallbackSuggestions].sort(() => Math.random() - 0.5);

      // Try to get one from each major category
      for (const cat of categories) {
        if (selected.length >= 3) break;
        const fromCat = shuffled.find(s => s.category === cat && !selected.includes(s));
        if (fromCat) selected.push(fromCat);
      }

      // Fill remaining with any other suggestions
      while (selected.length < 3) {
        const remaining = shuffled.find(s => !selected.includes(s));
        if (remaining) selected.push(remaining);
        else break;
      }

      return selected;
    };

    // Smart fallback: avoid recently covered categories
    const getSmartSuggestions = () => {
      const recentCategories = (recentTopics || []).map(t => t.category).filter(Boolean);
      const recentNames = (recentTopics || []).map(t => t.name?.toLowerCase()).filter(Boolean);

      // Score each suggestion based on how different it is from recent training
      const scored = allFallbackSuggestions.map(suggestion => {
        let score = 10; // Base score

        // Penalize if same category was done recently
        if (recentCategories.includes(suggestion.category)) {
          score -= 3;
        }

        // Penalize if similar name
        if (recentNames.some(name =>
          name.includes(suggestion.name.toLowerCase().split(' ')[0]) ||
          suggestion.name.toLowerCase().includes(name.split(' ')[0])
        )) {
          score -= 5;
        }

        // Bonus for balancing: if recent was offensive, suggest defensive
        if (recentCategories.length > 0) {
          const lastCategory = recentCategories[0];
          if (lastCategory === 'offensive' && suggestion.category === 'defensive') score += 2;
          if (lastCategory === 'defensive' && suggestion.category === 'offensive') score += 2;
          if (lastCategory === 'control' && suggestion.category === 'transition') score += 2;
          if (lastCategory === 'transition' && suggestion.category === 'control') score += 2;
        }

        // Add small random factor for variety
        score += Math.random() * 2;

        return { ...suggestion, score };
      });

      // Sort by score and return top 3 from different categories
      scored.sort((a, b) => b.score - a.score);

      const selected = [];
      const usedCategories = new Set();

      for (const s of scored) {
        if (selected.length >= 3) break;

        // Prefer variety in categories
        if (selected.length < 2 && usedCategories.has(s.category)) continue;

        selected.push(s);
        usedCategories.add(s.category);
      }

      // Remove score from output
      return selected.map(({ score, ...rest }) => rest);
    };

    if (!apiKey) {
      // Return smart fallback suggestions
      return res.json({
        suggestions: getSmartSuggestions(),
        source: 'template'
      });
    }

    // Build context for Claude
    const topicHistory = recentTopics?.length > 0
      ? recentTopics.map(t => `- ${t.name} (${t.category}): ${new Date(t.startDate).toLocaleDateString()} to ${new Date(t.endDate).toLocaleDateString()}`).join('\n')
      : 'No recent topics recorded';

    const gameHistory = recentGames?.length > 0
      ? recentGames.slice(0, 15).map(g => `- ${g.name}${g.constraints ? ` (Focus: ${g.constraints.slice(0, 50)})` : ''}`).join('\n')
      : 'No recent games recorded';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are an expert NoGi BJJ/submission grappling coach specializing in training periodization and curriculum design. You help practitioners plan their training focus for 2-4 week blocks.

Your suggestions should be:
1. SPECIFIC to NoGi grappling (no gi grips like collar/sleeve)
2. ACTIONABLE with clear techniques and positions to work on
3. BALANCED - consider what they've done recently and suggest complementary areas
4. PROGRESSIVE - build on foundations toward advanced applications

Categories:
- offensive: Submissions, attacks, finishing sequences (RNC, guillotines, leg locks, arm attacks)
- defensive: Escapes, survival, guard retention, defending submissions
- control: Passing guard, maintaining pins, pressure, top position dominance
- transition: Takedowns, wrestling, scrambles, sweeps, getting up from bottom
- competition: Tournament prep, timing, strategy, specific rulesets
- fundamentals: Movement, grips, frames, basic positions, building blocks

Return EXACTLY this JSON format (no markdown, no extra text):
[
  {
    "name": "Specific Topic Name",
    "category": "offensive|defensive|control|transition|competition|fundamentals",
    "description": "2-3 sentences explaining the focus area and what will be trained",
    "reasoning": "1-2 sentences explaining why this is good to train now based on their history",
    "goals": ["Specific goal 1", "Specific goal 2", "Specific goal 3"]
  }
]

Return ONLY the JSON array with exactly 3 suggestions.`,
        messages: [
          {
            role: 'user',
            content: `Based on my training history, suggest 3 different training topics for my next 2-4 week training block.

My Recent Training Topics:
${topicHistory}

Games/Drills I've Been Practicing:
${gameHistory}

Please suggest 3 different training topics that would complement my recent training. Make sure they cover different areas (don't suggest 3 offensive topics, for example).`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return res.json({
        suggestions: getSmartSuggestions(),
        source: 'template'
      });
    }

    const data = await response.json();
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    if (!textContent) {
      return res.json({
        suggestions: getSmartSuggestions(),
        source: 'template'
      });
    }

    let suggestions;
    try {
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent);

      // Validate the suggestions have required fields
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Invalid suggestions format');
      }

      suggestions = suggestions.map(s => ({
        name: s.name || 'Training Focus',
        category: ['offensive', 'defensive', 'control', 'transition', 'competition', 'fundamentals'].includes(s.category) ? s.category : 'custom',
        description: s.description || 'Focus on this training area',
        reasoning: s.reasoning || 'This complements your recent training',
        goals: Array.isArray(s.goals) ? s.goals.slice(0, 4) : ['Train consistently', 'Focus on technique', 'Drill with partners']
      }));
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.json({
        suggestions: getSmartSuggestions(),
        source: 'template'
      });
    }

    res.json({
      suggestions,
      source: 'claude'
    });
  } catch (error) {
    console.error('Topic suggestion error:', error);
    // Always return suggestions, never fail completely
    const emergencyFallback = [
      {
        name: 'Guard Passing Development',
        category: 'control',
        description: 'Focus on systematic guard passing using pressure and movement',
        reasoning: 'Passing is fundamental to establishing top position',
        goals: ['Knee cut mastery', 'Torreando basics', 'Leg drag entries']
      },
      {
        name: 'Submission Defense',
        category: 'defensive',
        description: 'Train defending common submissions and escaping bad positions',
        reasoning: 'Strong defense creates confidence to attack',
        goals: ['Arm defense posture', 'Choke escape timing', 'Leg lock defense']
      },
      {
        name: 'Wrestling Basics',
        category: 'transition',
        description: 'Develop takedowns and clinch work for NoGi',
        reasoning: 'Standing skills open up your entire game',
        goals: ['Double leg technique', 'Underhook battles', 'Sprawl defense']
      }
    ];
    res.json({
      suggestions: emergencyFallback,
      source: 'template'
    });
  }
});

// System prompt for problem solving / web search
const SEARCH_SYSTEM_PROMPT = `You are an expert BJJ/NoGi grappling coach with extensive knowledge of techniques, positions, and training methodologies. You help practitioners solve training problems and find solutions.

When asked about BJJ/grappling problems or techniques:
1. Provide clear, actionable advice
2. Suggest specific drills or games that address the issue
3. Reference common positions and situations
4. Consider both gi and no-gi applications
5. Include safety considerations where appropriate

Format your response as a JSON object:
{
  "summary": "Brief overview of the solution (1-2 sentences)",
  "analysis": "Detailed analysis of the problem and why this solution works",
  "techniques": ["List of specific techniques or concepts to focus on"],
  "drills": [
    {
      "name": "Drill or game name",
      "description": "How to perform it",
      "focus": "What it develops"
    }
  ],
  "commonMistakes": ["List of common mistakes to avoid"],
  "progressions": ["Beginner approach", "Intermediate variation", "Advanced application"],
  "relatedTopics": ["Related areas to explore"]
}

Return ONLY the JSON object.`;

// Generate fallback search results based on common BJJ topics
function generateFallbackSearchResult(query) {
  const queryLower = query.toLowerCase();

  // Common problem areas and their solutions
  const knowledgeBase = {
    'guard pass': {
      summary: 'Guard passing requires combining pressure, timing, and systematic approaches',
      analysis: 'Focus on establishing grips, controlling the hips, and using your body weight. Common passes include knee cut, torreando, and leg drag.',
      techniques: ['Knee cut pass', 'Torreando', 'Leg drag', 'Body lock pass', 'Over-under pass'],
      drills: [
        { name: 'Passing Flow Drill', description: 'Chain 3 passes together without stopping', focus: 'Passing combinations' },
        { name: 'Hip Control Drill', description: 'Maintain hip control for 30 seconds against active guard', focus: 'Pressure and control' }
      ],
      commonMistakes: ['Reaching too far forward', 'Not controlling the hips', 'Passing too high'],
      progressions: ['Light resistance drilling', 'Positional sparring from guard', 'Full rounds starting in guard']
    },
    'escape': {
      summary: 'Escapes require proper timing, frames, and systematic movement',
      analysis: 'Create space with frames before attempting to move. Time your escapes with your opponent\'s transitions.',
      techniques: ['Hip escape (shrimp)', 'Bridge and roll', 'Elbow-knee escape', 'Granby roll'],
      drills: [
        { name: 'Escape Chains', description: 'Link multiple escape attempts together', focus: 'Persistence and combinations' },
        { name: 'Frame Drilling', description: 'Establish and maintain frames under pressure', focus: 'Creating space' }
      ],
      commonMistakes: ['Moving without frames', 'Flat on back', 'Giving up too early'],
      progressions: ['Solo drilling', 'Partner drilling with light pressure', 'Positional sparring']
    },
    'submission': {
      summary: 'Submissions require proper positioning, control, and finishing mechanics',
      analysis: 'Focus on control before submission. Chain attacks together to create dilemmas.',
      techniques: ['Rear naked choke', 'Guillotine', 'Armbar', 'Triangle', 'Kimura'],
      drills: [
        { name: 'Submission Chains', description: 'Practice linking submissions (armbar to triangle to omoplata)', focus: 'Attack flow' },
        { name: 'Finishing Mechanics', description: 'Drill the final squeeze/extension with perfect technique', focus: 'Finishing details' }
      ],
      commonMistakes: ['Chasing submissions without control', 'Poor grip placement', 'Not adjusting to defense'],
      progressions: ['Drilling from static position', 'Submission-only rounds', 'Full sparring']
    },
    'takedown': {
      summary: 'Takedowns combine setup, timing, and finishing mechanics',
      analysis: 'Use grip fighting and movement to create openings. Commit fully to your shots.',
      techniques: ['Double leg', 'Single leg', 'Snap down', 'Arm drag', 'Body lock takedown'],
      drills: [
        { name: 'Shot Drill', description: 'Practice level change and penetration step', focus: 'Takedown entry' },
        { name: 'Chain Wrestling', description: 'Link failed takedowns to new attacks', focus: 'Wrestling combinations' }
      ],
      commonMistakes: ['Head down during shot', 'Not changing levels', 'Stopping after failed attempt'],
      progressions: ['Shadow wrestling', 'Partner drilling', 'Takedown sparring']
    },
    'default': {
      summary: 'Focus on fundamentals and position-specific training',
      analysis: 'Break down the problem into specific positions and scenarios. Train with progressive resistance.',
      techniques: ['Position-specific techniques', 'Movement patterns', 'Grip fighting'],
      drills: [
        { name: 'Positional Sparring', description: 'Start from the specific position you want to improve', focus: 'Position-specific development' },
        { name: 'Flow Rolling', description: 'Light technical rolling focusing on movement and transitions', focus: 'General skill development' }
      ],
      commonMistakes: ['Training too hard to learn', 'Not enough repetition', 'Skipping fundamentals'],
      progressions: ['Drilling', 'Positional sparring', 'Full sparring']
    }
  };

  // Find best matching topic
  let bestMatch = 'default';
  for (const key of Object.keys(knowledgeBase)) {
    if (key !== 'default' && queryLower.includes(key)) {
      bestMatch = key;
      break;
    }
  }

  // Check for more specific matches
  if (queryLower.includes('guard') && queryLower.includes('pass')) bestMatch = 'guard pass';
  if (queryLower.includes('escape') || queryLower.includes('defend')) bestMatch = 'escape';
  if (queryLower.includes('submit') || queryLower.includes('finish') || queryLower.includes('choke') || queryLower.includes('armbar')) bestMatch = 'submission';
  if (queryLower.includes('takedown') || queryLower.includes('wrestling') || queryLower.includes('shot')) bestMatch = 'takedown';

  const template = knowledgeBase[bestMatch];

  return {
    summary: template.summary,
    analysis: template.analysis + `\n\nFor your specific question about "${query}", apply these principles to your training.`,
    techniques: template.techniques,
    drills: template.drills,
    commonMistakes: template.commonMistakes,
    progressions: template.progressions,
    relatedTopics: ['Positional awareness', 'Timing', 'Grip fighting', 'Movement patterns']
  };
}

// @route   POST /api/ai/search
// @desc    Search for BJJ solutions and advice using Claude
// @access  Private
router.post('/search', protect, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return fallback result instead of error
      const fallbackResult = generateFallbackSearchResult(query);
      return res.json({
        result: fallbackResult,
        source: 'template',
        query,
        message: 'Using template response. Add ANTHROPIC_API_KEY for AI-powered search.'
      });
    }

    // Call Claude API for search/problem solving
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SEARCH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Help me with this BJJ/grappling problem or question:\n\n${query}\n\nProvide detailed advice and suggest specific drills or training games. Return only the JSON object.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', response.status, errorData);
      // Return fallback instead of error
      const fallbackResult = generateFallbackSearchResult(query);
      return res.json({
        result: fallbackResult,
        source: 'template',
        query,
        apiError: true
      });
    }

    const data = await response.json();
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    if (!textContent) {
      const fallbackResult = generateFallbackSearchResult(query);
      return res.json({
        result: fallbackResult,
        source: 'template',
        query
      });
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(textContent);
      }

      // Ensure all expected fields exist
      result = {
        summary: result.summary || 'See analysis for details',
        analysis: result.analysis || textContent,
        techniques: result.techniques || [],
        drills: result.drills || [],
        commonMistakes: result.commonMistakes || [],
        progressions: result.progressions || [],
        relatedTopics: result.relatedTopics || []
      };
    } catch (parseError) {
      // If parsing fails, return raw text as summary
      result = {
        summary: textContent.substring(0, 200),
        analysis: textContent,
        techniques: [],
        drills: [],
        commonMistakes: [],
        progressions: [],
        relatedTopics: []
      };
    }

    res.json({
      result,
      source: 'claude',
      query
    });
  } catch (error) {
    console.error('AI search error:', error);
    // Return fallback instead of error
    const fallbackResult = generateFallbackSearchResult(req.body?.query || 'general training');
    res.json({
      result: fallbackResult,
      source: 'template',
      query: req.body?.query,
      error: error.message
    });
  }
});

// @route   POST /api/ai/suggest-game
// @desc    Convert a search result drill into a full game
// @access  Private
router.post('/suggest-game', protect, async (req, res) => {
  try {
    const { drill, context } = req.body;

    if (!drill) {
      return res.status(400).json({ message: 'Drill information is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Create a basic game from the drill
      const game = {
        name: drill.name || 'Training Drill',
        topic: 'transition',
        topPlayer: `Focus: ${drill.focus || 'General skill development'}\n\nWork on the techniques described, applying pressure appropriately.`,
        bottomPlayer: `Focus: ${drill.focus || 'General skill development'}\n\nWork on defense and counters as appropriate.`,
        coaching: drill.description || 'Guide students through the drill progressively.',
        skills: [drill.focus || 'general'],
        gameType: 'main',
        difficulty: 'intermediate',
        aiGenerated: true,
        aiMetadata: {
          startPosition: 'As described in the drill',
          constraints: ['Follow the drill guidelines'],
          winConditions: { top: 'Execute the technique', bottom: 'Defend successfully' },
          progressions: ['Basic', 'With resistance', 'Full speed'],
          pedagogicalNote: `Based on: ${drill.description}`
        }
      };
      return res.json({ game, source: 'template' });
    }

    // Use Claude to create a full game
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Convert this drill into a full constraint-led training game:\n\nDrill Name: ${drill.name}\nDescription: ${drill.description}\nFocus: ${drill.focus}\n${context ? `Additional context: ${context}` : ''}\n\nReturn only the JSON object.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    let game;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      game = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent);
    } catch {
      // Fallback
      game = {
        name: drill.name,
        topic: 'transition',
        topPlayer: drill.description,
        bottomPlayer: 'Work on appropriate responses',
        coaching: `Focus on: ${drill.focus}`,
        skills: [drill.focus],
        gameType: 'main',
        difficulty: 'intermediate',
        aiGenerated: true
      };
    }

    game.aiGenerated = true;
    res.json({ game, source: 'claude' });
  } catch (error) {
    console.error('Suggest game error:', error);
    res.status(500).json({ message: 'Failed to create game', error: error.message });
  }
});

// @route   POST /api/ai/check-duplicates
// @desc    Check for duplicate or similar games
// @access  Private
router.post('/check-duplicates', protect, async (req, res) => {
  try {
    const { name, topPlayer, bottomPlayer, skills } = req.body;
    const Game = require('../models/Game');

    // Get user's existing games
    const userGames = await Game.find({ user: req.user._id });

    const duplicates = [];
    const similar = [];

    // Normalize text for comparison
    const normalize = (text) => (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const normalizedName = normalize(name);
    const normalizedTop = normalize(topPlayer);
    const normalizedBottom = normalize(bottomPlayer);
    const normalizedSkills = (skills || []).map(s => normalize(s));

    for (const game of userGames) {
      const gameName = normalize(game.name);
      const gameTop = normalize(game.topPlayer);
      const gameBottom = normalize(game.bottomPlayer);
      const gameSkills = (game.skills || []).map(s => normalize(s));

      // Calculate similarity scores
      let nameScore = 0;
      let contentScore = 0;
      let skillScore = 0;

      // Name similarity (exact match or contains)
      if (gameName === normalizedName) {
        nameScore = 100;
      } else if (gameName.includes(normalizedName) || normalizedName.includes(gameName)) {
        nameScore = 80;
      } else {
        // Word overlap
        const gameWords = new Set(gameName.split(' ').filter(w => w.length > 2));
        const newWords = new Set(normalizedName.split(' ').filter(w => w.length > 2));
        const overlap = [...gameWords].filter(w => newWords.has(w)).length;
        if (gameWords.size > 0 && newWords.size > 0) {
          nameScore = Math.round((overlap / Math.max(gameWords.size, newWords.size)) * 60);
        }
      }

      // Content similarity (top/bottom player instructions)
      const gameContent = gameTop + ' ' + gameBottom;
      const newContent = normalizedTop + ' ' + normalizedBottom;
      if (gameContent.length > 20 && newContent.length > 20) {
        // Word overlap in content
        const gameContentWords = new Set(gameContent.split(' ').filter(w => w.length > 3));
        const newContentWords = new Set(newContent.split(' ').filter(w => w.length > 3));
        const contentOverlap = [...gameContentWords].filter(w => newContentWords.has(w)).length;
        if (gameContentWords.size > 0 && newContentWords.size > 0) {
          contentScore = Math.round((contentOverlap / Math.min(gameContentWords.size, newContentWords.size)) * 100);
        }
      }

      // Skill similarity
      if (gameSkills.length > 0 && normalizedSkills.length > 0) {
        const skillOverlap = gameSkills.filter(s => normalizedSkills.some(ns => ns.includes(s) || s.includes(ns))).length;
        skillScore = Math.round((skillOverlap / Math.max(gameSkills.length, normalizedSkills.length)) * 100);
      }

      // Overall similarity (weighted)
      const overallScore = Math.round(nameScore * 0.4 + contentScore * 0.4 + skillScore * 0.2);

      if (nameScore >= 90 || overallScore >= 85) {
        duplicates.push({
          game: {
            _id: game._id,
            name: game.name,
            topic: game.topic,
            skills: game.skills
          },
          similarity: overallScore,
          type: 'duplicate',
          reason: nameScore >= 90 ? 'Same or very similar name' : 'Very similar content'
        });
      } else if (overallScore >= 50 || nameScore >= 50 || contentScore >= 60) {
        similar.push({
          game: {
            _id: game._id,
            name: game.name,
            topic: game.topic,
            skills: game.skills
          },
          similarity: overallScore,
          type: 'similar',
          reason: contentScore >= 60 ? 'Similar instructions' :
                  skillScore >= 70 ? 'Same skill focus' :
                  'Related game'
        });
      }
    }

    // Sort by similarity
    duplicates.sort((a, b) => b.similarity - a.similarity);
    similar.sort((a, b) => b.similarity - a.similarity);

    res.json({
      duplicates: duplicates.slice(0, 3),
      similar: similar.slice(0, 5),
      hasDuplicates: duplicates.length > 0,
      hasSimilar: similar.length > 0
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ message: 'Failed to check for duplicates', error: error.message });
  }
});

// @route   POST /api/ai/generate-variations
// @desc    Generate beginner/intermediate/advanced variations of a game
// @access  Private
router.post('/generate-variations', protect, async (req, res) => {
  try {
    const { game, targetDifficulty, missingLevels } = req.body;

    if (!game || !game.name) {
      return res.status(400).json({ message: 'Game information is required' });
    }

    // Determine which levels to generate
    const levelsToGenerate = missingLevels && missingLevels.length > 0
      ? missingLevels
      : (targetDifficulty ? [targetDifficulty] : ['beginner', 'intermediate', 'advanced']);

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Template-based variation generation - Modern grappling & CLA principles
    const generateTemplateVariation = (baseGame, difficulty) => {
      const topic = baseGame.topic || 'control';
      const skills = baseGame.skills || [];
      const originalName = baseGame.name.replace(/^(Beginner: |Advanced: )/, '');

      // Analyze the game content to make specific variations
      const hasLegLocks = /leg|heel|ankle|knee|50.?50|ashi|saddle|inside\s?sankaku/i.test(JSON.stringify(baseGame));
      const hasGuard = /guard|closed|open|half|butterfly|dlr|rdlr|lasso|spider|x.?guard/i.test(JSON.stringify(baseGame));
      const hasPassing = /pass|smash|pressure|torreando|knee.?cut|slice|body.?lock|over.?under/i.test(JSON.stringify(baseGame));
      const hasBack = /back|rear|rnc|collar|turtle|seatbelt/i.test(JSON.stringify(baseGame));
      const hasSubs = /sub|choke|arm|triangle|kimura|guillotine|darce|anaconda|strangle/i.test(JSON.stringify(baseGame));

      const difficultyModifiers = {
        beginner: {
          namePrefix: 'Foundation: ',
          // CLA: Reduce task complexity, increase environmental stability
          constraints: [
            'Start from the exact position described - no movement before "go"',
            `Partner gives ${hasSubs ? '30%' : '40%'} resistance - enough to feel real but allows success`,
            'Reset immediately when position is lost - repetition builds pattern recognition',
            'No submissions until position is secured for 3 seconds',
            hasLegLocks ? 'Inside position only - no outside heel hooks' : null,
            hasGuard ? 'Grips must be established before attacking' : null,
            hasPassing ? 'Control head or hips before advancing' : null
          ].filter(Boolean),
          progressions: [
            'Rep 1-5: Walk through with verbal cues, partner creates the "puzzle"',
            'Rep 6-10: Add timing - partner moves but telegraphs',
            'Rep 11-15: Increase resistance, maintain same timing windows'
          ],
          topMod: `Focus on the FEELING of correct weight distribution and frames. ${hasPassing ? 'Keep chest-to-chest connection, hips low.' : ''} ${hasBack ? 'Maintain seatbelt, keep hooks shallow initially.' : ''} Your partner should feel controlled but not crushed.`,
          bottomMod: `Focus on recognizing the TIMING windows. ${hasGuard ? 'Feel when their weight shifts - that\'s your moment.' : ''} ${hasLegLocks ? 'Learn to identify inside vs outside position before attacking.' : ''} Ask partner to pause when you miss a window.`,
          coachingMod: `CLA Focus: Perception-action coupling. Athletes should recognize patterns before reacting. ${hasSubs ? 'Submission is the last step - control comes first.' : ''} Use external focus cues: "feel their weight shift" not "move your hips."`
        },
        intermediate: {
          namePrefix: '',
          constraints: baseGame.aiMetadata?.constraints || [
            'Start from described position - brief hand fight allowed',
            `Partner gives ${hasSubs ? '70%' : '60%'} resistance with realistic reactions`,
            'Position resets after sweep/pass/escape - track success rate',
            hasLegLocks ? 'All leg lock entries legal, controlled heel hooks' : null,
            hasGuard ? 'Reguarding allowed - punishment for failed pass' : null,
            hasPassing ? 'Must advance position, not just maintain' : null,
            hasBack ? 'Escape = reset, submission = point' : null
          ].filter(Boolean),
          progressions: baseGame.aiMetadata?.progressions || [
            'Phase 1: Focus on primary attack chain',
            'Phase 2: Add secondary options when primary is defended',
            'Phase 3: Full positional sparring from the position'
          ],
          topMod: '',
          bottomMod: '',
          coachingMod: ''
        },
        advanced: {
          namePrefix: 'Competition: ',
          // CLA: Increase task complexity, add performer constraints
          constraints: [
            'Start from a WORSE version of the position (partially escaped, grips broken)',
            'Partner at 90-100% - active hunting and counters',
            'Time limit: 30 seconds to achieve objective or lose',
            hasLegLocks ? 'Full leg lock game - heel hooks, calf slicers, toe holds' : null,
            hasGuard ? 'Passer can disengage - you must re-engage within 3 sec' : null,
            hasPassing ? 'Guard player can stand up - must pass before they disengage' : null,
            hasBack ? 'Must finish or transition - riding time limited to 10 sec' : null,
            hasSubs ? 'Submission chains required - single attack = reset' : null,
            'Fatigue simulation: Start after 10 burpees or during last round'
          ].filter(Boolean),
          progressions: [
            'Phase 1: Competition scenario - bad position recovery',
            'Phase 2: Chain attacks - A fails → B fails → C',
            'Phase 3: Shark tank - fresh opponent every 30 seconds'
          ],
          topMod: `Gordon Ryan mindset: Position before submission, but constant forward pressure. ${hasPassing ? 'Body lock passing - remove space systematically.' : ''} ${hasBack ? 'Short hooks, tight seatbelt, immediate hand fighting for collar.' : ''} ${hasSubs ? 'Attack in combinations - never single attacks.' : ''} Punish every mistake within 2 seconds.`,
          bottomMod: `Craig Jones mindset: Always have a threat, even from bottom. ${hasLegLocks ? 'Every defensive position should threaten a leg entry.' : ''} ${hasGuard ? 'Broken guard → immediate leg pummeling or stand up.' : ''} Make them pay for every advancement. Counter-attack windows are small - commit fully.`,
          coachingMod: `Competition preparation: This is about decision-making under fatigue and pressure. ${hasSubs ? 'Modern submission grappling rewards chains - drill A→B→C sequences.' : ''} ${hasLegLocks ? 'Leg lock defense is as important as offense - drill both sides.' : ''} External chaos (time pressure, fatigue) exposes technical gaps - note them.`
        }
      };

      const mod = difficultyModifiers[difficulty];

      return {
        name: `${mod.namePrefix}${originalName}`,
        topic: baseGame.topic,
        topPlayer: mod.topMod ? `${baseGame.topPlayer}\n\n**${difficulty.toUpperCase()} FOCUS:**\n${mod.topMod}` : baseGame.topPlayer,
        bottomPlayer: mod.bottomMod ? `${baseGame.bottomPlayer}\n\n**${difficulty.toUpperCase()} FOCUS:**\n${mod.bottomMod}` : baseGame.bottomPlayer,
        coaching: mod.coachingMod ? `${baseGame.coaching || ''}\n\n**${difficulty.toUpperCase()} COACHING:**\n${mod.coachingMod}` : baseGame.coaching,
        skills: [...skills, difficulty === 'advanced' ? 'competition prep' : difficulty === 'beginner' ? 'fundamentals' : null].filter(Boolean),
        gameType: baseGame.gameType || 'main',
        difficulty: difficulty,
        aiGenerated: true,
        aiMetadata: {
          startPosition: difficulty === 'advanced'
            ? `DEGRADED: ${baseGame.aiMetadata?.startPosition || 'Position partially compromised'}`
            : baseGame.aiMetadata?.startPosition || 'As described',
          constraints: mod.constraints,
          winConditions: baseGame.aiMetadata?.winConditions || {
            top: difficulty === 'advanced' ? 'Submit or advance within time limit' : 'Achieve positional objective',
            bottom: difficulty === 'advanced' ? 'Escape, reverse, or counter-submit' : 'Defend or improve position'
          },
          progressions: mod.progressions,
          pedagogicalNote: difficulty === 'beginner'
            ? `Foundation work for "${originalName}". CLA principle: Reduce task constraints to allow pattern recognition. Success rate should be 70-80%. If lower, reduce partner resistance.`
            : difficulty === 'advanced'
            ? `Competition prep for "${originalName}". Based on modern grappling meta - continuous pressure, chain attacks, and time pressure. This should feel like a hard competition round.`
            : `Standard training for "${originalName}". Balanced offense/defense with realistic resistance.`
        }
      };
    };

    if (!apiKey) {
      // Generate template-based variation for only the requested levels
      const allVariations = {};
      levelsToGenerate.forEach(level => {
        allVariations[level] = generateTemplateVariation(game, level);
      });

      return res.json({
        variation: allVariations[levelsToGenerate[0]],
        source: 'template',
        allVariations,
        generatedLevels: levelsToGenerate
      });
    }

    // Use Claude for smarter variation generation with modern grappling principles
    const levelsDescription = levelsToGenerate.map(l => l.toUpperCase()).join(', ');

    // Analyze game content for context-aware generation
    const gameContent = JSON.stringify(game);
    const hasLegLocks = /leg|heel|ankle|knee|50.?50|ashi|saddle|inside\s?sankaku/i.test(gameContent);
    const hasGuard = /guard|closed|open|half|butterfly|dlr|rdlr|lasso|spider|x.?guard/i.test(gameContent);
    const hasPassing = /pass|smash|pressure|torreando|knee.?cut|slice|body.?lock|over.?under/i.test(gameContent);
    const hasBack = /back|rear|rnc|collar|turtle|seatbelt/i.test(gameContent);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are an elite NoGi grappling coach who has trained with John Danaher, Gordon Ryan, and Craig Jones. You specialize in the Constraints-Led Approach (CLA) to motor learning and modern submission grappling methodology.

## CORE PRINCIPLES

**Constraints-Led Approach (CLA):**
- Task constraints: Rules, scoring, time limits that shape behavior
- Environmental constraints: Space, partners, equipment
- Performer constraints: Skill level, fatigue, body type
- Learning emerges from the interaction of these constraints
- Use external focus cues ("feel their weight shift") not internal ("move your hips")

**Modern Grappling Meta (Gordon Ryan, Craig Jones, Danaher):**
- Position before submission, but always threaten
- Systematic passing: Body lock, over-under, headquarters
- Leg lock integration at all positions
- Chain attacks: A→B→C, never single attempts
- Back attacks: Short hooks, seatbelt control, collar hand fighting
- Guard: Every position should have offensive and defensive options

## DIFFICULTY LEVELS

**BEGINNER (Foundation):**
- CLA: Reduce task constraints, increase environmental stability
- 30-50% resistance - enough to feel real, allows 70-80% success rate
- Single concept focus - isolate the key movement pattern
- Reset frequently - build pattern recognition through repetition
- External cues only: "feel when..." not "do this..."
- No time pressure - quality over quantity

**INTERMEDIATE (Development):**
- CLA: Standard task constraints, moderate environmental variability
- 60-70% resistance with realistic reactions
- Primary + secondary attack options
- Position tracking - awareness of success/failure rate
- Add combinations when primary is defended
- Moderate time awareness

**ADVANCED (Competition):**
- CLA: Increase task complexity, add performer constraints (fatigue)
- 90-100% resistance - partner actively hunting
- Start from DEGRADED positions (partially escaped, grips broken)
- 30-second time limits - decision making under pressure
- Chain attacks required - single attacks = reset
- Fatigue simulation - start tired or shark tank format
- ${hasLegLocks ? 'Full leg lock game including heel hooks' : ''}
- ${hasBack ? 'Finish or transition - limited riding time' : ''}

## OUTPUT FORMAT

Return ONLY a JSON object with the requested levels. Each variation should:
1. Keep the EXACT same core technique/position
2. Adjust constraints based on difficulty principles above
3. Include specific, actionable instructions (not generic advice)
4. Reference the original game's specific positions/techniques
5. Add difficulty-appropriate modifications to top/bottom player instructions

{
  "${levelsToGenerate[0]}": {
    "name": "string (Prefix: Foundation/Competition for beginner/advanced)",
    "topic": "offensive|defensive|control|transition",
    "topPlayer": "Specific instructions with difficulty modifications",
    "bottomPlayer": "Specific instructions with difficulty modifications",
    "coaching": "CLA-focused coaching with external cues",
    "skills": ["array", "of", "skills"],
    "gameType": "warmup|main|cooldown",
    "difficulty": "${levelsToGenerate[0]}",
    "aiMetadata": {
      "startPosition": "Exact position (degraded for advanced)",
      "constraints": ["Specific rule 1", "Specific rule 2"],
      "winConditions": {"top": "...", "bottom": "..."},
      "progressions": ["Phase 1", "Phase 2", "Phase 3"],
      "pedagogicalNote": "Why this variation works for this level"
    }
  }
}`,
        messages: [
          {
            role: 'user',
            content: `Create ${levelsDescription} variation(s) of this training game. Keep the EXACT same technique/position but adjust for the difficulty level using CLA principles and modern grappling methodology.

## ORIGINAL GAME

**Name:** ${game.name}
**Topic:** ${game.topic}
**Current Difficulty:** ${game.difficulty || 'intermediate'}

**Top Player Instructions:**
${game.topPlayer}

**Bottom Player Instructions:**
${game.bottomPlayer}

**Coaching Notes:**
${game.coaching || 'None provided'}

**Skills:** ${(game.skills || []).join(', ') || 'General'}

**Current Constraints:** ${game.aiMetadata?.constraints?.join(', ') || 'Standard rules'}

**Start Position:** ${game.aiMetadata?.startPosition || 'As described'}

---

Generate ONLY these levels: ${levelsDescription}

For each level:
- Keep the same core position/technique (${game.name})
- Adjust resistance levels, time pressure, and complexity
- Make instructions SPECIFIC to this game (reference the actual positions)
- Include CLA-based coaching cues
- ${hasLegLocks ? 'Include appropriate leg lock considerations' : ''}
- ${hasGuard ? 'Include guard-specific progressions' : ''}
- ${hasPassing ? 'Include passing-specific pressure concepts' : ''}
- ${hasBack ? 'Include back control specifics (hooks, seatbelt, finishes)' : ''}`
          }
        ]
      })
    });

    if (!response.ok) {
      // Fallback to template for requested levels
      const allVariations = {};
      levelsToGenerate.forEach(level => {
        allVariations[level] = generateTemplateVariation(game, level);
      });
      return res.json({
        variation: allVariations[levelsToGenerate[0]],
        source: 'template',
        allVariations,
        generatedLevels: levelsToGenerate,
        apiError: true
      });
    }

    const data = await response.json();
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    let variations;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      variations = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent);

      // Ensure only requested levels exist, fill with templates if needed
      levelsToGenerate.forEach(level => {
        if (!variations[level]) {
          variations[level] = generateTemplateVariation(game, level);
        }
        variations[level].aiGenerated = true;
        variations[level].difficulty = level;
      });

      // Remove any levels we didn't request
      Object.keys(variations).forEach(key => {
        if (!levelsToGenerate.includes(key)) {
          delete variations[key];
        }
      });
    } catch (parseError) {
      console.error('Failed to parse variations:', parseError);
      // Fallback to template for requested levels
      const allVariations = {};
      levelsToGenerate.forEach(level => {
        allVariations[level] = generateTemplateVariation(game, level);
      });
      return res.json({
        variation: allVariations[levelsToGenerate[0]],
        source: 'template',
        allVariations,
        generatedLevels: levelsToGenerate,
        parseError: true
      });
    }

    res.json({
      variation: variations[levelsToGenerate[0]],
      source: 'claude',
      allVariations: variations,
      generatedLevels: levelsToGenerate
    });
  } catch (error) {
    console.error('Generate variations error:', error);
    res.status(500).json({ message: 'Failed to generate variations', error: error.message });
  }
});

// @route   GET /api/ai/find-similar
// @desc    Find similar games in user's library
// @access  Private
router.get('/find-similar', protect, async (req, res) => {
  try {
    const Game = require('../models/Game');
    const userGames = await Game.find({ user: req.user._id });

    // Group games by similarity
    const similarGroups = [];
    const processed = new Set();

    const normalize = (text) => (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    for (let i = 0; i < userGames.length; i++) {
      if (processed.has(userGames[i]._id.toString())) continue;

      const game = userGames[i];
      const gameName = normalize(game.name);
      const gameSkills = (game.skills || []).map(s => normalize(s));
      const gameContent = normalize(game.topPlayer + ' ' + game.bottomPlayer);

      const group = {
        primary: {
          _id: game._id,
          name: game.name,
          topic: game.topic,
          skills: game.skills,
          difficulty: game.difficulty
        },
        similar: []
      };

      for (let j = i + 1; j < userGames.length; j++) {
        if (processed.has(userGames[j]._id.toString())) continue;

        const other = userGames[j];
        const otherName = normalize(other.name);
        const otherSkills = (other.skills || []).map(s => normalize(s));
        const otherContent = normalize(other.topPlayer + ' ' + other.bottomPlayer);

        // Calculate similarity
        let similarity = 0;

        // Name similarity
        if (gameName === otherName) {
          similarity += 50;
        } else {
          const gameWords = gameName.split(' ').filter(w => w.length > 2);
          const otherWords = otherName.split(' ').filter(w => w.length > 2);
          const nameOverlap = gameWords.filter(w => otherWords.includes(w)).length;
          similarity += (nameOverlap / Math.max(gameWords.length, otherWords.length, 1)) * 30;
        }

        // Skill similarity
        if (gameSkills.length > 0 && otherSkills.length > 0) {
          const skillOverlap = gameSkills.filter(s => otherSkills.some(os => os.includes(s) || s.includes(os))).length;
          similarity += (skillOverlap / Math.max(gameSkills.length, otherSkills.length)) * 30;
        }

        // Content similarity
        if (gameContent.length > 30 && otherContent.length > 30) {
          const gameContentWords = new Set(gameContent.split(' ').filter(w => w.length > 3));
          const otherContentWords = new Set(otherContent.split(' ').filter(w => w.length > 3));
          const contentOverlap = [...gameContentWords].filter(w => otherContentWords.has(w)).length;
          similarity += (contentOverlap / Math.min(gameContentWords.size, otherContentWords.size, 1)) * 40;
        }

        if (similarity >= 50) {
          group.similar.push({
            _id: other._id,
            name: other.name,
            topic: other.topic,
            skills: other.skills,
            difficulty: other.difficulty,
            similarity: Math.round(similarity)
          });
          processed.add(other._id.toString());
        }
      }

      if (group.similar.length > 0) {
        processed.add(game._id.toString());
        similarGroups.push(group);
      }
    }

    // Sort groups by number of similar games
    similarGroups.sort((a, b) => b.similar.length - a.similar.length);

    res.json({
      groups: similarGroups,
      totalGroups: similarGroups.length,
      totalGames: userGames.length
    });
  } catch (error) {
    console.error('Find similar error:', error);
    res.status(500).json({ message: 'Failed to find similar games', error: error.message });
  }
});

// @route   POST /api/ai/smart-suggestions
// @desc    Generate smart, library-aware game suggestions using AI
// @access  Private
router.post('/smart-suggestions', protect, async (req, res) => {
  try {
    const { excludeIds = [], suggestionType = 'auto' } = req.body;
    const Game = require('../models/Game');

    // Get user's existing games
    const userGames = await Game.find({ user: req.user._id }).lean();

    if (userGames.length === 0) {
      // New user - suggest foundational games
      return res.json({
        suggestions: [
          {
            type: 'foundational',
            name: 'Positional Sparring Framework',
            description: 'Start building your game library with fundamental positional rounds',
            prompt: 'Create a foundational positional sparring game that can be adapted to any position',
            reasoning: 'Every coach needs a core positional sparring template to build upon'
          },
          {
            type: 'foundational',
            name: 'Guard Retention Basics',
            description: 'Essential guard retention game for developing defensive awareness',
            prompt: 'Create a guard retention training game focused on hip movement and framing',
            reasoning: 'Guard retention is the foundation of bottom game development'
          },
          {
            type: 'foundational',
            name: 'Escape Drill Template',
            description: 'Systematic escape training from bad positions',
            prompt: 'Create an escape training game from side control with progressive resistance',
            reasoning: 'Solid escapes build confidence to take risks elsewhere'
          }
        ],
        libraryAnalysis: {
          totalGames: 0,
          message: 'Start building your library with these foundational games'
        },
        source: 'template'
      });
    }

    // Deep library analysis
    const analysis = analyzeLibrary(userGames);

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Smart template-based suggestions
      const suggestions = generateSmartTemplateSuggestions(analysis, userGames, excludeIds);
      return res.json({
        suggestions,
        libraryAnalysis: analysis,
        source: 'template'
      });
    }

    // Build context for Claude
    const libraryContext = buildLibraryContext(userGames, analysis);

    // Determine suggestion types based on analysis
    const types = determineSuggestionTypes(analysis, suggestionType);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: `You are an elite NoGi grappling coach and curriculum designer. You analyze training game libraries and suggest new games that complement existing ones.

## YOUR TASK
Generate 3 unique, specific game suggestions based on the coach's existing library. Each suggestion should be:
1. UNIQUE - Not similar to any existing game in their library
2. SPECIFIC - Include actual positions, techniques, constraints (not generic)
3. COMPLEMENTARY - Fill gaps or build on existing games
4. ACTIONABLE - Ready to generate as a full training game

## SUGGESTION TYPES

**variation** - Take an existing game concept and create a meaningful variation:
- Different position but same skill focus
- Same position but different constraint/objective
- Progression (harder/easier) of existing game

**complement** - Games that chain with or counter existing games:
- If they have guard attack games, suggest guard defense
- If they have passing games, suggest guard retention
- Position chains: half guard → deep half → back take

**gap** - Fill missing areas in their training:
- Missing skill topics (offensive/defensive/control/transition)
- Missing positions (leg locks, standing, turtle)
- Missing difficulty levels

**meta** - Modern techniques not yet in their library:
- Leg lock systems (ashi garami, saddle, 50-50)
- Modern guards (k-guard, matrix, reverse DLR)
- Wrestling integration (front headlock, body lock)
- Back attack systems (body triangle, short choke)

**progression** - Building on games they use frequently:
- More advanced version of a beginner game
- Foundational drill for an advanced game

## OUTPUT FORMAT
Return ONLY this JSON (no markdown, no explanation):
{
  "suggestions": [
    {
      "type": "variation|complement|gap|meta|progression",
      "name": "Specific game name",
      "description": "2-3 sentences describing the game and its purpose",
      "prompt": "Detailed prompt to generate this game (include position, constraints, objectives)",
      "reasoning": "Why this complements their library",
      "basedOn": "Name of existing game this relates to (or null for new concepts)",
      "position": "Primary position focus",
      "topic": "offensive|defensive|control|transition"
    }
  ]
}`,
        messages: [
          {
            role: 'user',
            content: `Analyze my training game library and suggest 3 NEW games I should add.

## MY LIBRARY ANALYSIS
${libraryContext}

## SUGGESTION TYPES TO PRIORITIZE
${types.map(t => `- ${t.type}: ${t.reason}`).join('\n')}

## CONSTRAINTS
- Do NOT suggest games similar to what I already have
- Each suggestion must be DIFFERENT from each other
- Include specific positions and constraints, not generic concepts
- Consider modern grappling meta (leg locks, wrestling, modern guards)

Generate 3 unique suggestions that would genuinely improve my training library.`
          }
        ]
      })
    });

    if (!response.ok) {
      const suggestions = generateSmartTemplateSuggestions(analysis, userGames, excludeIds);
      return res.json({
        suggestions,
        libraryAnalysis: analysis,
        source: 'template',
        apiError: true
      });
    }

    const data = await response.json();
    const textContent = data.content?.find(c => c.type === 'text')?.text;

    let suggestions;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent);
      suggestions = parsed.suggestions || [];

      // Validate and enhance suggestions
      suggestions = suggestions.map(s => ({
        type: s.type || 'gap',
        name: s.name || 'Training Game',
        description: s.description || 'A new training game for your library',
        prompt: s.prompt || `Create a training game: ${s.name}`,
        reasoning: s.reasoning || 'Complements your existing library',
        basedOn: s.basedOn || null,
        position: s.position || 'various',
        topic: s.topic || 'transition'
      })).slice(0, 3);

    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError);
      suggestions = generateSmartTemplateSuggestions(analysis, userGames, excludeIds);
      return res.json({
        suggestions,
        libraryAnalysis: analysis,
        source: 'template',
        parseError: true
      });
    }

    res.json({
      suggestions,
      libraryAnalysis: analysis,
      source: 'claude'
    });

  } catch (error) {
    console.error('Smart suggestions error:', error);
    res.status(500).json({ message: 'Failed to generate suggestions', error: error.message });
  }
});

// Helper: Analyze user's library deeply
function analyzeLibrary(games) {
  const analysis = {
    totalGames: games.length,
    byTopic: { offensive: 0, defensive: 0, control: 0, transition: 0 },
    byDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
    byGameType: { warmup: 0, main: 0, cooldown: 0 },
    positions: {},
    techniques: {},
    skills: {},
    patterns: {
      constraintStyle: [],
      coachingVoice: [],
      favoritePositions: []
    },
    gaps: {
      topics: [],
      positions: [],
      techniques: [],
      difficulties: []
    },
    suggestions: []
  };

  // Position categories for analysis
  const positionKeywords = {
    guard: ['closed guard', 'half guard', 'butterfly', 'open guard', 'de la riva', 'dlr', 'spider', 'lasso', 'x guard', 'slx', 'deep half', 'z guard', 'k guard'],
    top: ['mount', 'side control', 'knee on belly', 'north south', 'back control', 'back mount'],
    standing: ['standing', 'clinch', 'wrestling', 'takedown'],
    legLocks: ['ashi', 'saddle', 'inside sankaku', '50 50', 'heel hook', 'outside ashi', 'leg entanglement'],
    turtle: ['turtle', 'front headlock', 'crucifix']
  };

  // Meta techniques to track
  const metaTechniques = {
    legLocks: ['heel hook', 'knee bar', 'toe hold', 'ashi garami', 'saddle', 'inside sankaku', '50-50', 'calf slicer'],
    modernGuards: ['k guard', 'matrix', 'reverse de la riva', 'squid guard', 'body lock guard'],
    wrestling: ['front headlock', 'guillotine', 'darce', 'anaconda', 'single leg', 'double leg', 'body lock', 'snap down'],
    backAttacks: ['body triangle', 'rear naked', 'short choke', 'arm trap', 'straight jacket'],
    modernPassing: ['body lock pass', 'over under', 'leg drag', 'knee cut', 'smash pass', 'float pass']
  };

  games.forEach(game => {
    // Count by topic
    if (game.topic && analysis.byTopic.hasOwnProperty(game.topic)) {
      analysis.byTopic[game.topic]++;
    }

    // Count by difficulty
    if (game.difficulty && analysis.byDifficulty.hasOwnProperty(game.difficulty)) {
      analysis.byDifficulty[game.difficulty]++;
    }

    // Count by game type
    const gameType = game.gameType || 'main';
    if (analysis.byGameType.hasOwnProperty(gameType)) {
      analysis.byGameType[gameType]++;
    }

    // Build searchable text
    const gameText = [
      game.name || '',
      game.topPlayer || '',
      game.bottomPlayer || '',
      game.coaching || '',
      game.position || '',
      ...(game.skills || []),
      ...(game.techniques || []),
      game.aiMetadata?.startPosition || '',
      game.aiMetadata?.description || '',
      ...(game.aiMetadata?.constraints || [])
    ].join(' ').toLowerCase();

    // Count positions
    Object.entries(positionKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (gameText.includes(keyword)) {
          analysis.positions[category] = (analysis.positions[category] || 0) + 1;
        }
      });
    });

    // Count meta techniques
    Object.entries(metaTechniques).forEach(([category, techniques]) => {
      techniques.forEach(tech => {
        if (gameText.includes(tech.toLowerCase())) {
          analysis.techniques[category] = (analysis.techniques[category] || 0) + 1;
        }
      });
    });

    // Count skills
    (game.skills || []).forEach(skill => {
      const normalizedSkill = skill.toLowerCase().trim();
      analysis.skills[normalizedSkill] = (analysis.skills[normalizedSkill] || 0) + 1;
    });

    // Extract constraint patterns
    if (game.aiMetadata?.constraints) {
      analysis.patterns.constraintStyle.push(...game.aiMetadata.constraints.slice(0, 2));
    }
  });

  // Identify gaps
  const totalByTopic = Object.values(analysis.byTopic).reduce((a, b) => a + b, 0);
  const avgPerTopic = totalByTopic / 4;

  Object.entries(analysis.byTopic).forEach(([topic, count]) => {
    if (count < avgPerTopic * 0.5) {
      analysis.gaps.topics.push({ topic, count, deficit: Math.round(avgPerTopic - count) });
    }
  });

  // Position gaps
  const positionCategories = ['guard', 'top', 'standing', 'legLocks', 'turtle'];
  positionCategories.forEach(pos => {
    if (!analysis.positions[pos] || analysis.positions[pos] < 2) {
      analysis.gaps.positions.push({ position: pos, count: analysis.positions[pos] || 0 });
    }
  });

  // Meta technique gaps
  Object.entries(metaTechniques).forEach(([category, techniques]) => {
    if (!analysis.techniques[category] || analysis.techniques[category] < 1) {
      analysis.gaps.techniques.push({ category, missing: techniques.slice(0, 3) });
    }
  });

  // Difficulty gaps
  Object.entries(analysis.byDifficulty).forEach(([diff, count]) => {
    if (count === 0 && games.length > 3) {
      analysis.gaps.difficulties.push(diff);
    }
  });

  // Find most used games (for variation suggestions)
  const gameUsage = games
    .filter(g => g.usageCount || g.lastUsed)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 5);

  analysis.frequentGames = gameUsage.map(g => ({
    name: g.name,
    topic: g.topic,
    position: g.position,
    usageCount: g.usageCount || 0
  }));

  return analysis;
}

// Helper: Build library context for AI
function buildLibraryContext(games, analysis) {
  const sections = [];

  // Overview
  sections.push(`## Overview
- Total games: ${analysis.totalGames}
- By topic: Offensive (${analysis.byTopic.offensive}), Defensive (${analysis.byTopic.defensive}), Control (${analysis.byTopic.control}), Transition (${analysis.byTopic.transition})
- By difficulty: Beginner (${analysis.byDifficulty.beginner}), Intermediate (${analysis.byDifficulty.intermediate}), Advanced (${analysis.byDifficulty.advanced})`);

  // Sample games (to understand style)
  const sampleGames = games.slice(0, 5);
  sections.push(`## Sample Games (to understand coaching style)
${sampleGames.map(g => `- "${g.name}" (${g.topic}): ${g.topPlayer?.substring(0, 100)}...`).join('\n')}`);

  // Existing positions
  sections.push(`## Position Coverage
${Object.entries(analysis.positions).map(([pos, count]) => `- ${pos}: ${count} games`).join('\n') || '- No specific positions detected'}`);

  // Gaps identified
  if (analysis.gaps.topics.length > 0) {
    sections.push(`## Topic Gaps
${analysis.gaps.topics.map(g => `- ${g.topic}: only ${g.count} games (needs ~${g.deficit} more)`).join('\n')}`);
  }

  if (analysis.gaps.positions.length > 0) {
    sections.push(`## Position Gaps
${analysis.gaps.positions.map(g => `- ${g.position}: only ${g.count} games`).join('\n')}`);
  }

  if (analysis.gaps.techniques.length > 0) {
    sections.push(`## Missing Modern Techniques
${analysis.gaps.techniques.map(g => `- ${g.category}: missing ${g.missing.join(', ')}`).join('\n')}`);
  }

  // Frequently used (for progressions)
  if (analysis.frequentGames.length > 0) {
    sections.push(`## Most Used Games (good for variations/progressions)
${analysis.frequentGames.map(g => `- "${g.name}" (${g.topic})`).join('\n')}`);
  }

  return sections.join('\n\n');
}

// Helper: Determine suggestion types based on analysis
function determineSuggestionTypes(analysis, requestedType) {
  const types = [];

  if (requestedType !== 'auto') {
    types.push({ type: requestedType, reason: 'User requested' });
    return types;
  }

  // Prioritize based on gaps
  if (analysis.gaps.positions.length > 0) {
    const worstPos = analysis.gaps.positions[0];
    types.push({ type: 'gap', reason: `Missing ${worstPos.position} games` });
  }

  if (analysis.gaps.techniques.length > 0) {
    const worstTech = analysis.gaps.techniques[0];
    types.push({ type: 'meta', reason: `No ${worstTech.category} coverage` });
  }

  if (analysis.gaps.topics.length > 0) {
    const worstTopic = analysis.gaps.topics[0];
    types.push({ type: 'gap', reason: `Low ${worstTopic.topic} games` });
  }

  if (analysis.frequentGames.length > 0) {
    types.push({ type: 'variation', reason: 'Build on your most-used games' });
  }

  // Always include complement
  types.push({ type: 'complement', reason: 'Chain with existing games' });

  return types.slice(0, 3);
}

// Helper: Generate smart template suggestions when no API key
function generateSmartTemplateSuggestions(analysis, games, excludeIds = []) {
  const suggestions = [];
  const existingNames = games.map(g => g.name.toLowerCase());
  const excludeSet = new Set(excludeIds.map(id => String(id).toLowerCase()));

  // Helper to check if suggestion should be excluded
  const isExcluded = (name) => {
    const nameLower = name.toLowerCase();
    return excludeSet.has(nameLower) ||
           existingNames.some(n => n.includes(nameLower.split(' ')[0])) ||
           Array.from(excludeSet).some(ex => nameLower.includes(ex) || ex.includes(nameLower.split(' ')[0]));
  };

  // Shuffle helper
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Large pool of suggestions organized by type
  const allSuggestions = {
    legLocks: shuffleArray([
      { name: 'Ashi Garami Entry Game', description: 'Develop leg lock entries from various guard positions', prompt: 'Create a leg lock entry game focused on achieving ashi garami control from open guard', topic: 'offensive' },
      { name: 'Heel Hook Control Game', description: 'Modern leg lock game focusing on inside sankaku and saddle control', prompt: 'Create a leg lock game emphasizing position before submission with heel hook finishes', topic: 'offensive' },
      { name: '50-50 Battle', description: 'Equal opportunity leg lock game from 50-50 position', prompt: 'Create a 50-50 leg lock game where both players hunt heel hooks simultaneously', topic: 'offensive' },
      { name: 'Saddle Entry System', description: 'Work entries into inside sankaku from multiple positions', prompt: 'Create a game focused on achieving saddle/inside sankaku from guard and top', topic: 'transition' },
      { name: 'Leg Lock Defense Drill', description: 'Escape leg entanglements before submissions lock in', prompt: 'Create a defensive leg lock game focused on boot defense and extraction', topic: 'defensive' },
      { name: 'K-Guard to Leg Attacks', description: 'Use K-guard to off-balance and enter leg entanglements', prompt: 'Create a K-guard game transitioning to saddle and ashi positions', topic: 'transition' }
    ]),
    standing: shuffleArray([
      { name: 'Wrestling Tie-Up Battle', description: 'Develop clinch control and takedown entries', prompt: 'Create a wrestling game focused on establishing dominant ties and level changes', topic: 'transition' },
      { name: 'Front Headlock Series', description: 'Snap downs, go-behinds, and choke threats', prompt: 'Create a front headlock game with guillotine, darce, and anaconda options', topic: 'offensive' },
      { name: 'Body Lock Takedowns', description: 'Wrestling game focused on body lock control and trips', prompt: 'Create a takedown game using body lock to throw and trip', topic: 'transition' },
      { name: 'Arm Drag to Back', description: 'Arm drag entries to back takes from standing', prompt: 'Create a standing game using arm drags to take the back', topic: 'transition' },
      { name: 'Sprawl & Counter', description: 'Defend takedowns and counter-attack', prompt: 'Create a wrestling game focusing on sprawls and counter offense', topic: 'defensive' }
    ]),
    guard: shuffleArray([
      { name: 'Guard Sweep Wars', description: 'Develop sweep timing from various guards', prompt: 'Create a guard game where bottom player hunts sweeps vs top maintains base', topic: 'transition' },
      { name: 'Guard Retention Flow', description: 'Maintain and recover guard under pressure', prompt: 'Create a guard retention game with continuous recovery required', topic: 'defensive' },
      { name: 'Closed Guard Attack Chain', description: 'Chain submissions from closed guard', prompt: 'Create a closed guard game chaining armbar-triangle-omoplata', topic: 'offensive' },
      { name: 'De La Riva Sweep System', description: 'DLR sweeps and back takes', prompt: 'Create a DLR guard game with sweep and back take options', topic: 'transition' },
      { name: 'Half Guard Battle', description: 'Both players work half guard attacks and passes', prompt: 'Create a half guard game with sweeps vs passes', topic: 'transition' }
    ]),
    top: shuffleArray([
      { name: 'Pin Transition Drill', description: 'Flow between dominant positions with control', prompt: 'Create a top position game cycling through side control, mount, back, knee on belly', topic: 'control' },
      { name: 'Body Lock Passing Game', description: 'Modern pressure passing with body lock control', prompt: 'Create a passing game using body lock pressure to pass guard', topic: 'control' },
      { name: 'Mount Attack Series', description: 'Submissions and transitions from mount', prompt: 'Create a mount game focusing on submissions and back takes', topic: 'offensive' },
      { name: 'Side Control Escape vs Hold', description: 'Top maintains, bottom escapes', prompt: 'Create a side control game with escape objectives and control time', topic: 'control' },
      { name: 'Knee Cut Passing', description: 'Systematic knee cut passing variations', prompt: 'Create a passing game focused on knee cut entries and finishes', topic: 'control' }
    ]),
    back: shuffleArray([
      { name: 'Back Attack System', description: 'Body triangle control with RNC and arm attacks', prompt: 'Create a back attack game with body triangle control and finishes', topic: 'offensive' },
      { name: 'Back Escape Challenge', description: 'Escape back control before submission', prompt: 'Create a back escape game with time pressure', topic: 'defensive' },
      { name: 'Back Take Entries', description: 'Multiple entries to back control', prompt: 'Create a game focused on achieving back control from various positions', topic: 'transition' }
    ]),
    meta: shuffleArray([
      { name: 'Modern Back Attack Flow', description: 'Body triangle, seat belt, short choke variations', prompt: 'Create a modern back attack game with body triangle and short choke options', topic: 'offensive' },
      { name: 'Matrix Guard System', description: 'Use matrix/K-guard for sweeps and leg entries', prompt: 'Create a matrix guard game with sweep and leg attack options', topic: 'transition' },
      { name: 'Darce/Anaconda Flow', description: 'Front headlock to D\'arce and anaconda transitions', prompt: 'Create a front headlock game flowing between darce and anaconda', topic: 'offensive' },
      { name: 'Wrestling Up Game', description: 'Stand up from bottom against leg lockers', prompt: 'Create a game focused on wrestling up vs leg lock entries', topic: 'defensive' },
      { name: 'Imanari Roll Entries', description: 'Flying entries to leg entanglements', prompt: 'Create a game using Imanari rolls to enter leg lock positions', topic: 'transition' }
    ]),
    topics: {
      offensive: shuffleArray([
        { name: 'Submission Hunt Game', description: 'Continuous submission attempts and chains', prompt: 'Create an offensive game where attacker chains submissions with limited position holds', topic: 'offensive' },
        { name: 'Finish or Reset', description: 'Must submit within time limit or reset', prompt: 'Create an offensive game with 30-second submission time limits', topic: 'offensive' },
        { name: 'First Attack Wins', description: 'Race to first clean submission attempt', prompt: 'Create a game where first clean submission attack scores', topic: 'offensive' }
      ]),
      defensive: shuffleArray([
        { name: 'Survival & Escape Rounds', description: 'Timed survival from bad positions', prompt: 'Create a defensive game starting from bad positions with escape objectives', topic: 'defensive' },
        { name: 'Guard Recovery Specialist', description: 'Recover guard from any passed position', prompt: 'Create a game focused on recovering guard from side control and mount', topic: 'defensive' },
        { name: 'Submission Defense Only', description: 'Defend all submissions for time', prompt: 'Create a pure defensive game against continuous attacks', topic: 'defensive' }
      ]),
      control: shuffleArray([
        { name: 'Pressure Maintenance Game', description: 'Maintain control and advance positions', prompt: 'Create a control game focused on maintaining and advancing dominant positions', topic: 'control' },
        { name: 'Pin Timer Challenge', description: 'Score points for pin duration', prompt: 'Create a game scoring points for time in dominant positions', topic: 'control' },
        { name: 'Position Ladder', description: 'Progress through positions systematically', prompt: 'Create a control game advancing from side control to mount to back', topic: 'control' }
      ]),
      transition: shuffleArray([
        { name: 'Scramble Points Game', description: 'Win scrambles for points', prompt: 'Create a transition game with point scoring for winning scrambles', topic: 'transition' },
        { name: 'Counter Attack Game', description: 'Defend then immediately attack', prompt: 'Create a game where defender must counter-attack within 3 seconds', topic: 'transition' },
        { name: 'Flow Roll Objectives', description: 'Flowing rolls with position targets', prompt: 'Create a flow game hitting specific position checkpoints', topic: 'transition' }
      ])
    }
  };

  // Try gap-based suggestions first
  if (analysis.gaps.positions.length > 0) {
    for (const gap of analysis.gaps.positions) {
      const pool = allSuggestions[gap.position] || [];
      for (const s of pool) {
        if (!isExcluded(s.name) && suggestions.length < 3) {
          suggestions.push({ type: 'gap', position: gap.position, reasoning: `Your library needs more ${gap.position} games`, ...s });
          break;
        }
      }
    }
  }

  // Add meta technique suggestions
  if (suggestions.length < 3) {
    for (const s of allSuggestions.meta) {
      if (!isExcluded(s.name) && suggestions.length < 3) {
        suggestions.push({ type: 'meta', reasoning: 'Modern grappling technique not in your library', ...s });
      }
    }
  }

  // Add topic balance suggestions
  if (analysis.gaps.topics.length > 0 && suggestions.length < 3) {
    for (const gap of analysis.gaps.topics) {
      const pool = allSuggestions.topics[gap.topic] || [];
      for (const s of pool) {
        if (!isExcluded(s.name) && suggestions.length < 3) {
          suggestions.push({ type: 'gap', reasoning: `Only ${gap.count} ${gap.topic} games (need more balance)`, ...s });
          break;
        }
      }
    }
  }

  // Add variation of frequent games
  if (analysis.frequentGames.length > 0 && suggestions.length < 3) {
    for (const popular of analysis.frequentGames) {
      const variationName = `${popular.name} - Competition Variant`;
      if (!isExcluded(variationName)) {
        suggestions.push({
          type: 'variation',
          name: variationName,
          description: `Advanced variation of ${popular.name} with added pressure`,
          prompt: `Create a competition variation of: ${popular.name}. Add time pressure and chain requirements.`,
          reasoning: `Based on your game "${popular.name}"`,
          basedOn: popular.name,
          topic: popular.topic || 'transition'
        });
        break;
      }
    }
  }

  // Fill remaining with random from all pools
  if (suggestions.length < 3) {
    const allPools = [...allSuggestions.legLocks, ...allSuggestions.standing, ...allSuggestions.guard,
                      ...allSuggestions.top, ...allSuggestions.back, ...allSuggestions.meta];
    const shuffledAll = shuffleArray(allPools);

    for (const s of shuffledAll) {
      if (!isExcluded(s.name) && suggestions.length < 3) {
        const alreadyHas = suggestions.some(existing => existing.name === s.name);
        if (!alreadyHas) {
          suggestions.push({ type: 'complement', reasoning: 'Expands your training variety', ...s });
        }
      }
    }
  }

  return suggestions.slice(0, 3);
}

module.exports = router;
