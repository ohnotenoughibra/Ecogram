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

// Template-based generation as fallback
function generateTemplateGame(prompt) {
  const promptLower = prompt.toLowerCase();

  let topic = 'transition';
  let gameType = 'main';
  let difficulty = 'intermediate';

  // Determine topic from prompt
  if (promptLower.includes('submit') || promptLower.includes('finish') || promptLower.includes('attack') || promptLower.includes('choke') || promptLower.includes('armbar')) {
    topic = 'offensive';
  } else if (promptLower.includes('escape') || promptLower.includes('defend') || promptLower.includes('survival') || promptLower.includes('recover')) {
    topic = 'defensive';
  } else if (promptLower.includes('pass') || promptLower.includes('control') || promptLower.includes('pressure') || promptLower.includes('pin')) {
    topic = 'control';
  }

  // Determine game type
  if (promptLower.includes('warmup') || promptLower.includes('warm up') || promptLower.includes('flow')) {
    gameType = 'warmup';
  } else if (promptLower.includes('cooldown') || promptLower.includes('cool down') || promptLower.includes('light')) {
    gameType = 'cooldown';
  }

  // Determine difficulty
  if (promptLower.includes('beginner') || promptLower.includes('basic') || promptLower.includes('fundamental')) {
    difficulty = 'beginner';
  } else if (promptLower.includes('advanced') || promptLower.includes('competition') || promptLower.includes('expert')) {
    difficulty = 'advanced';
  }

  const templates = {
    offensive: {
      startPosition: 'Back control with seatbelt grip',
      constraints: [
        'Attacker cannot re-hook legs once lost',
        'Defender can only escape to turtle (no full escape)',
        'Time limit: 2 minutes per round'
      ],
      winTop: 'Achieve submission or maintain back control for full round',
      winBottom: 'Escape to turtle position 3 times',
      coaching: 'Focus on chest-to-back connection. Use the "squeeze and shift" principle for choke setups.',
      progressions: [
        'Start: Back with both hooks, rear naked choke hunting',
        'Intermediate: Add arm triangle and bow & arrow options',
        'Advanced: Start from body triangle with hand fighting'
      ],
      pedagogical: 'This game develops submission awareness under defensive pressure, building perception-action coupling for finishing sequences.',
      skills: ['back control', 'submissions', 'finishing', 'pressure']
    },
    defensive: {
      startPosition: 'Bottom side control, opponent in standard cross-face',
      constraints: [
        'Bottom player must create space before bridging',
        'Top player cannot mount or take back',
        'Reset if bottom player achieves guard'
      ],
      winTop: 'Maintain side control for 90 seconds',
      winBottom: 'Escape to guard or stand up',
      coaching: 'Emphasize frame creation before movement. "Breathe, frame, bridge, turn" sequence.',
      progressions: [
        'Start: Side control with moderate pressure',
        'Intermediate: Add north-south transitions for top player',
        'Advanced: Top player can switch sides freely'
      ],
      pedagogical: 'Builds defensive problem-solving through constrained exploration, developing robust escape patterns.',
      skills: ['escapes', 'framing', 'hip movement', 'defense']
    },
    control: {
      startPosition: 'Top player in closed guard',
      constraints: [
        'No submissions allowed for either player',
        'Passer must maintain contact with guard player',
        'Guard player cannot stand up'
      ],
      winTop: 'Pass to side control and hold for 3 seconds',
      winBottom: 'Sweep to top position',
      coaching: 'Work posture and grip fighting. "Control the hips, control the fight."',
      progressions: [
        'Start: Closed guard passing with posture focus',
        'Intermediate: Add leg locks to make guard player defend',
        'Advanced: Start in open guard with grip advantages'
      ],
      pedagogical: 'Develops systematic passing approach while maintaining adaptability to guard player adjustments.',
      skills: ['guard passing', 'pressure', 'posture', 'control']
    },
    transition: {
      startPosition: 'Both players standing in clinch',
      constraints: [
        'Must achieve takedown within 30 seconds or reset',
        'No pulling guard allowed',
        'Points only awarded for clean takedowns'
      ],
      winTop: 'Achieve 3 takedowns first',
      winBottom: 'Same objective - first to 3 takedowns',
      coaching: 'Focus on level changes and timing. "Set up, break posture, execute."',
      progressions: [
        'Start: Wrestling clinch, single/double leg focus',
        'Intermediate: Add trips and throws',
        'Advanced: Start from grip fighting at distance'
      ],
      pedagogical: 'Creates high-rep takedown scenarios that develop timing and pattern recognition in scramble situations.',
      skills: ['takedowns', 'scrambles', 'wrestling', 'timing']
    }
  };

  const template = templates[topic];
  const name = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    topic,
    topPlayer: `Win condition: ${template.winTop}\n\nKey focus: Apply consistent pressure while hunting for the win condition.`,
    bottomPlayer: `Win condition: ${template.winBottom}\n\nKey focus: Stay calm, create space, and work systematically toward your goal.`,
    coaching: template.coaching,
    skills: template.skills,
    gameType,
    difficulty,
    aiGenerated: true,
    aiMetadata: {
      startPosition: template.startPosition,
      constraints: template.constraints,
      winConditions: {
        top: template.winTop,
        bottom: template.winBottom
      },
      progressions: template.progressions,
      pedagogicalNote: template.pedagogical
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
    message: hasApiKey ? 'Claude AI is configured' : 'Using template-based generation (add ANTHROPIC_API_KEY for AI)'
  });
});

module.exports = router;
