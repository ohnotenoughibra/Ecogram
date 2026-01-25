import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';
import api from '../utils/api';

const goalTypes = [
  { value: 'sessions_per_week', label: 'Sessions per Week', icon: '📅', description: 'Train X times every week' },
  { value: 'sessions_per_month', label: 'Sessions per Month', icon: '📆', description: 'Train X times every month' },
  { value: 'streak', label: 'Training Streak', icon: '🔥', description: 'Train for X consecutive days' },
  { value: 'games_used', label: 'Games Used', icon: '🎮', description: 'Use X different games total' },
  { value: 'topic_focus', label: 'Topic Focus', icon: '🎯', description: 'Complete X sessions on a topic' },
  { value: 'custom', label: 'Custom Goal', icon: '⭐', description: 'Set your own milestone' }
];

const topicOptions = [
  { value: 'any', label: 'Any Topic' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'defensive', label: 'Defensive' },
  { value: 'control', label: 'Control' },
  { value: 'transition', label: 'Transition' }
];

export default function Goals() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sessions_per_week',
    targetValue: 3,
    period: 'week',
    topic: 'any'
  });

  useEffect(() => {
    fetchGoalSummary();
  }, []);

  const fetchGoalSummary = async () => {
    try {
      const response = await api.get('/goals/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        title: formData.title || getDefaultTitle(),
        description: formData.description,
        type: formData.type,
        target: {
          value: parseInt(formData.targetValue),
          period: formData.period,
          topic: formData.topic
        }
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'sessions_per_week',
        targetValue: 3,
        period: 'week',
        topic: 'any'
      });
      fetchGoalSummary();
      showToast('Goal created!', 'success');
    } catch (error) {
      showToast('Failed to create goal', 'error');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${goalId}`);
      fetchGoalSummary();
      showToast('Goal deleted', 'success');
    } catch (error) {
      showToast('Failed to delete goal', 'error');
    }
  };

  const handleTogglePause = async (goal) => {
    try {
      await api.put(`/goals/${goal._id}`, {
        status: goal.status === 'paused' ? 'active' : 'paused'
      });
      fetchGoalSummary();
    } catch (error) {
      showToast('Failed to update goal', 'error');
    }
  };

  const getDefaultTitle = () => {
    const type = goalTypes.find(t => t.value === formData.type);
    switch (formData.type) {
      case 'sessions_per_week':
        return `Train ${formData.targetValue}x per week`;
      case 'sessions_per_month':
        return `Train ${formData.targetValue}x per month`;
      case 'streak':
        return `${formData.targetValue} day streak`;
      case 'games_used':
        return `Use ${formData.targetValue} different games`;
      case 'topic_focus':
        return `${formData.targetValue} ${formData.topic} sessions`;
      default:
        return 'Custom Goal';
    }
  };

  if (loading) {
    return <Loading text="Loading goals..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Training Goals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set targets and track your progress
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          New Goal
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">🔥</div>
          <p className="text-2xl font-bold text-orange-500">{summary?.currentStreak || 0}</p>
          <p className="text-sm text-gray-500">Day Streak</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">📅</div>
          <p className="text-2xl font-bold text-primary-500">{summary?.weekSessions || 0}</p>
          <p className="text-sm text-gray-500">This Week</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">📆</div>
          <p className="text-2xl font-bold text-green-500">{summary?.monthSessions || 0}</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">🎯</div>
          <p className="text-2xl font-bold text-yellow-500">{summary?.achievedThisPeriod || 0}/{summary?.totalGoals || 0}</p>
          <p className="text-sm text-gray-500">Goals Met</p>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        {summary?.goals?.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-green-500">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Goals Set
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create training goals to stay motivated and track your progress over time.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          summary?.goals?.map(goal => (
            <div
              key={goal._id}
              className={`card p-5 ${goal.status === 'paused' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Progress circle */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(goal.progressPercentage, 100) / 100)}`}
                      className={goal.progressPercentage >= 100 ? 'text-green-500' : 'text-primary-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {goal.progressPercentage}%
                    </span>
                  </div>
                </div>

                {/* Goal details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {goal.title}
                    </h3>
                    {goal.status === 'paused' && (
                      <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                        Paused
                      </span>
                    )}
                    {goal.progressPercentage >= 100 && (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        Achieved!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {goal.currentProgress || 0} / {goal.target.value}
                    {goal.target.period !== 'total' && ` this ${goal.target.period}`}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{goal.description}</p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${goal.progressPercentage >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePause(goal)}
                    className="btn-icon text-gray-400 hover:text-gray-600"
                    title={goal.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {goal.status === 'paused' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="btn-icon text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Create New Goal
              </h2>
              <form onSubmit={handleCreateGoal} className="space-y-5">
                {/* Goal Type */}
                <div>
                  <label className="label">Goal Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {goalTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          formData.type === type.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Target Value</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                      className="input"
                    />
                  </div>
                  {formData.type === 'topic_focus' && (
                    <div>
                      <label className="label">Topic</label>
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                        className="input"
                      >
                        {topicOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Custom Title */}
                <div>
                  <label className="label">
                    Title
                    <span className="text-xs text-gray-400 ml-2">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={getDefaultTitle()}
                    className="input"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">
                    Description
                    <span className="text-xs text-gray-400 ml-2">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add any notes or motivation..."
                    rows={2}
                    className="input resize-none"
                  />
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
                    Create Goal
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
