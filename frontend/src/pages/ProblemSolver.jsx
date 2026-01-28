import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

// Common problems coaches face - quick selection
const COMMON_PROBLEMS = [
  { id: 'guard_passed', label: 'Guard keeps getting passed', category: 'defensive', icon: '🛡️' },
  { id: 'cant_finish', label: "Can't finish submissions", category: 'offensive', icon: '🎯' },
  { id: 'stuck_bottom', label: 'Stuck on bottom, no sweeps', category: 'transition', icon: '🔄' },
  { id: 'loses_back', label: 'Loses back control quickly', category: 'control', icon: '🔙' },
  { id: 'takedown_defense', label: 'Gets taken down easily', category: 'defensive', icon: '🤼' },
  { id: 'scramble_loses', label: 'Loses every scramble', category: 'transition', icon: '💨' },
  { id: 'no_pressure', label: 'No pressure from top', category: 'control', icon: '⬇️' },
  { id: 'leg_lock_panic', label: 'Panics in leg lock situations', category: 'defensive', icon: '🦵' },
  { id: 'guard_pull_only', label: 'Only knows how to pull guard', category: 'transition', icon: '🧲' },
  { id: 'single_attack', label: 'Only has one attack', category: 'offensive', icon: '1️⃣' }
];

// Position-specific problems
const POSITION_PROBLEMS = {
  'Closed Guard': [
    'Getting posture broken constantly',
    'Can\'t break opponent\'s posture',
    'Armbar always gets defended',
    'No hip movement'
  ],
  'Half Guard': [
    'Can\'t establish underhook',
    'Gets flattened out',
    'No sweeps working',
    'Keeps getting passed'
  ],
  'Mount': [
    'Gets bucked off immediately',
    'Can\'t isolate arms',
    'Opponent keeps escaping',
    'No submissions from mount'
  ],
  'Side Control': [
    'Opponent always recovers guard',
    'Can\'t maintain pressure',
    'No progression to mount',
    'Gets reversed'
  ],
  'Back Control': [
    'Can\'t get hooks in',
    'Loses seatbelt grip',
    'Opponent escapes to guard',
    'RNC always defended'
  ],
  'Standing': [
    'No confidence in takedowns',
    'Always gets taken down',
    'Can\'t establish grips',
    'No game plan from feet'
  ]
};

