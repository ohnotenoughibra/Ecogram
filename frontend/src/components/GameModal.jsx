import { useState, useEffect } from 'react';

const topics = [
  { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
  { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition / Scrambles', color: 'bg-green-500' }
];

export default function GameModal({ isOpen, onClose, onSave, game = null }) {
  const [formData, setFormData] = useState({
    name: '',
    topic: 'transition',
    topPlayer: '',
    bottomPlayer: '',
    coaching: '',
    skills: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        topic: game.topic || 'transition',
        topPlayer: game.topPlayer || '',
        bottomPlayer: game.bottomPlayer || '',
        coaching: game.coaching || '',
        skills: game.skills || []
      });
    } else {
      setFormData({
        name: '',
        topic: 'transition',
        topPlayer: '',
        bottomPlayer: '',
        coaching: '',
        skills: []
      });
    }
    setErrors({});
    setSkillInput('');
  }, [game, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim().replace(/^#/, '');
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Game name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {game ? 'Edit Game' : 'Create New Game'}
            </h2>
            <button
              onClick={onClose}
              className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label">Game Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Guard Retention Game"
                className={`input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="label">Topic</label>
              <div className="grid grid-cols-2 gap-2">
                {topics.map(topic => (
                  <button
                    key={topic.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, topic: topic.value }))}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      formData.topic === topic.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${topic.color}`}></span>
                    <span className="text-sm font-medium">{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Player */}
            <div>
              <label className="label">Top Player Instructions</label>
              <textarea
                name="topPlayer"
                value={formData.topPlayer}
                onChange={handleChange}
                rows={3}
                placeholder="Instructions for the top player..."
                className="input resize-none"
              />
            </div>

            {/* Bottom Player */}
            <div>
              <label className="label">Bottom Player Instructions</label>
              <textarea
                name="bottomPlayer"
                value={formData.bottomPlayer}
                onChange={handleChange}
                rows={3}
                placeholder="Instructions for the bottom player..."
                className="input resize-none"
              />
            </div>

            {/* Coaching */}
            <div>
              <label className="label">Coaching Notes</label>
              <textarea
                name="coaching"
                value={formData.coaching}
                onChange={handleChange}
                rows={3}
                placeholder="Key coaching points, cues, and observations..."
                className="input resize-none"
              />
            </div>

            {/* Skills/Hashtags */}
            <div>
              <label className="label">Skills / Hashtags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillInputKeyDown}
                  placeholder="Add skill (press Enter)"
                  className="input"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="chip flex items-center gap-1"
                    >
                      #{skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {game ? 'Save Changes' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
