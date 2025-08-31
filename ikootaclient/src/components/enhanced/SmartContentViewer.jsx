// Smart Content Viewer with Summarization and Recommendations
// Demonstrates integration of all enhanced systems

import React, { useState, useEffect } from 'react';
import { useContentSummarization, useSmartSummarization } from '../../hooks/useSummarization';
import { useContentRecommendations, useRecommendationTracking } from '../../hooks/useRecommendations';
import { useSearchContent } from '../../hooks/useSearchContent';
import './smartcontentviewer.css';

const SmartContentViewer = ({ 
  content, 
  contentType = 'teaching', 
  contentId,
  showSummary = true,
  showRecommendations = true,
  showRelatedContent = true 
}) => {
  const [viewMode, setViewMode] = useState('full'); // 'full', 'summary', 'recommendations'
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // ===============================================
  // SUMMARIZATION INTEGRATION
  // ===============================================
  
  const { 
    data: summary, 
    isLoading: summaryLoading,
    error: summaryError 
  } = useContentSummarization(contentType, contentId, {
    method: 'auto',
    maxLength: 200,
    style: contentType === 'teaching' ? 'educational' : 'casual',
    enabled: showSummary && !!contentId
  });

  const smartSummary = useSmartSummarization(content, contentType);

  // ===============================================
  // RECOMMENDATIONS INTEGRATION
  // ===============================================
  
  const { 
    data: recommendations, 
    isLoading: recLoading 
  } = useContentRecommendations(contentType, contentId, {
    includeExternal: true,
    maxCurated: 3,
    maxExternal: 2,
    sources: 'youtube',
    enabled: showRecommendations && !!contentId
  });

  const trackingMutation = useRecommendationTracking();

  // ===============================================
  // RELATED CONTENT SEARCH
  // ===============================================

  const { data: relatedContent } = useSearchContent({
    query: extractKeywords(content),
    contentType: 'all',
    localData: [],
    useServerSearch: true,
    enabled: showRelatedContent
  });

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  const handleRecommendationClick = (recommendation) => {
    // Track the interaction
    trackingMutation.mutate({
      contentId,
      contentType,
      recommendationUrl: recommendation.url,
      interactionType: 'click',
      source: recommendation.source || 'curated'
    });

    // Open recommendation in new tab
    window.open(recommendation.url, '_blank');
    setSelectedRecommendation(recommendation);
  };

  const handleSummaryRequest = () => {
    if (!summary && content) {
      smartSummary.summarize();
    }
    setViewMode('summary');
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // ===============================================
  // UTILITY FUNCTIONS
  // ===============================================

  const extractKeywords = (text) => {
    if (!text) return '';
    
    // Simple keyword extraction
    const words = text.toLowerCase()
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 3);
    
    return words.join(' ');
  };

  const getSummaryText = () => {
    return summary?.summary || smartSummary.data?.summary || 'No summary available';
  };

  const shouldShowSummary = () => {
    return showSummary && (summary || smartSummary.data) && content && content.length > 300;
  };

  // ===============================================
  // RENDER COMPONENTS
  // ===============================================

  const renderSummarySection = () => (
    <div className="summary-section">
      <div className="summary-header">
        <h3>📝 Quick Summary</h3>
        <div className="summary-controls">
          <span className="summary-method">
            {summary?.method === 'ai' && '🤖 AI Generated'}
            {summary?.method === 'extractive_scored' && '⚡ Smart Extract'}
            {summary?.method === 'builtin' && '💻 Quick Summary'}
          </span>
          {summaryLoading && <span className="loading">⏳ Generating...</span>}
        </div>
      </div>
      
      <div className="summary-content">
        <p>{getSummaryText()}</p>
        
        {summary && (
          <div className="summary-stats">
            <span>Original: {summary.originalLength} chars</span>
            <span>Compression: {Math.round((1 - (getSummaryText().length / summary.originalLength)) * 100)}%</span>
            <span>Confidence: {Math.round((summary.confidence || 0.8) * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecommendationsSection = () => (
    <div className="recommendations-section">
      <h3>🔍 Related Resources</h3>
      
      {recLoading && <div className="loading">Finding related content...</div>}
      
      {recommendations && (
        <div className="recommendations-grid">
          {/* Curated Recommendations */}
          {recommendations.curated?.length > 0 && (
            <div className="curated-recommendations">
              <h4>📚 Curated Content</h4>
              {recommendations.curated.map((rec, index) => (
                <div key={index} className="recommendation-card curated">
                  <div className="rec-header">
                    <span className="rec-title">{rec.title}</span>
                    <span className="rec-rating">⭐ {rec.rating}</span>
                  </div>
                  <p className="rec-description">{rec.description}</p>
                  <div className="rec-footer">
                    <span className="rec-type">{rec.type}</span>
                    <span className="rec-difficulty">{rec.difficulty}</span>
                    <button 
                      onClick={() => handleRecommendationClick(rec)}
                      className="rec-visit-btn"
                    >
                      Visit Resource
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* External Recommendations */}
          {recommendations.external?.length > 0 && (
            <div className="external-recommendations">
              <h4>🌐 External Content</h4>
              {recommendations.external.map((rec, index) => (
                <div key={index} className="recommendation-card external">
                  <div className="rec-header">
                    <span className="rec-title">{rec.title}</span>
                    {rec.thumbnail && <img src={rec.thumbnail} alt="thumbnail" className="rec-thumbnail" />}
                  </div>
                  <p className="rec-description">{rec.description}</p>
                  <div className="rec-footer">
                    <span className="rec-source">{rec.source}</span>
                    {rec.channel && <span className="rec-channel">{rec.channel}</span>}
                    <button 
                      onClick={() => handleRecommendationClick(rec)}
                      className="rec-visit-btn"
                    >
                      Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderRelatedContentSection = () => (
    <div className="related-content-section">
      <h3>🔗 Related Platform Content</h3>
      
      {relatedContent && relatedContent.total > 0 && (
        <div className="related-content-grid">
          {relatedContent.chats?.slice(0, 2).map((chat, index) => (
            <div key={`chat-${index}`} className="related-item">
              <span className="item-type">💬 Discussion</span>
              <h4>{chat.title || chat.content_title}</h4>
              <p>{chat.description?.substring(0, 100)}...</p>
            </div>
          ))}
          
          {relatedContent.teachings?.slice(0, 2).map((teaching, index) => (
            <div key={`teaching-${index}`} className="related-item">
              <span className="item-type">📚 Teaching</span>
              <h4>{teaching.topic || teaching.title}</h4>
              <p>{teaching.description?.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ===============================================
  // MAIN RENDER
  // ===============================================

  return (
    <div className="smart-content-viewer">
      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button 
          className={viewMode === 'full' ? 'active' : ''}
          onClick={() => handleViewModeChange('full')}
        >
          📄 Full Content
        </button>
        
        {shouldShowSummary() && (
          <button 
            className={viewMode === 'summary' ? 'active' : ''}
            onClick={handleSummaryRequest}
          >
            📝 Summary
          </button>
        )}
        
        {showRecommendations && (
          <button 
            className={viewMode === 'recommendations' ? 'active' : ''}
            onClick={() => handleViewModeChange('recommendations')}
          >
            🔍 Recommendations
          </button>
        )}
      </div>

      {/* Content Display */}
      <div className="content-display">
        {viewMode === 'full' && (
          <div className="full-content">
            <div className="main-content">
              {content && <p>{content}</p>}
            </div>
            
            {/* Side panels */}
            <div className="side-panels">
              {shouldShowSummary() && renderSummarySection()}
              {showRecommendations && recommendations && renderRecommendationsSection()}
              {showRelatedContent && renderRelatedContentSection()}
            </div>
          </div>
        )}
        
        {viewMode === 'summary' && shouldShowSummary() && renderSummarySection()}
        
        {viewMode === 'recommendations' && showRecommendations && renderRecommendationsSection()}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span>📊 Smart Features Active</span>
        {shouldShowSummary() && <span>• Summary Available</span>}
        {recommendations && <span>• {recommendations.total} Recommendations</span>}
        {relatedContent && <span>• {relatedContent.total} Related Items</span>}
      </div>
    </div>
  );
};

export default SmartContentViewer;