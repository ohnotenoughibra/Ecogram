import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { POSITIONS, TECHNIQUES, TOPICS, getPositionLabel, getTechniqueLabel } from '../utils/constants';

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'lastUsed', label: 'Last Used' },
  { value: 'rating', label: 'Rating' },
  { value: 'usageCount', label: 'Usage Count' }
];

// Filter presets for quick common scenarios
const filterPresets = [
  {
    id: 'guard-work',
    label: 'Guard Work',
    icon: '🛡️',
    filters: { position: 'closed-guard', topic: '' },
    positions: ['closed-guard', 'half-guard', 'open-guard', 'butterfly-guard']
  },
  {
    id: 'submissions',
    label: 'Submissions',
    icon: '⚔️',
    filters: { topic: 'offensive', position: '' }
  },
  {
    id: 'escapes',
    label: 'Escapes',
    icon: '🏃',
    filters: { topic: 'defensive', position: '' }
  },
  {
    id: 'passing',
    label: 'Passing',
    icon: '🎯',
    filters: { topic: 'control', position: '' }
  },
  {
    id: 'takedowns',
    label: 'Takedowns',
    icon: '🤼',
    filters: { position: 'standing', topic: '' }
  },
  {
    id: 'competition',
    label: 'Comp Prep',
    icon: '🏆',
    filters: { topic: 'competition', position: '' }
  },
];

// Common BJJ skills for autocomplete
const COMMON_SKILLS = [
  'armbar', 'triangle', 'kimura', 'omoplata', 'guillotine', 'rear naked choke', 'darce', 'anaconda',
  'sweep', 'pass', 'escape', 'mount', 'back take', 'leg lock', 'heel hook', 'knee bar', 'ankle lock',
  'underhook', 'overhook', 'frame', 'hip escape', 'bridge', 'shrimp', 'technical standup',
  'wrestling', 'takedown', 'single leg', 'double leg', 'sprawl', 'snap down', 'arm drag'
];

