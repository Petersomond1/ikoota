import React, { useState, useEffect } from "react";
import "./towncrier.css";
import RevTopics from "./RevTopics";
import RevTeaching from "./RevTeaching";
import { useFetchTeachings } from "../service/useFetchTeachings";

const Towncrier = () => {
  const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
  const [selectedTeaching, setSelectedTeaching] = useState(null);
  const [enhancedTeachings, setEnhancedTeachings] = useState([]);

  // Enhance teachings data with consistent structure
  useEffect(() => {
    if (teachings.length > 0) {
      const enhanced = teachings.map(teaching => ({
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt,
        // Ensure author field exists
        author: teaching.user_id || teaching.author || 'Admin'
      }));
      
      // Sort by most recent first
      enhanced.sort((a, b) => {
        const aDate = new Date(a.display_date);
        const bDate = new Date(b.display_date);
        return bDate - aDate;
      });
      
      setEnhancedTeachings(enhanced);
      
      // Set the latest teaching as the default selection if none selected
      if (!selectedTeaching && enhanced.length > 0) {
        setSelectedTeaching(enhanced[0]);
      }
    }
  }, [teachings, selectedTeaching]);

  const handleSelectTeaching = (teaching) => {
    try {
      // Ensure the selected teaching has enhanced structure
      const enhancedTeaching = {
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt,
        author: teaching.user_id || teaching.author || 'Admin'
      };
      
      setSelectedTeaching(enhancedTeaching);
    } catch (error) {
      console.error('Error selecting teaching:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="towncrier_container">
        <div className="nav">Navbar: Towncrier</div>
        <div className="towncrier_viewport">
          <div className="loading-message">
            <p>Loading teachings...</p>
          </div>
        </div>
        <div className="footnote">Footnote</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="towncrier_container">
        <div className="nav">Navbar: Towncrier</div>
        <div className="towncrier_viewport">
          <div className="error-message">
            <p style={{color: 'red'}}>Error fetching teachings: {error.message}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        </div>
        <div className="footnote">Footnote</div>
      </div>
    );
  }

  return (
    <div className="towncrier_container">
      <div className="nav">
        <span>Navbar: Towncrier</span>
        <div className="nav-stats">
          <span>Total Teachings: {enhancedTeachings.length}</span>
          <button onClick={handleRefresh} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>
      
      <div className="towncrier_viewport">
        {/* Left side: Topics List */}
        <RevTopics 
          teachings={enhancedTeachings} 
          onSelect={handleSelectTeaching}
          selectedTeaching={selectedTeaching}
        />
                
        {/* Right side: Selected Teaching Details */}
        <RevTeaching 
          teaching={selectedTeaching} 
          allTeachings={enhancedTeachings}
          onSelectNext={(nextTeaching) => handleSelectTeaching(nextTeaching)}
        />
      </div>
      
      <div className="footnote">
        <span>Footnote - Last updated: {new Date().toLocaleString()}</span>
        {selectedTeaching && (
          <span> | Selected: {selectedTeaching.prefixed_id}</span>
        )}
      </div>
    </div>
  );
};

export default Towncrier;