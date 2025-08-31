// ikootaclient/src/components/classes/ClassListPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../service/api';
import './ClassListPage.css';

const fetchAllClasses = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/classes?${params}`);
  return data;
};

const ClassListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    filter: searchParams.get('filter') || '' // for public/private filtering
  });

  const { data: classesData, isLoading, error } = useQuery({
    queryKey: ['allClasses', filters],
    queryFn: () => fetchAllClasses(filters),
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const handleClassClick = (classItem) => {
    const classId = classItem.class_id || classItem.id;
    // URL encode the classId to handle # characters properly
    const encodedClassId = encodeURIComponent(classId);
    navigate(`/classes/${encodedClassId}`);
  };

  const classes = classesData?.data || [];

  if (isLoading) {
    return (
      <div className="class-list-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading classes...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-list-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error loading classes</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="class-list-page">
      <div className="page-header">
        <h1>Browse Classes</h1>
        <p>Explore available classes and learning opportunities</p>
        
        <button 
          onClick={() => navigate('/classes/my-classes')}
          className="btn-my-classes"
        >
          📚 My Classes
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search classes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="academic">Academic</option>
            <option value="professional">Professional</option>
            <option value="general">General</option>
            <option value="workshop">Workshop</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.filter}
            onChange={(e) => handleFilterChange('filter', e.target.value)}
            className="filter-select"
          >
            <option value="">All Classes</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="results-section">
        <div className="results-header">
          <span className="results-count">
            {classes.length} class{classes.length !== 1 ? 'es' : ''} found
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="empty-results">
            <div className="empty-icon">🎓</div>
            <h3>No classes found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(classItem => (
              <div 
                key={classItem.class_id || classItem.id} 
                className="class-card"
                onClick={() => handleClassClick(classItem)}
              >
                <div className="class-header">
                  <h3>{classItem.class_name}</h3>
                  <div className="class-badges">
                    {classItem.is_public ? (
                      <span className="badge public">Public</span>
                    ) : (
                      <span className="badge private">Private</span>
                    )}
                    <span className={`badge status ${classItem.is_active ? 'active' : 'inactive'}`}>
                      {classItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="class-content">
                  <p className="class-description">
                    {classItem.description?.substring(0, 120)}
                    {classItem.description?.length > 120 ? '...' : ''}
                  </p>

                  <div className="class-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📋</span>
                      <span>{classItem.class_type}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{classItem.total_members || 0} members</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🆔</span>
                      <span>{classItem.class_id}</span>
                    </div>
                  </div>
                </div>

                <div className="class-actions">
                  <button 
                    className="btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClassClick(classItem);
                    }}
                  >
                    View Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="page-footer">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-back"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ClassListPage;