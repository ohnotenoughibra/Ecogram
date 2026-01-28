#!/usr/bin/env node
/**
 * Game Enrichment Script
 * Analyzes games and fills in missing position and technique fields
 *
 * Usage:
 *   node scripts/enrich-games.js input.json output.json
 *
 * Or to process and overwrite:
 *   node scripts/enrich-games.js games.json
 */

const fs = require('fs');
const path = require('path');

// Position detection patterns
const positionPatterns = {
  // Guard positions
  'closed-guard': /closed\s*guard|close\s*guard|full\s*guard/i,
  'open-guard': /open\s*guard|seated\s*guard/i,
  'half-guard': /half\s*guard|half-?guard|z[\s-]?guard/i,
  'butterfly-guard': /butterfly|seated\s*butterfly/i,
  'x-guard': /x[\s-]?guard|single\s*leg\s*x/i,
  'dlr': /de\s*la\s*riva|dlr|dela\s*riva/i,
  'rdlr': /reverse\s*de\s*la\s*riva|rdlr|reverse\s*dlr/i,
  'spider-guard': /spider[\s-]?guard|spider/i,
  'lasso-guard': /lasso[\s-]?guard|lasso/i,
  'collar-sleeve': /collar[\s-]?sleeve|collar\s*and\s*sleeve/i,

  // Top positions
  'mount': /\bmount\b|mounted|s[\s-]?mount|low\s*mount|high\s*mount|technical\s*mount/i,
  'side-control': /side[\s-]?control|side\s*mount|100[\s-]?kilos|kesa[\s-]?gatame|scarf\s*hold/i,
  'north-south': /north[\s-]?south|n\/s|north\s*south/i,
  'knee-on-belly': /knee[\s-]?on[\s-]?belly|kob|knee\s*ride/i,
  'back-control': /back[\s-]?control|back\s*mount|rear[\s-]?mount|back\s*take|taking\s*(the\s*)?back/i,

  // Neutral positions
  'turtle': /turtle|all[\s-]?fours|quad/i,
  'front-headlock': /front[\s-]?head[\s-]?lock|fhl|head[\s-]?and[\s-]?arm/i,
  'standing': /standing|stand[\s-]?up|takedown|wrestling|clinch|grip\s*fight|hand\s*fight/i,
  'clinch': /clinch|collar\s*tie|underhook\s*battle|over[\s-]?under/i,

  // Leg lock positions
  '50-50': /50[\s-]?50|fifty[\s-]?fifty/i,
  'saddle': /saddle|honey[\s-]?hole|inside\s*heel/i,
  'ashi-garami': /ashi[\s-]?garami|ashi|outside\s*ashi|straight\s*ashi/i,
  'inside-sankaku': /inside[\s-]?sankaku|411|4[\s-]?11/i
};

