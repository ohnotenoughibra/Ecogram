import { useState, useEffect } from 'react';
import { ALL_POSITIONS, POSITIONS, ALL_TECHNIQUES, TECHNIQUES, getPositionLabel } from '../utils/constants';
import DrillChainManager from './DrillChainManager';

const topics = [
  { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
  { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition / Scrambles', color: 'bg-green-500' }
];

const gameTypes = [
  { value: 'warmup', label: 'Warmup', icon: '🔥', description: 'Light movement, flow-based' },
  { value: 'main', label: 'Main', icon: '🎯', description: 'Core training games' },
  { value: 'cooldown', label: 'Cooldown', icon: '🧘', description: 'Recovery, low intensity' }
];

const difficulties = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' }
];

export default function GameModal({ isOpen, onClose, onSave, game = null }) {
  const [formData, setFormData] = useState({
    name: '',
    topic: 'transition',
    position: '',
    techniques: [],
    gameType: 'main',
    difficulty: 'intermediate',
    topPlayer: '',
    bottomPlayer: '',
    coaching: '',
    personalNotes: '',
    videoUrl: '',
    skills: [],
    linkedGames: { previous: null, next: null }
  });
  const [showTechniqueSelect, setShowTechniqueSelect] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        topic: game.topic || 'transition',
        position: game.position || '',
        techniques: game.techniques || [],
        gameType: game.gameType || 'main',
        difficulty: game.difficulty || 'intermediate',
        topPlayer: game.topPlayer || '',
        bottomPlayer: game.bottomPlayer || '',
        coaching: game.coaching || '',
        personalNotes: game.personalNotes || '',
        videoUrl: game.videoUrl || '',
        skills: game.skills || [],
        linkedGames: game.linkedGames || { previous: null, next: null }
      });
      // Show advanced if non-default values
      if (game.gameType !== 'main' || game.difficulty !== 'intermediate' || game.videoUrl) {
        setShowAdvanced(true);
      }
    } else {
      setFormData({
        name: '',
        topic: 'transition',
        position: '',
        techniques: [],
        gameType: 'main',
        difficulty: 'intermediate',
        topPlayer: '',
        bottomPlayer: '',
        coaching: '',
        personalNotes: '',
        videoUrl: '',
        skills: [],
        linkedGames: { previous: null, next: null }
      });
      setShowAdvanced(false);
    }
    setErrors({});
    setSkillInput('');
    setShowTechniqueSelect(false);
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

            {/* Position */}
            <div>
              <label className="label">Starting Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="input"
              >
                <option value="">Select position...</option>
                <optgroup label="Guard">
                  {POSITIONS.guard.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Top Positions">
                  {POSITIONS.top.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Neutral">
                  {POSITIONS.neutral.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Leg Lock Positions">
                  {POSITIONS.legLocks.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Techniques */}
            <div>
              <label className="label flex items-center justify-between">
                <span>Techniques Involved</span>
                {formData.techniques.length > 0 && (
                  <span className="text-xs text-gray-500">{formData.techniques.length} selected</span>
                )}
              </label>

              {/* Selected techniques */}
              {formData.techniques.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.techniques.map(tech => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs"
                    >
                      {ALL_TECHNIQUES.find(t => t.value === tech)?.label || tech}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          techniques: prev.techniques.filter(t => t !== tech)
                        }))}
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

              <button
                type="button"
                onClick={() => setShowTechniqueSelect(!showTechniqueSelect)}
                className="btn-secondary text-sm w-full"
              >
                {showTechniqueSelect ? 'Hide Techniques' : '+ Add Techniques'}
              </button>

              {showTechniqueSelect && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-48 overflow-y-auto space-y-3">
                  {Object.entries(TECHNIQUES).map(([category, techs]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {techs.map(tech => (
                          <button
                            key={tech.value}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                techniques: prev.techniques.includes(tech.value)
                                  ? prev.techniques.filter(t => t !== tech.value)
                                  : [...prev.techniques, tech.value]
                              }));
                            }}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              formData.techniques.includes(tech.value)
                                ? 'bg-purple-500 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                            }`}
                          >
                            {tech.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game Type & Difficulty Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                Game Type & Difficulty
                {(formData.gameType !== 'main' || formData.difficulty !== 'intermediate') && (
                  <span className="text-xs text-primary-600 dark:text-primary-400">(customized)</span>
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-fade-in">
                  {/* Game Type */}
                  <div>
                    <label className="label text-sm">Game Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {gameTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gameType: type.value }))}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            formData.gameType === type.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xl mb-1">{type.icon}</span>
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="label text-sm">Difficulty</label>
                    <div className="flex gap-2">
                      {difficulties.map(diff => (
                        <button
                          key={diff.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.value }))}
                          className={`flex items-center gap-2 flex-1 p-2 rounded-lg border-2 transition-all ${
                            formData.difficulty === diff.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${diff.color}`}></span>
                          <span className="text-sm">{diff.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="label text-sm flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
                      </svg>
                      Video Reference
                    </label>
                    <input
                      type="url"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=... or any video URL"
                      className="input text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Add a YouTube, Instagram, or any video link for reference</p>
                  </div>
                </div>
              )}
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

            {/* Personal Notes */}
            <div>
              <label className="label">
                Personal Notes
                <span className="text-xs text-gray-400 ml-2">(private)</span>
              </label>
              <textarea
                name="personalNotes"
                value={formData.personalNotes}
                onChange={handleChange}
                rows={2}
                placeholder="Your personal observations, what worked, what to improve..."
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

            {/* Drill Progression Chain - only show when editing existing game */}
            {game && (
              <DrillChainManager
                game={{ ...game, linkedGames: formData.linkedGames }}
                onLinkUpdated={(linkedGames) => setFormData(prev => ({ ...prev, linkedGames }))}
              />
            )}

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
