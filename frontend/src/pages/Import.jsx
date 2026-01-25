import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const topicKeywords = {
  offensive: ['submit', 'submission', 'attack', 'finish', 'choke', 'armbar', 'leg lock', 'strangle', 'offense'],
  defensive: ['escape', 'defend', 'defense', 'survival', 'recover', 'guard recovery', 'retention'],
  control: ['pass', 'passing', 'control', 'pressure', 'pin', 'mount', 'side control', 'position'],
  transition: ['scramble', 'transition', 'sweep', 'reversal', 'movement', 'flow', 'chain']
};

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

function parseTextToGames(text) {
  const games = [];

  // Split by double newlines or "---" separators
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

    // Check for structured format with labels
    const hasLabels = lines.some(l =>
      /^(name|title|game|top|bottom|coaching|notes|skills|tags|topic):/i.test(l)
    );

    if (hasLabels) {
      // Parse labeled format
      let currentField = null;
      let currentValue = [];

      for (const line of lines) {
        const labelMatch = line.match(/^(name|title|game|top|bottom|coaching|notes|skills|tags|topic):\s*(.*)/i);

        if (labelMatch) {
          // Save previous field
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
              const topicLower = value.toLowerCase();
              if (['offensive', 'defensive', 'control', 'transition'].includes(topicLower)) {
                game.topic = topicLower;
              }
            }
          }

          currentField = labelMatch[1].toLowerCase();
          currentValue = labelMatch[2] ? [labelMatch[2]] : [];
        } else if (currentField) {
          currentValue.push(line);
        }
      }

      // Save last field
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
          const topicLower = value.toLowerCase();
          if (['offensive', 'defensive', 'control', 'transition'].includes(topicLower)) {
            game.topic = topicLower;
          }
        }
      }
    } else {
      // Simple format: first line is name, rest is description
      game.name = lines[0].replace(/^[-*•]\s*/, '');

      if (lines.length > 1) {
        // Check if lines mention top/bottom player
        const restText = lines.slice(1).join('\n');

        const topMatch = restText.match(/top(?:\s+player)?[:\s]+([^\n]+)/i);
        const bottomMatch = restText.match(/bottom(?:\s+player)?[:\s]+([^\n]+)/i);

        if (topMatch) game.topPlayer = topMatch[1].trim();
        if (bottomMatch) game.bottomPlayer = bottomMatch[1].trim();

        // Remaining text becomes coaching notes
        let coaching = restText
          .replace(/top(?:\s+player)?[:\s]+[^\n]+/gi, '')
          .replace(/bottom(?:\s+player)?[:\s]+[^\n]+/gi, '')
          .trim();

        if (coaching) game.coaching = coaching;
      }

      // Extract hashtags as skills
      const hashtags = block.match(/#\w+/g);
      if (hashtags) {
        game.skills = hashtags.map(t => t.slice(1));
      }
    }

    // Auto-detect topic from content
    if (game.topic === 'transition') {
      game.topic = detectTopic(`${game.name} ${game.topPlayer} ${game.bottomPlayer} ${game.coaching}`);
    }

    // Only add if we have a name
    if (game.name) {
      games.push(game);
    }
  }

  return games;
}

export default function Import() {
  const navigate = useNavigate();
  const { importGames, showToast } = useApp();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('text'); // 'text' or 'json'
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleFile = async (file) => {
    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        if (!data.games || !Array.isArray(data.games)) {
          showToast('Invalid JSON format. Expected { games: [...] }', 'error');
          return;
        }
        setPreviewData({
          games: data.games,
          exportDate: data.exportDate,
          count: data.games.length,
          source: 'json'
        });
      } else {
        // Text file - parse it
        const games = parseTextToGames(text);
        if (games.length === 0) {
          showToast('No games found in file', 'error');
          return;
        }
        setPreviewData({
          games,
          count: games.length,
          source: 'text'
        });
      }
    } catch (error) {
      showToast('Failed to parse file', 'error');
    }
  };

  const handleParseText = () => {
    if (!textInput.trim()) {
      showToast('Please enter some text', 'warning');
      return;
    }

    const games = parseTextToGames(textInput);
    if (games.length === 0) {
      showToast('Could not parse any games from text', 'error');
      return;
    }

    setPreviewData({
      games,
      count: games.length,
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

  const topicLabels = {
    offensive: 'Offensive',
    defensive: 'Defensive',
    control: 'Control',
    transition: 'Transition'
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
          Import from text or JSON file
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
                <label className="label">Paste your games</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={exampleText}
                  rows={12}
                  className="input resize-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Separate games with blank lines or ---
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
                  <li>• <strong>Simple:</strong> First line = name, rest = notes</li>
                  <li>• <strong>Labels:</strong> Name:, Top:, Bottom:, Coaching:, Skills:</li>
                  <li>• <strong>Hashtags:</strong> #guard #escape become skills</li>
                  <li>• <strong>Topic:</strong> Auto-detected or set with Topic: label</li>
                </ul>
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
                  Accepts .json or .txt files
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

              {/* Game preview list */}
              <div className="max-h-80 overflow-y-auto space-y-3">
                {previewData.games.map((game, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge badge-${game.topic || 'transition'}`}>
                        {topicLabels[game.topic] || 'Transition'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {game.name}
                      </span>
                    </div>
                    {game.topPlayer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <strong>Top:</strong> {game.topPlayer.substring(0, 60)}...
                      </p>
                    )}
                    {game.bottomPlayer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <strong>Bottom:</strong> {game.bottomPlayer.substring(0, 60)}...
                      </p>
                    )}
                    {game.skills && game.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {game.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            #{skill}
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
    </div>
  );
}