// Technique detection patterns
const techniquePatterns = {
  // Submissions
  'armbar': /armbar|arm[\s-]?bar|juji[\s-]?gatame/i,
  'triangle': /triangle|sankaku|tri[\s-]?angle/i,
  'kimura': /kimura|double\s*wrist\s*lock|americana\s*reverse/i,
  'americana': /americana|ude[\s-]?garami|key[\s-]?lock/i,
  'omoplata': /omoplata|omo[\s-]?plata/i,
  'guillotine': /guillotine|standing\s*guillotine|arm[\s-]?in\s*guillotine/i,
  'darce': /darce|d'arce|brabo/i,
  'anaconda': /anaconda|gator\s*roll/i,
  'rnc': /rnc|rear[\s-]?naked|mata[\s-]?leao/i,
  'ezekiel': /ezekiel|sode[\s-]?guruma/i,
  'heel-hook': /heel[\s-]?hook|inside\s*heel|outside\s*heel/i,
  'knee-bar': /knee[\s-]?bar|kneebar/i,
  'toe-hold': /toe[\s-]?hold|toehold/i,
  'calf-slicer': /calf[\s-]?slicer|calf[\s-]?crusher/i,
  'ankle-lock': /ankle[\s-]?lock|straight\s*ankle|achilles/i,

  // Sweeps
  'scissor-sweep': /scissor[\s-]?sweep|scissor/i,
  'hip-bump': /hip[\s-]?bump|bump[\s-]?sweep/i,
  'flower-sweep': /flower[\s-]?sweep|pendulum/i,
  'pendulum-sweep': /pendulum[\s-]?sweep/i,
  'elevator-sweep': /elevator[\s-]?sweep|hook[\s-]?sweep/i,
  'overhead-sweep': /overhead[\s-]?sweep|balloon/i,

  // Escapes
  'hip-escape': /hip[\s-]?escape|shrimp|elbow[\s-]?escape/i,
  'bridge': /bridge|upa|bump[\s-]?and[\s-]?roll/i,
  'elbow-knee': /elbow[\s-]?knee|elbow\s*to\s*knee/i,
  'frame': /frame|framing|stiff[\s-]?arm/i,

  // Passes
  'knee-cut': /knee[\s-]?cut|knee[\s-]?slice|knee[\s-]?slide/i,
  'torreando': /torreando|toreando|bullfighter/i,
  'stack-pass': /stack[\s-]?pass|stack|stacking/i,
  'leg-drag': /leg[\s-]?drag/i,
  'body-lock-pass': /body[\s-]?lock[\s-]?pass|body[\s-]?lock/i,
  'over-under': /over[\s-]?under[\s-]?pass|over[\s-]?under/i,
  'smash-pass': /smash[\s-]?pass|pressure[\s-]?pass/i,

  // Takedowns
  'single-leg': /single[\s-]?leg/i,
  'double-leg': /double[\s-]?leg/i,
  'ankle-pick': /ankle[\s-]?pick/i,
  'arm-drag': /arm[\s-]?drag/i,
  'snap-down': /snap[\s-]?down|snapdown/i,

  // Control
  'crossface': /crossface|cross[\s-]?face/i,
  'underhook': /underhook|under[\s-]?hook/i,
  'overhook': /overhook|over[\s-]?hook|whizzer/i,
  'seatbelt': /seatbelt|seat[\s-]?belt/i,
  'body-triangle': /body[\s-]?triangle/i,

  // Movement
  'granby': /granby|granby[\s-]?roll/i,
  'inversion': /inversion|invert/i,
  'berimbolo': /berimbolo|bolo/i,
  'leg-pummeling': /leg[\s-]?pummel|pummel/i
};

// Topic-to-position mappings for general inference
const topicPositionHints = {
  'guard': ['closed-guard', 'open-guard', 'half-guard'],
  'guard-retention': ['open-guard', 'half-guard'],
  'passing': ['standing', 'half-guard'],
  'mount': ['mount'],
  'back': ['back-control'],
  'side': ['side-control'],
  'takedown': ['standing'],
  'leg-lock': ['ashi-garami', 'saddle', '50-50'],
  'submission': ['mount', 'back-control', 'side-control'],
  'sweep': ['closed-guard', 'open-guard', 'butterfly-guard'],
  'escape': ['mount', 'side-control', 'back-control']
};

// Skill-to-position mappings
const skillPositionMap = {
  'guard': 'open-guard',
  'closed-guard': 'closed-guard',
  'half-guard': 'half-guard',
  'butterfly': 'butterfly-guard',
  'dlr': 'dlr',
  'spider': 'spider-guard',
  'lasso': 'lasso-guard',
  'x-guard': 'x-guard',
  'mount': 'mount',
  'side-control': 'side-control',
  'back': 'back-control',
  'back-control': 'back-control',
  'turtle': 'turtle',
  'standing': 'standing',
  'takedowns': 'standing',
  'wrestling': 'standing',
  'leg-locks': 'ashi-garami',
  'leglocks': 'ashi-garami',
  'ashi': 'ashi-garami',
  'saddle': 'saddle',
  '50-50': '50-50'
};

function analyzeText(game) {
  // Combine all text fields for analysis
  const textParts = [
    game.name || '',
    game.topPlayer || '',
    game.bottomPlayer || '',
    game.coaching || '',
    game.personalNotes || '',
    ...(game.skills || [])
  ];
  return textParts.join(' ').toLowerCase();
}

