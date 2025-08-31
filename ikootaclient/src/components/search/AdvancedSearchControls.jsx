// Enhanced Search Controls with Advanced Filters
import React, { useState, useEffect } from 'react';
import './advancedsearchcontrols.css';

const AdvancedSearchControls = ({ 
  onSearch, 
  contentType = 'all', // 'teachings', 'chats', 'comments', 'all'
  placeholder = "Search...",
  showAdvanced = false 
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(showAdvanced);
  const [filters, setFilters] = useState({
    // Common filters
    user_id: '',
    date_from: '',
    date_to: '',
    sort_by: 'updatedAt',
    sort_order: 'desc',
    
    // Teaching-specific filters
    audience: '',
    subjectMatter: '',
    difficulty_level: '',
    approval_status: 'approved',
    
    // Chat-specific filters
    search_fields: 'all',
    
    // Comment-specific filters
    parent_type: 'all'
  });

  // Real-time search as user types (debounced)
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else if (query.length === 0) {
        handleSearch(); // Clear search
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [query, filters]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    const searchParams = {
      query: query.trim(),
      filters: { ...filters },
      contentType
    };

    console.log('🔍 Advanced search params:', searchParams);
    onSearch(searchParams);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      user_id: '',
      date_from: '',
      date_to: '',
      sort_by: 'updatedAt',
      sort_order: 'desc',
      audience: '',
      subjectMatter: '',
      difficulty_level: '',
      approval_status: 'approved',
      search_fields: 'all',
      parent_type: 'all'
    });
    setQuery('');
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value && value !== 'all' && value !== 'approved' && value !== 'updatedAt' && value !== 'desc'
    ).length;
  };

  return (
    <div className="advanced-search-controls">
      {/* Main Search Input */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${getActiveFiltersCount() > 0 ? 'has-filters' : ''}`}
            title={showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
          >
            ⚙️ {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>
        </div>
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filters-header">
            <h4>Advanced Search Filters</h4>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>

          <div className="filters-grid">
            {/* Date Range */}
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="createdAt">Recently Created</option>
                <option value="title">Title (A-Z)</option>
                <option value="author">Author</option>
              </select>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Teaching-specific filters */}
            {(contentType === 'teachings' || contentType === 'all') && (
              <>
                <div className="filter-group">
                  <label>Audience</label>
                  <select
                    value={filters.audience}
                    onChange={(e) => handleFilterChange('audience', e.target.value)}
                  >
                    <option value="">All Audiences</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Subject Matter</label>
                  <input
                    type="text"
                    value={filters.subjectMatter}
                    onChange={(e) => handleFilterChange('subjectMatter', e.target.value)}
                    placeholder="e.g., Programming, Design"
                  />
                </div>

                <div className="filter-group">
                  <label>Difficulty Level</label>
                  <select
                    value={filters.difficulty_level}
                    onChange={(e) => handleFilterChange('difficulty_level', e.target.value)}
                  >
                    <option value="">Any Level</option>
                    <option value="1">Level 1 (Basic)</option>
                    <option value="2">Level 2 (Intermediate)</option>
                    <option value="3">Level 3 (Advanced)</option>
                    <option value="4">Level 4 (Expert)</option>
                  </select>
                </div>
              </>
            )}

            {/* Chat-specific filters */}
            {(contentType === 'chats' || contentType === 'all') && (
              <div className="filter-group">
                <label>Search In</label>
                <select
                  value={filters.search_fields}
                  onChange={(e) => handleFilterChange('search_fields', e.target.value)}
                >
                  <option value="all">All Fields</option>
                  <option value="title">Title Only</option>
                  <option value="content">Content Only</option>
                  <option value="user">User/Author</option>
                </select>
              </div>
            )}

            {/* Comment-specific filters */}
            {(contentType === 'comments' || contentType === 'all') && (
              <div className="filter-group">
                <label>Comment Type</label>
                <select
                  value={filters.parent_type}
                  onChange={(e) => handleFilterChange('parent_type', e.target.value)}
                >
                  <option value="all">All Comments</option>
                  <option value="chat">Chat Comments</option>
                  <option value="teaching">Teaching Comments</option>
                </select>
              </div>
            )}

            {/* User Filter */}
            <div className="filter-group">
              <label>User ID</label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                placeholder="Filter by user ID"
              />
            </div>
          </div>

          {/* Search Stats */}
          {query && (
            <div className="search-stats">
              <span>🔍 Searching for: "{query}"</span>
              {getActiveFiltersCount() > 0 && (
                <span> • {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchControls;