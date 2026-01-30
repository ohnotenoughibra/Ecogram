import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const topicKeywords = {
  offensive: ['submit', 'submission', 'attack', 'finish', 'choke', 'armbar', 'leg lock', 'strangle', 'offense', 'hunt'],
  defensive: ['escape', 'defend', 'defense', 'survival', 'recover', 'guard recovery', 'retention', 'survive'],
  control: ['pass', 'passing', 'control', 'pressure', 'pin', 'mount', 'side control', 'position', 'maintain'],
  transition: ['scramble', 'transition', 'sweep', 'reversal', 'movement', 'flow', 'chain', 'drill'],
  competition: ['match', 'competition', 'points', 'adcc', 'ibjjf', 'tournament', 'overtime']
};

// Position detection patterns
const positionPatterns = {
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
  'mount': /\bmount\b|mounted|s[\s-]?mount|low\s*mount|high\s*mount|technical\s*mount/i,
  'side-control': /side[\s-]?control|side\s*mount|100[\s-]?kilos|kesa[\s-]?gatame|scarf\s*hold/i,
  'north-south': /north[\s-]?south|n\/s|north\s*south/i,
  'knee-on-belly': /knee[\s-]?on[\s-]?belly|kob|knee\s*ride/i,
  'back-control': /back[\s-]?control|back\s*mount|rear[\s-]?mount|back\s*take|taking\s*(the\s*)?back/i,
  'turtle': /turtle|all[\s-]?fours|quad/i,
  'front-headlock': /front[\s-]?head[\s-]?lock|fhl|head[\s-]?and[\s-]?arm/i,
  'standing': /standing|stand[\s-]?up|takedown|wrestling|clinch|grip\s*fight|hand\s*fight/i,
  'clinch': /clinch|collar\s*tie|underhook\s*battle|over[\s-]?under/i,
  '50-50': /50[\s-]?50|fifty[\s-]?fifty/i,
  'saddle': /saddle|honey[\s-]?hole|inside\s*heel/i,
  'ashi-garami': /ashi[\s-]?garami|ashi|outside\s*ashi|straight\s*ashi/i,
  'inside-sankaku': /inside[\s-]?sankaku|411|4[\s-]?11/i
};

// Technique detection patterns
const techniquePatterns = {
  'armbar': /armbar|arm[\s-]?bar|juji[\s-]?gatame/i,
  'triangle': /triangle|sankaku|tri[\s-]?angle/i,
  'kimura': /kimura|double\s*wrist\s*lock/i,
  'americana': /americana|ude[\s-]?garami|key[\s-]?lock/i,
  'omoplata': /omoplata|omo[\s-]?plata/i,
  'guillotine': /guillotine|standing\s*guillotine/i,
  'darce': /darce|d'arce|brabo/i,
  'anaconda': /anaconda|gator\s*roll/i,
  'rnc': /rnc|rear[\s-]?naked|mata[\s-]?leao/i,
  'ezekiel': /ezekiel|sode[\s-]?guruma/i,
  'heel-hook': /heel[\s-]?hook|inside\s*heel|outside\s*heel/i,
  'knee-bar': /knee[\s-]?bar|kneebar/i,
  'toe-hold': /toe[\s-]?hold|toehold/i,
  'ankle-lock': /ankle[\s-]?lock|straight\s*ankle|achilles/i,
  'scissor-sweep': /scissor[\s-]?sweep/i,
  'hip-bump': /hip[\s-]?bump|bump[\s-]?sweep/i,
  'hip-escape': /hip[\s-]?escape|shrimp/i,
  'bridge': /bridge|upa|bump[\s-]?and[\s-]?roll/i,
  'knee-cut': /knee[\s-]?cut|knee[\s-]?slice|knee[\s-]?slide/i,
  'torreando': /torreando|toreando|bullfighter/i,
  'leg-drag': /leg[\s-]?drag/i,
  'body-lock-pass': /body[\s-]?lock[\s-]?pass|body[\s-]?lock/i,
  'single-leg': /single[\s-]?leg/i,
  'double-leg': /double[\s-]?leg/i,
  'arm-drag': /arm[\s-]?drag/i,
  'crossface': /crossface|cross[\s-]?face/i,
  'underhook': /underhook|under[\s-]?hook/i,
  'seatbelt': /seatbelt|seat[\s-]?belt/i,
  'berimbolo': /berimbolo|bolo/i
};

