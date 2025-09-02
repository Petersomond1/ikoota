//ikootaclient\src\components\iko\Userinfo.jsx
import React, { useEffect, useState } from 'react';
import api from '../service/api';
import {jwtDecode} from 'jwt-decode';
import './userinfo.css';

const Userinfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [activeTime, setActiveTime] = useState('Just now');

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.user_id || decoded.id);
      } else {
        const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
        if (tokenCookie) {
          const decoded = jwtDecode(tokenCookie.split("=")[1]);
          setUserId(decoded.user_id || decoded.id);
        } else {
          setError("Access token not found");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Failed to decode token");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user_id) return;

    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        // Handle both response.data and response.data.data structures
        const userData = response.data?.data || response.data;
        setUserInfo(userData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Fallback to basic user info if profile fetch fails
        setUserInfo({
          id: user_id,
          username: 'Member',
          email: 'member@ikoota.com',
          class_id: 'N/A'
        });
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user_id]);

  useEffect(() => {
    const updateActiveTime = () => {
      const elapsedTime = Date.now() - sessionStart;
      const seconds = Math.floor(elapsedTime / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      let displayTime;
      if (hours > 0) {
        displayTime = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        displayTime = `${minutes}m`;
      } else if (seconds > 30) {
        displayTime = `${seconds}s`;
      } else {
        displayTime = 'Just now';
      }
      
      setActiveTime(displayTime);
    };

    // Update immediately
    updateActiveTime();
    
    // Then update every 30 seconds
    const intervalId = setInterval(updateActiveTime, 30000);

    return () => clearInterval(intervalId);
  }, [sessionStart]);

  if (loading) {
    return (
      <div className='userinfo-container'>
        <div className="userinfo-loading">
          <div className="loading-spinner"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='userinfo-container'>
        <div className="userinfo-error">
          <span className="error-icon">⚠️</span>
          <span>Profile unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className='userinfo-container'>
      <div className='userinfo'>
        <div className="user">
          <img 
            src={userInfo?.avatar || "./avatar.png"} 
            alt="User Avatar" 
            onError={(e) => { e.target.src = "./avatar.png"; }}
          />
          <h4>{userInfo?.username || 'Member'}</h4>
        </div>
        <div className="icons">
          <button className="icon-btn" title="More options">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          <button className="icon-btn" title="Start video call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Edit profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="user-details-info">
        <p>
          <strong>Email:</strong>
          <span>{userInfo?.email || 'Not available'}</span>
        </p>
        <p>
          <strong>Class ID:</strong>
          <span>{userInfo?.class_id || 'Not assigned'}</span>
        </p>
        <p>
          <strong>User ID:</strong>
          <span>#{userInfo?.id || user_id || 'N/A'}</span>
        </p>
        <p>
          <strong>Session:</strong>
          <span className="session-time">{activeTime}</span>
        </p>
      </div>
    </div>
  );
};

export default Userinfo;