export default function FilterBar({ onSearch, showQuickPositions = true }) {
  const { filters, setFilters, games } = useApp();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeout = useRef(null);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Get unique skills from user's games
  const userSkills = [...new Set(games?.flatMap(g => g.skills || []) || [])];

  // Generate suggestions based on search value
  useEffect(() => {
    if (!searchValue || searchValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchValue.toLowerCase();
    const matched = [];

    // Search in positions
    POSITIONS.forEach(pos => {
      if (pos.label.toLowerCase().includes(query) || pos.value.toLowerCase().includes(query)) {
        matched.push({ type: 'position', value: pos.value, label: pos.label, icon: '📍' });
      }
    });

    // Search in topics
    TOPICS.forEach(topic => {
      if (topic.label.toLowerCase().includes(query) || topic.value.toLowerCase().includes(query)) {
        matched.push({ type: 'topic', value: topic.value, label: topic.label, icon: '🎯' });
      }
    });

    // Search in techniques
    TECHNIQUES.forEach(tech => {
      if (tech.label.toLowerCase().includes(query) || tech.value.toLowerCase().includes(query)) {
        matched.push({ type: 'technique', value: tech.value, label: tech.label, icon: '⚡' });
      }
    });

    // Search in user's skills
    userSkills.forEach(skill => {
      if (skill.toLowerCase().includes(query)) {
        matched.push({ type: 'skill', value: skill, label: `#${skill}`, icon: '🏷️' });
      }
    });

    // Search in common skills
    COMMON_SKILLS.forEach(skill => {
      if (skill.toLowerCase().includes(query) && !userSkills.includes(skill)) {
        matched.push({ type: 'search', value: skill, label: skill, icon: '🔍' });
      }
    });

    // Limit and dedupe
    const unique = matched.filter((item, index, self) =>
      index === self.findIndex(t => t.value === item.value && t.type === item.type)
    );
    setSuggestions(unique.slice(0, 8));
  }, [searchValue, userSkills]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setShowSuggestions(false);

    switch (suggestion.type) {
      case 'position':
        setFilters(prev => ({ ...prev, position: suggestion.value }));
        setSearchValue('');
        break;
      case 'topic':
        setFilters(prev => ({ ...prev, topic: suggestion.value }));
        setSearchValue('');
        break;
      case 'technique':
        setFilters(prev => ({ ...prev, technique: suggestion.value }));
        setSearchValue('');
        break;
      case 'skill':
      case 'search':
      default:
        setSearchValue(suggestion.value);
        break;
    }

    if (onSearch) onSearch();
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchValue }));
        if (onSearch) onSearch();
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchValue]);

  const handleTopicChange = (topic) => {
    setFilters(prev => ({ ...prev, topic }));
    if (onSearch) onSearch();
  };

  const handleSortChange = (sortBy) => {
    setFilters(prev => ({ ...prev, sortBy }));
    if (onSearch) onSearch();
  };

  const handleSortOrderToggle = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    if (onSearch) onSearch();
  };

  const handleFavoriteToggle = () => {
    setFilters(prev => ({ ...prev, favorite: !prev.favorite }));
    if (onSearch) onSearch();
  };

  const handlePositionChange = (position) => {
    setFilters(prev => ({ ...prev, position }));
    setActivePreset(null);
    if (onSearch) onSearch();
  };

  const applyPreset = (preset) => {
    if (activePreset === preset.id) {
      // Clear preset
      setActivePreset(null);
      setFilters(prev => ({ ...prev, topic: '', position: '' }));
    } else {
      setActivePreset(preset.id);
      setFilters(prev => ({ ...prev, ...preset.filters }));
    }
    if (onSearch) onSearch();
  };

  const handleTechniqueChange = (technique) => {
    setFilters(prev => ({ ...prev, technique }));
    if (onSearch) onSearch();
  };

  const clearFilters = () => {
    setSearchValue('');
    setFilters({
      topic: '',
      search: '',
      favorite: false,
      position: '',
      technique: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    if (onSearch) onSearch();
  };

  const hasActiveFilters = filters.topic || filters.search || filters.favorite || filters.position || filters.technique;

  // Count active filters for badge
  const activeFilterCount = [
    filters.topic,
    filters.search,
    filters.favorite,
    filters.position,
    filters.technique
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1" ref={inputRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
          >
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSuggestions(false);
              if (e.key === 'ArrowDown' && suggestions.length > 0) {
                e.preventDefault();
                suggestionsRef.current?.querySelector('button')?.focus();
              }
            }}
            placeholder="Search games, skills, positions..."
            className="input pl-11"
            autoComplete="off"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
              </svg>
            </button>
          )}

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto animate-fade-in"
            >
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = e.currentTarget.nextElementSibling;
                        if (next) next.focus();
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = e.currentTarget.previousElementSibling;
                        if (prev) prev.focus();
                        else inputRef.current?.querySelector('input')?.focus();
                      }
                      if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors"
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.label}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {suggestion.type === 'search' ? 'Search for' : `Filter by ${suggestion.type}`}
                      </p>
                    </div>
                    {suggestion.type !== 'search' && suggestion.type !== 'skill' && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                        Apply filter
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400">
                  Type to search or select a filter
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn-secondary relative ${isExpanded ? 'bg-primary-100 dark:bg-primary-900/30' : ''} ${activeFilterCount > 0 ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
          title={activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Filter games'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline ml-2">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-500 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Presets - Quick scenarios */}
      {showQuickPositions && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {filterPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activePreset === preset.id
                  ? 'bg-primary-500 text-white shadow-md scale-105'
                  : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <span className="text-base">{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expanded filters */}
      {isExpanded && (
        <div className="card p-4 space-y-4 animate-slide-down">
          {/* Topic filter */}
          <div>
            <label className="label">Topic</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(topic => (
                <button
                  key={topic.value}
                  onClick={() => handleTopicChange(topic.value)}
                  className={`chip ${filters.topic === topic.value ? 'chip-active' : ''}`}
                >
                  {topic.color && (
                    <span className={`w-2 h-2 rounded-full ${topic.color}`}></span>
                  )}
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position filter */}
          <div>
            <label className="label">Position</label>
            <select
              value={filters.position || ''}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="input py-2"
            >
              <option value="">All Positions</option>
              <optgroup label="Guard">
                {POSITIONS.guard.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="Top">
                {POSITIONS.top.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="Neutral">
                {POSITIONS.neutral.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="Leg Locks">
                {POSITIONS.legLocks.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Technique filter */}
          <div>
            <label className="label">Technique</label>
            <select
              value={filters.technique || ''}
              onChange={(e) => handleTechniqueChange(e.target.value)}
              className="input py-2"
            >
              <option value="">All Techniques</option>
              <optgroup label="Submissions">
                {TECHNIQUES.submissions.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Sweeps">
                {TECHNIQUES.sweeps.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Escapes">
                {TECHNIQUES.escapes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Passes">
                {TECHNIQUES.passes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Takedowns">
                {TECHNIQUES.takedowns.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Sort options */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="label">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input py-2"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Order</label>
              <button
                onClick={handleSortOrderToggle}
                className="btn-secondary"
              >
                {filters.sortOrder === 'asc' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                    </svg>
                    Ascending
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                    </svg>
                    Descending
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="label">Filter</label>
              <button
                onClick={handleFavoriteToggle}
                className={`chip ${filters.favorite ? 'chip-active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${filters.favorite ? 'text-yellow-400' : ''}`}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Favorites Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
              title="Clear all filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
              </svg>
              Clear all
            </button>
          </div>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          {filters.topic && (
            <span className="chip chip-active">
              {TOPICS.find(t => t.value === filters.topic)?.label}
              <button onClick={() => handleTopicChange('')} className="ml-1" title="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.search && (
            <span className="chip chip-active">
              Search: "{filters.search}"
              <button onClick={() => setSearchValue('')} className="ml-1" title="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.favorite && (
            <span className="chip chip-active">
              Favorites
              <button onClick={handleFavoriteToggle} className="ml-1" title="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.position && (
            <span className="chip chip-active">
              {getPositionLabel(filters.position)}
              <button onClick={() => handlePositionChange('')} className="ml-1" title="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.technique && (
            <span className="chip chip-active">
              {getTechniqueLabel(filters.technique)}
              <button onClick={() => handleTechniqueChange('')} className="ml-1" title="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
