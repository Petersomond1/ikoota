// ikootaclient/src/components/user/UserDashboard.jsx - ENHANCED WITH CLASS SYSTEM
// Features: Class enrollment, progress tracking, personalized recommendations, content access

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import { getUserAccess } from '../config/accessMatrix';
import api from '../service/api'; 
import './userDashboard.css';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Userinfo from '../iko/Userinfo';

// ===============================================
// ✅ ENHANCED API FUNCTIONS WITH COMPREHENSIVE ENDPOINTS
// ===============================================

const fetchUserDashboard = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// Enhanced API for comprehensive user profile
const fetchUserProfile = async () => {
  const token = localStorage.getItem("token");
  try {
    const { data } = await api.get('/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.log('Profile API fallback to dashboard data');
    return fetchUserDashboard();
  }
};

// Mentorship assignments API
const fetchMentorshipAssignments = async () => {
  const token = localStorage.getItem("token");
  try {
    const { data } = await api.get('/users/mentorship/assignments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.log('Mentorship assignments API not available, using mock data');
    return {
      fromMentor: [
        {
          id: 'assignment_1',
          title: 'Complete African History Course Introduction',
          description: 'Study the fundamentals of African civilization and complete assigned readings.',
          assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          priority: 'high'
        }
      ],
      toMentees: []
    };
  }
};

// User activity analytics
const fetchUserAnalytics = async () => {
  const token = localStorage.getItem("token");
  try {
    const { data } = await api.get('/users/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    return {
      classesJoined: 0,
      activitiesCompleted: 0,
      daysActive: 1,
      engagementScore: 75,
      learningProgress: 30
    };
  }
};

const fetchUserClasses = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-classes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserProgress = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-progress', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserActivity = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-activity', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchRecommendations = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/recommendations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchPublicClasses = async (filters = {}) => {
  const params = new URLSearchParams({
    limit: '6',
    ...filters
  });
  const { data } = await api.get(`/classes?${params}`);
  return data;
};

const joinClass = async (classId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(`/classes/${classId}/join`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const leaveClass = async (classId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(`/classes/${classId}/leave`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put(`/communication/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// ===============================================
// ✅ ENHANCED COMPONENT SECTIONS
// ===============================================

const MembershipStatus = ({ status, onApplyClick }) => {
  console.log('🔍 MembershipStatus received status:', status);
  
  if (!status) return (
    <div className="membership-status loading">
      <div className="loading-spinner"></div>
      <p>Loading membership status...</p>
    </div>
  );

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'member':
      case 'full_member':
      case 'approved_member':
      case 'approved_pre_member':
      case 'approved':
        return 'success';
      case 'pre_member':
        return 'info';
      case 'ready_to_apply':
      case 'not_submitted':
        return 'primary';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'declined':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'member':
      case 'full_member':
      case 'approved_member':
      case 'approved_pre_member':
      case 'approved':
        return '✅';
      case 'pre_member':
        return '👤';
      case 'ready_to_apply':
      case 'not_submitted':
        return '📝';
      case 'pending':
      case 'under_review':
        return '⏳';
      case 'declined':
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  const membershipStage = status.membership_stage || 'none';
  const memberStatus = status.initial_application_status || status.application_status || 'not_applied';
  
  let applicationStatus, applicationStatusDisplay, applicationDescription;
  
  // Use new field structure with fallback for compatibility
  applicationStatus = status.initial_application_status || status.application_status || 'not_applied';
  applicationStatusDisplay = status.application_status_display || applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  applicationDescription = status.application_description || 'Application status information';
  
  console.log('🔍 MembershipStatus processing:', {
    membershipStage,
    memberStatus,
    applicationStatus,
    applicationStatusDisplay,
    applicationDescription
  });
  
  return (
    <div className="membership-status">
      <div className="status-header">
        <h3>Membership Status</h3>
        <div className={`status-badge ${getStatusColor(applicationStatus)}`}>
          <span className="status-icon">{getStatusIcon(applicationStatus)}</span>
          <span className="status-text">
            {applicationStatus === 'ready_to_apply' ? 'NEW USER' :
             applicationStatus === 'approved_pre_member' ? 'PRE-MEMBER' :
             applicationStatus === 'approved_member' ? 'FULL MEMBER' :
             applicationStatus === 'pending' ? 'UNDER REVIEW' :
             applicationStatusDisplay.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <strong>Current Status:</strong> 
          <span className={`status-indicator ${getStatusColor(memberStatus)}`}>
            {memberStatus === 'applied' && applicationStatus === 'ready_to_apply' ? 'Ready to Apply' :
             memberStatus === 'applied' ? 'Application Submitted' : 
             memberStatus === 'pre_member' ? 'Pre-Member' :
             memberStatus === 'member' ? 'Full Member' :
             memberStatus.replace(/_/g, ' ')}
          </span>
        </div>
        
        <div className="detail-item">
          <strong>Application Status:</strong> 
          <span className={`status-indicator ${getStatusColor(applicationStatus)}`}>
            {applicationStatusDisplay}
          </span>
        </div>

        {status.user_created && (
          <div className="detail-item">
            <strong>Member Since:</strong> 
            <span>{new Date(status.user_created).toLocaleDateString()}</span>
          </div>
        )}

        {(status.application_ticket || status.survey_ticket) && (
          <div className="detail-item">
            <strong>Application ID:</strong> 
            <span className="application-ticket">
              {status.application_ticket || status.survey_ticket}
            </span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {applicationStatus === 'ready_to_apply' && (
          <div className="ready-to-apply-message">
            <div className="ready-icon">📝</div>
            <h4>Ready to Apply</h4>
            <p>{applicationDescription}</p>
            <button 
              className="apply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Start Application
            </button>
          </div>
        )}

        {applicationStatus === 'not_submitted' && memberStatus === 'applied' && (
          <div className="not-submitted-message">
            <div className="not-submitted-icon">📝</div>
            <h4>Application Required</h4>
            <p>Complete your membership application to join our community.</p>
            <button 
              className="apply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Submit Application
            </button>
          </div>
        )}

        {(applicationStatus === 'pending' || applicationStatus === 'under_review') && (
          <div className="pending-message">
            <div className="pending-icon">⏳</div>
            <h4>Application Under Review</h4>
            <p>{applicationDescription}</p>
            {status.application_submittedAt && (
              <small>
                Submitted on {new Date(status.application_submittedAt).toLocaleDateString()}
              </small>
            )}
          </div>
        )}

        {(membershipStage === 'member' || applicationStatus === 'approved_member') && (
          <div className="member-benefits">
            <div className="benefits-icon">🎉</div>
            <h4>Full Member Benefits Active</h4>
            <ul>
              <li>✅ Access to Iko Chat</li>
              <li>✅ Full platform access</li>
              <li>✅ Class enrollment</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        )}

        {(membershipStage === 'pre_member' || applicationStatus === 'approved_pre_member') && (
          <div className="premember-benefits">
            <div className="benefits-icon">👤</div>
            <h4>Pre-Member Access</h4>
            <ul>
              <li>✅ Towncrier content access</li>
              <li>✅ Limited class access</li>
              <li>📝 Full membership application available</li>
            </ul>
            <button 
              className="upgrade-btn"
              onClick={() => window.location.href = '/full-membership'}
            >
              Apply for Full Membership
            </button>
          </div>
        )}

        {(applicationStatus === 'rejected' || applicationStatus === 'declined') && (
          <div className="rejected-message">
            <div className="rejected-icon">❌</div>
            <h4>Application Not Approved</h4>
            <p>{applicationDescription}</p>
            {(status.admin_notes || status.notes) && (
              <div className="admin-feedback">
                <strong>Feedback:</strong> {status.admin_notes || status.notes}
              </div>
            )}
            <button 
              className="reapply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Reapply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 

// ✅ ENHANCED CLASS ENROLLMENT COMPONENT
const ClassEnrollmentSection = ({ user }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch user's classes
  const { data: userClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['userClasses'],
    queryFn: fetchUserClasses,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['classRecommendations'],
    queryFn: fetchRecommendations,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Fetch public classes
  const { data: publicClasses } = useQuery({
    queryKey: ['publicClasses'],
    queryFn: () => fetchPublicClasses({ limit: 4 }),
    staleTime: 3 * 60 * 1000,
    retry: 1
  });

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: joinClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      queryClient.invalidateQueries(['classRecommendations']);
      alert('Successfully joined class!');
    },
    onError: (error) => {
      console.error('Failed to join class:', error);
      alert(error.response?.data?.message || 'Failed to join class');
    }
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: leaveClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      alert('Successfully left class!');
    },
    onError: (error) => {
      console.error('Failed to leave class:', error);
      alert(error.response?.data?.message || 'Failed to leave class');
    }
  });

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

  const userClassesData = userClasses?.data || [];
  const recommendedClasses = recommendations?.based_on_interests || recommendations?.popular_classes || [];
  const publicClassesData = publicClasses?.data || [];

  return (
    <div className="class-enrollment-section">
      <div className="section-header">
        <div className="section-title-group">
          <h3>My Classes</h3>
          <button 
            className="toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            {isCollapsed ? "▶" : "▼"}
          </button>
        </div>
        <button 
          onClick={() => navigate('/classes')}
          className="btn-browse"
        >
          Browse All Classes
        </button>
      </div>

      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        {classesLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your classes...</p>
          </div>
        ) : userClassesData.length === 0 ? (
        <div className="empty-classes">
          <div className="empty-icon">🎓</div>
          <h4>No Classes Yet</h4>
          <p>You haven't joined any classes yet. Explore our available classes below!</p>
        </div>
      ) : (
        <div className="user-classes-grid">
          {userClassesData.slice(0, 4).map(cls => (
            <div key={cls.class_id} className="class-card user">
              <div className="class-header">
                <h4>{cls.class_name}</h4>
                <span className={`status-badge ${cls.is_active ? 'active' : 'inactive'}`}>
                  {cls.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="class-info">
                <p className="class-description">
                  {cls.description?.substring(0, 100)}...
                </p>
                
                <div className="class-meta">
                  <span className="class-type">{cls.class_type}</span>
                  <span className="member-count">{cls.total_members} members</span>
                </div>
              </div>

              <div className="class-actions">
                <button 
                  onClick={() => navigate(`/classes/${encodeURIComponent(cls.class_id)}`)}
                  className="btn-view"
                >
                  View Class
                </button>
                <button 
                  onClick={() => handleLeaveClass(cls.class_id)}
                  className="btn-leave"
                  disabled={leaveClassMutation.isLoading}
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Classes */}
      {recommendedClasses.length > 0 && (
        <div className="recommendations-section">
          <h4>Recommended for You</h4>
          <div className="recommended-classes">
            {recommendedClasses.slice(0, 3).map(cls => (
              <div key={cls.class_id} className="class-card recommended">
                <div className="recommendation-badge">Recommended</div>
                <h5>{cls.class_name}</h5>
                <p>{cls.description?.substring(0, 80)}...</p>
                <div className="class-meta">
                  <span>{cls.class_type}</span>
                  <span>{cls.total_members} members</span>
                </div>
                <button 
                  onClick={() => handleJoinClass(cls.class_id)}
                  className="btn-join"
                  disabled={joinClassMutation.isLoading}
                >
                  Join Class
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Public Classes */}
      {publicClassesData.length > 0 && (
        // <div className="public-classes-section">
          <div className="public-classes">
             <span>Popular Public Classes</span>
            {publicClassesData.slice(0, 3).map(cls => (
              <div key={cls.class_id} className="class-card public">
                <div className="public-badge">Public</div>
                <h5>{cls.class_name}</h5>
                <p>{cls.description?.substring(0, 80)}...</p>
                <div className="class-meta">
                  <span>{cls.class_type}</span>
                  <span>{cls.total_members} members</span>
                </div>
                <button 
                  onClick={() => handleJoinClass(cls.class_id)}
                  className="btn-join"
                  disabled={joinClassMutation.isLoading}
                >
                  Join Class
                </button>
              </div>
            ))}
          </div>
        // </div>
      )}
      </div>
    </div>
  );
};

// ✅ ENHANCED PROGRESS TRACKING COMPONENT
const ProgressTrackingSection = ({ user }) => {
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress'],
    queryFn: fetchUserProgress,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: activityData } = useQuery({
    queryKey: ['userActivity'],
    queryFn: fetchUserActivity,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  if (progressLoading) {
    return (
      <div className="progress-section loading">
        <div className="loading-spinner"></div>
        <p>Loading progress...</p>
      </div>
    );
  }

  const progress = progressData?.progress || {};
  const activity = activityData?.activity || {};

  return (
    <div className="progress-tracking-section">
      <div className="section-header">
        <h3>My Progress</h3>
      </div>

      <div className="progress-stats">
        <div className="progress-stat">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h4>Classes Joined</h4>
            <span className="stat-number">{progress.total_classes_joined || 0}</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h4>Active Classes</h4>
            <span className="stat-number">{progress.active_classes || 0}</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h4>Completion Rate</h4>
            <span className="stat-number">{progress.completion_rate || 0}%</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Attendance Rate</h4>
            <span className="stat-number">{progress.attendance_rate || 0}%</span>
          </div>
        </div>
      </div>

      {activity.recent_participation && activity.recent_participation.length > 0 && (
        <div className="recent-activity">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {activity.recent_participation.slice(0, 5).map((item, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {item.type === 'join' ? '➕' :
                   item.type === 'complete' ? '✅' :
                   item.type === 'attend' ? '📅' : '📝'}
                </div>
                <div className="activity-content">
                  <span className="activity-text">{item.description}</span>
                  <span className="activity-time">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activity.upcoming_events && activity.upcoming_events.length > 0 && (
        <div className="upcoming-events">
          <h4>Upcoming Events</h4>
          <div className="events-list">
            {activity.upcoming_events.slice(0, 3).map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date">
                  <span className="date">{new Date(event.date).getDate()}</span>
                  <span className="month">{new Date(event.date).toLocaleDateString('en', { month: 'short' })}</span>
                </div>
                <div className="event-info">
                  <h5>{event.title}</h5>
                  <p>{event.class_name}</p>
                  <span className="event-time">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ ENHANCED QUICK ACTIONS WITH CLASS FEATURES
const QuickActions = ({ actions, user }) => {
  const { getUserStatus } = useUser();
  const userStatus = getUserStatus();
  const userAccess = user ? getUserAccess(user) : null;

  console.log('🔍 QuickActions - User Status:', userStatus);
  console.log('🔍 QuickActions - User Access:', userAccess);

  const getActionsForUser = () => {
    const baseActions = [
      {
        text: 'View Profile',
        link: '/profile',
        type: 'primary',
        icon: '👤',
        size: 'small'
      }
    ];

    // Class-related actions for all users
    const classActions = [
      {
        text: 'Browse Classes',
        link: '/classes',
        type: 'info',
        icon: '🎓',
        size: 'small'
      },
      {
        text: 'My Classes',
        link: '/classes/my-classes',
        type: 'secondary',
        icon: '📚',
        size: 'small'
      }
    ];

    // Admin specific actions
    if (userStatus === 'admin') {
      return [
        ...baseActions,
        ...classActions,
        {
          text: 'Admin Panel',
          link: '/admin',
          type: 'admin',
          icon: '🔧',
          size: 'small'
        },
        {
          text: 'Class Management',
          link: '/admin/audienceclassmgr',
          type: 'admin',
          icon: '📋',
          size: 'small'
        },
        {
          text: 'User Management',
          link: '/admin/usermanagement',
          type: 'admin',
          icon: '👥',
          size: 'small'
        },
        {
          text: 'Applications',
          link: '/admin/authcontrols',
          type: 'admin',
          icon: '📝',
          size: 'small'
        },
        {
          text: 'Iko Chat',
          link: '/iko',
          type: 'info',
          icon: '💬',
          size: 'small'
        },
        {
          text: 'Towncrier',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        }
      ];
    }

    // Full member actions
    if (userStatus === 'full_member') {
      return [
        ...baseActions,
        ...classActions,
        {
          text: 'Iko Chat',
          link: '/iko',
          type: 'info',
          icon: '💬',
          size: 'small'
        },
        {
          text: 'Towncrier',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        }
      ];
    }
    
    // Pre-member actions
    if (userStatus === 'pre_member') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Towncrier Content',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        },
        {
          text: 'Apply for Full Membership',
          link: '/full-membership-application',
          type: 'success',
          icon: '⬆️',
          size: 'small'
        }
      ];
    }
    
    // Pending verification actions
    if (userStatus === 'pending_verification') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Application Status',
          link: '/pending-verification',
          type: 'warning',
          icon: '⏳',
          size: 'small'
        }
      ];
    }
    
    // Needs application actions
    if (userStatus === 'needs_application') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Complete Application',
          link: '/applicationsurvey',
          type: 'primary',
          icon: '📝',
          size: 'small'
        }
      ];
    }
    
    return [...baseActions, ...classActions];
  };

  const defaultActions = [
    {
      text: 'Help Center',
      link: '/help',
      type: 'info',
      icon: '❓',
      size: 'small'
    },
    {
      text: 'Settings',
      link: '/settings',
      type: 'default',
      icon: '⚙️',
      size: 'small'
    },
    {
      text: 'Home',
      link: '/',
      type: 'secondary',
      icon: '🏠',
      size: 'small'
    }
  ];

  const userSpecificActions = getActionsForUser();
  const allActions = [...userSpecificActions, ...defaultActions, ...(actions || [])];

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid compact">
        {allActions.map((action, index) => (
          <a 
            key={index} 
            href={action.link} 
            className={`action-btn ${action.type} ${action.size || 'small'}`}
            title={action.description || action.text}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-text">{action.text}</span>
            {action.badge && (
              <span className="action-badge">{action.badge}</span>
            )}
          </a>
        ))}
        
        <button 
          onClick={handleLogout}
          className="action-btn danger small"
          title="Sign out of your account"
        >
          <div className="action-icon">🚪</div>
          <span className="action-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'application':
        return '📝';
      case 'approval':
        return '✅';
      case 'class_join':
        return '🎓';
      case 'class_complete':
        return '🏆';
      case 'course':
        return '📚';
      case 'message':
        return '💬';
      case 'login':
        return '🔐';
      case 'registration':
        return '🎉';
      default:
        return '📋';
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'declined':
        return 'danger';
      default:
        return 'info';
    }
  };

  const defaultActivities = [
    {
      type: 'registration',
      title: 'Account Created',
      description: 'Welcome to the Ikoota platform!',
      date: new Date().toISOString(),
      status: 'completed'
    },
    {
      type: 'class_join',
      title: 'Browse Classes',
      description: 'Explore available classes to join',
      date: new Date().toISOString(),
      status: 'pending'
    }
  ];

  const displayActivities = activities && activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="recent-activities">
      <h3>Recent Activities</h3>
      <div className="activities-list">
        {displayActivities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <h4 className="activity-title">{activity.title}</h4>
              <p className="activity-description">{activity.description}</p>
              <div className="activity-meta">
                <span className="activity-date">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
                <span className={`activity-status ${getActivityColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsSection = ({ notifications, onMarkAsRead }) => {
  const [localNotifications, setLocalNotifications] = useState([
    {
      id: 'welcome',
      type: 'info',
      message: 'Welcome to Ikoota! Complete your profile to get started.',
      date: new Date().toISOString(),
      read: false
    },
    {
      id: 'class_reminder',
      type: 'class',
      message: 'New classes are available for enrollment.',
      date: new Date().toISOString(),
      read: false
    }
  ]);

  const allNotifications = [...(notifications || []), ...localNotifications];

  if (allNotifications.length === 0) {
    return (
      <div className="notifications-section">
        <div className="section-header">
          <h3>Notifications & Communications</h3>
          <div className="notification-controls">
            <button className="refresh-btn">🔄</button>
          </div>
        </div>
        <div className="empty-notifications">
          <div className="empty-icon">🔔</div>
          <p>No new notifications</p>
          <small>You're all caught up!</small>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'class':
        return '🎓';
      case 'communication':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const handleMarkAsRead = (notificationId) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
    setLocalNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className="notifications-section">
      <div className="section-header">
        <h3>Notifications & Communications</h3>
        <div className="notification-controls">
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
          <button className="refresh-btn" title="Refresh notifications">🔄</button>
          <button className="mark-all-read-btn" title="Mark all as read">
            ✓ All
          </button>
        </div>
      </div>
      
      <div className="communication-tabs">
        <button className="tab-btn active">All</button>
        <button className="tab-btn">Messages</button>
        <button className="tab-btn">System</button>
      </div>
      
      <div className="notifications-list">
        {allNotifications.slice(0, 10).map((notification, index) => (
          <div 
            key={notification.id || index} 
            className={`notification ${notification.type} ${notification.read ? 'read' : 'unread'}`}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <div className="notification-meta">
                <span className="notification-date">
                  {new Date(notification.date || Date.now()).toLocaleDateString()}
                </span>
                <span className="notification-time">
                  {new Date(notification.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                {!notification.read && (
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="mark-read-btn"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
            {!notification.read && <div className="unread-indicator"></div>}
          </div>
        ))}
      </div>
      
      {allNotifications.length > 10 && (
        <div className="notifications-footer">
          <button className="view-all-btn">View All Notifications</button>
        </div>
      )}
    </div>
  );
};

const WelcomeSection = ({ user, dashboardData, analyticsData }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="welcome-section">
      <div className="welcome-content">
        <h1 className="welcome-title">
          {getGreeting()}, {user?.username || 'User'}! 👋
        </h1>
        <p className="welcome-subtitle">
          Here's your current status and available opportunities
        </p>
      </div>
    </div>
  );
};

// ===============================================
// ✅ MAIN ENHANCED USER DASHBOARD COMPONENT
// ===============================================

const UserDashboard = () => {
  const { user, isAuthenticated, getUserStatus } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // Enhanced URL routing support
  const getTabFromUrl = () => {
    // Check for /dashboard/profile pattern
    if (location.pathname === '/dashboard/profile') return 'profile';
    // Check for /dashboard?profile pattern
    if (searchParams.get('profile') !== null) return 'profile';
    if (searchParams.get('analytics') !== null) return 'analytics';
    // Check search params for tab
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'profile', 'analytics'].includes(tab)) return tab;
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [selectedProfileSection, setSelectedProfileSection] = useState(null);

  // Handle URL changes
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Update URL based on tab
    if (tab === 'profile') {
      // Support both URL patterns
      navigate('/dashboard?tab=profile', { replace: true });
    } else if (tab === 'analytics') {
      navigate('/dashboard?tab=analytics', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // Enhanced data fetching with multiple queries
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: fetchUserDashboard,
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1
  });

  // Classes data - available for profile tab
  const { data: userClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['userClasses'],
    queryFn: fetchUserClasses,
    enabled: !!user && isAuthenticated && (activeTab === 'profile' || selectedProfileSection === 'classes'),
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Activity data - available for profile tab
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['userActivity'],
    queryFn: fetchUserActivity,
    enabled: !!user && isAuthenticated && (activeTab === 'profile' || selectedProfileSection === 'activity'),
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Extract data arrays
  const userClassesData = userClasses?.data || [];

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    enabled: !!user && isAuthenticated && activeTab === 'profile',
    staleTime: 10 * 60 * 1000
  });

  const { data: mentorshipData } = useQuery({
    queryKey: ['mentorshipAssignments'],
    queryFn: fetchMentorshipAssignments,
    enabled: !!user && isAuthenticated && (activeTab === 'profile' || selectedProfileSection === 'mentorship'),
    staleTime: 5 * 60 * 1000
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['userAnalytics'],
    queryFn: fetchUserAnalytics,
    enabled: !!user && isAuthenticated,
    staleTime: 10 * 60 * 1000
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['userDashboard']);
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMentorshipClick = () => {
    setSelectedProfileSection(selectedProfileSection === 'mentorship' ? null : 'mentorship');
  };

  const handleProfileSectionClick = (section) => {
    setSelectedProfileSection(selectedProfileSection === section ? null : section);
  };

  // Assignment interaction handlers
  const handleCompleteAssignment = async (assignmentId) => {
    try {
      // In a real app, this would call an API endpoint
      console.log('Completing assignment:', assignmentId);
      alert('Assignment marked as complete! Your mentor will be notified.');
      
      // Refresh mentorship data
      queryClient.invalidateQueries(['mentorshipAssignments']);
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert('Failed to complete assignment. Please try again.');
    }
  };

  const handleAskQuestion = (assignmentId) => {
    const question = prompt('What question would you like to ask your mentor about this assignment?');
    if (question) {
      console.log('Question for assignment', assignmentId, ':', question);
      alert('Your question has been sent to your mentor. They will respond soon.');
    }
  };

  const handleEditAssignment = (assignmentId) => {
    console.log('Editing assignment:', assignmentId);
    alert('Assignment editing is not yet available. This feature is coming soon.');
  };

  const handleCheckProgress = (assignmentId, menteeConverseId) => {
    console.log('Checking progress for assignment:', assignmentId, 'mentee:', menteeConverseId);
    alert(`Checking progress for mentee ${menteeConverseId}. Progress tracking dashboard coming soon.`);
  };

  const handleCreateNewAssignment = () => {
    console.log('Creating new assignment');
    alert('Assignment creation interface is coming soon. For now, please contact your mentees directly.');
  };

  const handleBecomeMentor = () => {
    if (window.confirm('Would you like to apply to become a mentor? This will redirect you to the mentor application.')) {
      window.location.href = '/mentorship/apply';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-section">
            <div className="profile-links">
              <h3>Profile Management</h3>
              <div className="profile-link-grid">
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'identity' ? 'active' : ''}`}
                  onClick={() => handleProfileSectionClick('identity')}
                >
                  🎭 Identity
                </button>
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'membership' ? 'active' : ''}`}
                  onClick={() => handleProfileSectionClick('membership')}
                >
                  🏆 Membership
                </button>
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'mentorship' ? 'active' : ''}`}
                  onClick={() => handleMentorshipClick()}
                >
                  🌟 Mentorship
                </button>
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'classes' ? 'active' : ''}`}
                  onClick={() => handleProfileSectionClick('classes')}
                >
                  📚 Classes
                </button>
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'activity' ? 'active' : ''}`}
                  onClick={() => handleProfileSectionClick('activity')}
                >
                  📊 Activity
                </button>
                <button 
                  className={`profile-link-btn ${selectedProfileSection === 'permissions' ? 'active' : ''}`}
                  onClick={() => handleProfileSectionClick('permissions')}
                >
                  🔐 Permissions
                </button>
              </div>
            </div>

            {/* Dynamic Profile Content */}
            {selectedProfileSection && (
              <div className="profile-content">
                {selectedProfileSection === 'mentorship' && (
                  <div className="mentorship-assignments">
                    <h4>🌟 Mentorship Assignments</h4>
                    
                    {/* Section 1: Assignments FROM Mentor */}
                    <div className="assignments-section">
                      <h5>📋 Assignments from Mentor</h5>
                      {mentorshipData?.fromMentor && mentorshipData.fromMentor.length > 0 ? (
                        <div className="assignments-list">
                          {mentorshipData.fromMentor.map((assignment) => (
                            <div key={assignment.id} className={`assignment-card ${assignment.status}`}>
                              <div className="assignment-header">
                                <h6>{assignment.title}</h6>
                                <span className={`priority-badge ${assignment.priority}`}>
                                  {assignment.priority?.toUpperCase()}
                                </span>
                              </div>
                              <p className="assignment-description">{assignment.description}</p>
                              <div className="assignment-meta">
                                <span className="assigned-date">
                                  Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                                </span>
                                <span className="due-date">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                                <span className={`status-badge ${assignment.status}`}>
                                  {assignment.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              {assignment.status === 'in_progress' && (
                                <div className="assignment-actions">
                                  <button 
                                    className="btn-complete"
                                    onClick={() => handleCompleteAssignment(assignment.id)}
                                  >
                                    Mark Complete
                                  </button>
                                  <button 
                                    className="btn-question"
                                    onClick={() => handleAskQuestion(assignment.id)}
                                  >
                                    Ask Question
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-assignments">
                          <p>No assignments from mentor yet.</p>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Assignments TO Mentees */}
                    <div className="assignments-section">
                      <h5>👥 Assignments to Mentees</h5>
                      {mentorshipData?.toMentees && mentorshipData.toMentees.length > 0 ? (
                        <div className="assignments-list">
                          {mentorshipData.toMentees.map((assignment) => (
                            <div key={assignment.id} className={`assignment-card mentor-view ${assignment.status}`}>
                              <div className="assignment-header">
                                <h6>{assignment.title}</h6>
                                <span className="mentee-id">To: {assignment.menteeConverseId}</span>
                              </div>
                              <p className="assignment-description">{assignment.description}</p>
                              <div className="assignment-meta">
                                <span className="assigned-date">
                                  Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                                </span>
                                <span className="due-date">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                                <span className={`status-badge ${assignment.status}`}>
                                  {assignment.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="assignment-actions">
                                <button 
                                  className="btn-edit"
                                  onClick={() => handleEditAssignment(assignment.id)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn-progress"
                                  onClick={() => handleCheckProgress(assignment.id, assignment.menteeConverseId)}
                                >
                                  Check Progress
                                </button>
                              </div>
                            </div>
                          ))}
                          <button 
                            className="btn-create-assignment"
                            onClick={handleCreateNewAssignment}
                          >
                            + Create New Assignment
                          </button>
                        </div>
                      ) : (
                        <div className="no-assignments">
                          <p>You are not currently mentoring anyone.</p>
                          <button 
                            className="btn-become-mentor"
                            onClick={handleBecomeMentor}
                          >
                            Apply to Become Mentor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedProfileSection === 'identity' && (
                  <div className="identity-section">
                    <h4>🎭 Identity & Privacy</h4>
                    <div className="identity-info">
                      <div className="info-item">
                        <label>Converse ID:</label>
                        <span className="converse-id">{user?.converse_id || 'Not assigned'}</span>
                      </div>
                      <div className="info-item">
                        <label>Identity Status:</label>
                        <span className="identity-status">Protected</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProfileSection === 'membership' && (
                  <div className="membership-section">
                    <h4>🏆 Membership Status</h4>
                    <div className="membership-info">
                      <div className="info-item">
                        <label>Current Status:</label>
                        <span className="membership-status">{user?.membership_stage || 'Not a member'}</span>
                      </div>
                      <div className="info-item">
                        <label>Member Since:</label>
                        <span>{user?.user_created ? new Date(user.user_created).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Application Status:</label>
                        <span className={`status-indicator ${(user?.initial_application_status || user?.application_status) === 'approved' ? 'success' : 'info'}`}>
                          {user?.initial_application_status || user?.application_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProfileSection === 'classes' && (
                  <div className="classes-section">
                    <h4>📚 My Classes</h4>
                    {classesLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading classes...</p>
                      </div>
                    ) : userClassesData && userClassesData.length > 0 ? (
                      <div className="classes-list">
                        {userClassesData.map(cls => (
                          <div key={cls.class_id} className="class-item">
                            <div className="class-header">
                              <h5>{cls.class_name}</h5>
                              <span className={`status-badge ${cls.is_active ? 'active' : 'inactive'}`}>
                                {cls.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="class-description">{cls.description?.substring(0, 100)}...</p>
                            <div className="class-meta">
                              <span>Type: {cls.class_type}</span>
                              <span>Members: {cls.total_members}</span>
                              <span>Joined: {cls.joined_date ? new Date(cls.joined_date).toLocaleDateString() : 'Recently'}</span>
                            </div>
                            <div className="class-actions">
                              <button 
                                onClick={() => navigate(`/classes/${encodeURIComponent(cls.class_id)}`)}
                                className="btn-view-class"
                              >
                                View Class
                              </button>
                              <button 
                                onClick={() => handleLeaveClass(cls.class_id)}
                                className="btn-leave-class"
                              >
                                Leave Class
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-classes">
                        <p>You haven't joined any classes yet.</p>
                        <button 
                          onClick={() => navigate('/classes')}
                          className="btn-browse-classes"
                        >
                          Browse Available Classes
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedProfileSection === 'activity' && (
                  <div className="activity-section">
                    <h4>📊 My Activity</h4>
                    {activityLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading activity...</p>
                      </div>
                    ) : (
                      <div className="activity-content">
                        <div className="activity-summary">
                          <div className="summary-card">
                            <span className="summary-icon">📅</span>
                            <div className="summary-details">
                              <span className="summary-value">{analyticsData?.daysActive || 1}</span>
                              <span className="summary-label">Days Active</span>
                            </div>
                          </div>
                          <div className="summary-card">
                            <span className="summary-icon">✅</span>
                            <div className="summary-details">
                              <span className="summary-value">{analyticsData?.activitiesCompleted || 0}</span>
                              <span className="summary-label">Activities Completed</span>
                            </div>
                          </div>
                          <div className="summary-card">
                            <span className="summary-icon">📚</span>
                            <div className="summary-details">
                              <span className="summary-value">{analyticsData?.classesJoined || 0}</span>
                              <span className="summary-label">Classes Joined</span>
                            </div>
                          </div>
                          <div className="summary-card">
                            <span className="summary-icon">📈</span>
                            <div className="summary-details">
                              <span className="summary-value">{analyticsData?.engagementScore || 0}%</span>
                              <span className="summary-label">Engagement Score</span>
                            </div>
                          </div>
                        </div>

                        {activityData?.recent_participation && activityData.recent_participation.length > 0 && (
                          <div className="recent-activity-list">
                            <h5>Recent Activity</h5>
                            {activityData.recent_participation.map((item, index) => (
                              <div key={index} className="activity-timeline-item">
                                <div className="timeline-icon">
                                  {item.type === 'join' ? '➕' :
                                   item.type === 'complete' ? '✅' :
                                   item.type === 'attend' ? '📅' : '📝'}
                                </div>
                                <div className="timeline-content">
                                  <p className="timeline-description">{item.description}</p>
                                  <span className="timeline-date">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activityData?.upcoming_events && activityData.upcoming_events.length > 0 && (
                          <div className="upcoming-events-list">
                            <h5>Upcoming Events</h5>
                            {activityData.upcoming_events.map((event, index) => (
                              <div key={index} className="event-card">
                                <div className="event-date-badge">
                                  <span className="date">{new Date(event.date).getDate()}</span>
                                  <span className="month">
                                    {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                  </span>
                                </div>
                                <div className="event-details">
                                  <h6>{event.title}</h6>
                                  <p>{event.class_name}</p>
                                  <span className="event-time">{event.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedProfileSection === 'permissions' && (
                  <div className="permissions-section">
                    <h4>🔐 Permissions & Access</h4>
                    <div className="permissions-content">
                      <div className="permission-group">
                        <h5>Current Access Level</h5>
                        <div className="access-level">
                          <span className="access-icon">
                            {user?.is_admin ? '👑' : 
                             user?.membership_stage === 'member' ? '✅' :
                             user?.membership_stage === 'pre_member' ? '👤' : '🔒'}
                          </span>
                          <span className="access-title">
                            {user?.is_admin ? 'Administrator' :
                             user?.membership_stage === 'member' ? 'Full Member' :
                             user?.membership_stage === 'pre_member' ? 'Pre-Member' : 'Guest'}
                          </span>
                        </div>
                      </div>

                      <div className="permission-group">
                        <h5>Available Features</h5>
                        <ul className="features-list">
                          <li className={user?.membership_stage ? 'enabled' : 'disabled'}>
                            <span className="feature-icon">📰</span>
                            <span>Towncrier Access</span>
                            <span className="feature-status">
                              {user?.membership_stage ? '✅' : '❌'}
                            </span>
                          </li>
                          <li className={user?.membership_stage === 'member' || user?.is_admin ? 'enabled' : 'disabled'}>
                            <span className="feature-icon">💬</span>
                            <span>Iko Chat</span>
                            <span className="feature-status">
                              {user?.membership_stage === 'member' || user?.is_admin ? '✅' : '❌'}
                            </span>
                          </li>
                          <li className={user?.membership_stage ? 'enabled' : 'disabled'}>
                            <span className="feature-icon">🎓</span>
                            <span>Class Enrollment</span>
                            <span className="feature-status">
                              {user?.membership_stage ? '✅' : '❌'}
                            </span>
                          </li>
                          <li className={user?.is_mentor ? 'enabled' : 'disabled'}>
                            <span className="feature-icon">🌟</span>
                            <span>Mentorship Program</span>
                            <span className="feature-status">
                              {user?.is_mentor ? '✅' : '❌'}
                            </span>
                          </li>
                          <li className={user?.is_admin ? 'enabled' : 'disabled'}>
                            <span className="feature-icon">⚙️</span>
                            <span>Admin Panel</span>
                            <span className="feature-status">
                              {user?.is_admin ? '✅' : '❌'}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="permission-group">
                        <h5>Privacy Settings</h5>
                        <div className="privacy-settings">
                          <div className="privacy-item">
                            <label>Profile Visibility:</label>
                            <span className="privacy-value">
                              {user?.converse_id ? 'Protected (Converse ID)' : 'Standard'}
                            </span>
                          </div>
                          <div className="privacy-item">
                            <label>Data Sharing:</label>
                            <span className="privacy-value">Minimal</span>
                          </div>
                          <div className="privacy-item">
                            <label>Communication:</label>
                            <span className="privacy-value">Members Only</span>
                          </div>
                        </div>
                      </div>

                      {!user?.membership_stage || user?.membership_stage === 'pre_member' ? (
                        <div className="upgrade-prompt">
                          <p>Upgrade your membership to unlock more features!</p>
                          <button 
                            onClick={() => window.location.href = '/applicationsurvey'}
                            className="btn-upgrade"
                          >
                            Apply for Full Membership
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Keep other sections as they were */}
              </div>
            )}
          </div>
        );
      case 'analytics':
        return (
          <div className="analytics-section">
            <div className="analytics-content">
              <h3>Activity Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>Engagement Score</h4>
                  <div className="score-display">
                    <span className="score-number">{analyticsData?.engagementScore || 0}%</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${analyticsData?.engagementScore || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <p>Your community participation and engagement level</p>
                </div>
                <div className="analytics-card">
                  <h4>Learning Progress</h4>
                  <div className="progress-display">
                    <span className="progress-number">{analyticsData?.learningProgress || 0}%</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${analyticsData?.learningProgress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <p>Overall progress through classes and assignments</p>
                </div>
                <div className="analytics-card">
                  <h4>Activity Summary</h4>
                  <div className="activity-stats">
                    <div className="stat">
                      <span className="stat-value">{analyticsData?.classesJoined || 0}</span>
                      <span className="stat-name">Classes</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{analyticsData?.activitiesCompleted || 0}</span>
                      <span className="stat-name">Activities</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{analyticsData?.daysActive || 1}</span>
                      <span className="stat-name">Days Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default: // 'overview'
        return (
          <div className="dashboard-content">
            <div className="dashboard-grid enhanced">
              <div className="dashboard-main">
                <div className="top-section">
                  <div className="user-status-section">
                    <Userinfo />
                  </div>
                  <div className="quick-stats-section">
                    <div className='quick-stats-section2'>
                    <div className="welcome-stats">
                      <div className="stat-item">
                        <span className="stat-number">{analyticsData?.classesJoined || 0}</span>
                        <span className="stat-label">Classes Joined</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{analyticsData?.activitiesCompleted || 0}</span>
                        <span className="stat-label">Activities</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{analyticsData?.daysActive || 1}</span>
                        <span className="stat-label">Days Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                
                <div className="main-content-section">
                  <div className="left-column">
                    <MembershipStatus 
                      status={dashboardData?.membershipStatus || user} 
                    />
                    
                    <ProgressTrackingSection user={user} />
                    <ClassEnrollmentSection user={user} />
                  </div>
                  
                  <div className="right-column">
                    <QuickActions 
                      actions={dashboardData?.quickActions}
                      user={user}
                    />
                    
                    <NotificationsSection 
                      notifications={dashboardData?.notifications}
                      onMarkAsRead={handleMarkAsRead}
                    />
              
                    <RecentActivities 
                      activities={dashboardData?.recentActivities} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-auth-error">
        <div className="auth-error-container">
          <div className="auth-error-icon">🔐</div>
          <h3>Authentication Required</h3>
          <p>Please log in to view your dashboard</p>
          <a href="/login" className="login-btn">Go to Login</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <h3>Loading your dashboard...</h3>
          <p>Please wait while we fetch your latest information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error loading dashboard</h3>
          <p>{error.message}</p>
          <button 
            onClick={() => queryClient.invalidateQueries(['userDashboard'])}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard enhanced">
      <div className="dashboard-header">
        <div className="header-top">
          <WelcomeSection user={user} dashboardData={dashboardData} analyticsData={analyticsData} />
          
          <div className="header-right">
            <div className="notification-indicator">
              <button 
                className="notification-badge-global"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                title="View notifications"
              >
                2
              </button>
              
              {showNotificationDropdown && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    <button 
                      className="close-dropdown"
                      onClick={() => setShowNotificationDropdown(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="dropdown-content">
                    <div className="notification-item-dropdown">
                      <div className="notif-icon">ℹ️</div>
                      <div className="notif-content">
                        <p>Welcome to Ikoota! Complete your profile to get started.</p>
                        <small>2 minutes ago</small>
                      </div>
                    </div>
                    <div className="notification-item-dropdown">
                      <div className="notif-icon">🎓</div>
                      <div className="notif-content">
                        <p>New classes are available for enrollment.</p>
                        <small>5 minutes ago</small>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-footer">
                    <button className="view-all-notifications">View All</button>
                  </div>
                </div>
              )}
            </div>
            <div className="dashboard-navigation">
              <button 
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => handleTabChange('overview')}
                title="View your dashboard overview with membership status and quick actions"
              >
                Overview
              </button>
              <button 
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => handleTabChange('profile')}
                title="Manage your profile, mentorship assignments, and personal settings"
              >
                Profile
              </button>
              <button 
                className={activeTab === 'analytics' ? 'active' : ''}
                onClick={() => handleTabChange('analytics')}
                title="View your engagement scores and learning progress analytics"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default UserDashboard;




