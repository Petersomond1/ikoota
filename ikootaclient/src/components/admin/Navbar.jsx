// ikootaclient/src/components/admin/Navbar.jsx
// ==================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationCount, setNotificationCount] = useState(3); // Example notification count
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New user registration pending approval", time: "5 min ago", type: "info" },
    { id: 2, message: "System backup completed successfully", time: "1 hour ago", type: "success" },
    { id: 3, message: "Server maintenance scheduled for tonight", time: "2 hours ago", type: "warning" }
  ]);
  
  const navigate = useNavigate();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Get current user info (replace with your auth logic)
  useEffect(() => {
    // Replace this with your actual user fetching logic
    const user = {
      name: 'Admin User',
      role: 'Administrator',
      email: 'admin@ikoota.com'
    };
    setCurrentUser(user);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown') && !event.target.closest('.notifications-btn')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ✅ Enhanced action button handlers
  const handleNotifications = () => {
    console.log('Notifications clicked');
    setShowNotifications(!showNotifications);
    
    // Reset notification count when opened
    if (!showNotifications) {
      setNotificationCount(0);
    }
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // Navigate to settings page
    navigate('/admin/settings');
    // Or you could show a settings modal instead
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      // Clear user session/tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      // Optional: Call logout API
      // api.post('/auth/logout').then(() => {
      //   navigate('/login');
      // }).catch(() => {
      //   navigate('/login'); // Still navigate even if API fails
      // });
      
      // Redirect to login page
      navigate('/login');
      
      // Show success message
      alert('Successfully logged out!');
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationCount(0);
    setShowNotifications(false);
  };

  return (
    <nav className="admin-navbar-content">
      {/* Left side - Page title area */}
      <div className="navbar-left">
        <h1 className="navbar-title">Admin Dashboard</h1>
      </div>

      {/* Center - Status indicators (hidden on mobile) */}
      <div className="navbar-center">
        <div className="status-indicators">
          <span className="status-indicator online">
            <span className="status-dot"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Right side - User info and actions */}
      <div className="navbar-right">
        {/* Time display (hidden on small mobile) */}
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="current-date">{formatDate(currentTime)}</span>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.role}</span>
          </div>
        )}

        {/* ✅ Enhanced Actions with full functionality */}
        <div className="navbar-actions">
          {/* Notifications Button with Dropdown */}
          <div className="notifications-container">
            <button 
              className="action-btn notifications-btn" 
              onClick={handleNotifications}
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <button 
                      className="clear-all-btn"
                      onClick={clearAllNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div key={notification.id} className={`notification-item ${notification.type}`}>
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                        <button 
                          className="dismiss-btn"
                          onClick={() => markNotificationAsRead(notification.id)}
                          aria-label="Dismiss notification"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 3 && (
                  <div className="notifications-footer">
                    <button 
                      className="view-all-btn"
                      onClick={() => navigate('/admin/notifications')}
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Settings Button */}
          <button 
            className="action-btn settings-btn" 
            onClick={handleSettings}
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
          
          {/* Logout Button */}
          <button 
            className="action-btn logout-btn" 
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

