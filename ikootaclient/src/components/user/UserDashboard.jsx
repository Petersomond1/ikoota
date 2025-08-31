// ikootaclient/src/components/user/UserDashboard.jsx - ENHANCED WITH CLASS SYSTEM
// Features: Class enrollment, progress tracking, personalized recommendations, content access

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import { getUserAccess } from '../config/accessMatrix';
import api from '../service/api'; 
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ===============================================
// ✅ ENHANCED API FUNCTIONS WITH CLASS ENDPOINTS
// ===============================================

const fetchUserDashboard = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
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
  const memberStatus = status.is_member || 'not_applied';
  
  let applicationStatus, applicationStatusDisplay, applicationDescription;
  
  if (status.application_status) {
    applicationStatus = status.application_status;
    applicationStatusDisplay = status.application_status_display || status.application_status;
    applicationDescription = status.application_description || 'No description available';
  } else {
    applicationStatus = status.initial_application_status || 'not_submitted';
    applicationStatusDisplay = applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    applicationDescription = 'Application status information';
  }
  
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
            {status.admin_notes && (
              <div className="admin-feedback">
                <strong>Feedback:</strong> {status.admin_notes}
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
        <h3>My Classes</h3>
        <button 
          onClick={() => navigate('/classes')}
          className="btn-browse"
        >
          Browse All Classes
        </button>
      </div>

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
  if (!notifications || notifications.length === 0) {
    return (
      <div className="notifications-section">
        <h3>Notifications</h3>
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
      default:
        return '📢';
    }
  };

  return (
    <div className="notifications-section">
      <h3>Notifications</h3>
      <div className="notifications-list">
        {notifications.map((notification, index) => (
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
                {!notification.read && onMarkAsRead && (
                  <button 
                    onClick={() => onMarkAsRead(notification.id)}
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
    </div>
  );
};

const WelcomeSection = ({ user, dashboardData }) => {
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
          {dashboardData?.membershipStatus?.membership_stage === 'member' 
            ? "Welcome back to your member dashboard"
            : "Here's your current status and available opportunities"
          }
        </p>
      </div>
      <div className="welcome-stats">
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.classesJoined || 0}</span>
          <span className="stat-label">Classes Joined</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.activitiesCompleted || 0}</span>
          <span className="stat-label">Activities</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.daysActive || 1}</span>
          <span className="stat-label">Days Active</span>
        </div>
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

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: fetchUserDashboard,
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1
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
      <WelcomeSection user={user} dashboardData={dashboardData} />
      
      <div className="dashboard-grid enhanced">
        <MembershipStatus 
          status={dashboardData?.membershipStatus || user} 
        />
        
        <QuickActions 
          actions={dashboardData?.quickActions}
          user={user}
        />
  
        <RecentActivities 
          activities={dashboardData?.recentActivities} 
        />
      </div>

        <ProgressTrackingSection user={user} />
        {/* <MediaGallerySection user={user} /> */}

        <ClassEnrollmentSection user={user} />
        
      

      {(dashboardData?.notifications?.length > 0) && (
        <NotificationsSection 
          notifications={dashboardData.notifications}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

export default UserDashboard;




