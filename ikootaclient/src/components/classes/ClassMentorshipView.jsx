// ikootaclient/src/components/classes/ClassMentorshipView.jsx
// MENTORSHIP INTEGRATION FOR CLASS SYSTEM
// Shows mentor-mentee relationships within classes using converse IDs

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './ClassMentorshipView.css';

const ClassMentorshipView = ({ classId, showInDashboard = false }) => {
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();
  const [selectedMentorshipPair, setSelectedMentorshipPair] = useState(null);
  const [showMentorshipDetails, setShowMentorshipDetails] = useState(false);

  // Normalize class ID for API calls (remove # if present)
  const apiClassId = classId?.replace('#', '') || classId;

  // ✅ FETCH CLASS MENTORSHIP DATA
  const { data: mentorshipData, isLoading: mentorshipLoading, error: mentorshipError } = useQuery({
    queryKey: ['classMentorship', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/mentorship-pairs`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // ✅ FETCH USER'S MENTORSHIP STATUS IN THIS CLASS
  const { data: userMentorshipStatus } = useQuery({
    queryKey: ['userClassMentorship', apiClassId, user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/my-mentorship-status`);
      return data;
    },
    enabled: !!apiClassId && !!user?.id && isAuthenticated,
    staleTime: 2 * 60 * 1000
  });

  // ✅ FETCH CLASS MEMBERS WITH MENTORSHIP ROLES
  const { data: classMembersData } = useQuery({
    queryKey: ['classMembersWithMentorship', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/members?include_mentorship=true`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 2 * 60 * 1000
  });

  // ✅ REQUEST MENTOR ASSIGNMENT
  const requestMentorMutation = useMutation({
    mutationFn: async (mentorData) => {
      return await api.post(`/classes/${apiClassId}/request-mentor`, mentorData);
    },
    onSuccess: () => {
      alert('Mentor request submitted successfully!');
      queryClient.invalidateQueries(['classMentorship']);
      queryClient.invalidateQueries(['userClassMentorship']);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to request mentor');
    }
  });

  // ✅ ACCEPT MENTORSHIP (FOR MENTORS)
  const acceptMentorshipMutation = useMutation({
    mutationFn: async ({ menteeConverseId }) => {
      return await api.post(`/classes/${apiClassId}/accept-mentorship`, {
        mentee_converse_id: menteeConverseId
      });
    },
    onSuccess: () => {
      alert('Mentorship accepted!');
      queryClient.invalidateQueries(['classMentorship']);
    }
  });

  // Process data safely
  const mentorshipPairs = mentorshipData?.data || [];
  const classMembers = classMembersData?.data?.data || [];
  const userStatus = userMentorshipStatus?.data || {};

  // Find user's mentorship info in this class
  const userAsMentee = mentorshipPairs.find(pair => 
    pair.mentee_converse_id === user?.converse_id || 
    pair.mentee_id === user?.id
  );
  
  const userAsMentor = mentorshipPairs.filter(pair => 
    pair.mentor_converse_id === user?.converse_id || 
    pair.mentor_id === user?.id
  );

  // Check if user can be a mentor (based on role or experience)
  const canBeMentor = user?.role === 'admin' || user?.role === 'super_admin' || 
                     user?.membership_stage === 'member' ||
                     classMembers.find(member => 
                       (member.user_id === user?.id || member.converse_id === user?.converse_id) &&
                       (member.role_in_class === 'moderator' || member.role_in_class === 'mentor')
                     );

  // ✅ HANDLERS
  const handleRequestMentor = () => {
    if (!user?.converse_id) {
      alert('Please complete your profile setup to request a mentor');
      return;
    }
    
    requestMentorMutation.mutate({
      mentee_converse_id: user.converse_id,
      class_id: apiClassId,
      reason: 'Requesting guidance in this class'
    });
  };

  const handleAcceptMentorship = (menteeConverseId) => {
    if (window.confirm('Do you want to accept this mentorship responsibility?')) {
      acceptMentorshipMutation.mutate({ menteeConverseId });
    }
  };

  const handleViewMentorshipDetails = (pair) => {
    setSelectedMentorshipPair(pair);
    setShowMentorshipDetails(true);
  };

  // ✅ RENDER LOADING STATE
  if (mentorshipLoading) {
    return (
      <div className="mentorship-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading mentorship information...</p>
      </div>
    );
  }

  // ✅ RENDER ERROR STATE
  if (mentorshipError) {
    return (
      <div className="mentorship-view-error">
        <div className="error-icon">⚠️</div>
        <p>Could not load mentorship data</p>
      </div>
    );
  }

  // ✅ MAIN RENDER
  return (
    <div className={`class-mentorship-view ${showInDashboard ? 'dashboard-mode' : 'full-mode'}`}>
      {/* ✅ HEADER */}
      <div className="mentorship-header">
        <div className="header-content">
          <h3>
            {showInDashboard ? '👥 Class Mentorship' : '👥 Mentorship Network'}
            <span className="mentorship-count">({mentorshipPairs.length} active pairs)</span>
          </h3>
          
          {!showInDashboard && (
            <div className="mentorship-stats">
              <div className="stat-item">
                <span className="stat-value">{mentorshipPairs.length}</span>
                <span className="stat-label">Active Pairs</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {new Set(mentorshipPairs.map(p => p.mentor_converse_id)).size}
                </span>
                <span className="stat-label">Mentors</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {mentorshipPairs.filter(p => p.is_active).length}
                </span>
                <span className="stat-label">Active Now</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ USER'S MENTORSHIP STATUS */}
      <div className="user-mentorship-status">
        <div className="status-section">
          <h4>Your Mentorship Status</h4>
          
          {userAsMentee ? (
            <div className="mentorship-info mentee-info">
              <div className="mentorship-role">
                <span className="role-badge mentee">👥 Mentee</span>
              </div>
              <div className="mentorship-details">
                <p><strong>Mentor:</strong> {userAsMentee.mentor_display_name || userAsMentee.mentor_converse_id}</p>
                <p><strong>Since:</strong> {new Date(userAsMentee.created_at || userAsMentee.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${userAsMentee.is_active ? 'active' : 'inactive'}`}>
                    {userAsMentee.is_active ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="no-mentorship mentee">
              <div className="no-mentorship-content">
                <span className="no-mentorship-icon">👤</span>
                <p>You don't have a mentor in this class yet</p>
                <button 
                  onClick={handleRequestMentor}
                  className="btn-request-mentor"
                  disabled={requestMentorMutation.isLoading}
                >
                  {requestMentorMutation.isLoading ? 'Requesting...' : '🙋‍♂️ Request a Mentor'}
                </button>
              </div>
            </div>
          )}

          {userAsMentor.length > 0 && (
            <div className="mentorship-info mentor-info">
              <div className="mentorship-role">
                <span className="role-badge mentor">🧑‍🏫 Mentor</span>
                <span className="mentee-count">({userAsMentor.length} mentees)</span>
              </div>
              <div className="mentees-list">
                {userAsMentor.map(pair => (
                  <div key={pair.id} className="mentee-item">
                    <div className="mentee-info">
                      <span className="mentee-name">{pair.mentee_display_name || pair.mentee_converse_id}</span>
                      <span className="mentee-since">
                        Since {new Date(pair.created_at || pair.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`mentee-status ${pair.is_active ? 'active' : 'inactive'}`}>
                      {pair.is_active ? '🟢' : '⚫'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canBeMentor && userAsMentor.length === 0 && (
            <div className="mentor-availability">
              <div className="availability-content">
                <span className="availability-icon">🧑‍🏫</span>
                <p>You're eligible to be a mentor in this class</p>
                <p className="availability-note">Accept mentorship requests to help other members</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MENTORSHIP PAIRS LIST */}
      <div className="mentorship-pairs-section">
        <div className="section-header">
          <h4>Class Mentorship Pairs</h4>
          {!showInDashboard && (
            <div className="view-controls">
              <button className="btn-toggle-view" onClick={() => setShowMentorshipDetails(!showMentorshipDetails)}>
                {showMentorshipDetails ? '👁️ Hide Details' : '🔍 Show Details'}
              </button>
            </div>
          )}
        </div>

        <div className="mentorship-pairs-list">
          {mentorshipPairs.length === 0 ? (
            <div className="empty-mentorship">
              <div className="empty-content">
                <span className="empty-icon">👥</span>
                <h4>No Mentorship Pairs Yet</h4>
                <p>Be the first to start a mentorship relationship in this class!</p>
                {!userAsMentee && (
                  <button onClick={handleRequestMentor} className="btn-start-mentorship">
                    🙋‍♂️ Request a Mentor
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="pairs-grid">
              {mentorshipPairs.map(pair => (
                <div key={pair.id} className={`mentorship-pair ${pair.is_active ? 'active' : 'inactive'}`}>
                  <div className="pair-header">
                    <div className="pair-status">
                      <span className={`status-dot ${pair.is_active ? 'active' : 'inactive'}`}></span>
                      <span className="pair-type">{pair.relationship_type || 'mentor'}</span>
                    </div>
                    <div className="pair-date">
                      {new Date(pair.created_at || pair.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="pair-content">
                    <div className="mentor-section">
                      <div className="role-label">🧑‍🏫 Mentor</div>
                      <div className="participant-info">
                        <div className="participant-name">
                          {pair.mentor_display_name || pair.mentor_converse_id}
                        </div>
                        {showMentorshipDetails && (
                          <div className="participant-details">
                            <span>ID: {pair.mentor_converse_id}</span>
                            {pair.mentor_expertise && (
                              <span>Focus: {pair.mentor_expertise}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pair-connection">
                      <div className="connection-line"></div>
                      <div className="connection-icon">⇄</div>
                    </div>

                    <div className="mentee-section">
                      <div className="role-label">👥 Mentee</div>
                      <div className="participant-info">
                        <div className="participant-name">
                          {pair.mentee_display_name || pair.mentee_converse_id}
                        </div>
                        {showMentorshipDetails && (
                          <div className="participant-details">
                            <span>ID: {pair.mentee_converse_id}</span>
                            {pair.learning_goals && (
                              <span>Goals: {pair.learning_goals}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {showMentorshipDetails && (
                    <div className="pair-footer">
                      <button 
                        onClick={() => handleViewMentorshipDetails(pair)}
                        className="btn-view-details"
                      >
                        View Details
                      </button>
                      
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <div className="admin-controls">
                          <button className="btn-edit-pair">✏️ Edit</button>
                          <button className="btn-archive-pair">📦 Archive</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MENTORSHIP DETAILS MODAL */}
      {selectedMentorshipPair && (
        <div className="modal-overlay" onClick={() => setSelectedMentorshipPair(null)}>
          <div className="modal-content mentorship-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mentorship Details</h3>
              <button onClick={() => setSelectedMentorshipPair(null)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="mentorship-full-details">
                <div className="detail-section">
                  <h4>🧑‍🏫 Mentor Information</h4>
                  <div className="detail-content">
                    <p><strong>Display Name:</strong> {selectedMentorshipPair.mentor_display_name}</p>
                    <p><strong>Converse ID:</strong> {selectedMentorshipPair.mentor_converse_id}</p>
                    <p><strong>Expertise:</strong> {selectedMentorshipPair.mentor_expertise || 'General mentoring'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>👥 Mentee Information</h4>
                  <div className="detail-content">
                    <p><strong>Display Name:</strong> {selectedMentorshipPair.mentee_display_name}</p>
                    <p><strong>Converse ID:</strong> {selectedMentorshipPair.mentee_converse_id}</p>
                    <p><strong>Learning Goals:</strong> {selectedMentorshipPair.learning_goals || 'Not specified'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>📊 Relationship Status</h4>
                  <div className="detail-content">
                    <p><strong>Type:</strong> {selectedMentorshipPair.relationship_type}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${selectedMentorshipPair.is_active ? 'active' : 'inactive'}`}>
                        {selectedMentorshipPair.is_active ? '🟢 Active' : '⚫ Inactive'}
                      </span>
                    </p>
                    <p><strong>Started:</strong> {new Date(selectedMentorshipPair.created_at).toLocaleString()}</p>
                    <p><strong>Class:</strong> {classId}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedMentorshipPair(null)} className="btn-close-modal">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassMentorshipView;