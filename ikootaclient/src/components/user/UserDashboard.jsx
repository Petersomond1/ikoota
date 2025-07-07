// ==================================================
// USER DASHBOARD COMPONENT (NEW)
// ikootaclient/src/components/user/UserDashboard.jsx
// ==================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api'; 
import './UserDashboard.css'; // Assuming you have a CSS file for styling

// ==================================================
// API FUNCTIONS
// ==================================================

const fetchUserDashboard = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/membership/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const submitMembershipApplication = async (applicationData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post('/membership/apply', applicationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/user/profile', profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put(`/user/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// ==================================================
// COMPONENT SECTIONS
// ==================================================

const MembershipStatus = ({ status, onApplyClick }) => {
  if (!status) return (
    <div className="membership-status loading">
      <div className="loading-spinner"></div>
      <p>Loading membership status...</p>
    </div>
  );

  const getStatusColor = (stage) => {
    switch (stage) {
      case 'member':
      case 'full_member':
        return 'success';
      case 'pre_member':
        return 'info';
      case 'applicant':
        return 'warning';
      case 'declined':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (stage) => {
    switch (stage) {
      case 'member':
      case 'full_member':
        return '✅';
      case 'pre_member':
        return '👤';
      case 'applicant':
        return '⏳';
      case 'declined':
        return '❌';
      default:
        return '📝';
    }
  };

  const canApplyForFullMembership = status.membership_stage === 'pre_member' && 
    status.full_membership_application_status !== 'pending' &&
    status.full_membership_application_status !== 'approved';

  const canApplyInitially = !status.membership_stage || 
    (status.membership_stage === 'applicant' && status.initial_application_status === 'declined');

  return (
    <div className="membership-status">
      <div className="status-header">
        <h3>Membership Status</h3>
        <div className={`status-badge ${getStatusColor(status.membership_stage)}`}>
          <span className="status-icon">{getStatusIcon(status.membership_stage)}</span>
          <span className="status-text">
            {status.membership_stage?.replace('_', ' ').toUpperCase() || 'NOT APPLIED'}
          </span>
        </div>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <strong>Current Status:</strong> 
          <span>{status.current_status?.replace(/_/g, ' ') || 'No application'}</span>
        </div>
        
        <div className="detail-item">
          <strong>Initial Application:</strong> 
          <span className={`status-indicator ${getStatusColor(status.initial_application_status)}`}>
            {status.initial_application_status || 'Not submitted'}
          </span>
        </div>

        {status.membership_stage === 'pre_member' && (
          <div className="detail-item">
            <strong>Full Membership:</strong> 
            <span className={`status-indicator ${getStatusColor(status.full_membership_application_status)}`}>
              {status.full_membership_application_status || 'Not submitted'}
            </span>
          </div>
        )}

        {status.application_date && (
          <div className="detail-item">
            <strong>Applied:</strong> 
            <span>{new Date(status.application_date).toLocaleDateString()}</span>
          </div>
        )}

        {status.approved_date && (
          <div className="detail-item">
            <strong>Approved:</strong> 
            <span>{new Date(status.approved_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {canApplyInitially && (
          <button 
            onClick={() => onApplyClick('initial')}
            className="btn-apply initial"
          >
            Apply for Membership
          </button>
        )}
        
        {canApplyForFullMembership && (
          <button 
            onClick={() => onApplyClick('full')}
            className="btn-apply full"
          >
            Apply for Full Membership
          </button>
        )}

        {status.membership_stage === 'member' && (
          <div className="member-benefits">
            <h4>Member Benefits Active</h4>
            <ul>
              <li>✅ Access to all courses</li>
              <li>✅ Mentor assignment</li>
              <li>✅ Community forums</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickActions = ({ actions, user }) => {
  const defaultActions = [
    {
      text: 'View Profile',
      link: '/profile',
      type: 'primary',
      icon: '👤'
    },
    {
      text: 'Towncrier Content',
      link: '/towncrier',
      type: 'secondary',
      icon: '📚'
    },
    {
      text: 'Iko Chat',
      link: '/iko',
      type: 'info',
      icon: '💬'
    },
    {
      text: 'Help Center',
      link: '/help',
      type: 'info',
      icon: '❓'
    },
    {
      text: 'Settings',
      link: '/settings',
      type: 'default',
      icon: '⚙️'
    }
  ];

  const allActions = [...(actions || []), ...defaultActions];

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        {allActions.map((action, index) => (
          <a 
            key={index} 
            href={action.link} 
            className={`action-btn ${action.type}`}
            title={action.description || action.text}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-text">{action.text}</span>
            {action.badge && (
              <span className="action-badge">{action.badge}</span>
            )}
          </a>
        ))}
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
      case 'course':
        return '📚';
      case 'message':
        return '💬';
      case 'login':
        return '🔐';
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

  return (
    <div className="recent-activities">
      <h3>Recent Activities</h3>
      {!activities || activities.length === 0 ? (
        <div className="empty-activities">
          <div className="empty-icon">📭</div>
          <p>No recent activities</p>
          <small>Your activities will appear here as you use the platform</small>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map((activity, index) => (
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
              {activity.actionRequired && (
                <div className="activity-action">
                  <button className="btn-small primary">
                    Take Action
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsSection = ({ notifications, onMarkAsRead }) => {
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
                  {new Date(notification.date).toLocaleDateString()}
                </span>
                {!notification.read && (
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

  const getLastLoginMessage = () => {
    if (!user?.last_login) return null;
    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const diffTime = Math.abs(now - lastLogin);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    return `Last seen on ${lastLogin.toLocaleDateString()}`;
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
            : "Here's your current status and available actions"
          }
        </p>
        {getLastLoginMessage() && (
          <p className="last-login">{getLastLoginMessage()}</p>
        )}
      </div>
      <div className="welcome-stats">
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.coursesCompleted || 0}</span>
          <span className="stat-label">Courses</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.achievementsUnlocked || 0}</span>
          <span className="stat-label">Achievements</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.daysActive || 0}</span>
          <span className="stat-label">Days Active</span>
        </div>
      </div>
    </div>
  );
};

// ==================================================
// MAIN COMPONENT
// ==================================================

const UserDashboard = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationType, setApplicationType] = useState(null);

  // Queries
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: fetchUserDashboard,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['userDashboard']);
    }
  });

  const applicationMutation = useMutation({
    mutationFn: submitMembershipApplication,
    onSuccess: () => {
      alert('Application submitted successfully!');
      setShowApplicationModal(false);
      queryClient.invalidateQueries(['userDashboard']);
    },
    onError: (error) => {
      alert(`Application failed: ${error.response?.data?.message || error.message}`);
    }
  });

  // Event Handlers
  const handleApplyClick = (type) => {
    setApplicationType(type);
    setShowApplicationModal(true);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleSubmitApplication = (applicationData) => {
    applicationMutation.mutate({
      type: applicationType,
      ...applicationData
    });
  };

  // Loading and Error States
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
    <div className="user-dashboard">
      <WelcomeSection user={user} dashboardData={dashboardData} />
      
      <div className="dashboard-grid">
        <MembershipStatus 
          status={dashboardData?.membershipStatus} 
          onApplyClick={handleApplyClick}
        />
        <QuickActions 
          actions={dashboardData?.quickActions}
          user={user}
        />
        <RecentActivities 
          activities={dashboardData?.recentActivities} 
        />
      </div>

      {dashboardData?.notifications?.length > 0 && (
        <NotificationsSection 
          notifications={dashboardData.notifications}
          onMarkAsRead={handleMarkAsRead}
        />
      )}

      {/* Application Modal - Simple version for now */}
      {showApplicationModal && (
        <div className="modal-overlay">
          <div className="modal-container application-modal">
            <div className="modal-header">
              <h3>
                {applicationType === 'initial' ? 'Initial Membership Application' : 'Full Membership Application'}
              </h3>
              <button 
                onClick={() => setShowApplicationModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p>
                {applicationType === 'initial' 
                  ? 'You are about to submit your initial membership application.'
                  : 'You are about to submit your full membership application.'
                }
              </p>
              <p>This will redirect you to the application form.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => handleSubmitApplication({})}
                className="btn-primary"
                disabled={applicationMutation.isLoading}
              >
                {applicationMutation.isLoading ? 'Submitting...' : 'Continue to Application'}
              </button>
              <button 
                onClick={() => setShowApplicationModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;