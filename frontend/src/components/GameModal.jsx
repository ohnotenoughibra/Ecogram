import { useState, useEffect, useRef, useCallback } from 'react';
import { ALL_POSITIONS, POSITIONS, ALL_TECHNIQUES, TECHNIQUES, getPositionLabel } from '../utils/constants';
import DrillChainManager from './DrillChainManager';
import { useApp } from '../context/AppContext';

const DRAFT_KEY = 'gameModalDraft';

// Quick templates for faster game creation
const GAME_TEMPLATES = [
  {
    id: 'guard-pass',
    name: 'Guard Passing Game',
    icon: '🎯',
    data: {
      topic: 'control',
      position: 'closed-guard',
      topPlayer: 'Work to pass the guard using proper posture and grips',
      bottomPlayer: 'Retain guard, work for sweeps or submissions',
      gameType: 'main',
      difficulty: 'intermediate'
    }
  },
  {
    id: 'sweep-game',
    name: 'Sweep Game',
    icon: '🔄',
    data: {
      topic: 'transition',
      position: 'closed-guard',
      topPlayer: 'Maintain base and posture, prevent sweeps',
      bottomPlayer: 'Work to sweep and come on top',
      gameType: 'main',
      difficulty: 'intermediate'
    }
  },
  {
    id: 'escape-drill',
    name: 'Escape Drill',
    icon: '🏃',
    data: {
      topic: 'defensive',
      position: 'side-control',
      topPlayer: 'Maintain dominant position with pressure',
      bottomPlayer: 'Work to escape and recover guard or stand up',
      gameType: 'main',
      difficulty: 'intermediate'
    }
  },
  {
    id: 'submission-hunt',
    name: 'Submission Hunt',
    icon: '⚔️',
    data: {
      topic: 'offensive',
      position: 'mount',
      topPlayer: 'Hunt for submissions while maintaining position',
      bottomPlayer: 'Defend and look for escapes',
      gameType: 'main',
      difficulty: 'intermediate'
    }
  },
  {
    id: 'takedown-game',
    name: 'Takedown Game',
    icon: '🤼',
    data: {
      topic: 'transition',
      position: 'standing',
      topPlayer: 'Work takedowns or pulls',
      bottomPlayer: 'Counter and look for your own takedowns',
      gameType: 'warmup',
      difficulty: 'beginner'
    }
  },
  {
    id: 'leg-lock',
    name: 'Leg Lock Battle',
    icon: '🦵',
    data: {
      topic: 'offensive',
      position: 'open-guard',
      topPlayer: 'Pass or attack legs',
      bottomPlayer: 'Set up leg entanglements and attacks',
      gameType: 'main',
      difficulty: 'advanced'
    }
  }
];

