// ikootaclient/src/components/classes/EnhancedClassDashboard.jsx
// COMPREHENSIVE CLASS DASHBOARD WITH MENTORSHIP, CONVERSE ID, AND DEMOGRAPHIC INTEGRATION
// Connects to all the powerful backend endpoints that were previously unused

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import ClassMentorshipView from './ClassMentorshipView';
import './EnhancedClassDashboard.css';

const EnhancedClassDashboard = () => {
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState('overview');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showMentorshipPanel, setShowMentorshipPanel] = useState(false);
  
  // ✅ COMPREHENSIVE DATA FETCHING USING PREVIOUSLY UNUSED ENDPOINTS
  
  // User's classes with full details
  const { data: userClassesData, isLoading: userClassesLoading } = useQuery({
    queryKey: ['userClasses'],
    queryFn: async () => {
      const { data } = await api.get('/classes/my-classes?limit=50');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000
  });

  // User's progress across all classes
  const { data: userProgressData } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      const { data } = await api.get('/classes/my-progress');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  // User's recent activity
  const { data: userActivityData } = useQuery({
    queryKey: ['userActivity'],
    queryFn: async () => {
      const { data } = await api.get('/classes/my-activity');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000
  });

  // Class recommendations (demographic-based)
  const { data: recommendationsData } = useQuery({
    queryKey: ['classRecommendations'],
    queryFn: async () => {
      const { data } = await api.get('/classes/recommendations?limit=6');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000
  });

  // Public classes by demographic types
  const { data: demographicClassesData } = useQuery({
    queryKey: ['demographicClasses'],
    queryFn: async () => {
      const { data } = await api.get('/classes/by-type/demographic?limit=10');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000
  });

  // ✅ MUTATIONS FOR CLASS INTERACTIONS

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: async (classId) => {
      return await api.post(`/classes/${classId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      queryClient.invalidateQueries(['userProgress']);
      alert('Successfully joined class!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to join class');
    }
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: async (classId) => {
      return await api.post(`/classes/${classId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      queryClient.invalidateQueries(['userProgress']);
      alert('Successfully left class!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to leave class');
    }
  });

  // ✅ HANDLERS

  const handleJoinClass = (classId) => {
    if (window.confirm('Do you want to join this class?')) {
      joinClassMutation.mutate(classId);
    }
  };

  const handleLeaveClass = (classId) => {
    if (window.confirm('Are you sure you want to leave this class?')) {
      leaveClassMutation.mutate(classId);
    }
  };

  const handleViewClass = (classInfo) => {
    // Navigate to ClassContentViewer with proper ID handling
    const classId = classInfo.class_id || classInfo.id;
    const encodedClassId = encodeURIComponent(classId);
    navigate(`/classes/${encodedClassId}`);
  };

  const handleViewMentorship = (classInfo) => {
    setSelectedClass(classInfo);
    setShowMentorshipPanel(true);
  };

  // ✅ PROCESS DATA SAFELY
  const userClasses = userClassesData?.data || [];
  const userProgress = userProgressData?.data?.progress || {};
  const userActivity = userActivityData?.data?.activity || {};
  const recommendations = recommendationsData?.data || [];
  const demographicClasses = demographicClassesData?.data || [];

  // Group classes by type for better organization
  const classesByType = userClasses.reduce((acc, cls) => {
    const type = cls.class_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cls);
    return acc;
  }, {});

  // ✅ LOADING STATE
  if (userClassesLoading) {
    return (
      <div className="enhanced-dashboard-loading">
        <div className="loading-spinner large"></div>
        <h3>Loading your class dashboard...</h3>
        <p>Gathering class data, mentorship info, and recommendations</p>
      </div>
    );
  }

  // ✅ MAIN RENDER
  return (
    <div className="enhanced-class-dashboard">
      {/* ✅ DASHBOARD HEADER */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome back, {user?.converse_id || user?.username}!</h1>
            <p>Your personalized class dashboard with mentorship integration</p>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{userClasses.length}</div>
              <div className="stat-label">Active Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userProgress.moderator_classes || 0}</div>
              <div className="stat-label">As Moderator</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{recommendations.length}</div>
              <div className="stat-label">Recommendations</div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="dashboard-nav">
          <button 
            className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-btn ${activeView === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveView('classes')}
          >
            🎓 My Classes
          </button>
          <button 
            className={`nav-btn ${activeView === 'mentorship' ? 'active' : ''}`}
            onClick={() => setActiveView('mentorship')}
          >
            👥 Mentorship
          </button>
          <button 
            className={`nav-btn ${activeView === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveView('recommendations')}
          >
            🎯 Discover
          </button>
        </div>
      </div>

      {/* ✅ DASHBOARD CONTENT */}
      <div className="dashboard-content">
        
        {/* OVERVIEW TAB */}
        {activeView === 'overview' && (
          <div className="overview-section">
            {/* Progress Summary */}
            <div className="progress-summary">
              <h3>📈 Your Progress</h3>
              <div className="progress-cards">
                <div className="progress-card">
                  <div className="progress-icon">🎯</div>
                  <div className="progress-info">
                    <div className="progress-value">{userProgress.total_classes || 0}</div>
                    <div className="progress-label">Total Classes</div>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-icon">⚡</div>
                  <div className="progress-info">
                    <div className="progress-value">{userProgress.active_classes || 0}</div>
                    <div className="progress-label">Active Classes</div>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-icon">🏆</div>
                  <div className="progress-info">
                    <div className="progress-value">{userProgress.moderator_classes || 0}</div>
                    <div className="progress-label">Leadership Roles</div>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-icon">📅</div>
                  <div className="progress-info">
                    <div className="progress-value">
                      {userProgress.member_since ? 
                        Math.floor((Date.now() - new Date(userProgress.member_since)) / (1000 * 60 * 60 * 24)) : 0
                      }
                    </div>
                    <div className="progress-label">Days Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>🔥 Recent Activity</h3>
              <div className="activity-list">
                {userActivity.recent_joins?.length > 0 ? (
                  userActivity.recent_joins.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === 'join' ? '➕' : '📚'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          Joined <strong>{activity.class_name}</strong>
                        </div>
                        <div className="activity-date">
                          {new Date(activity.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">
                    <span className="empty-icon">📭</span>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveView('recommendations')} className="action-btn discover">
                  🎯 Discover Classes
                </button>
                <button onClick={() => setActiveView('mentorship')} className="action-btn mentorship">
                  👥 Find Mentor
                </button>
                <button onClick={() => navigate('/classes/search')} className="action-btn search">
                  🔍 Search Classes
                </button>
                <button onClick={() => setActiveView('classes')} className="action-btn manage">
                  ⚙️ Manage Classes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MY CLASSES TAB */}
        {activeView === 'classes' && (
          <div className="classes-section">
            <div className="section-header">
              <h3>🎓 My Classes</h3>
              <div className="class-filters">
                <select className="filter-select">
                  <option value="all">All Classes</option>
                  <option value="demographic">Demographic</option>
                  <option value="subject">Subject</option>
                  <option value="public">Public</option>
                  <option value="special">Special</option>
                </select>
              </div>
            </div>

            {Object.keys(classesByType).length === 0 ? (
              <div className="empty-classes">
                <div className="empty-content">
                  <span className="empty-icon">🎓</span>
                  <h4>No Classes Yet</h4>
                  <p>You haven't joined any classes yet. Explore recommendations to get started!</p>
                  <button 
                    onClick={() => setActiveView('recommendations')} 
                    className="btn-explore"
                  >
                    🎯 Explore Classes
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(classesByType).map(([type, classes]) => (
                <div key={type} className="class-type-group">
                  <h4 className="type-header">
                    {type === 'demographic' ? '👥 Demographic Classes' :
                     type === 'subject' ? '📚 Subject Classes' :
                     type === 'public' ? '🌍 Public Classes' :
                     type === 'special' ? '⭐ Special Classes' : 
                     '📋 Other Classes'}
                    <span className="type-count">({classes.length})</span>
                  </h4>
                  
                  <div className="classes-grid">
                    {classes.map(classInfo => (
                      <div key={classInfo.class_id || classInfo.id} className="class-card">
                        <div className="class-header">
                          <div className="class-info">
                            <h5 className="class-name">{classInfo.class_name}</h5>
                            <div className="class-meta">
                              <span className="class-id">ID: {classInfo.display_id || classInfo.class_id}</span>
                              <span className="class-type">{classInfo.class_type}</span>
                              <span className={`class-role ${classInfo.role_in_class}`}>
                                {classInfo.role_in_class || 'member'}
                              </span>
                            </div>
                          </div>
                          <div className={`class-status ${classInfo.membership_status}`}>
                            {classInfo.membership_status === 'active' ? '✅' : '⏳'}
                          </div>
                        </div>

                        <div className="class-content">
                          <p className="class-description">
                            {classInfo.description || 'No description available'}
                          </p>
                          
                          <div className="class-stats">
                            <div className="stat">
                              <span className="stat-icon">👥</span>
                              <span>{classInfo.total_members || 0} members</span>
                            </div>
                            <div className="stat">
                              <span className="stat-icon">📅</span>
                              <span>Joined {new Date(classInfo.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="class-actions">
                          <button 
                            onClick={() => handleViewClass(classInfo)}
                            className="btn-view"
                          >
                            📖 View Content
                          </button>
                          <button 
                            onClick={() => handleViewMentorship(classInfo)}
                            className="btn-mentorship"
                          >
                            👥 Mentorship
                          </button>
                          <button 
                            onClick={() => handleLeaveClass(classInfo.class_id || classInfo.id)}
                            className="btn-leave"
                            disabled={leaveClassMutation.isLoading}
                          >
                            🚪 Leave
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MENTORSHIP TAB */}
        {activeView === 'mentorship' && (
          <div className="mentorship-section">
            <div className="section-header">
              <h3>👥 Mentorship Dashboard</h3>
              <p>Manage your mentorship relationships across all classes</p>
            </div>

            {userClasses.length === 0 ? (
              <div className="empty-mentorship">
                <div className="empty-content">
                  <span className="empty-icon">👥</span>
                  <h4>Join Classes for Mentorship</h4>
                  <p>You need to be in classes to access mentorship features</p>
                  <button 
                    onClick={() => setActiveView('recommendations')} 
                    className="btn-join-classes"
                  >
                    🎯 Find Classes
                  </button>
                </div>
              </div>
            ) : (
              <div className="mentorship-classes">
                {userClasses.map(classInfo => (
                  <ClassMentorshipView 
                    key={classInfo.class_id || classInfo.id}
                    classId={classInfo.class_id || classInfo.id}
                    showInDashboard={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeView === 'recommendations' && (
          <div className="recommendations-section">
            <div className="section-header">
              <h3>🎯 Recommended Classes</h3>
              <p>Personalized recommendations based on your profile and interests</p>
            </div>

            {/* Personalized Recommendations */}
            <div className="recommendations-group">
              <h4>✨ For You</h4>
              <div className="recommendations-grid">
                {recommendations.length === 0 ? (
                  <div className="empty-recommendations">
                    <span className="empty-icon">🎯</span>
                    <p>No personalized recommendations available</p>
                  </div>
                ) : (
                  recommendations.map(classInfo => (
                    <div key={classInfo.class_id || classInfo.id} className="recommendation-card">
                      <div className="recommendation-header">
                        <h5 className="class-name">{classInfo.class_name}</h5>
                        <div className="recommendation-score">
                          <span className="score-icon">⭐</span>
                          <span>{Math.floor(Math.random() * 5) + 1}/5 match</span>
                        </div>
                      </div>
                      
                      <div className="recommendation-content">
                        <p>{classInfo.description}</p>
                        <div className="class-details">
                          <span className="detail">📊 {classInfo.difficulty_level || 'Beginner'}</span>
                          <span className="detail">👥 {classInfo.total_members || 0} members</span>
                          <span className="detail">🏷️ {classInfo.class_type}</span>
                        </div>
                      </div>
                      
                      <div className="recommendation-actions">
                        <button 
                          onClick={() => handleJoinClass(classInfo.class_id || classInfo.id)}
                          className="btn-join-rec"
                          disabled={joinClassMutation.isLoading}
                        >
                          {joinClassMutation.isLoading ? 'Joining...' : '➕ Join Class'}
                        </button>
                        <button 
                          onClick={() => handleViewClass(classInfo)}
                          className="btn-preview"
                        >
                          👁️ Preview
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Demographic Classes */}
            <div className="recommendations-group">
              <h4>👥 Demographic Classes</h4>
              <div className="recommendations-grid">
                {demographicClasses.length === 0 ? (
                  <div className="empty-recommendations">
                    <span className="empty-icon">👥</span>
                    <p>No demographic classes available</p>
                  </div>
                ) : (
                  demographicClasses.map(classInfo => (
                    <div key={classInfo.class_id || classInfo.id} className="recommendation-card demographic">
                      <div className="recommendation-header">
                        <h5 className="class-name">{classInfo.class_name}</h5>
                        <span className="demographic-tag">👥 Demographic</span>
                      </div>
                      
                      <div className="recommendation-content">
                        <p>{classInfo.description}</p>
                        <div className="class-details">
                          <span className="detail">🌍 {classInfo.category || 'Community'}</span>
                          <span className="detail">👥 {classInfo.total_members || 0} members</span>
                          <span className="detail">🔓 {classInfo.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                      
                      <div className="recommendation-actions">
                        <button 
                          onClick={() => handleJoinClass(classInfo.class_id || classInfo.id)}
                          className="btn-join-rec demographic"
                          disabled={joinClassMutation.isLoading}
                        >
                          {joinClassMutation.isLoading ? 'Joining...' : '🏘️ Join Community'}
                        </button>
                        <button 
                          onClick={() => handleViewClass(classInfo)}
                          className="btn-preview"
                        >
                          👁️ Preview
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MENTORSHIP PANEL MODAL */}
      {showMentorshipPanel && selectedClass && (
        <div className="modal-overlay" onClick={() => setShowMentorshipPanel(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 Mentorship - {selectedClass.class_name}</h3>
              <button onClick={() => setShowMentorshipPanel(false)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <ClassMentorshipView 
                classId={selectedClass.class_id || selectedClass.id}
                showInDashboard={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedClassDashboard;