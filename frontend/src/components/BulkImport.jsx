import { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

export default function BulkImport({ isOpen, onClose }) {
  const { showToast, createGame, fetchGames } = useApp();
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [parsedGames, setParsedGames] = useState([]);
  const [step, setStep] = useState('input'); // input, review, importing
  const [importProgress, setImportProgress] = useState(0);

  const sampleFormats = [
    {
      name: 'Simple Text',
      example: `Guard Retention Drill - Focus on hip movement and frames
Back Attack Series - RNC hunting with seatbelt control
Leg Lock Entry Game - Inside sankaku entries from open guard`
    },
    {
      name: 'JSON Array',
      example: `[
  {"name": "Guard Retention", "topic": "defensive", "description": "Hip movement drill"},
  {"name": "Back Attacks", "topic": "offensive", "description": "RNC from body triangle"}
]`
    },
    {
      name: 'Detailed Description',
      example: `Create a game where top player tries to pass butterfly guard while bottom player sweeps using hooks.
Focus on underhook battles and timing. Good for intermediate level students who struggle with butterfly sweeps.`
    }
  ];

  const handleParse = async () => {
    if (!inputText.trim()) {
      showToast('Please enter game descriptions', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/ai/bulk-parse', {
        input: inputText
      });

      if (response.data.games && response.data.games.length > 0) {
        setParsedGames(response.data.games);
        setStep('review');
      } else {
        showToast('Could not parse any games from the input. Try a different format.', 'error');
      }
    } catch (err) {
      console.error('Parse error:', err);
      showToast('Failed to parse games. Please check your input format.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedGames.length === 0) {
      showToast('No games to import', 'error');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    let imported = 0;
    for (let i = 0; i < parsedGames.length; i++) {
      const game = parsedGames[i];
      try {
        // Generate full game from parsed data
        const response = await api.post('/ai/generate', {
          prompt: game.prompt || `${game.name}: ${game.description || game.topPlayer || ''}`,
          context: `Bulk import game. Topic: ${game.topic || 'transition'}`,
          temperature: 0.7
        });

        await createGame({
          ...response.data.game,
          topic: game.topic || response.data.game.topic || 'transition'
        });
        imported++;
      } catch (err) {
        console.error('Failed to import game:', game.name, err);
      }
      setImportProgress(Math.round(((i + 1) / parsedGames.length) * 100));
    }

    fetchGames();
    showToast(`Successfully imported ${imported} of ${parsedGames.length} games!`, 'success');
    handleClose();
  };

  const handleRemoveGame = (index) => {
    setParsedGames(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateGame = (index, field, value) => {
    setParsedGames(prev => prev.map((game, i) =>
      i === index ? { ...game, [field]: value } : game
    ));
  };

  const handleClose = () => {
    setInputText('');
    setParsedGames([]);
    setStep('input');
    setImportProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">📥</span>
              Bulk Import Games
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {step === 'input' && 'Paste game descriptions in any format - AI will format them'}
              {step === 'review' && `Review ${parsedGames.length} parsed games before importing`}
              {step === 'importing' && 'Importing games...'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Format Examples */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supported Formats
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {sampleFormats.map((format, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(format.example)}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click a format to see an example. AI will understand most text descriptions, lists, or JSON.
                </p>
              </div>

              {/* Input textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your game descriptions
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste game descriptions here...

Examples:
- Simple list of game names and descriptions
- JSON array of game objects
- Detailed paragraph descriptions
- Notes from your notebook
- Content from other sources"
                  className="w-full h-64 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inputText.length} characters
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 'review' && (
            <div className="space-y-3">
              {parsedGames.map((game, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={game.name}
                        onChange={(e) => handleUpdateGame(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex gap-2">
                        <select
                          value={game.topic || 'transition'}
                          onChange={(e) => handleUpdateGame(idx, 'topic', e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded"
                        >
                          <option value="offensive">Offensive</option>
                          <option value="defensive">Defensive</option>
                          <option value="control">Control</option>
                          <option value="transition">Transition</option>
                        </select>
                        <select
                          value={game.difficulty || 'intermediate'}
                          onChange={(e) => handleUpdateGame(idx, 'difficulty', e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      {game.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {game.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveGame(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {parsedGames.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  All games removed. Go back to add more.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Importing Games
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                AI is generating full game details...
              </p>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{importProgress}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {step === 'input' && (
            <>
              <button onClick={handleClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!inputText.trim() || processing}
                className="btn-primary disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1z" />
                    </svg>
                    Parse with AI
                  </>
                )}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button onClick={() => setStep('input')} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={parsedGames.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Import {parsedGames.length} Game{parsedGames.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {step === 'importing' && (
            <div className="w-full text-center text-sm text-gray-500">
              Please wait while games are being generated...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
