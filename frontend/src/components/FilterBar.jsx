import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const topics = [
  { value: '', label: 'All Topics' },
  { value: 'offensive', label: 'Offensive', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-500' },
  { value: 'control', label: 'Control', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition', color: 'bg-green-500' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'lastUsed', label: 'Last Used' },
  { value: 'rating', label: 'Rating' },
  { value: 'usageCount', label: 'Usage Count' }
];

export default function FilterBar({ onSearch }) {
  const { filters, setFilters } = useApp();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const searchTimeout = useRef(null);

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

  const clearFilters = () => {
    setSearchValue('');
    setFilters({
      topic: '',
      search: '',
      favorite: false,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    if (onSearch) onSearch();
  };

  const hasActiveFilters = filters.topic || filters.search || filters.favorite;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search games, skills..."
            className="input pl-10"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn-secondary ${isExpanded ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline ml-2">Filters</span>
        </button>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="card p-4 space-y-4 animate-slide-down">
          {/* Topic filter */}
          <div>
            <label className="label">Topic</label>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>

          {filters.topic && (
            <span className="chip chip-active">
              {topics.find(t => t.value === filters.topic)?.label}
              <button onClick={() => handleTopicChange('')} className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.search && (
            <span className="chip chip-active">
              Search: "{filters.search}"
              <button onClick={() => setSearchValue('')} className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          {filters.favorite && (
            <span className="chip chip-active">
              Favorites
              <button onClick={handleFavoriteToggle} className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