const topics = [
  { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
  { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition / Scrambles', color: 'bg-green-500' },
  { value: 'competition', label: 'Competition / Match Sim', color: 'bg-orange-500' }
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
  const { checkDuplicates } = useApp();
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
  const [techniqueInput, setTechniqueInput] = useState('');
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const saveTimeoutRef = useRef(null);
  const duplicateCheckRef = useRef(null);

  // Auto-save draft to localStorage (debounced)
  const saveDraft = useCallback((data) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      // Only save draft for new games, not edits
      if (!game && data.name) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1000);
  }, [game]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, []);

  // Load draft on mount
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setFormData(draft);
        setHasDraft(true);
        if (draft.gameType !== 'main' || draft.difficulty !== 'intermediate' || draft.videoUrl) {
          setShowAdvanced(true);
        }
        return true;
      }
    } catch (e) {
      localStorage.removeItem(DRAFT_KEY);
    }
    return false;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (game) {
      // Editing existing game
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
      setHasDraft(false);
      // Show advanced if non-default values
      if (game.gameType !== 'main' || game.difficulty !== 'intermediate' || game.videoUrl) {
        setShowAdvanced(true);
      }
    } else {
      // Creating new game - try to load draft first
      const draftLoaded = loadDraft();
      if (!draftLoaded) {
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
    }
    setErrors({});
    setSkillInput('');
    setTechniqueInput('');
    setShowTechniqueSelect(false);
    setIsSaving(false);
    setShowTemplates(!game); // Show templates only for new games
    setDuplicateWarning(null);
    setCheckingDuplicates(false);
  }, [game, isOpen, loadDraft]);

  // Auto-save draft when form data changes (only for new games)
  useEffect(() => {
    if (isOpen && !game) {
      saveDraft(formData);
    }
  }, [formData, isOpen, game, saveDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleAddCustomTechnique = (e) => {
    e?.preventDefault();
    const technique = techniqueInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (technique && !formData.techniques.includes(technique)) {
      setFormData(prev => ({
        ...prev,
        techniques: [...prev.techniques, technique]
      }));
    }
    setTechniqueInput('');
  };

  const handleTechniqueInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCustomTechnique(e);
    }
  };

  // Check for duplicates when name changes
  const checkForDuplicates = useCallback(async (name) => {
    if (!name?.trim() || game) return; // Don't check when editing

    if (duplicateCheckRef.current) {
      clearTimeout(duplicateCheckRef.current);
    }

    duplicateCheckRef.current = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const result = await checkDuplicates({
          name: name.trim(),
          topic: formData.topic,
          position: formData.position,
          techniques: formData.techniques
        });

        if (result.hasDuplicates) {
          setDuplicateWarning(result);
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {
        console.error('Error checking duplicates:', e);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);
  }, [checkDuplicates, formData.topic, formData.position, formData.techniques, game]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Check for duplicates when name changes
    if (name === 'name') {
      checkForDuplicates(value);
    }
  };

  // Apply a template
  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      name: '',
      ...template.data
    }));
    setShowTemplates(false);
    // Focus on name input
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]');
      if (nameInput) nameInput.focus();
    }, 100);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate() && !isSaving) {
      setIsSaving(true);
      try {
        clearDraft(); // Clear draft on successful save
        await onSave(formData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
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
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {game ? 'Edit Game' : 'Create New Game'}
              </h2>
              {/* Draft indicator */}
              {!game && hasDraft && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M13.791 2.086a.75.75 0 00-1.16-.166L8.54 5.49l-.001.01c-.9 1.08-2.1 1.7-3.299 2.108a11.02 11.02 0 00-2.039.738.75.75 0 00.006 1.263c.74.413 1.517.73 2.197.972.644.226 1.19.397 1.555.51.038.012.068.022.09.029.34.093.62.26.768.463A.504.504 0 008 11.7l.002.002a.75.75 0 001.27-.453c.114-.48.134-1.175.133-1.773a.75.75 0 01.05-.263 5.53 5.53 0 01.254-.424c.3-.44.583-.794.79-1.006l4.103-4.126a.75.75 0 00-.011-1.071l-.8-.75z" />
                    </svg>
                    Draft restored
                  </span>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-xs text-gray-500 hover:text-red-500 underline"
                  >
                    Discard
                  </button>
                </div>
              )}
              {draftSaved && !game && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1 animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                  </svg>
                  Draft saved
                </span>
              )}
            </div>
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
            {/* Quick Templates - Only show for new games */}
            {!game && showTemplates && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Quick Start Templates</label>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Start from scratch
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GAME_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
                    >
                      <span className="text-xl">{template.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{template.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Select a template to pre-fill common settings, then customize as needed
                </p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="label">Game Name *</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Guard Retention Game"
                  className={`input ${errors.name ? 'input-error' : ''} ${duplicateWarning?.hasExactMatch ? 'border-amber-500 focus:border-amber-500' : ''}`}
                />
                {checkingDuplicates && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </span>
                )}
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}

              {/* Duplicate Warning */}
              {duplicateWarning && duplicateWarning.duplicates.length > 0 && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {duplicateWarning.hasExactMatch ? 'Similar game exists!' : 'Possible duplicates found'}
                      </p>
                      <ul className="mt-1 space-y-1">
                        {duplicateWarning.duplicates.slice(0, 3).map(dup => (
                          <li key={dup._id} className="text-xs text-amber-700 dark:text-amber-300">
                            "{dup.name}" - {dup.reasons.join(', ')}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        You can still create this game if it's different
                      </p>
                    </div>
                  </div>
                </div>
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
              {/* Quick position chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { value: 'closed-guard', label: 'Closed Guard' },
                  { value: 'half-guard', label: 'Half Guard' },
                  { value: 'mount', label: 'Mount' },
                  { value: 'side-control', label: 'Side Control' },
                  { value: 'back', label: 'Back' },
                  { value: 'standing', label: 'Standing' },
                ].map(pos => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, position: pos.value }))}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      formData.position === pos.value
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
              {/* Full position dropdown */}
              <select
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="input"
              >
                <option value="">More positions...</option>
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
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  {/* Custom technique input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={techniqueInput}
                      onChange={(e) => setTechniqueInput(e.target.value)}
                      onKeyDown={handleTechniqueInputKeyDown}
                      placeholder="Add custom technique..."
                      className="input text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTechnique}
                      className="btn-secondary text-sm px-3"
                    >
                      Add
                    </button>
                  </div>

                  {/* Predefined techniques */}
                  <div className="max-h-40 overflow-y-auto space-y-3">
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
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving && (
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSaving ? 'Saving...' : (game ? 'Save Changes' : 'Create Game')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
