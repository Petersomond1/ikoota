// Reusable AI Features Panel Component
// Can be integrated into any content viewer component
import React, { useState } from 'react';
import { useContentSummarization } from '../../hooks/useSummarization';
import { useContentRecommendations } from '../../hooks/useRecommendations';
import './AIFeaturesPanel.css';

const AIFeaturesPanel = ({ 
  content,           // The content to analyze (text, description, etc.)
  contentType,       // Type: 'chat', 'teaching', 'comment', 'class'
  contentId,         // ID of the content
  contentTitle,      // Title to display
  position = 'inline', // 'inline', 'floating', 'modal'
  autoLoad = false,  // Auto-load AI features on mount
  showButton = true  // Show the AI Features button
}) => {
  const [isOpen, setIsOpen] = useState(autoLoad);
  const [activeTab, setActiveTab] = useState('summary');

  // AI Hooks - only activate when panel is open
  const { 
    data: summary, 
    isLoading: summaryLoading,
    error: summaryError 
  } = useContentSummarization(
    contentType, 
    contentId, 
    {
      method: 'auto',
      maxLength: 200,
      style: contentType === 'teaching' ? 'educational' : 'casual',
      enabled: isOpen && !!content && !!contentId
    }
  );

  const { 
    data: recommendations, 
    isLoading: recommendationsLoading 
  } = useContentRecommendations(
    contentType, 
    contentId, 
    {
      includeExternal: true,
      maxCurated: 3,
      maxExternal: 2,
      sources: 'youtube',
      enabled: isOpen && !!content && !!contentId
    }
  );

  // Don't render if no content
  if (!content) return null;

  // Calculate content metrics
  const contentLength = content?.length || 0;
  const wordCount = content?.split(' ').length || 0;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <div className={`ai-features-wrapper ai-position-${position}`}>
      {/* AI Features Toggle Button */}
      {showButton && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-features-toggle ${isOpen ? 'active' : ''}`}
          title="Toggle AI-powered features"
        >
          <span className="ai-icon">🤖</span>
          <span className="ai-label">AI Features</span>
          {isOpen && <span className="ai-close">✖</span>}
        </button>
      )}

      {/* AI Features Panel */}
      {isOpen && (
        <div className="ai-features-panel">
          {/* Panel Header */}
          <div className="ai-panel-header">
            <h3>
              <span className="ai-icon">🤖</span>
              AI Content Analysis
            </h3>
            {contentTitle && (
              <div className="ai-content-title">{contentTitle}</div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="ai-panel-tabs">
            <button 
              onClick={() => setActiveTab('summary')}
              className={`ai-tab ${activeTab === 'summary' ? 'active' : ''}`}
            >
              📝 Summary
            </button>
            <button 
              onClick={() => setActiveTab('recommendations')}
              className={`ai-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            >
              🔍 Resources
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`ai-tab ${activeTab === 'insights' ? 'active' : ''}`}
            >
              📊 Insights
            </button>
          </div>

          {/* Tab Content */}
          <div className="ai-panel-content">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="ai-tab-content summary-content">
                <div className="ai-section-header">
                  <h4>📝 Smart Summary</h4>
                  <span className="ai-badge">
                    {summary?.method === 'ai' ? '🤖 AI' : '⚡ Quick'}
                  </span>
                </div>
                
                {summaryLoading ? (
                  <div className="ai-loading">
                    <div className="ai-spinner"></div>
                    <span>Analyzing content...</span>
                  </div>
                ) : summaryError ? (
                  <div className="ai-error">
                    <span>⚠️</span>
                    <p>Summary temporarily unavailable</p>
                  </div>
                ) : summary ? (
                  <div className="ai-summary">
                    <p>{summary.summary}</p>
                    {summary.confidence && (
                      <div className="ai-metrics">
                        <span>Confidence: {Math.round(summary.confidence * 100)}%</span>
                        <span>Compression: {Math.round((1 - (summary.summary?.length / contentLength)) * 100)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ai-placeholder">
                    <p>AI summary will appear here when content is analyzed.</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="ai-tab-content recommendations-content">
                <div className="ai-section-header">
                  <h4>🔍 Related Resources</h4>
                </div>
                
                {recommendationsLoading ? (
                  <div className="ai-loading">
                    <div className="ai-spinner"></div>
                    <span>Finding resources...</span>
                  </div>
                ) : recommendations ? (
                  <div className="ai-recommendations">
                    {/* Platform Content */}
                    {recommendations.curated?.length > 0 && (
                      <div className="ai-rec-section">
                        <h5>📚 Platform Content</h5>
                        {recommendations.curated.map((rec, idx) => (
                          <div key={idx} className="ai-rec-card curated">
                            <div className="rec-title">{rec.title}</div>
                            <div className="rec-desc">{rec.description?.substring(0, 100)}...</div>
                            <div className="rec-meta">
                              <span>{rec.type}</span>
                              <span>⭐ {rec.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* External Resources */}
                    {recommendations.external?.length > 0 && (
                      <div className="ai-rec-section">
                        <h5>🌐 External Resources</h5>
                        {recommendations.external.map((rec, idx) => (
                          <div 
                            key={idx} 
                            className="ai-rec-card external"
                            onClick={() => window.open(rec.url, '_blank')}
                          >
                            <div className="rec-title">
                              {rec.title} <span className="rec-link">🔗</span>
                            </div>
                            <div className="rec-desc">{rec.description?.substring(0, 100)}...</div>
                            <div className="rec-meta">
                              <span>{rec.source}</span>
                              {rec.channel && <span>{rec.channel}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ai-placeholder">
                    <p>Related resources will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="ai-tab-content insights-content">
                <div className="ai-section-header">
                  <h4>📊 Content Insights</h4>
                </div>
                
                <div className="ai-insights">
                  <div className="insight-card">
                    <div className="insight-label">Content Type</div>
                    <div className="insight-value">{contentType}</div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-label">Length</div>
                    <div className="insight-value">{contentLength} chars</div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-label">Word Count</div>
                    <div className="insight-value">{wordCount} words</div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-label">Reading Time</div>
                    <div className="insight-value">~{readingTime} min</div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-label">AI Analysis</div>
                    <div className="insight-value">
                      {isOpen ? '✅ Active' : '⏸️ Inactive'}
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-label">Features</div>
                    <div className="insight-value">
                      {summary ? '✅' : '⏳'} Summary<br/>
                      {recommendations ? '✅' : '⏳'} Resources
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFeaturesPanel;