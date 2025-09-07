// ikootaclient/src/components/towncrier/RevTopics.jsx - ENHANCED WITH BACKEND SEARCH
import React, { useState, useEffect, useMemo } from 'react';
import SearchControls from '../search/SearchControls';
import { useSmartSearch } from '../../hooks/useSearchContent';
import './revtopics.css';
import './towncrier.css'; // Shared styles
import './revteaching.css'; // Shared styles
import '../search/searchcontrols.css'; // Shared styles
import api from '../service/api';

const RevTopics = ({ teachings: propTeachings = [], onSelect, selectedTeaching }) => {
  const [teachings, setTeachings] = useState([]);
  const [filteredTeachings, setFilteredTeachings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Use prop teachings if available, otherwise fetch
  useEffect(() => {
    if (propTeachings.length > 0) {
      console.log('Using prop teachings:', propTeachings.length, 'items');
      setTeachings(propTeachings);
      setFilteredTeachings(propTeachings);
      setLoading(false);
      return;
    }

    // Only fetch if no prop teachings
    const fetchTeachings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching teachings from API...');
        const response = await api.get('/content/teachings');
        
        // Debug response
        console.log('API Response type:', typeof response.data);
        console.log('API Response:', response.data);
        
        // Normalize response
        let teachingsData = [];
        if (Array.isArray(response.data)) {
          teachingsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          teachingsData = response.data.data;
        } else if (response.data?.teachings && Array.isArray(response.data.teachings)) {
          teachingsData = response.data.teachings;
        } else {
          console.warn('Unexpected response structure:', response.data);
          teachingsData = [];
        }
        
        const enhancedTeachings = teachingsData.map((teaching, index) => ({
          ...teaching,
          id: teaching.id || `temp-${index}`,
          content_type: 'teaching',
          content_title: teaching.topic || teaching.title || 'Untitled Teaching',
          prefixed_id: teaching.prefixed_id || `t${teaching.id || index}`,
          display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
          author: teaching.author || teaching.user_id || teaching.created_by || 'Admin',
          topic: teaching.topic || teaching.title || 'Untitled',
          description: teaching.description || 'No description available',
          subjectMatter: teaching.subjectMatter || teaching.subject || 'Not specified',
          audience: teaching.audience || 'General'
        }));
        
        enhancedTeachings.sort((a, b) => new Date(b.display_date) - new Date(a.display_date));
        
        console.log('Processed teachings:', enhancedTeachings.length, 'items');
        setTeachings(enhancedTeachings);
        setFilteredTeachings(enhancedTeachings);
      } catch (error) {
        console.error('Error fetching teachings:', error);
        setError(`Failed to fetch teachings: ${error.message}`);
        setTeachings([]);
        setFilteredTeachings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachings();
  }, [propTeachings.length]); // Only depend on length to avoid infinite loops

  // ✅ ENHANCED: Use smart search hook for backend integration
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    searchMethod 
  } = useSmartSearch({
    query: searchQuery,
    contentType: 'teachings',
    localData: teachings,
    useServerSearch: searchQuery.length >= 2, // Use server search for queries >= 2 chars
    enabled: searchQuery.length >= 2
  });

  // Update filtered results when search changes
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredTeachings(teachings);
    } else if (searchQuery.length >= 2) {
      setFilteredTeachings(searchResults || []);
    } else {
      // For 1 character searches, use client-side filtering
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = teachings.filter(teaching => {
        const searchFields = [
          teaching.topic, teaching.title, teaching.description,
          teaching.subjectMatter, teaching.subject, teaching.audience,
          teaching.author, teaching.prefixed_id, teaching.content
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(lowercaseQuery)
        );
      });
      setFilteredTeachings(filtered);
    }
  }, [searchQuery, searchResults, teachings]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleTopicClick = (teaching) => {
    try {
      console.log('🔍 Topic clicked:', teaching.id, teaching.topic);
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

  // ✅ FIXED: Enhanced selection detection
  const isSelected = (teaching) => {
    if (!selectedTeaching || !teaching) return false;
    
    // Try multiple comparison methods
    const matches = [
      selectedTeaching.id === teaching.id,
      selectedTeaching.prefixed_id === teaching.prefixed_id,
      selectedTeaching.id === teaching.prefixed_id,
      selectedTeaching.prefixed_id === teaching.id
    ];
    
    const result = matches.some(match => match);
    console.log('🔍 Selection check:', {
      selectedId: selectedTeaching.id,
      selectedPrefixedId: selectedTeaching.prefixed_id,
      teachingId: teaching.id,
      teachingPrefixedId: teaching.prefixed_id,
      isSelected: result
    });
    
    return result;
  };

  if (loading) {
    return (
      <div className="revtopic-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading educational content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revtopic-container">
        <div className="error-message">
          <h3>Unable to Load Content</h3>
          <p style={{color: 'red'}}>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="revtopic-container">
      {/* <div className="search"> */}
        <div className="searchbar">
          <SearchControls onSearch={handleSearch} />
        {/* </div> */}
   
      </div>
           <div className="search-stats">
          <span>📖 {filteredTeachings.length} of {teachings.length} resources</span>
          {searchQuery && (
            <span className="search-method">
              {isSearching && ' ⏳ Searching...'}
              {!isSearching && searchMethod === 'server' && ' 🌐 Advanced Search'}
              {!isSearching && searchMethod === 'client' && ' 💻 Quick Search'}
            </span>
          )}
        </div>
      {/* <div> */}
     
      {/* </div> */}
      <div className="topics-list">
         
 <div className="topic-header">
        <span className="content-type-badge">📚 Educational Resource</span>
        <span>Available Teachings</span>
      </div>
      <div className="topics-scroll">
        {filteredTeachings.length > 0 ? (
          filteredTeachings.map((teaching, index) => {
            const selected = isSelected(teaching);
            
            return (
              <div 
                key={teaching.prefixed_id || `teaching-${teaching.id || index}`} 
                className={`topic-item ${selected ? 'selected' : ''}`}
                onClick={() => handleTopicClick(teaching)}
              >
              
                <div className="texts">
                     <span className="content-id">{getContentIdentifier(teaching)}</span>
               
                  <span className="topic-title">
                    {teaching.topic || teaching.title || 'Untitled Resource'}
                  </span>
                  <p className="topic-description">
                    {truncateText(teaching.description, 80)}
                  </p>
                  
                  <div className="topic-meta">
                    <p>📋 Subject: {teaching.subjectMatter || teaching.subject || 'Not specified'}</p>
                    <p>👥 Audience: {teaching.audience || 'General'}</p>
                    <p>✍️ By: {teaching.author}</p>
                  </div>
                  
                  <div className="topic-dates">
                    <p>📅 Created: {formatDate(teaching.createdAt)}</p>
                    {teaching.updatedAt && teaching.updatedAt !== teaching.createdAt && (
                      <p>🔄 Updated: {formatDate(teaching.updatedAt)}</p>
                    )}
                  </div>
                </div>
                
                {selected && (
                  <div className="selected-indicator">
                    <span>▶</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-teachings">
            <div className="empty-state">
              <h3>📚 No Educational Content Available</h3>
              <p>
                {teachings.length > 0 
                  ? "No content matches your search. Try adjusting your search terms." 
                  : "No educational resources have been published yet."
                }
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
      
      <div className="topics-footer">
        <div className="summary-stats">
          <span>📊 Total: {teachings.length} resources</span>
          {filteredTeachings.length !== teachings.length && (
            <span> | 🔍 Showing: {filteredTeachings.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevTopics;


