import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const topics = [
  { value: '', label: 'Mixed (All Topics)', icon: '🎯', color: 'bg-gray-500' },
  { value: 'offensive', label: 'Offensive', icon: '⚔️', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive', icon: '🛡️', color: 'bg-blue-500' },
  { value: 'control', label: 'Control', icon: '🔒', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition', icon: '🔄', color: 'bg-green-500' }
];

const durations = [
  { value: 'short', label: 'Quick', description: '~30 min (3 games)', icon: '⚡' },
  { value: 'medium', label: 'Standard', description: '~45-60 min (5 games)', icon: '⏱️' },
  { value: 'long', label: 'Extended', description: '~90 min (7 games)', icon: '🏋️' }
];

export default function SmartSessionBuilder({ isOpen, onClose, onSessionCreated }) {
  const navigate = useNavigate();
  const { showToast, fetchSessions } = useApp();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('medium');
  const [sessionName, setSessionName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/sessions/smart-build', {
        topic: selectedTopic || undefined,
        duration: selectedDuration,
        name: sessionName.trim() || undefined
      });

      const { session, summary } = response.data;

      await fetchSessions();
      showToast(`Session created with ${summary.total} games!`, 'success');

      if (onSessionCreated) {
        onSessionCreated(session);
      }

      onClose();

      // Navigate to the session
      navigate(`/session/${session._id}`);
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to generate session',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
                  <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                </svg>
                Smart Session Builder
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Auto-generate a balanced training session
              </p>
            </div>
            <button onClick={onClose} className="btn-icon" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Session Name (optional) */}
          <div className="mb-6">
            <label className="label">Session Name (optional)</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="input"
            />
          </div>

          {/* Topic Selection */}
          <div className="mb-6">
            <label className="label mb-2">Training Focus</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.value}
                  onClick={() => setSelectedTopic(topic.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedTopic === topic.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${topic.color}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {topic.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <label className="label mb-2">Session Length</label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setSelectedDuration(dur.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedDuration === dur.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{dur.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {dur.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dur.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Preview
            </h4>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Warmup
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  topics.find(t => t.value === selectedTopic)?.color || 'bg-gray-500'
                }`} />
                Main Drills
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Cooldown
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary flex-1"
            >
              {isGenerating ? (
                <>
                  <span className="spinner mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
                  </svg>
                  Generate Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
