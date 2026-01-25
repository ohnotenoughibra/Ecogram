import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';
import api from '../utils/api';

const topicColors = {
  offensive: '#ef4444',
  defensive: '#3b82f6',
  control: '#a855f7',
  transition: '#22c55e'
};

const topicLabels = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  control: 'Control',
  transition: 'Transition'
};

export default function CompetitionPrep() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    weightClass: '',
    targetWeight: '',
    division: 'nogi',
    category: 'intermediate',
    focusAreas: [],
    gameplan: ''
  });
  const [weightEntry, setWeightEntry] = useState({ weight: '', notes: '' });

  useEffect(() => {
    fetchActiveCompetition();
  }, []);

  const fetchActiveCompetition = async () => {
    try {
      const response = await api.get('/competitions/active');
      setCompetition(response.data);
      if (response.data?._id) {
        fetchRecommendedGames(response.data._id);
      }
    } catch (error) {
      console.error('Failed to fetch competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedGames = async (compId) => {
    try {
      const response = await api.get(`/competitions/${compId}/recommended-games`);
      setRecommendedGames(response.data);
    } catch (error) {
      console.error('Failed to fetch recommended games:', error);
    }
  };

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/competitions', {
        ...formData,
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null
      });
      setCompetition(response.data);
      setShowCreateModal(false);
      showToast('Competition created!', 'success');
      fetchRecommendedGames(response.data._id);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create competition', 'error');
    }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!competition) return;

    try {
      const response = await api.post(`/competitions/${competition._id}/weight`, {
        weight: parseFloat(weightEntry.weight),
        notes: weightEntry.notes
      });
      setCompetition(response.data);
      setWeightEntry({ weight: '', notes: '' });
      setShowWeightModal(false);
      showToast('Weight logged!', 'success');
    } catch (error) {
      showToast('Failed to log weight', 'error');
    }
  };

  const handleUpdateGameplan = async (gameplan) => {
    if (!competition) return;

    try {
      const response = await api.put(`/competitions/${competition._id}`, { gameplan });
      setCompetition(response.data);
    } catch (error) {
      showToast('Failed to save gameplan', 'error');
    }
  };

  const toggleFocusArea = (topic) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(topic)
        ? prev.focusAreas.filter(t => t !== topic)
        : [...prev.focusAreas, topic]
    }));
  };

  const getDaysUntil = () => {
    if (!competition?.date) return null;
    const now = new Date();
    const compDate = new Date(competition.date);
    const diffTime = compDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getWeightProgress = () => {
    if (!competition?.targetWeight || !competition?.weightLog?.length) return null;
    const currentWeight = competition.weightLog[competition.weightLog.length - 1].weight;
    const diff = currentWeight - competition.targetWeight;
    return { current: currentWeight, target: competition.targetWeight, diff };
  };

  if (loading) {
    return <Loading text="Loading competition..." />;
  }

  const daysUntil = getDaysUntil();
  const weightProgress = getWeightProgress();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-yellow-500">
              <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1zM2.525 4.422C3.012 4.3 3.504 4.19 4 4.09V5c0 .74.134 1.448.38 2.103a3.503 3.503 0 01-1.855-2.68zm14.95 0a3.503 3.503 0 01-1.854 2.68C15.866 6.449 16 5.74 16 5v-.91c.496.099.988.21 1.475.332z" clipRule="evenodd" />
            </svg>
            Competition Prep
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Focused training for your upcoming competition
          </p>
        </div>
        {!competition && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add Competition
          </button>
        )}
      </div>

      {!competition ? (
        /* No active competition */
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-yellow-500">
              <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1zM2.525 4.422C3.012 4.3 3.504 4.19 4 4.09V5c0 .74.134 1.448.38 2.103a3.503 3.503 0 01-1.855-2.68zm14.95 0a3.503 3.503 0 01-1.854 2.68C15.866 6.449 16 5.74 16 5v-.91c.496.099.988.21 1.475.332z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Active Competition
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Set up your upcoming competition to get a countdown timer, weight tracking, and focused training recommendations.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add Competition
          </button>
        </div>
      ) : (
        <>
          {/* Countdown & Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
              <p className="text-4xl font-bold text-yellow-600">{daysUntil || '?'}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">Days Until</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{competition.division?.toUpperCase()}</p>
              <p className="text-sm text-gray-500">Division</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{competition.weightClass || '-'}</p>
              <p className="text-sm text-gray-500">Weight Class</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{competition.category}</p>
              <p className="text-sm text-gray-500">Category</p>
            </div>
          </div>

          {/* Competition Info */}
          <div className="card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{competition.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {new Date(competition.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {competition.location && ` • ${competition.location}`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('End competition prep mode?')) {
                    api.put(`/competitions/${competition._id}`, { status: 'completed' })
                      .then(() => {
                        setCompetition(null);
                        showToast('Competition marked as complete', 'success');
                      });
                  }
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                End Prep
              </button>
            </div>

            {/* Focus Areas */}
            {competition.focusAreas?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-500">Focus:</span>
                {competition.focusAreas.map(topic => (
                  <span
                    key={topic}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: topicColors[topic] }}
                  >
                    {topicLabels[topic]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Weight Tracking */}
          {competition.targetWeight && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-500">
                    <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8zm-6.828 2.828a.75.75 0 010 1.061L6.11 12.95a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm6.594 0a.75.75 0 011.061 0l1.06 1.06a.75.75 0 11-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zM10 14a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 14z" clipRule="evenodd" />
                  </svg>
                  Weight Tracking
                </h3>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="btn-secondary text-sm"
                >
                  Log Weight
                </button>
              </div>

              {weightProgress ? (
                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Current</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {weightProgress.current} <span className="text-lg text-gray-400">kg</span>
                      </p>
                    </div>
                    <div className="flex-1">
                      <svg viewBox="0 0 100 20" className="w-full h-6 text-gray-200 dark:text-gray-700">
                        <line x1="10" y1="10" x2="90" y2="10" stroke="currentColor" strokeWidth="2" />
                        <circle cx="90" cy="10" r="4" fill="#22c55e" />
                        <text x="90" y="5" textAnchor="middle" fontSize="6" fill="#22c55e">
                          {weightProgress.target}
                        </text>
                      </svg>
                    </div>
                    <div className={`text-right ${weightProgress.diff <= 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      <p className="text-sm">{weightProgress.diff <= 0 ? 'On target!' : 'To lose'}</p>
                      <p className="text-2xl font-bold">
                        {weightProgress.diff > 0 ? `${weightProgress.diff.toFixed(1)}` : '0'} kg
                      </p>
                    </div>
                  </div>

                  {/* Weight log history */}
                  {competition.weightLog?.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 mb-2">Recent entries</p>
                      <div className="space-y-1">
                        {competition.weightLog.slice(-5).reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{new Date(entry.date).toLocaleDateString()}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{entry.weight} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No weight entries yet</p>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="text-primary-600 text-sm mt-2"
                  >
                    Log your first weigh-in
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Gameplan */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-500">
                <path d="M5.127 3.502L5.25 3.5h9.5c.041 0 .082 0 .123.002A2.251 2.251 0 0012.75 2h-5.5a2.25 2.25 0 00-2.123 1.502zM1 10.25A2.25 2.25 0 013.25 8h13.5A2.25 2.25 0 0119 10.25v5.5A2.25 2.25 0 0116.75 18H3.25A2.25 2.25 0 011 15.75v-5.5zM3.25 6.5c-.04 0-.082 0-.123.002A2.25 2.25 0 015.25 5h9.5c.98 0 1.814.627 2.123 1.502a3.819 3.819 0 00-.123-.002H3.25z" />
              </svg>
              Competition Gameplan
            </h3>
            <textarea
              value={competition.gameplan || ''}
              onChange={(e) => setCompetition(prev => ({ ...prev, gameplan: e.target.value }))}
              onBlur={(e) => handleUpdateGameplan(e.target.value)}
              placeholder="Write your competition strategy, key positions to focus on, techniques to drill..."
              rows={5}
              className="input resize-none"
            />
          </div>

          {/* Recommended Drills */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Recommended Drills
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Based on your focus areas and highest-rated games
            </p>
            {recommendedGames.length > 0 ? (
              <div className="space-y-2">
                {recommendedGames.slice(0, 8).map(game => (
                  <div
                    key={game._id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: topicColors[game.topic] }}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                      {game.name}
                    </span>
                    {game.averageEffectiveness > 0 && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.575a.75.75 0 01-1.12.814L8 12.093l-3.136 1.9a.75.75 0 01-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 01.427-1.318l3.663-.293 1.41-3.393A.75.75 0 018 1.75z" />
                        </svg>
                        {game.averageEffectiveness.toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Add games matching your focus areas to get recommendations
              </p>
            )}
            <Link to="/sessions" className="block text-center text-primary-600 text-sm mt-4 hover:underline">
              Create a training session
            </Link>
          </div>
        </>
      )}

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div className="modal-overlay\" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Add Competition
              </h2>
              <form onSubmit={handleCreateCompetition} className="space-y-4">
                <div>
                  <label className="label">Competition Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ADCC Trials 2026"
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Weight Class</label>
                    <input
                      type="text"
                      value={formData.weightClass}
                      onChange={(e) => setFormData(prev => ({ ...prev, weightClass: e.target.value }))}
                      placeholder="e.g., 77kg"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.targetWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                      placeholder="For weight tracking"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Division</label>
                    <select
                      value={formData.division}
                      onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                      className="input"
                    >
                      <option value="nogi">No-Gi</option>
                      <option value="gi">Gi</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(topicLabels).map(([topic, label]) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleFocusArea(topic)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.focusAreas.includes(topic)
                            ? 'text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                        style={formData.focusAreas.includes(topic) ? { backgroundColor: topicColors[topic] } : {}}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Competition
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Log Weight Modal */}
      {showWeightModal && (
        <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Log Weight
              </h2>
              <form onSubmit={handleLogWeight} className="space-y-4">
                <div>
                  <label className="label">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightEntry.weight}
                    onChange={(e) => setWeightEntry(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Enter your weight"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input
                    type="text"
                    value={weightEntry.notes}
                    onChange={(e) => setWeightEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Morning, before training"
                    className="input"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWeightModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Log Weight
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