function detectPosition(game) {
  const text = analyzeText(game);

  // First check explicit position patterns in name/description
  for (const [position, pattern] of Object.entries(positionPatterns)) {
    if (pattern.test(text)) {
      return position;
    }
  }

  // Check skills for position hints
  if (game.skills && Array.isArray(game.skills)) {
    for (const skill of game.skills) {
      const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (skillPositionMap[normalizedSkill]) {
        return skillPositionMap[normalizedSkill];
      }
      if (skillPositionMap[skill.toLowerCase()]) {
        return skillPositionMap[skill.toLowerCase()];
      }
    }
  }

  // Infer from topic-related keywords
  if (text.includes('guard retention') || text.includes('retain')) {
    return 'open-guard';
  }
  if (text.includes('pass') && !text.includes('escape')) {
    return 'standing';
  }
  if (text.includes('escape') && text.includes('mount')) {
    return 'mount';
  }
  if (text.includes('escape') && text.includes('side')) {
    return 'side-control';
  }
  if (text.includes('escape') && text.includes('back')) {
    return 'back-control';
  }
  if (text.includes('sweep')) {
    return 'closed-guard';
  }
  if (text.includes('submission') || text.includes('submit')) {
    // Could be various positions, check more context
    if (text.includes('guard')) return 'closed-guard';
    if (text.includes('mount')) return 'mount';
    if (text.includes('back')) return 'back-control';
  }

  // Topic-based inference
  const topic = (game.topic || '').toLowerCase();
  if (topic === 'defensive') {
    if (text.includes('guard')) return 'open-guard';
    return 'side-control'; // Common defensive position
  }
  if (topic === 'offensive') {
    if (text.includes('guard')) return 'closed-guard';
    return 'mount'; // Common offensive position
  }
  if (topic === 'control') {
    return 'side-control';
  }

  return ''; // Unable to determine
}

function detectTechniques(game) {
  const text = analyzeText(game);
  const techniques = new Set();

  for (const [technique, pattern] of Object.entries(techniquePatterns)) {
    if (pattern.test(text)) {
      techniques.add(technique);
    }
  }

  return Array.from(techniques);
}

function enrichGame(game) {
  const enriched = { ...game };

  // Only fill in if empty
  if (!enriched.position || enriched.position === '') {
    enriched.position = detectPosition(game);
  }

  // Merge detected techniques with existing
  const existingTechniques = enriched.techniques || [];
  const detectedTechniques = detectTechniques(game);
  const allTechniques = new Set([...existingTechniques, ...detectedTechniques]);
  enriched.techniques = Array.from(allTechniques);

  return enriched;
}

function processGames(inputFile, outputFile) {
  // Read input file
  let data;
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    data = JSON.parse(content);
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }

  // Handle both array format and { games: [...] } format
  let games;
  let isWrapped = false;

  if (Array.isArray(data)) {
    games = data;
  } else if (data.games && Array.isArray(data.games)) {
    games = data.games;
    isWrapped = true;
  } else {
    console.error('Invalid format: expected array or { games: [...] }');
    process.exit(1);
  }

  console.log(`Processing ${games.length} games...`);

  // Enrich games
  const enrichedGames = games.map((game, idx) => {
    const enriched = enrichGame(game);

    if (enriched.position && !game.position) {
      console.log(`  [${idx + 1}] "${game.name}" -> position: ${enriched.position}`);
    }
    if (enriched.techniques.length > (game.techniques?.length || 0)) {
      const newTechniques = enriched.techniques.filter(t => !(game.techniques || []).includes(t));
      if (newTechniques.length > 0) {
        console.log(`  [${idx + 1}] "${game.name}" -> techniques: +${newTechniques.join(', ')}`);
      }
    }

    return enriched;
  });

  // Count enrichments
  const positionsAdded = enrichedGames.filter((g, i) => g.position && !games[i].position).length;
  const techniquesAdded = enrichedGames.filter((g, i) => g.techniques.length > (games[i].techniques?.length || 0)).length;

  console.log(`\nSummary:`);
  console.log(`  Positions added: ${positionsAdded}`);
  console.log(`  Games with new techniques: ${techniquesAdded}`);

  // Prepare output
  const output = isWrapped
    ? { ...data, games: enrichedGames, enrichedAt: new Date().toISOString() }
    : enrichedGames;

  // Write output
  const outPath = outputFile || inputFile;
  try {
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\nEnriched games saved to: ${outPath}`);
  } catch (err) {
    console.error(`Error writing file: ${err.message}`);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Game Enrichment Script
======================

Analyzes games and fills in missing position and technique fields
based on game names, descriptions, and skills.

Usage:
  node scripts/enrich-games.js <input.json> [output.json]

Arguments:
  input.json   - Exported games JSON file
  output.json  - Output file (optional, defaults to overwriting input)

Example:
  node scripts/enrich-games.js ecogames-export-2026-01-28.json enriched-games.json
`);
  process.exit(0);
}

const inputFile = args[0];
const outputFile = args[1];

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

processGames(inputFile, outputFile);