// Field name mappings for different JSON schemas
const fieldMappings = {
  name: ['name', 'title', 'gameName', 'game_name', 'drill', 'drillName', 'exercise', 'activity'],
  topic: ['topic', 'type', 'category', 'gameType', 'game_type', 'focus', 'objective', 'theme'],
  position: ['position', 'startingPosition', 'starting_position', 'pos', 'startPosition', 'location'],
  topPlayer: ['topPlayer', 'top_player', 'top', 'attacker', 'passer', 'topInstructions', 'playerA', 'player1'],
  bottomPlayer: ['bottomPlayer', 'bottom_player', 'bottom', 'defender', 'guard', 'bottomInstructions', 'playerB', 'player2'],
  coaching: ['coaching', 'notes', 'description', 'instructions', 'coachingNotes', 'coaching_notes', 'details', 'rules', 'explanation', 'how', 'howTo'],
  techniques: ['techniques', 'technique', 'moves', 'skills', 'tags', 'submissionTypes', 'moves'],
  difficulty: ['difficulty', 'level', 'skillLevel', 'experience'],
  gameType: ['gameType', 'drillType', 'exerciseType', 'warmup', 'type']
};

// Topic normalization
const topicNormalization = {
  'offense': 'offensive',
  'attack': 'offensive',
  'attacking': 'offensive',
  'submission': 'offensive',
  'defense': 'defensive',
  'escape': 'defensive',
  'escaping': 'defensive',
  'guard': 'defensive',
  'pass': 'control',
  'passing': 'control',
  'positional': 'control',
  'position': 'control',
  'sweep': 'transition',
  'movement': 'transition',
  'flow': 'transition',
  'dynamic': 'transition',
  'match': 'competition',
  'sparring': 'competition',
  'live': 'competition'
};

function getFieldValue(obj, fieldNames) {
  for (const field of fieldNames) {
    if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
      return obj[field];
    }
    // Try case-insensitive match
    const lowerField = field.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === lowerField) {
        return obj[key];
      }
    }
  }
  return undefined;
}

function normalizeTopic(topic) {
  if (!topic) return 'transition';
  const lower = topic.toLowerCase().trim();

  // Direct match
  if (['offensive', 'defensive', 'control', 'transition', 'competition'].includes(lower)) {
    return lower;
  }

  // Normalized match
  if (topicNormalization[lower]) {
    return topicNormalization[lower];
  }

  return 'transition';
}

function isGameLikeObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;

  // Must have at least a name or title-like field
  const hasName = getFieldValue(obj, fieldMappings.name);
  if (!hasName) return false;

  // Should have at least one other game-related field
  const hasTopPlayer = getFieldValue(obj, fieldMappings.topPlayer);
  const hasBottomPlayer = getFieldValue(obj, fieldMappings.bottomPlayer);
  const hasCoaching = getFieldValue(obj, fieldMappings.coaching);
  const hasTopic = getFieldValue(obj, fieldMappings.topic);
  const hasPosition = getFieldValue(obj, fieldMappings.position);
  const hasTechniques = getFieldValue(obj, fieldMappings.techniques);

  return hasTopPlayer || hasBottomPlayer || hasCoaching || hasTopic || hasPosition || hasTechniques;
}

function normalizeGameObject(obj) {
  const game = {
    name: '',
    topic: 'transition',
    position: '',
    topPlayer: '',
    bottomPlayer: '',
    coaching: '',
    techniques: [],
    skills: [],
    difficulty: 'intermediate',
    gameType: 'main'
  };

  // Extract fields using mappings
  game.name = String(getFieldValue(obj, fieldMappings.name) || '').trim();

  const topicValue = getFieldValue(obj, fieldMappings.topic);
  game.topic = normalizeTopic(topicValue);

  game.position = String(getFieldValue(obj, fieldMappings.position) || '').trim();
  game.topPlayer = String(getFieldValue(obj, fieldMappings.topPlayer) || '').trim();
  game.bottomPlayer = String(getFieldValue(obj, fieldMappings.bottomPlayer) || '').trim();
  game.coaching = String(getFieldValue(obj, fieldMappings.coaching) || '').trim();

  const techValue = getFieldValue(obj, fieldMappings.techniques);
  if (Array.isArray(techValue)) {
    game.techniques = techValue.map(t => String(t).trim()).filter(t => t);
  } else if (typeof techValue === 'string') {
    game.techniques = techValue.split(/[,;]/).map(t => t.trim()).filter(t => t);
  }

  const diffValue = getFieldValue(obj, fieldMappings.difficulty);
  if (diffValue && ['beginner', 'intermediate', 'advanced'].includes(String(diffValue).toLowerCase())) {
    game.difficulty = String(diffValue).toLowerCase();
  }

  const gameTypeValue = getFieldValue(obj, fieldMappings.gameType);
  if (gameTypeValue && ['warmup', 'main', 'cooldown'].includes(String(gameTypeValue).toLowerCase())) {
    game.gameType = String(gameTypeValue).toLowerCase();
  }

  // Copy over any other fields that might be useful
  if (obj.skills) {
    game.skills = Array.isArray(obj.skills) ? obj.skills : String(obj.skills).split(/[,;]/).map(s => s.trim());
  }
  if (obj.personalNotes) game.personalNotes = String(obj.personalNotes);
  if (obj.videoUrl) game.videoUrl = String(obj.videoUrl);
  if (obj.favorite !== undefined) game.favorite = Boolean(obj.favorite);

  return game;
}

