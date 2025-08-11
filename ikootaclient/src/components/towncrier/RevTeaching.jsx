//ikootaclient\src\components\towncrier\RevTeaching.jsx
import React from "react";
import ReactPlayer from "react-player";
import "./revteaching.css";

const RevTeaching = ({ teaching, allTeachings = [], onSelectNext }) => {
  if (!teaching) {
    return (
      <div className="revTeaching-container">
        <div className="no-selection">
          <p>Select a teaching to view details.</p>
        </div>
      </div>
    );
  }

  // Enhanced media rendering function
  const renderMedia = (url, type, alt = "media", index) => {
    if (!url || !type) return null;

    const commonStyle = { 
      maxWidth: "100%", 
      marginBottom: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    };

    switch (type) {
      case "image":
        return (
          <div key={`image-${index}`} className="media-item">
            <img 
              src={url} 
              alt={alt} 
              style={{ 
                ...commonStyle, 
                maxHeight: "400px", 
                objectFit: "contain",
                width: "100%"
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                console.error('Failed to load image:', url);
              }}
            />
          </div>
        );
      case "video":
        return (
          <div key={`video-${index}`} className="media-item">
            <ReactPlayer 
              url={url} 
              controls 
              width="100%" 
              height="300px"
              style={commonStyle}
              onError={(error) => console.error('Video playback error:', error)}
            />
          </div>
        );
      case "audio":
        return (
          <div key={`audio-${index}`} className="media-item">
            <audio controls style={{ width: "100%", ...commonStyle }}>
              <source src={url} type="audio/mpeg" />
              <source src={url} type="audio/wav" />
              <source src={url} type="audio/ogg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case "file":
        return (
          <div key={`file-${index}`} className="media-item">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: "block", 
                padding: "10px", 
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                textDecoration: "none",
                color: "#333",
                ...commonStyle
              }}
            >
              📎 Download File
            </a>
          </div>
        );
      default:
        return (
          <div key={`unknown-${index}`} className="media-item">
            <p>Unsupported media type: {type}</p>
          </div>
        );
    }
  };

  // Helper functions
  const getContentIdentifier = (teaching) => {
    return teaching?.prefixed_id || `${teaching?.id}` || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatContent = (content) => {
    if (!content) return 'No content available';
    
    // Simple formatting for URLs and line breaks
    return content
      .split('\n')
      .map((line, index) => (
        <p key={index} style={{ marginBottom: '10px' }}>
          {line}
        </p>
      ));
  };

  // Navigation helpers
  const findNextTeaching = () => {
    if (!allTeachings.length) return null;
    const currentIndex = allTeachings.findIndex(t => t.id === teaching.id);
    return currentIndex < allTeachings.length - 1 ? allTeachings[currentIndex + 1] : null;
  };

  const findPrevTeaching = () => {
    if (!allTeachings.length) return null;
    const currentIndex = allTeachings.findIndex(t => t.id === teaching.id);
    return currentIndex > 0 ? allTeachings[currentIndex - 1] : null;
  };

  const nextTeaching = findNextTeaching();
  const prevTeaching = findPrevTeaching();

  return (
    <div className="revTeaching-container">
      <div className="teaching-item">
        {/* Header */}
        <div className="teaching-header">
          <div className="title-section">
            <h2>{teaching.topic || 'Untitled Teaching'}</h2>
            <div className="teaching-meta">
              <span className="content-id">ID: {getContentIdentifier(teaching)}</span>
              <span className="content-type-badge">Teaching</span>
            </div>
          </div>
          
          {/* Navigation buttons */}
          {(prevTeaching || nextTeaching) && (
            <div className="navigation-buttons">
              {prevTeaching && (
                <button 
                  onClick={() => onSelectNext(prevTeaching)}
                  className="nav-btn prev-btn"
                  title={`Previous: ${prevTeaching.topic}`}
                >
                  ← Previous
                </button>
              )}
              {nextTeaching && (
                <button 
                  onClick={() => onSelectNext(nextTeaching)}
                  className="nav-btn next-btn"
                  title={`Next: ${nextTeaching.topic}`}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="teaching-content">
          <div className="teaching-details">
            <p><strong>Description:</strong> {teaching.description || 'No description available'}</p>
            <p><strong>Lesson #:</strong> {teaching.lessonNumber || getContentIdentifier(teaching)}</p>
            <p><strong>Subject Matter:</strong> {teaching.subjectMatter || 'Not specified'}</p>
            <p><strong>Audience:</strong> {teaching.audience || 'General'}</p>
            <p><strong>By:</strong> {teaching.author || teaching.user_id || 'Admin'}</p>
            <p><strong>Created:</strong> {formatDate(teaching.createdAt)}</p>
            <p><strong>Updated:</strong> {formatDate(teaching.updatedAt)}</p>
          </div>

          {/* Main content */}
          {teaching.content && (
            <div className="main-content">
              <h3>Content:</h3>
              <div className="content-text">
                {formatContent(teaching.content)}
              </div>
            </div>
          )}
        </div>

        {/* Media content */}
        <div className="media-container">
          <h3>Media Content:</h3>
          {[
            { url: teaching.media_url1, type: teaching.media_type1 },
            { url: teaching.media_url2, type: teaching.media_type2 },
            { url: teaching.media_url3, type: teaching.media_type3 }
          ].some(media => media.url && media.type) ? (
            <div className="media-grid">
              {renderMedia(teaching.media_url1, teaching.media_type1, "Media 1", 1)}
              {renderMedia(teaching.media_url2, teaching.media_type2, "Media 2", 2)}
              {renderMedia(teaching.media_url3, teaching.media_type3, "Media 3", 3)}
            </div>
          ) : (
            <p className="no-media">No media content available</p>
          )}
        </div>

        {/* Footer with additional info */}
        <div className="teaching-footer">
          <div className="teaching-stats">
            <span>Position: {allTeachings.findIndex(t => t.id === teaching.id) + 1} of {allTeachings.length}</span>
            {teaching.display_date && (
              <span>Last activity: {formatDate(teaching.display_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevTeaching;