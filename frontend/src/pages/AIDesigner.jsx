import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const examplePrompts = [
  "Create a game to improve guard retention against pressure passers",
  "Design a constraint game for developing hip escapes from bottom side control",
  "Make a game focusing on arm drag setups from seated guard",
  "Create a positional sparring game for back control with submission threats",
  "Design a warmup game for grip fighting and pummeling",
  "Create an advanced leg lock defense game starting from 50/50"
];

const topics = [
  { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
  { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition / Scrambles', color: 'bg-green-500' }
];

const gameTypes = [
  { value: 'warmup', label: 'Warmup', icon: '🔥' },
  { value: 'main', label: 'Main', icon: '🎯' },
  { value: 'cooldown', label: 'Cooldown', icon: '🧘' }
];

const difficulties = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' }
];

export default function AIDesigner() {
  const { createGame, showToast } = useApp();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [generationSource, setGenerationSource] = useState(null);

  // Check AI status on mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const response = await api.get('/ai/status');
      setAiStatus(response.data);
    } catch (err) {
      setAiStatus({ available: true, provider: 'template' });
    }
  };

  // Generate a constraint-led game using the API
  const generateGame = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a problem or focus area', 'warning');
      return;
    }

    setLoading(true);
    setGenerationSource(null);

    try {
      const response = await api.post('/ai/generate', { prompt });
      const { game, source } = response.data;

      setGeneratedGame(game);
      setGenerationSource(source);
      setEditMode(false);

      if (source === 'claude') {
        showToast('Game generated with Claude AI', 'success');
      } else {
        showToast('Game generated using templates', 'info');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Failed to generate game. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setGeneratedGame(prev => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (field, value) => {
    setGeneratedGame(prev => ({
      ...prev,
      aiMetadata: { ...prev.aiMetadata, [field]: value }
    }));
  };

  const handleAddToLibrary = async () => {
    const result = await createGame(generatedGame);
    if (result.success) {
      setGeneratedGame(null);
      setPrompt('');
      setGenerationSource(null);
      showToast('Game added to your library!', 'success');
    }
  };

  const regenerateGame = () => {
    generateGame();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-purple-500">
            <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8zm-6.828 2.828a.75.75 0 010 1.061L6.11 12.95a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm6.594 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zM10 14a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 14z" />
            <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6zM9 8a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
          </svg>
          AI Game Designer
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate constraint-led training games using ecological dynamics principles
          </p>
          {aiStatus && (
            <span className={`badge text-xs ${aiStatus.provider === 'claude' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {aiStatus.provider === 'claude' ? 'Claude AI' : 'Templates'}
            </span>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="card p-6 mb-6">
        <label className="label">What problem or skill do you want to develop?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the problem you want to solve or skill you want to develop..."
          rows={3}
          className="input resize-none mb-4"
        />

        {/* Example prompts */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(example)}
                className="chip text-xs hover:bg-primary-100 dark:hover:bg-primary-900/30"
              >
                {example.substring(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateGame}
          disabled={loading || !prompt.trim()}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner mr-2" />
              {aiStatus?.provider === 'claude' ? 'Generating with Claude...' : 'Generating...'}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1z" />
                <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
              </svg>
              Generate Game
            </>
          )}
        </button>
      </div>

      {/* Generated Game Preview */}
      {generatedGame && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generated Game
              </h2>
              {generationSource && (
                <span className={`badge text-xs ${generationSource === 'claude' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {generationSource === 'claude' ? 'Claude AI' : 'Template'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={regenerateGame}
                disabled={loading}
                className="btn-secondary text-sm"
                title="Generate a new variation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className="btn-secondary text-sm"
              >
                {editMode ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={() => {
                  setGeneratedGame(null);
                  setGenerationSource(null);
                }}
                className="btn-ghost text-sm text-gray-500"
              >
                Discard
              </button>
            </div>
          </div>

          {editMode ? (
            // Edit mode
            <div className="space-y-4">
              <div>
                <label className="label">Game Name</label>
                <input
                  type="text"
                  value={generatedGame.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Topic</label>
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
                      <button
                        key={topic.value}
                        onClick={() => handleFieldChange('topic', topic.value)}
                        className={`chip text-xs ${generatedGame.topic === topic.value ? 'chip-active' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${topic.color}`} />
                        {topic.label.split(' / ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Game Type</label>
                  <div className="flex flex-wrap gap-2">
                    {gameTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleFieldChange('gameType', type.value)}
                        className={`chip text-xs ${generatedGame.gameType === type.value ? 'chip-active' : ''}`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Difficulty</label>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map(diff => (
                      <button
                        key={diff.value}
                        onClick={() => handleFieldChange('difficulty', diff.value)}
                        className={`chip text-xs ${generatedGame.difficulty === diff.value ? 'chip-active' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${diff.color}`} />
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Start Position</label>
                <input
                  type="text"
                  value={generatedGame.aiMetadata?.startPosition || ''}
                  onChange={(e) => handleMetadataChange('startPosition', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Top Player Instructions</label>
                <textarea
                  value={generatedGame.topPlayer}
                  onChange={(e) => handleFieldChange('topPlayer', e.target.value)}
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Bottom Player Instructions</label>
                <textarea
                  value={generatedGame.bottomPlayer}
                  onChange={(e) => handleFieldChange('bottomPlayer', e.target.value)}
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Coaching Notes</label>
                <textarea
                  value={generatedGame.coaching}
                  onChange={(e) => handleFieldChange('coaching', e.target.value)}
                  rows={2}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={generatedGame.skills?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="input"
                  placeholder="e.g., guard retention, hip movement, framing"
                />
              </div>
            </div>
          ) : (
            // Preview mode
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {generatedGame.name}
                </h3>
                <span className={`badge badge-${generatedGame.topic}`}>
                  {topics.find(t => t.value === generatedGame.topic)?.label}
                </span>
                {generatedGame.gameType && generatedGame.gameType !== 'main' && (
                  <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {gameTypes.find(t => t.value === generatedGame.gameType)?.icon} {gameTypes.find(t => t.value === generatedGame.gameType)?.label}
                  </span>
                )}
                {generatedGame.difficulty && generatedGame.difficulty !== 'intermediate' && (
                  <span className={`badge text-white ${difficulties.find(d => d.value === generatedGame.difficulty)?.color}`}>
                    {generatedGame.difficulty}
                  </span>
                )}
              </div>

              {generatedGame.aiMetadata?.startPosition && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Position
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {generatedGame.aiMetadata.startPosition}
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Top Player
                  </h4>
                  <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                    {generatedGame.topPlayer}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Bottom Player
                  </h4>
                  <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">
                    {generatedGame.bottomPlayer}
                  </p>
                </div>
              </div>

              {generatedGame.aiMetadata?.constraints && generatedGame.aiMetadata.constraints.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Constraints
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {generatedGame.aiMetadata.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedGame.aiMetadata?.progressions && generatedGame.aiMetadata.progressions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Progressions
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {generatedGame.aiMetadata.progressions.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
              )}

              {generatedGame.coaching && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Coaching Notes
                  </h4>
                  <p className="text-sm text-green-900 dark:text-green-100">
                    {generatedGame.coaching}
                  </p>
                </div>
              )}

              {generatedGame.aiMetadata?.pedagogicalNote && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                    Pedagogical Note
                  </h4>
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    {generatedGame.aiMetadata.pedagogicalNote}
                  </p>
                </div>
              )}

              {generatedGame.skills && generatedGame.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatedGame.skills.map((skill, idx) => (
                    <span key={idx} className="chip">
                      #{skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAddToLibrary}
              className="btn-primary w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add to Library
            </button>
          </div>
        </div>
      )}

      {/* Info section */}
      {!generatedGame && (
        <div className="card p-6 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            About Constraint-Led Training
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            This designer uses ecological dynamics principles to create training games that:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Create specific constraints that guide skill development
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Encourage problem-solving and adaptability
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Build perception-action coupling through repetition
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Progress systematically from simple to complex
            </li>
          </ul>

          {aiStatus && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                {aiStatus.provider === 'claude' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Powered by Claude AI for intelligent game generation
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Using template-based generation. Add ANTHROPIC_API_KEY for AI-powered games.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
