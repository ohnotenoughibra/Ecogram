import { useState } from 'react';
import { useApp } from '../context/AppContext';

const examplePrompts = [
  "Create a game to improve guard retention against pressure passers",
  "Design a constraint game for developing hip escapes from bottom side control",
  "Make a game focusing on arm drag setups from seated guard",
  "Create a positional sparring game for back control with submission threats"
];

const topics = [
  { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
  { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition / Scrambles', color: 'bg-green-500' }
];

export default function AIDesigner() {
  const { createGame, showToast } = useApp();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Generate a constraint-led game based on the prompt
  // This is a simulated AI generation - in production, this would call an AI API
  const generateGame = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a problem or focus area', 'warning');
      return;
    }

    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated AI-generated game based on ecological dynamics principles
    const game = generateConstraintLedGame(prompt);
    setGeneratedGame(game);
    setLoading(false);
    setEditMode(false);
  };

  const generateConstraintLedGame = (userPrompt) => {
    // Parse prompt for keywords to determine topic and constraints
    const promptLower = userPrompt.toLowerCase();

    let topic = 'transition';
    if (promptLower.includes('submit') || promptLower.includes('finish') || promptLower.includes('attack')) {
      topic = 'offensive';
    } else if (promptLower.includes('escape') || promptLower.includes('defend') || promptLower.includes('survival')) {
      topic = 'defensive';
    } else if (promptLower.includes('pass') || promptLower.includes('control') || promptLower.includes('pressure')) {
      topic = 'control';
    }

    // Generate game structure based on constraint-led approach
    const templates = {
      offensive: {
        startPosition: 'Back control with seatbelt grip',
        constraints: [
          'Attacker cannot re-hook legs once lost',
          'Defender can only escape to turtle (no full escape)',
          'Time limit: 2 minutes per round'
        ],
        winTop: 'Achieve submission or maintain position for full round',
        winBottom: 'Escape to turtle position 3 times',
        coaching: 'Focus on chest-to-back connection. Use the "squeeze and shift" principle for choke setups.',
        progressions: [
          'Start: Back with both hooks, rear naked choke hunting',
          'Intermediate: Add arm triangle and bow & arrow options',
          'Advanced: Start from body triangle with hand fighting'
        ],
        pedagogical: 'This game develops submission awareness under defensive pressure, aligned with ecological dynamics principles of perception-action coupling.',
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
        winBottom: 'Sweep to top position or submit (sweep only)',
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

    // Create game name from prompt
    const name = userPrompt.length > 50
      ? userPrompt.substring(0, 50) + '...'
      : userPrompt;

    return {
      name: `${name.charAt(0).toUpperCase() + name.slice(1)}`,
      topic,
      topPlayer: `Win condition: ${template.winTop}\n\nKey focus: Apply consistent pressure while hunting for the win condition.`,
      bottomPlayer: `Win condition: ${template.winBottom}\n\nKey focus: Stay calm, create space, and work systematically toward your goal.`,
      coaching: template.coaching,
      skills: template.skills,
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
      showToast('Game added to your library!', 'success');
    }
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate constraint-led training games using ecological dynamics principles
        </p>
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
              Generating...
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Game
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className="btn-secondary text-sm"
              >
                {editMode ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={() => setGeneratedGame(null)}
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

              <div>
                <label className="label">Topic</label>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <button
                      key={topic.value}
                      onClick={() => handleFieldChange('topic', topic.value)}
                      className={`chip ${generatedGame.topic === topic.value ? 'chip-active' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${topic.color}`} />
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Start Position</label>
                <input
                  type="text"
                  value={generatedGame.aiMetadata.startPosition}
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
            </div>
          ) : (
            // Preview mode
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {generatedGame.name}
                </h3>
                <span className={`badge badge-${generatedGame.topic}`}>
                  {topics.find(t => t.value === generatedGame.topic)?.label}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Position
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {generatedGame.aiMetadata.startPosition}
                </p>
              </div>

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

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  Coaching Notes
                </h4>
                <p className="text-sm text-green-900 dark:text-green-100">
                  {generatedGame.coaching}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  Pedagogical Note
                </h4>
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {generatedGame.aiMetadata.pedagogicalNote}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {generatedGame.skills.map((skill, idx) => (
                  <span key={idx} className="chip">
                    #{skill}
                  </span>
                ))}
              </div>
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
        </div>
      )}
    </div>
  );
}