function findGamesInJson(data, depth = 0, maxDepth = 5) {
  const games = [];

  if (depth > maxDepth) return games;

  // If it's an array, check each element
  if (Array.isArray(data)) {
    for (const item of data) {
      if (isGameLikeObject(item)) {
        games.push(normalizeGameObject(item));
      } else if (typeof item === 'object' && item !== null) {
        games.push(...findGamesInJson(item, depth + 1, maxDepth));
      }
    }
    return games;
  }

  // If it's an object
  if (typeof data === 'object' && data !== null) {
    // Check if the object itself is a game
    if (isGameLikeObject(data)) {
      games.push(normalizeGameObject(data));
      return games;
    }

    // Check known container fields
    const containerFields = ['games', 'drills', 'exercises', 'activities', 'items', 'data', 'results', 'list'];
    for (const field of containerFields) {
      if (data[field]) {
        games.push(...findGamesInJson(data[field], depth + 1, maxDepth));
      }
    }

    // If nothing found in known containers, check all object values
    if (games.length === 0) {
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'object' && data[key] !== null) {
          games.push(...findGamesInJson(data[key], depth + 1, maxDepth));
        }
      }
    }
  }

  return games;
}

function analyzeGameText(game) {
  const parts = [
    game.name || '',
    game.topPlayer || '',
    game.bottomPlayer || '',
    game.coaching || '',
    ...(Array.isArray(game.skills) ? game.skills : []),
    ...(Array.isArray(game.techniques) ? game.techniques : [])
  ];
  return parts.join(' ').toLowerCase();
}

function detectPosition(game) {
  if (game.position) return game.position;

  const text = analyzeGameText(game);

  for (const [position, pattern] of Object.entries(positionPatterns)) {
    if (pattern.test(text)) return position;
  }

  return '';
}

function detectTechniques(game) {
  const text = analyzeGameText(game);
  const techniques = [];

  for (const [technique, pattern] of Object.entries(techniquePatterns)) {
    if (pattern.test(text)) techniques.push(technique);
  }

  return techniques;
}

function detectTopic(text) {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return topic;
      }
    }
  }
  return 'transition';
}

function enrichGame(game) {
  const enriched = { ...game };

  if (!enriched.position) {
    enriched.position = detectPosition(game);
  }

  const existingTechniques = enriched.techniques || [];
  const detectedTechniques = detectTechniques(game);
  const allTechniques = [...new Set([...existingTechniques, ...detectedTechniques])];
  enriched.techniques = allTechniques;

  // Detect topic if default
  if (enriched.topic === 'transition') {
    const text = analyzeGameText(enriched);
    enriched.topic = detectTopic(text);
  }

  return enriched;
}

