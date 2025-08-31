// ikootaclient/src/components/classes/ClassPreview.jsx
// CLASS PREVIEW/SUMMARY PAGE - Shows class overview before entering the live classroom
// Features: Class description, syllabus, instructor info, prerequisites, "Enter Classroom" button

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './ClassPreview.css';

const ClassPreview = () => {
  console.log('🚀 ClassPreview Component Loading - Updated Version v2.0');
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  
  // Debug logging
  console.log('🔍 ClassPreview Raw Debug:', {
    classIdFromParams: classId,
    windowLocationHref: window.location.href,
    windowLocationPathname: window.location.pathname,
    windowLocationHash: window.location.hash,
    useParamsResult: useParams()
  });
  
  // State for preview modes
  const [activeSection, setActiveSection] = useState('overview');

  // Helper function to handle class ID formats - MULTIPLE EXTRACTION STRATEGIES
  const normalizeClassId = (id) => {
    console.log('🔍 ClassPreview: Starting normalization for:', id);
    console.log('🔍 ClassPreview: Full URL debug:', {
      href: window.location.href,
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
      useParamsId: id
    });
    
    if (!id) {
      console.warn('❌ ClassPreview: No ID provided to normalize');
      return null;
    }
    
    let finalClassId = null;
    
    // STRATEGY 1: Try to extract from current URL pathname
    const currentPath = window.location.pathname;
    console.log('🔍 ClassPreview: Current pathname:', currentPath);
    
    const pathMatch = currentPath.match(/\/classes\/([^\/]+)/);
    console.log('🔍 ClassPreview: Path regex match:', pathMatch);
    
    if (pathMatch && pathMatch[1]) {
      try {
        const urlClassId = decodeURIComponent(pathMatch[1]);
        console.log('🔍 ClassPreview: Decoded URL class ID:', urlClassId);
        
        // Check if this looks like a complete class ID
        if (urlClassId.includes('#') || urlClassId.length > 5) {
          finalClassId = urlClassId;
          console.log('✅ ClassPreview: Strategy 1 SUCCESS - Using URL-extracted:', finalClassId);
        }
      } catch (err) {
        console.warn('❌ ClassPreview: Strategy 1 decode failed:', err);
      }
    }
    
    // STRATEGY 2: Check if URL hash contains the missing part
    if (!finalClassId && window.location.hash) {
      const hashPart = window.location.hash.substring(1); // Remove the #
      console.log('🔍 ClassPreview: Found hash part:', hashPart);
      
      // Try combining the ID with the hash
      if (id && hashPart && !id.includes('#')) {
        const combinedId = `${id}#${hashPart}`;
        console.log('🔍 ClassPreview: Strategy 2 - Combined ID:', combinedId);
        if (combinedId.match(/^[A-Z]{2,4}#[0-9A-Z]{3,}$/i)) {
          finalClassId = combinedId;
          console.log('✅ ClassPreview: Strategy 2 SUCCESS - Using combined:', finalClassId);
        }
      }
    }
    
    // STRATEGY 3: Try to reconstruct from useParams ID if it looks incomplete
    if (!finalClassId && id) {
      console.log('🔍 ClassPreview: Strategy 3 - Analyzing useParams ID:', id);
      
      // If ID doesn't have # but looks like it should
      if (!id.includes('#') && id.length >= 6) {
        // Check if it matches pattern like OTU222222 or OTU004001
        const match = id.match(/^([A-Z]{2,4})([0-9A-Z]{3,})$/i);
        if (match) {
          finalClassId = `${match[1]}#${match[2]}`;
          console.log('✅ ClassPreview: Strategy 3 SUCCESS - Reconstructed:', finalClassId);
        }
      } else if (id.includes('#')) {
        // Already has hash, use as-is
        finalClassId = id;
        console.log('✅ ClassPreview: Strategy 3 SUCCESS - Using as-is:', finalClassId);
      }
    }
    
    // STRATEGY 4: Last resort - use the original ID if nothing else worked
    if (!finalClassId) {
      finalClassId = id;
      console.log('⚠️ ClassPreview: Strategy 4 FALLBACK - Using original:', finalClassId);
    }
    
    // FINAL VALIDATION: Check if the result looks valid
    const isValidFormat = finalClassId && (
      finalClassId.includes('#') && 
      finalClassId.match(/^[A-Z]{2,4}#[0-9A-Z]{3,}$/i) &&
      finalClassId.length >= 7
    );
    
    console.log('🔍 ClassPreview: Final validation:', {
      finalClassId,
      isValidFormat,
      hasHash: finalClassId?.includes('#'),
      length: finalClassId?.length,
      regexMatch: finalClassId?.match(/^[A-Z]{2,4}#[0-9A-Z]{3,}$/i)
    });
    
    if (!isValidFormat) {
      console.error('❌ ClassPreview: Final class ID is invalid:', finalClassId);
      return null;
    }
    
    console.log('✅ ClassPreview: Final normalized class ID:', finalClassId);
    return finalClassId;
  };

  const apiClassId = normalizeClassId(classId);

  // Debug the final API class ID
  console.log('🚀 ClassPreview: Final API Class ID being used:', apiClassId);
  console.log('🚀 ClassPreview: API call will go to:', `/classes/${apiClassId}`);

  // CRITICAL: Validate API class ID BEFORE defining useQuery hooks
  const isValidApiClassId = apiClassId && 
    apiClassId.includes('#') && 
    apiClassId !== 'OTU' && 
    apiClassId.length > 6 &&
    apiClassId.match(/^[A-Z]{2,4}#[0-9A-Z]{3,}$/i);

  console.log('🔍 ClassPreview: API Class ID validation:', {
    apiClassId,
    isValid: isValidApiClassId,
    hasHash: apiClassId?.includes('#'),
    notJustOTU: apiClassId !== 'OTU',
    properLength: apiClassId?.length > 6,
    matchesPattern: apiClassId?.match(/^[A-Z]{2,4}#[0-9A-Z]{3,}$/i)
  });

  // Fetch class details for preview - ONLY if we have a valid API class ID
  const { data: classData, isLoading, error } = useQuery({
    queryKey: ['classPreview', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      console.log('🔄 ClassPreview: Making API call to:', `/classes/${encodedClassId}`);
      const { data } = await api.get(`/classes/${encodedClassId}`);
      return data;
    },
    enabled: isValidApiClassId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch class statistics - ONLY if we have a valid API class ID
  const { data: statsData } = useQuery({
    queryKey: ['classStats', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      console.log('🔄 ClassPreview: Making stats API call to:', `/classes/${encodedClassId}/stats`);
      const { data } = await api.get(`/classes/${encodedClassId}/stats`);
      return data;
    },
    enabled: isValidApiClassId && isAuthenticated,
    staleTime: 2 * 60 * 1000
  });

  // Fetch recent announcements for preview - ONLY if we have a valid API class ID
  const { data: previewContent } = useQuery({
    queryKey: ['classPreviewContent', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      console.log('🔄 ClassPreview: Making content API call to:', `/classes/${encodedClassId}/content?limit=3&type=announcement`);
      const { data } = await api.get(`/classes/${encodedClassId}/content?limit=3&type=announcement`);
      return data;
    },
    enabled: isValidApiClassId && isAuthenticated,
    staleTime: 1 * 60 * 1000
  });

  // Early return if we don't have a valid API class ID
  if (!isValidApiClassId) {
    console.error('❌ ClassPreview: Invalid API class ID, showing error page:', {
      apiClassId,
      originalClassId: classId,
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      hash: window.location.hash,
      useParamsResult: useParams()
    });
    
    return (
      <div className="class-preview-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Class</h3>
          <p><strong>Invalid class ID format:</strong> "{apiClassId}"</p>
          <p><strong>Expected format:</strong> OTU#XXXXXX</p>
          
          <div style={{marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'left'}}>
            <h4>Debug Information:</h4>
            <p><strong>Original useParams ID:</strong> {classId || 'null'}</p>
            <p><strong>Processed API ID:</strong> {apiClassId || 'null'}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Pathname:</strong> {window.location.pathname}</p>
            <p><strong>URL Hash:</strong> {window.location.hash || 'none'}</p>
          </div>
          
          <button onClick={() => navigate('/classes')} className="btn-back">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  const handleEnterClassroom = () => {
    navigate(`/classes/${encodeURIComponent(apiClassId)}/classroom`);
  };

  const handleJoinClass = async () => {
    try {
      const encodedClassId = encodeURIComponent(apiClassId);
      await api.post(`/classes/${encodedClassId}/join`);
      alert('Successfully joined class!');
      // Refresh class data
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join class');
    }
  };

  if (isLoading) {
    return (
      <div className="class-preview-loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <h3>Loading class preview...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-preview-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Class</h3>
          <p>{error.message}</p>
          <button onClick={() => navigate('/classes')} className="btn-back">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  const classInfo = classData?.data || classData || {};
  const stats = statsData?.data || {};
  const recentContent = previewContent?.data?.data || [];

  const isClassMember = classInfo.is_member;
  const canEnterClassroom = isClassMember || classInfo.is_public;

  return (
    <div className="class-preview">
      {/* Header Section */}
      <div className="class-preview-header">
        <div className="header-navigation">
          <button onClick={() => navigate('/classes')} className="btn-back">
            ← Back to Classes
          </button>
          <div className="header-breadcrumb">
            <span>Classes</span> / <span>{classInfo.class_name}</span>
          </div>
        </div>

        <div className="class-hero">
          <div className="class-hero-content">
            <div className="class-title-section">
              <h1 className="class-title">{classInfo.class_name}</h1>
              <div className="class-meta-badges">
                <span className={`status-badge ${classInfo.is_active ? 'active' : 'inactive'}`}>
                  {classInfo.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="type-badge">{classInfo.class_type}</span>
                <span className="visibility-badge">
                  {classInfo.is_public ? '🌍 Public' : '🔒 Private'}
                </span>
                <span className="id-badge">ID: {apiClassId}</span>
              </div>
            </div>

            <div className="class-stats-quick">
              <div className="stat-item">
                <span className="stat-number">{stats.total_members || 0}</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.total_content || 0}</span>
                <span className="stat-label">Lessons</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completion_rate || 0}%</span>
                <span className="stat-label">Completion</span>
              </div>
            </div>
          </div>

          <div className="class-hero-actions">
            {canEnterClassroom ? (
              <button 
                onClick={handleEnterClassroom}
                className="btn-enter-classroom primary"
                disabled={!classInfo.is_active}
              >
                🎓 Enter Classroom
              </button>
            ) : (
              <button 
                onClick={handleJoinClass}
                className="btn-join-class"
              >
                ➕ Join Class
              </button>
            )}
            
            {isClassMember && (
              <button className="btn-bookmark">
                🔖 Bookmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="class-preview-nav">
        <div className="preview-tabs">
          <button 
            className={`tab-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={`tab-btn ${activeSection === 'syllabus' ? 'active' : ''}`}
            onClick={() => setActiveSection('syllabus')}
          >
            📚 Syllabus
          </button>
          <button 
            className={`tab-btn ${activeSection === 'instructor' ? 'active' : ''}`}
            onClick={() => setActiveSection('instructor')}
          >
            👨‍🏫 Instructor
          </button>
          <button 
            className={`tab-btn ${activeSection === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveSection('recent')}
          >
            📢 Recent Updates
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="class-preview-content">
        {activeSection === 'overview' && (
          <div className="overview-section">
            <div className="overview-main">
              <div className="class-description">
                <h3>Class Description</h3>
                <p>{classInfo.description || 'No description available for this class.'}</p>
              </div>

              <div className="class-details-grid">
                <div className="detail-card">
                  <h4>📅 Schedule</h4>
                  <p>{classInfo.schedule || 'Flexible scheduling'}</p>
                </div>
                
                <div className="detail-card">
                  <h4>⏰ Duration</h4>
                  <p>{classInfo.estimated_duration ? `${Math.round(classInfo.estimated_duration / 60)} hours` : 'Self-paced'}</p>
                </div>
                
                <div className="detail-card">
                  <h4>🎯 Difficulty</h4>
                  <p>{classInfo.difficulty_level || 'All levels'}</p>
                </div>
                
                <div className="detail-card">
                  <h4>👥 Capacity</h4>
                  <p>{stats.total_members || 0} / {classInfo.max_members || 'Unlimited'}</p>
                </div>
              </div>

              {classInfo.prerequisites && (
                <div className="prerequisites">
                  <h4>📋 Prerequisites</h4>
                  <p>{classInfo.prerequisites}</p>
                </div>
              )}
            </div>

            <div className="overview-sidebar">
              <div className="quick-actions">
                <h4>Quick Actions</h4>
                {canEnterClassroom && (
                  <button onClick={handleEnterClassroom} className="action-btn primary">
                    🎓 Enter Classroom
                  </button>
                )}
                <button className="action-btn">📋 View Schedule</button>
                <button className="action-btn">👥 View Members</button>
                <button className="action-btn">📊 View Progress</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'syllabus' && (
          <div className="syllabus-section">
            <h3>Course Syllabus</h3>
            <div className="syllabus-content">
              <p>Detailed syllabus will be available here...</p>
              {/* This would be populated from class content/curriculum */}
            </div>
          </div>
        )}

        {activeSection === 'instructor' && (
          <div className="instructor-section">
            <h3>Instructor Information</h3>
            <div className="instructor-info">
              <div className="instructor-profile">
                <div className="instructor-avatar">👨‍🏫</div>
                <div className="instructor-details">
                  <h4>{classInfo.instructor_name || 'Instructor Name'}</h4>
                  <p className="instructor-title">{classInfo.instructor_title || 'Class Instructor'}</p>
                  <p className="instructor-bio">{classInfo.instructor_bio || 'Instructor bio will be available here...'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'recent' && (
          <div className="recent-section">
            <h3>Recent Updates</h3>
            <div className="recent-updates">
              {recentContent.length > 0 ? (
                recentContent.map(item => (
                  <div key={item.id} className="update-item">
                    <div className="update-icon">📢</div>
                    <div className="update-content">
                      <h4>{item.title}</h4>
                      <p>{item.content?.substring(0, 150)}...</p>
                      <span className="update-date">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent updates available.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Call to Action */}
      {canEnterClassroom && (
        <div className="class-preview-footer">
          <div className="footer-cta">
            <h3>Ready to start learning?</h3>
            <p>Join the live classroom experience with interactive lessons, discussions, and real-time teaching.</p>
            <button 
              onClick={handleEnterClassroom}
              className="btn-enter-classroom large"
              disabled={!classInfo.is_active}
            >
              🎓 Enter Live Classroom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassPreview;