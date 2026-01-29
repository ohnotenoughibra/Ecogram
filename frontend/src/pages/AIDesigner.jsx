import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const examplePrompts = [
  "Create a game to improve guard retention against pressure passers",
  "Design a constraint game for developing hip escapes from bottom side control",
  "Make a game focusing on arm drag setups from seated guard",
  "Create a positional sparring game for back control with submission threats",
  "Design a warmup game for grip fighting and pummeling",
  "Create an advanced leg lock defense game starting from 50/50"
];

const exampleSearches = [
  "How to escape mount against a heavier opponent",
  "Best way to finish rear naked choke when they defend",
  "Guard retention when opponent is fast at passing",
  "Counters to knee slice pass",
  "Setting up triangles from closed guard"
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
  const { createGame, deleteGame, showToast, games, fetchGames } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('generate'); // 'generate' | 'search' | 'variations'
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [generationSource, setGenerationSource] = useState(null);

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Variations state
  const [selectedGameForVariation, setSelectedGameForVariation] = useState(null);
  const [generatedVariations, setGeneratedVariations] = useState(null);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Similar games state
  const [similarGames, setSimilarGames] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  // Check AI status on mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const response = await api.get('/ai/status');
      setAiStatus(response.data);
    } catch (err) {
      setAiStatus({ available: true, provider: 'template', features: { gameGeneration: true } });
    }
  };

  // Check for duplicates when a game is generated
  const checkForDuplicates = useCallback(async (game) => {
    if (!game) return;
    setCheckingDuplicates(true);
    try {
      const response = await api.post('/ai/check-duplicates', {
        name: game.name,
        topPlayer: game.topPlayer,
        bottomPlayer: game.bottomPlayer,
        skills: game.skills
      });
      if (response.data.hasDuplicates || response.data.hasSimilar) {
        setDuplicateWarning(response.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Failed to check duplicates:', err);
      setDuplicateWarning(null);
    } finally {
      setCheckingDuplicates(false);
    }
  }, []);

  // Generate skill level variations (only missing levels)
  const generateVariations = async (game) => {
    // Calculate missing levels
    const getBaseName = (name) => name.replace(/^(Beginner: |Advanced: )/, '').trim();
    const baseName = getBaseName(game.name);
    const relatedGames = games.filter(g => getBaseName(g.name) === baseName);
    const existingLevels = relatedGames.map(g => g.difficulty || 'intermediate');
    const missingLevels = ['beginner', 'intermediate', 'advanced'].filter(
      level => !existingLevels.includes(level)
    );

    if (missingLevels.length === 0) {
      showToast('All variations already exist!', 'info');
      return;
    }

    setLoadingVariations(true);
    try {
      const response = await api.post('/ai/generate-variations', {
        game,
        missingLevels
      });
      setGeneratedVariations(response.data.allVariations);
      showToast(`Generated ${missingLevels.length} variation(s)!`, 'success');
      // Auto-scroll to show variations
      setTimeout(() => {
        const variationsSection = document.getElementById('generated-variations');
        if (variationsSection) {
          variationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      showToast('Failed to generate variations', 'error');
    } finally {
      setLoadingVariations(false);
    }
  };

  // Find similar games in library
  const findSimilarGames = async () => {
    setLoadingSimilar(true);
    try {
      const response = await api.get('/ai/find-similar');
      setSimilarGames(response.data);
    } catch (err) {
      showToast('Failed to find similar games', 'error');
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Handle delete game from duplicates
  const handleDeleteDuplicate = (game) => {
    setGameToDelete(game);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDuplicate = async () => {
    if (!gameToDelete) return;

    setDeletingGameId(gameToDelete._id);
    try {
      const result = await deleteGame(gameToDelete._id);
      if (result?.success !== false) {
        showToast(`"${gameToDelete.name}" deleted`, 'success');
        // Refresh the similar games list
        findSimilarGames();
        fetchGames();
      }
    } catch (err) {
      showToast('Failed to delete game', 'error');
    } finally {
      setDeletingGameId(null);
      setShowDeleteConfirm(false);
      setGameToDelete(null);
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
    setSearchResult(null);

    try {
      const response = await api.post('/ai/generate', { prompt });
      const { game, source } = response.data;

      setGeneratedGame(game);
      setGenerationSource(source);
      setEditMode(false);
      setDuplicateWarning(null);

      // Check for duplicates
      checkForDuplicates(game);

      if (source === 'claude') {
        showToast('Game generated with Claude AI (Anthropic)', 'success');
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

  // Search for BJJ solutions
  const searchSolutions = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a question or problem', 'warning');
      return;
    }

    setLoading(true);
    setGeneratedGame(null);
    setGenerationSource(null);

    try {
      const response = await api.post('/ai/search', { query: prompt });
      setSearchResult(response.data);
      showToast('Search completed with Claude AI', 'success');
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 400) {
        showToast('AI search requires Anthropic API key', 'warning');
      } else {
        showToast('Search failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert a drill from search results to a full game
  const convertDrillToGame = async (drill) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/suggest-game', { drill, context: prompt });
      const { game, source } = response.data;

      setGeneratedGame(game);
      setGenerationSource(source);
      setSearchResult(null);
      setMode('generate');

      showToast('Drill converted to training game!', 'success');
    } catch (error) {
      showToast('Failed to convert drill', 'error');
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
    if (mode === 'generate') {
      generateGame();
    } else {
      searchSolutions();
    }
  };

  const handleSubmit = () => {
    if (mode === 'generate') {
      generateGame();
    } else {
      searchSolutions();
    }
  };

  const getSourceBadge = (source) => {
    if (source === 'claude') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z"/>
          </svg>
          Anthropic Claude
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clipRule="evenodd" />
        </svg>
        Template
      </span>
    );
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
            Generate games or search for BJJ solutions
          </p>
          {aiStatus && getSourceBadge(aiStatus.provider)}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => {
            setMode('generate');
            setSearchResult(null);
            setSimilarGames(null);
          }}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'generate'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1z" />
            <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Generate</span>
        </button>
        <button
          onClick={() => {
            setMode('variations');
            setGeneratedGame(null);
            setSearchResult(null);
            setGeneratedVariations(null);
          }}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'variations'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" />
          </svg>
          <span className="hidden sm:inline">Variations</span>
        </button>
        <button
          onClick={() => {
            setMode('manage');
            setGeneratedGame(null);
            setSearchResult(null);
            findSimilarGames();
          }}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'manage'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
          </svg>
          <span className="hidden sm:inline">Duplicates</span>
        </button>
        <button
          onClick={() => {
            setMode('search');
            setGeneratedGame(null);
            setSimilarGames(null);
          }}
          disabled={aiStatus?.provider !== 'claude'}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'search'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          } ${aiStatus?.provider !== 'claude' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Input Section - only for generate and search modes */}
      {(mode === 'generate' || mode === 'search') && (
      <div className="card p-6 mb-6">
        <label className="label">
          {mode === 'generate'
            ? 'What problem or skill do you want to develop?'
            : 'What BJJ question or problem do you need help with?'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'generate'
            ? 'Describe the problem you want to solve or skill you want to develop...'
            : 'Ask about techniques, positions, escapes, submissions, or training problems...'}
          rows={3}
          className="input resize-none mb-4"
        />

        {/* Example prompts */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {(mode === 'generate' ? examplePrompts : exampleSearches).map((example, idx) => (
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
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner mr-2" />
              {mode === 'generate'
                ? (aiStatus?.provider === 'claude' ? 'Generating with Claude...' : 'Generating...')
                : 'Searching with Claude...'}
            </>
          ) : (
            <>
              {mode === 'generate' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1z" />
                    <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
                  </svg>
                  Generate Game
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  Search
                </>
              )}
            </>
          )}
        </button>
      </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search Results
              </h2>
              {getSourceBadge('claude')}
            </div>
            <button
              onClick={() => setSearchResult(null)}
              className="btn-ghost text-sm text-gray-500"
            >
              Clear
            </button>
          </div>

          {/* Summary */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg mb-4">
            <h3 className="font-medium text-primary-700 dark:text-primary-300 mb-1">Summary</h3>
            <p className="text-sm text-primary-900 dark:text-primary-100">
              {searchResult.result.summary}
            </p>
          </div>

          {/* Analysis */}
          {searchResult.result.analysis && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchResult.result.analysis}
              </p>
            </div>
          )}

          {/* Techniques */}
          {searchResult.result.techniques?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Key Techniques</h3>
              <div className="flex flex-wrap gap-2">
                {searchResult.result.techniques.map((tech, idx) => (
                  <span key={idx} className="chip">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drills - can convert to games */}
          {searchResult.result.drills?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Suggested Drills & Games
              </h3>
              <div className="space-y-3">
                {searchResult.result.drills.map((drill, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {drill.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {drill.description}
                        </p>
                        {drill.focus && (
                          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                            Focus: {drill.focus}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => convertDrillToGame(drill)}
                        disabled={loading}
                        className="btn-secondary text-xs whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                          <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                        </svg>
                        Create Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {searchResult.result.commonMistakes?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Common Mistakes to Avoid</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {searchResult.result.commonMistakes.map((mistake, idx) => (
                  <li key={idx}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progressions */}
          {searchResult.result.progressions?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Progressions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {searchResult.result.progressions.map((prog, idx) => (
                  <li key={idx}>{prog}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Related Topics */}
          {searchResult.result.relatedTopics?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {searchResult.result.relatedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(topic);
                      searchSolutions();
                    }}
                    className="chip text-xs hover:bg-primary-100 dark:hover:bg-primary-900/30"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Game Preview */}
      {generatedGame && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generated Game
              </h2>
              {generationSource && getSourceBadge(generationSource)}
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

          {/* Duplicate Warning */}
          {duplicateWarning && (duplicateWarning.hasDuplicates || duplicateWarning.hasSimilar) && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    {duplicateWarning.hasDuplicates ? 'Potential Duplicate Found!' : 'Similar Games Exist'}
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {duplicateWarning.hasDuplicates
                      ? 'This game appears to already exist in your library.'
                      : 'You have similar games that might serve the same purpose.'}
                  </p>
                  <div className="mt-3 space-y-2">
                    {[...duplicateWarning.duplicates, ...duplicateWarning.similar].slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.game.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.similarity}% similar • {item.reason}
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          item.type === 'duplicate'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {item.type === 'duplicate' ? 'Duplicate' : 'Similar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Variations Button */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => generateVariations(generatedGame)}
              disabled={loadingVariations}
              className="btn-secondary text-sm flex-1"
            >
              {loadingVariations ? (
                <>
                  <span className="spinner mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" />
                  </svg>
                  Generate Skill Variations
                </>
              )}
            </button>
          </div>

          {/* Skill Level Variations */}
          {generatedVariations && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Skill Level Variations</h4>
              <div className="grid gap-3">
                {['beginner', 'intermediate', 'advanced'].map(level => {
                  const variation = generatedVariations[level];
                  if (!variation) return null;
                  return (
                    <div key={level} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {variation.name}
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            const result = await createGame(variation);
                            if (result.success) {
                              showToast(`${level} variation added to library!`, 'success');
                            }
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          Add to Library
                        </button>
                      </div>
                      {variation.aiMetadata?.pedagogicalNote && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {variation.aiMetadata.pedagogicalNote}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAddToLibrary}
              className={`btn-primary w-full ${duplicateWarning?.hasDuplicates ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              {duplicateWarning?.hasDuplicates ? 'Add Anyway' : 'Add to Library'}
            </button>
          </div>
        </div>
      )}

      {/* Variations Mode */}
      {mode === 'variations' && (
        <div className="space-y-6">
          {/* Games Needing Variations Section */}
          {(() => {
            // Find games that are missing variations
            const getBaseName = (name) => name.replace(/^(Beginner: |Advanced: )/, '').trim();
            const gamesWithVariationStatus = games?.map(game => {
              const baseName = getBaseName(game.name);
              const relatedGames = games.filter(g => getBaseName(g.name) === baseName);
              const existingLevels = relatedGames.map(g => g.difficulty || 'intermediate');
              const missingLevels = ['beginner', 'intermediate', 'advanced'].filter(
                level => !existingLevels.includes(level)
              );
              return { ...game, baseName, existingLevels, missingLevels, relatedCount: relatedGames.length };
            }) || [];

            // Group by base name and find games needing variations
            const uniqueBaseGames = [];
            const seenBaseNames = new Set();
            gamesWithVariationStatus.forEach(game => {
              if (!seenBaseNames.has(game.baseName) && game.missingLevels.length > 0) {
                seenBaseNames.add(game.baseName);
                uniqueBaseGames.push(game);
              }
            });

            const gamesNeedingVariations = uniqueBaseGames.slice(0, 5);

            return gamesNeedingVariations.length > 0 && (
              <div className="card p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-medium text-gray-900 dark:text-white">Games Needing Variations</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  These games only have {gamesNeedingVariations[0]?.relatedCount === 1 ? 'one difficulty level' : 'some difficulty levels'}. Add variations to serve all skill levels.
                </p>
                <div className="space-y-2">
                  {gamesNeedingVariations.map(game => (
                    <button
                      key={game._id}
                      onClick={() => {
                        setSelectedGameForVariation(game);
                        setGeneratedVariations(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedGameForVariation?._id === game._id
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{game.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Has:</span>
                            {game.existingLevels.map(level => (
                              <span key={level} className={`text-xs px-1.5 py-0.5 rounded ${
                                level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                level === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {level}
                              </span>
                            ))}
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">Missing:</span>
                            {game.missingLevels.map(level => (
                              <span key={level} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {level}
                              </span>
                            ))}
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Generate Skill Level Variations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create beginner and advanced versions of your games. Only missing difficulty levels will be generated.
            </p>

            {/* Game selector */}
            <div className="mb-4">
              <label className="label">Select a Game</label>
              <select
                value={selectedGameForVariation?._id || ''}
                onChange={(e) => {
                  const game = games?.find(g => g._id === e.target.value);
                  setSelectedGameForVariation(game);
                  setGeneratedVariations(null);
                }}
                className="input"
              >
                <option value="">Choose a game...</option>
                {games?.map(game => (
                  <option key={game._id} value={game._id}>
                    {game.name} ({game.difficulty || 'intermediate'})
                  </option>
                ))}
              </select>
            </div>

            {selectedGameForVariation && (() => {
              const getBaseName = (name) => name.replace(/^(Beginner: |Advanced: )/, '').trim();
              const baseName = getBaseName(selectedGameForVariation.name);
              const relatedGames = games.filter(g => getBaseName(g.name) === baseName);
              const existingLevels = relatedGames.map(g => g.difficulty || 'intermediate');
              const missingLevels = ['beginner', 'intermediate', 'advanced'].filter(
                level => !existingLevels.includes(level)
              );

              return (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedGameForVariation.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`badge badge-${selectedGameForVariation.topic}`}>
                        {selectedGameForVariation.topic}
                      </span>
                    </div>

                    {/* Variation status */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Existing levels:</span>
                      {['beginner', 'intermediate', 'advanced'].map(level => {
                        const exists = existingLevels.includes(level);
                        return (
                          <span
                            key={level}
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                              exists
                                ? level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  level === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                            }`}
                          >
                            {exists && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                              </svg>
                            )}
                            {level}
                          </span>
                        );
                      })}
                    </div>

                    {missingLevels.length === 0 ? (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        All difficulty levels exist for this game!
                      </p>
                    ) : (
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Will generate: {missingLevels.join(', ')} variations
                      </p>
                    )}

                    {selectedGameForVariation.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedGameForVariation.skills.map((skill, idx) => (
                          <span key={idx} className="chip text-xs">#{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => generateVariations(selectedGameForVariation)}
                    disabled={loadingVariations || missingLevels.length === 0}
                    className="btn-primary w-full"
                  >
                    {loadingVariations ? (
                      <>
                        <span className="spinner mr-2" />
                        Generating {missingLevels.length} Variation{missingLevels.length !== 1 ? 's' : ''}...
                      </>
                    ) : missingLevels.length === 0 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        All Variations Complete
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                          <path d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" />
                        </svg>
                        Generate Missing Variations ({missingLevels.length})
                      </>
                    )}
                  </button>
                </>
              );
            })()}

            {/* Generated Variations Display - Review before adding */}
            {generatedVariations && (
              <div id="generated-variations" className="mt-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">Review Generated Variations</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Click "Add to Library" to save each one
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  Review each variation below. Only add the ones that look good to your library.
                </p>

                {['beginner', 'intermediate', 'advanced'].map(level => {
                  const variation = generatedVariations[level];
                  if (!variation) return null;

                  // Check if this level already exists
                  const getBaseName = (name) => name.replace(/^(Beginner: |Advanced: )/, '').trim();
                  const baseName = selectedGameForVariation ? getBaseName(selectedGameForVariation.name) : '';
                  const alreadyExists = games.some(g =>
                    getBaseName(g.name) === baseName && (g.difficulty || 'intermediate') === level
                  );

                  if (alreadyExists) return null;

                  const levelColors = {
                    beginner: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
                    intermediate: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
                    advanced: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-500', text: 'text-red-700 dark:text-red-400' }
                  };
                  const colors = levelColors[level];

                  return (
                    <div key={level} className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${colors.badge}`} />
                            <span className={`text-sm font-semibold uppercase ${colors.text}`}>
                              {level} Version
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded">
                              NEW
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {variation.name}
                          </h4>
                        </div>
                      </div>

                      {variation.aiMetadata?.pedagogicalNote && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                          "{variation.aiMetadata.pedagogicalNote}"
                        </p>
                      )}

                      {/* Show key differences */}
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs font-medium text-gray-500 mb-1">Top Player Focus:</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                            {variation.topPlayer?.split('\n\n')[1] || variation.topPlayer?.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs font-medium text-gray-500 mb-1">Bottom Player Focus:</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                            {variation.bottomPlayer?.split('\n\n')[1] || variation.bottomPlayer?.substring(0, 100)}...
                          </p>
                        </div>
                      </div>

                      {variation.aiMetadata?.constraints && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Constraints:</p>
                          <div className="flex flex-wrap gap-1">
                            {variation.aiMetadata.constraints.slice(0, 4).map((c, i) => (
                              <span key={i} className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={async () => {
                            const result = await createGame(variation);
                            if (result.success) {
                              showToast(`${level.charAt(0).toUpperCase() + level.slice(1)} version added!`, 'success');
                              // Remove this variation from the generated list
                              setGeneratedVariations(prev => {
                                const updated = { ...prev };
                                delete updated[level];
                                // If all variations are added, clear
                                if (Object.keys(updated).length === 0) return null;
                                return updated;
                              });
                              fetchGames();
                            }
                          }}
                          className="btn-primary flex-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                          Add to Library
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedVariations(prev => {
                              const updated = { ...prev };
                              delete updated[level];
                              if (Object.keys(updated).length === 0) return null;
                              return updated;
                            });
                            showToast(`${level} variation discarded`, 'info');
                          }}
                          className="btn-ghost text-gray-500"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Show when all variations have been processed */}
                {generatedVariations && Object.keys(generatedVariations).every(level => {
                  const getBaseName = (name) => name.replace(/^(Beginner: |Advanced: )/, '').trim();
                  const baseName = selectedGameForVariation ? getBaseName(selectedGameForVariation.name) : '';
                  return games.some(g => getBaseName(g.name) === baseName && (g.difficulty || 'intermediate') === level);
                }) && (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 mx-auto text-green-500 mb-2">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <p className="font-medium text-green-700 dark:text-green-400">All variations complete!</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Select another game to continue.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Management Mode */}
      {mode === 'manage' && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Find Similar & Duplicate Games
            </h2>
            <button
              onClick={findSimilarGames}
              disabled={loadingSimilar}
              className="btn-secondary text-sm"
            >
              {loadingSimilar ? (
                <>
                  <span className="spinner mr-1" />
                  Scanning...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                  Rescan
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Review games that might be duplicates or very similar. Consider merging or removing redundant games.
          </p>

          {loadingSimilar ? (
            <div className="text-center py-12">
              <span className="spinner mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Analyzing your game library...</p>
            </div>
          ) : similarGames ? (
            similarGames.groups.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{similarGames.totalGames} games in library</span>
                  <span>{similarGames.totalGroups} groups of similar games found</span>
                </div>

                {similarGames.groups.map((group, groupIdx) => (
                  <div key={groupIdx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-500">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {group.similar.length + 1} similar games
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete all ${group.similar.length} similar games and keep only "${group.primary.name}"?`)) {
                            for (const similar of group.similar) {
                              await deleteGame(similar._id);
                            }
                            showToast(`Deleted ${group.similar.length} duplicate games`, 'success');
                            findSimilarGames();
                            fetchGames();
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove All Duplicates
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Primary game */}
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-primary-300 dark:border-primary-700">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {group.primary.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs badge badge-${group.primary.topic}`}>
                              {group.primary.topic}
                            </span>
                            {group.primary.difficulty && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {group.primary.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded">
                          Keep
                        </span>
                      </div>

                      {/* Similar games */}
                      {group.similar.map((similar, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {similar.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs badge badge-${similar.topic}`}>
                                {similar.topic}
                              </span>
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                {similar.similarity}% similar
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/games?edit=${similar._id}`)}
                              className="text-xs text-gray-500 hover:text-primary-500 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteDuplicate(similar)}
                              disabled={deletingGameId === similar._id}
                              className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                              {deletingGameId === similar._id ? (
                                <span className="spinner-sm" />
                              ) : (
                                'Delete'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No duplicates found!</p>
                <p className="text-sm mt-1">Your game library looks clean.</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Click "Rescan" to analyze your game library</p>
            </div>
          )}
        </div>
      )}

      {/* Info section */}
      {!generatedGame && !searchResult && mode !== 'variations' && mode !== 'manage' && (
        <div className="card p-6 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            {mode === 'generate' ? 'About Constraint-Led Training' : 'About AI Search'}
          </h3>

          {mode === 'generate' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Claude AI can help you with:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Finding solutions to specific grappling problems
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Learning new techniques and their applications
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Discovering drills to improve specific skills
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Converting advice into structured training games
                </li>
              </ul>
            </>
          )}

          {aiStatus && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                {aiStatus.provider === 'claude' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Powered by Anthropic Claude AI for intelligent generation & search
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Using template-based generation. Add ANTHROPIC_API_KEY for AI-powered features.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                Delete Game?
              </h3>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{gameToDelete?.name || 'this game'}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setGameToDelete(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDuplicate}
                  disabled={deletingGameId}
                  className="btn-danger flex-1"
                >
                  {deletingGameId ? (
                    <>
                      <span className="spinner mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
