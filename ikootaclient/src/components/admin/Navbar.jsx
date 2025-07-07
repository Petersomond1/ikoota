// ==================================================
// RESPONSIVE NAVBAR COMPONENT
// ikootaclient/src/components/admin/Navbar.jsx
// ==================================================

import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      role: 'Administrator'
    };
    setCurrentUser(user);
  }, []);

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

        {/* Actions dropdown */}
        <div className="navbar-actions">
          <button className="action-btn notifications-btn" aria-label="Notifications">
            🔔
          </button>
          <button className="action-btn settings-btn" aria-label="Settings">
            ⚙️
          </button>
          <button className="action-btn logout-btn" aria-label="Logout">
            🚪
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          padding: 0 15px;
        }

        .navbar-left .navbar-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .navbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .status-indicators {
          display: flex;
          gap: 15px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.875rem;
          color: #666;
        }

        .status-indicator.online {
          color: #4CAF50;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #4CAF50;
          animation: pulse 2s infinite;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .time-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 0.875rem;
          color: #666;
        }

        .current-time {
          font-weight: 600;
          color: #333;
        }

        .current-date {
          font-size: 0.75rem;
          color: #888;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 0.875rem;
        }

        .user-name {
          font-weight: 600;
          color: #333;
        }

        .user-role {
          font-size: 0.75rem;
          color: #666;
        }

        .navbar-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: background-color 0.2s ease;
        }

        .action-btn:hover {
          background-color: #f0f0f0;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        /* Tablet styles */
        @media (max-width: 1024px) {
          .navbar-left .navbar-title {
            font-size: 1.3rem;
          }

          .time-display,
          .user-info {
            font-size: 0.8rem;
          }
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .admin-navbar-content {
            padding: 0 10px;
          }

          .navbar-left .navbar-title {
            font-size: 1.2rem;
          }

          .navbar-center {
            display: none;
          }

          .time-display {
            display: none;
          }

          .user-info {
            display: none;
          }

          .navbar-actions {
            gap: 5px;
          }

          .action-btn {
            padding: 6px;
            font-size: 1.1rem;
          }
        }

        /* Small mobile styles */
        @media (max-width: 480px) {
          .navbar-left .navbar-title {
            font-size: 1.1rem;
          }

          .action-btn {
            padding: 5px;
            font-size: 1rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;



// import React from 'react'
// import './navbar.css'

// const Navbar = () => {
//   return (
//     <div className="navbar">
//         <div className="logo">
//         <img src="./palmTree.png" alt="Logo" />
//         <p>IKOOTA</p>
//         </div>
//         <div className="nav_page_heading"> 
//         <div style={{fontSize: '2rem'}}>-IKO O'Ta umu'Elde</div>
//         <div>The Clarion Call TownCriers: for the Synergy, Strategy and Rebuilding of 'The land of the Gods'</div>
//         </div>
//         <div className="nav_items">
//         <div className="nav_item">Home</div>
//         <div className="nav_item">About</div>
//         <div className="nav_item">Contact</div>
//         </div>
//     </div>
//   )
// }

// export default Navbar