function parseTextToGames(text) {
  const games = [];
  const blocks = text.split(/\n\n+|---+/).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    const game = {
      name: '',
      topic: 'transition',
      topPlayer: '',
      bottomPlayer: '',
      coaching: '',
      skills: []
    };

    const hasLabels = lines.some(l =>
      /^(name|title|game|top|bottom|coaching|notes|skills|tags|topic):/i.test(l)
    );

    if (hasLabels) {
      let currentField = null;
      let currentValue = [];

      for (const line of lines) {
        const labelMatch = line.match(/^(name|title|game|top|bottom|coaching|notes|skills|tags|topic):\s*(.*)/i);

        if (labelMatch) {
          if (currentField && currentValue.length > 0) {
            const value = currentValue.join('\n').trim();
            if (currentField === 'name' || currentField === 'title' || currentField === 'game') {
              game.name = value;
            } else if (currentField === 'top') {
              game.topPlayer = value;
            } else if (currentField === 'bottom') {
              game.bottomPlayer = value;
            } else if (currentField === 'coaching' || currentField === 'notes') {
              game.coaching = value;
            } else if (currentField === 'skills' || currentField === 'tags') {
              game.skills = value.split(/[,#]/).map(s => s.trim()).filter(s => s);
            } else if (currentField === 'topic') {
              game.topic = normalizeTopic(value);
            }
          }
          currentField = labelMatch[1].toLowerCase();
          currentValue = labelMatch[2] ? [labelMatch[2]] : [];
        } else if (currentField) {
          currentValue.push(line);
        }
      }

      if (currentField && currentValue.length > 0) {
        const value = currentValue.join('\n').trim();
        if (currentField === 'name' || currentField === 'title' || currentField === 'game') {
          game.name = value;
        } else if (currentField === 'top') {
          game.topPlayer = value;
        } else if (currentField === 'bottom') {
          game.bottomPlayer = value;
        } else if (currentField === 'coaching' || currentField === 'notes') {
          game.coaching = value;
        } else if (currentField === 'skills' || currentField === 'tags') {
          game.skills = value.split(/[,#]/).map(s => s.trim()).filter(s => s);
        } else if (currentField === 'topic') {
          game.topic = normalizeTopic(value);
        }
      }
    } else {
      game.name = lines[0].replace(/^[-*•]\s*/, '');

      if (lines.length > 1) {
        const restText = lines.slice(1).join('\n');
        const topMatch = restText.match(/top(?:\s+player)?[:\s]+([^\n]+)/i);
        const bottomMatch = restText.match(/bottom(?:\s+player)?[:\s]+([^\n]+)/i);

        if (topMatch) game.topPlayer = topMatch[1].trim();
        if (bottomMatch) game.bottomPlayer = bottomMatch[1].trim();

        let coaching = restText
          .replace(/top(?:\s+player)?[:\s]+[^\n]+/gi, '')
          .replace(/bottom(?:\s+player)?[:\s]+[^\n]+/gi, '')
          .trim();

        if (coaching) game.coaching = coaching;
      }

      const hashtags = block.match(/#\w+/g);
      if (hashtags) {
        game.skills = hashtags.map(t => t.slice(1));
      }
    }

    if (game.topic === 'transition') {
      game.topic = detectTopic(`${game.name} ${game.topPlayer} ${game.bottomPlayer} ${game.coaching}`);
    }

    if (game.name) {
      games.push(game);
    }
  }

  return games;
}

export default function Import() {
  const navigate = useNavigate();
  const { importGames, showToast, clearAllGames, gamesPagination } = useApp();
  const totalGames = gamesPagination?.total || 0;
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processJsonData = (text) => {
    // Clean input
    const cleaned = text
      .replace(/^\uFEFF/, '') // BOM
      .replace(/[\u201C\u201D]/g, '"') // Smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart apostrophes
      .trim();

    try {
      const data = JSON.parse(cleaned);
      const games = findGamesInJson(data);

      if (games.length === 0) {
        return { success: false, error: 'No games found in JSON. Make sure objects have a "name" field and game-related fields like "topPlayer", "bottomPlayer", "coaching", etc.' };
      }

      const enrichedGames = games.map(enrichGame);
      const enrichedCount = enrichedGames.filter((g, i) =>
        (g.position && !games[i].position) ||
        (g.techniques?.length > (games[i].techniques?.length || 0))
      ).length;

      return {
        success: true,
        games: enrichedGames,
        count: enrichedGames.length,
        enrichedCount,
        source: 'json'
      };
    } catch (e) {
      return { success: false, error: `JSON parse error: ${e.message}` };
    }
  };

  const handleFile = async (file) => {
    try {
      const text = await file.text();

      if (file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const result = processJsonData(text);
        if (result.success) {
          setPreviewData(result);
          showToast(`Found ${result.count} games`, 'success');
        } else {
          showToast(result.error, 'error');
        }
      } else {
        const parsedGames = parseTextToGames(text);
        if (parsedGames.length === 0) {
          showToast('No games found in file', 'error');
          return;
        }
        const enrichedGames = parsedGames.map(enrichGame);
        setPreviewData({
          games: enrichedGames,
          count: enrichedGames.length,
          source: 'text'
        });
      }
    } catch (error) {
      showToast(`Failed to parse file: ${error.message}`, 'error');
    }
  };

  const handleParseText = () => {
    if (!textInput.trim()) {
      showToast('Please enter some text', 'warning');
      return;
    }

    const trimmedInput = textInput.trim();
    const firstChar = trimmedInput.charAt(0);

    // Check if JSON
    if (firstChar === '[' || firstChar === '{') {
      const result = processJsonData(trimmedInput);
      if (result.success) {
        setPreviewData(result);
        showToast(`Found ${result.count} games`, 'success');
      } else {
        showToast(result.error, 'error');
      }
      return;
    }

    // Parse as text
    const parsedGames = parseTextToGames(textInput);
    if (parsedGames.length === 0) {
      showToast('Could not parse any games from text', 'error');
      return;
    }

    const enrichedGames = parsedGames.map(enrichGame);
    setPreviewData({
      games: enrichedGames,
      count: enrichedGames.length,
      source: 'text'
    });
  };

  const handleImport = async () => {
    if (!previewData) return;

    setLoading(true);
    const result = await importGames(previewData.games);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  const exampleText = `Guard Retention Game
Top: Pass the guard using any method
Bottom: Retain guard for 2 minutes, no submissions
Coaching: Focus on hip movement and frames
#guard #retention #defense

---

Name: Submission Hunting
Topic: offensive
Top: Hunt for submissions from mount
Bottom: Escape or survive for 90 seconds
Skills: mount, submissions, pressure`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-1 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Games</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Import from text or any JSON format
        </p>
      </div>

      {!previewData ? (
        <div className="space-y-6">
          {/* Mode tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'text'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              Smart Text
            </button>
            <button
              onClick={() => setMode('json')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'json'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              JSON File
            </button>
          </div>

          {mode === 'text' ? (
            <div className="space-y-4">
              <div className="card p-4">
                <label className="label">Paste your games (text or JSON)</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={exampleText}
                  rows={12}
                  className="input resize-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supports text format or any JSON structure
                </p>
              </div>

              <button
                onClick={handleParseText}
                className="btn-primary w-full"
              >
                Parse & Preview
              </button>

              {/* Format help */}
              <div className="card p-4 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Supported formats:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <strong>JSON array:</strong> [{"{ name: '...' }"}]</li>
                  <li>• <strong>JSON object:</strong> {"{ games: [...] }"}</li>
                  <li>• <strong>Nested JSON:</strong> Any structure with game objects</li>
                  <li>• <strong>Text format:</strong> Name, Top/Bottom/Coaching labels</li>
                  <li>• <strong>Hashtags:</strong> #guard #escape become skills</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Auto-detects game objects by finding "name" + game-related fields
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`card p-8 border-2 border-dashed transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Drop your file here
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary mt-4"
                >
                  Select File
                </button>
                <p className="mt-4 text-xs text-gray-400">
                  Accepts any JSON structure with game objects
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Preview
              </h2>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setTextInput('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Start over
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Games found</span>
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {previewData.count}
                </span>
              </div>

              {previewData.enrichedCount > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Auto-enriched {previewData.enrichedCount} games with positions/techniques
                    </span>
                  </div>
                </div>
              )}

              {/* Game preview list */}
              <div className="max-h-80 overflow-y-auto space-y-3">
                {previewData.games.map((game, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                        {game.topic || 'General'}
                      </span>
                      {game.position && (
                        <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">
                          {game.position}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {game.name}
                      </span>
                    </div>
                    {game.topPlayer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        <strong>Top:</strong> {game.topPlayer.substring(0, 80)}{game.topPlayer.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {game.bottomPlayer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        <strong>Bottom:</strong> {game.bottomPlayer.substring(0, 80)}{game.bottomPlayer.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {(game.skills?.length > 0 || game.techniques?.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(game.skills) ? game.skills : []).slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            #{skill.replace(/^#/, '')}
                          </span>
                        ))}
                        {game.techniques?.slice(0, 2).map((tech, i) => (
                          <span key={`t-${i}`} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPreviewData(null);
                setTextInput('');
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2" />
                  Importing...
                </>
              ) : (
                `Import ${previewData.count} Games`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty Library Section */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Clear Library
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Remove all games from your library to start fresh or before reimporting.
          {totalGames > 0 && (
            <span className="text-gray-700 dark:text-gray-300 font-medium"> You currently have {totalGames} games.</span>
          )}
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger"
            disabled={totalGames === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            Empty Library
          </button>
        ) : (
          <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
              This will permanently delete all {totalGames} games. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="input mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (clearConfirmText === 'DELETE') {
                    const result = await clearAllGames();
                    if (result.success) {
                      setShowClearConfirm(false);
                      setClearConfirmText('');
                    }
                  }
                }}
                disabled={clearConfirmText !== 'DELETE'}
                className="btn-danger flex-1"
              >
                Delete All Games
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
