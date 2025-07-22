// ikootaclient/src/components/user/UserDashboard.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api'; 
import './UserDashboard.css';

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
      case 'applied':
        return 'warning';
      case 'declined':
      case 'rejected':
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
      case 'applied':
        return '⏳';
      case 'declined':
      case 'rejected':
        return '❌';
      default:
        return '📝';
    }
  };

  const membershipStage = status.membership_stage || 'none';
  const memberStatus = status.is_member || 'not_applied';
  
  return (
    <div className="membership-status">
      <div className="status-header">
        <h3>Membership Status</h3>
        <div className={`status-badge ${getStatusColor(membershipStage)}`}>
          <span className="status-icon">{getStatusIcon(membershipStage)}</span>
          <span className="status-text">
            {membershipStage === 'none' ? 'APPLIED' : membershipStage.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <strong>Current Status:</strong> 
          <span className={`status-indicator ${getStatusColor(memberStatus)}`}>
            {memberStatus === 'applied' ? 'Application Submitted' : memberStatus.replace(/_/g, ' ')}
          </span>
        </div>
        
        <div className="detail-item">
          <strong>Application Status:</strong> 
          <span className={`status-indicator ${getStatusColor(status.initial_application_status)}`}>
            {status.initial_application_status === 'not_submitted' ? 'Ready to Submit' : 
             status.initial_application_status || 'Pending Review'}
          </span>
        </div>

        {status.user_created && (
          <div className="detail-item">
            <strong>Member Since:</strong> 
            <span>{new Date(status.user_created).toLocaleDateString()}</span>
          </div>
        )}

        {status.application_ticket && (
          <div className="detail-item">
            <strong>Application ID:</strong> 
            <span className="application-ticket">{status.application_ticket}</span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {membershipStage === 'none' && memberStatus === 'applied' && (
          <div className="pending-message">
            <div className="pending-icon">⏳</div>
            <h4>Application Under Review</h4>
            <p>Your application has been submitted and is currently being reviewed by our team. You'll receive an update soon!</p>
          </div>
        )}

        {membershipStage === 'member' && (
          <div className="member-benefits">
            <h4>Member Benefits Active</h4>
            <ul>
              <li>✅ Access to Iko Chat</li>
              <li>✅ Full platform access</li>
              <li>✅ Community participation</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        )}

        {membershipStage === 'pre_member' && (
          <div className="premember-benefits">
            <h4>Pre-Member Access</h4>
            <ul>
              <li>✅ Towncrier content access</li>
              <li>✅ Limited community features</li>
              <li>📝 Full membership application available</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickActions = ({ actions, user }) => {
  const { getUserStatus } = useUser();
  const userStatus = getUserStatus();

  // Dynamic actions based on user status
  const getActionsForUser = () => {
    const baseActions = [
      {
        text: 'View Profile',
        link: '/profile',
        type: 'primary',
        icon: '👤'
      }
    ];

    switch (userStatus) {
      case 'full_member':
        return [
          ...baseActions,
          {
            text: 'Iko Chat',
            link: '/iko',
            type: 'info',
            icon: '💬'
          },
          {
            text: 'Towncrier',
            link: '/towncrier',
            type: 'secondary',
            icon: '📚'
          }
        ];
      
      case 'pre_member':
        return [
          ...baseActions,
          {
            text: 'Towncrier Content',
            link: '/towncrier',
            type: 'secondary',
            icon: '📚'
          },
          {
            text: 'Apply for Full Membership',
            link: '/full-membership-application',
            type: 'success',
            icon: '📝'
          }
        ];
      
      case 'pending_verification':
        return [
          ...baseActions,
          {
            text: 'Application Status',
            link: '/pending-verification',
            type: 'warning',
            icon: '⏳'
          }
        ];
      
      case 'needs_application':
        return [
          ...baseActions,
          {
            text: 'Complete Application',
            link: '/applicationsurvey',
            type: 'primary',
            icon: '📝'
          }
        ];
      
      default:
        return baseActions;
    }
  };

  const defaultActions = [
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

  const userSpecificActions = getActionsForUser();
  const allActions = [...userSpecificActions, ...defaultActions, ...(actions || [])];

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

  // Default activities if none provided
  const defaultActivities = [
    {
      type: 'registration',
      title: 'Account Created',
      description: 'Welcome to the Ikoota platform!',
      date: new Date().toISOString(),
      status: 'completed'
    },
    {
      type: 'application',
      title: 'Application Submitted',
      description: 'Your membership application is under review',
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
            : "Here's your current status and available actions"
          }
        </p>
      </div>
      <div className="welcome-stats">
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.coursesCompleted || 0}</span>
          <span className="stat-label">Activities</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.achievementsUnlocked || 0}</span>
          <span className="stat-label">Achievements</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.daysActive || 1}</span>
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
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Queries
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: fetchUserDashboard,
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['userDashboard']);
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  // Event Handlers
  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Loading and Error States
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
    <div className="user-dashboard">
      <WelcomeSection user={user} dashboardData={dashboardData} />
      
      <div className="dashboard-grid">
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