export default function ProblemSolver() {
  const { showToast, createGame, fetchGames } = useApp();
  const [step, setStep] = useState('describe'); // describe, analyzing, results
  const [problemText, setProblemText] = useState('');
  const [selectedQuickProblem, setSelectedQuickProblem] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [addingGames, setAddingGames] = useState(false);
  const textareaRef = useRef(null);

  // Handle quick problem selection
  const selectQuickProblem = (problem) => {
    setSelectedQuickProblem(problem);
    setProblemText(problem.label);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle position-specific problem selection
  const selectPositionProblem = (position, problem) => {
    setSelectedPosition(position);
    setProblemText(`${position}: ${problem}`);
  };

  // Analyze the problem and get game suggestions
  const analyzeProblem = async () => {
    if (!problemText.trim()) {
      showToast('Please describe the problem first', 'error');
      return;
    }

    setLoading(true);
    setStep('analyzing');

    try {
      const response = await api.post('/ai/analyze-problem', {
        problem: problemText,
        category: selectedQuickProblem?.category,
        position: selectedPosition
      });

      setAnalysisResult(response.data);
      setStep('results');
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback to direct game generation
      try {
        const fallbackResponse = await api.post('/ai/smart-suggestions', {
          problemContext: problemText
        });
        setAnalysisResult({
          analysis: {
            rootCause: 'Based on your description, here are games that address this issue.',
            keySkills: ['problem-solving', 'adaptation'],
            claApproach: 'These games use constraints to guide discovery of solutions.'
          },
          games: fallbackResponse.data.suggestions.map(s => ({
            ...s,
            matchScore: 85
          }))
        });
        setStep('results');
      } catch (fallbackErr) {
        showToast('Failed to analyze problem. Please try again.', 'error');
        setStep('describe');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle game selection
  const toggleGameSelection = (game) => {
    setSelectedGames(prev => {
      const exists = prev.find(g => g.name === game.name);
      if (exists) {
        return prev.filter(g => g.name !== game.name);
      }
      return [...prev, game];
    });
  };

  // Add selected games to library
  const addSelectedGames = async () => {
    if (selectedGames.length === 0) {
      showToast('Select at least one game to add', 'error');
      return;
    }

    setAddingGames(true);
    let added = 0;

    for (const game of selectedGames) {
      try {
        // Generate full game from the suggestion
        const response = await api.post('/ai/generate', {
          prompt: game.prompt || `${game.name}: ${game.description}`,
          context: `Solving problem: ${problemText}`,
          suggestionType: game.type
        });

        await createGame({
          ...response.data.game,
          topic: game.topic || 'transition'
        });
        added++;
      } catch (err) {
        console.error('Failed to add game:', game.name, err);
      }
    }

    setAddingGames(false);

    if (added > 0) {
      showToast(`Added ${added} game${added > 1 ? 's' : ''} to your library!`, 'success');
      fetchGames();
      // Reset for new problem
      setSelectedGames([]);
    }
  };

  // Reset to start
  const startOver = () => {
    setStep('describe');
    setProblemText('');
    setSelectedQuickProblem(null);
    setSelectedPosition(null);
    setAnalysisResult(null);
    setSelectedGames([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-3xl">🩺</span>
          Problem Solver
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Describe what your students struggle with. AI will suggest targeted games.
        </p>
      </div>

      {/* Step 1: Describe the problem */}
      {step === 'describe' && (
        <div className="space-y-6">
          {/* Quick problems */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Common Problems (tap to select)
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_PROBLEMS.map(problem => (
                <button
                  key={problem.id}
                  onClick={() => selectQuickProblem(problem)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedQuickProblem?.id === problem.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{problem.icon}</span>
                  {problem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position-specific problems */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Or select by position
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(POSITION_PROBLEMS).map(([position, problems]) => (
                <div key={position} className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {position}
                  </p>
                  {problems.slice(0, 2).map(problem => (
                    <button
                      key={problem}
                      onClick={() => selectPositionProblem(position, problem)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        problemText === `${position}: ${problem}`
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {problem}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Free-form description */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Describe the problem in your own words
            </h3>
            <textarea
              ref={textareaRef}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="e.g., My students always get their guard passed when the opponent stands up. They don't know how to track the hips or create angles..."
              className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              The more detail you provide, the better the AI can understand and help.
            </p>
          </div>

          {/* Analyze button */}
          <button
            onClick={analyzeProblem}
            disabled={!problemText.trim()}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
              <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 14a4 4 0 100-8 4 4 0 000 8zm0-1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
            Find Solutions
          </button>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === 'analyzing' && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing the Problem
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Looking at root causes and finding targeted games...
          </p>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'results' && analysisResult && (
        <div className="space-y-6">
          {/* Problem summary */}
          <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span>🔍</span> Problem Analysis
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              {problemText}
            </p>
          </div>

          {/* AI Analysis */}
          {analysisResult.analysis && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>🧠</span> Root Cause Analysis
              </h3>

              <div className="space-y-3">
                {analysisResult.analysis.rootCause && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Root Cause
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      {analysisResult.analysis.rootCause}
                    </p>
                  </div>
                )}

                {analysisResult.analysis.keySkills && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Key Skills to Develop
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.keySkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.analysis.claApproach && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      CLA Approach
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {analysisResult.analysis.claApproach}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Games */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🎮</span> Recommended Games
              </h3>
              <span className="text-xs text-gray-500">
                Select games to add to your library
              </span>
            </div>

            <div className="space-y-3">
              {(analysisResult.games || analysisResult.suggestions || []).map((game, index) => {
                const isSelected = selectedGames.find(g => g.name === game.name);
                return (
                  <div
                    key={index}
                    onClick={() => toggleGameSelection(game)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Game info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {game.name}
                          </p>
                          {game.matchScore && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              {game.matchScore}% match
                            </span>
                          )}
                          {game.type && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded uppercase">
                              {game.type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {game.description}
                        </p>
                        {game.reasoning && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                            {game.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={startOver}
              className="btn-secondary flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
              </svg>
              New Problem
            </button>
            <button
              onClick={addSelectedGames}
              disabled={selectedGames.length === 0 || addingGames}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {addingGames ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add {selectedGames.length} Game{selectedGames.length !== 1 ? 's' : ''} to Library
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
