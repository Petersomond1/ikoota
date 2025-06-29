import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import './revtopics.css';
import api from '../service/api';

const RevTopics = ({ teachings: propTeachings = [], onSelect, selectedTeaching }) => {
  const [teachings, setTeachings] = useState([]);
  const [filteredTeachings, setFilteredTeachings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/teachings');
        
        // Enhance teachings data for consistency
        const enhancedTeachings = response.data.map(teaching => ({
          ...teaching,
          content_type: 'teaching',
          content_title: teaching.topic || 'Untitled Teaching',
          prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
          display_date: teaching.updatedAt || teaching.createdAt,
          author: teaching.user_id || teaching.author || 'Admin'
        }));
        
        // Sort by most recent first
        enhancedTeachings.sort((a, b) => {
          const aDate = new Date(a.display_date);
          const bDate = new Date(b.display_date);
          return bDate - aDate;
        });
        
        setTeachings(enhancedTeachings);
        setFilteredTeachings(enhancedTeachings);
      } catch (error) {
        console.error('Error fetching teachings:', error);
        setError('Failed to fetch teachings');
      } finally {
        setLoading(false);
      }
    };

    // Use prop teachings if available, otherwise fetch
    if (propTeachings.length > 0) {
      setTeachings(propTeachings);
      setFilteredTeachings(propTeachings);
      setLoading(false);
    } else {
      fetchTeachings();
    }
  }, [propTeachings]);

  const handleSearch = (query) => {
    if (!Array.isArray(teachings)) return;
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = teachings.filter(teaching => {
      const searchFields = [
        teaching.topic,
        teaching.description,
        teaching.subjectMatter,
        teaching.audience,
        teaching.author,
        teaching.prefixed_id,
        teaching.content
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(lowercaseQuery)
      );
    });
    
    setFilteredTeachings(filtered);
  };

  const handleTopicClick = (teaching) => {
    try {
      if (onSelect) {
        onSelect(teaching);
      }
    } catch (error) {
      console.error('Error selecting teaching:', error);
    }
  };

  // Helper functions
  const getContentIdentifier = (teaching) => {
    return teaching?.prefixed_id || `t${teaching?.id}` || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No description available';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="revtopic-container">
        <div className="loading-message">
          <p>Loading teachings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revtopic-container">
        <div className="error-message">
          <p style={{color: 'red'}}>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="revtopic-container">
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="Search Icon" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <div className="search-stats">
          <span>{filteredTeachings.length} of {teachings.length} teachings</span>
        </div>
      </div>

      <div className="topics-list">
        {filteredTeachings.length > 0 ? (
          filteredTeachings.map((teaching) => {
            const isSelected = selectedTeaching?.id === teaching.id;
            
            return (
              <div 
                key={teaching.prefixed_id || `teaching-${teaching.id}`} 
                className={`topic-item ${isSelected ? 'selected' : ''}`} 
                onClick={() => handleTopicClick(teaching)}
              >
                <div className="topic-header">
                  <span className="content-type-badge">Teaching</span>
                  <span className="content-id">{getContentIdentifier(teaching)}</span>
                </div>
                
                <div className="texts">
                  <span className="topic-title">Topic: {teaching.topic || 'Untitled'}</span>
                  <p className="topic-description">
                    Description: {truncateText(teaching.description, 80)}
                  </p>
                  
                  <div className="topic-meta">
                    <p>Subject: {teaching.subjectMatter || 'Not specified'}</p>
                    <p>Audience: {teaching.audience || 'General'}</p>
                    <p>By: {teaching.author}</p>
                  </div>
                  
                  <div className="topic-dates">
                    <p>Created: {formatDate(teaching.createdAt)}</p>
                    <p>Updated: {formatDate(teaching.updatedAt)}</p>
                  </div>
                </div>
                
                {/* Visual indicator for selected item */}
                {isSelected && (
                  <div className="selected-indicator">
                    <span>▶</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-teachings">
            <p>No teachings available</p>
            {teachings.length > 0 && (
              <p className="search-hint">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with summary */}
      <div className="topics-footer">
        <div className="summary-stats">
          <span>Total: {teachings.length} teachings</span>
          {filteredTeachings.length !== teachings.length && (
            <span>Filtered: {filteredTeachings.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevTopics;