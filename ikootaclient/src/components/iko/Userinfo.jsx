//ikootaclient\src\components\iko\Userinfo.jsx
import React, { useEffect, useState } from 'react';
import api from '../service/api';
import {jwtDecode} from 'jwt-decode';
import { useUser } from '../auth/UserStatus';
import './userinfo.css';

const Userinfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [activeTime, setActiveTime] = useState('Just now');
  const { user, isAdmin } = useUser();

  // First try to use user from context
  useEffect(() => {
    console.log('=== UserInfo Component Debug ===');
    console.log('User from context:', user);
    console.log('Is Admin:', isAdmin);
    
    // If we have user data from context, use it immediately
    if (user && Object.keys(user).length > 0) {
      console.log('Using user data from context');
      const userDataFromContext = {
        username: user.username || user.name || user.user_name || 'pet',
        avatar: user.avatar || user.profile_image || user.profile_picture || null,
        classid: user.class_id || user.classid || user.audience || user.class_name || 'N/A',
        Membership_status: user.membership_status || user.membership_stage || user.Membership_status || 'Member',
        role: user.role || user.user_role || (user.is_admin || isAdmin ? 'Super Admin' : 'Member'),
        email: user.email || null,
        converseid: user.converse_id || user.converseid || null,
        is_admin: user.is_admin || user.isAdmin || isAdmin || false
      };
      console.log('Setting user info from context:', userDataFromContext);
      setUserInfo(userDataFromContext);
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Get user ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        console.log('Token decoded:', decoded);
        setUserId(decoded.user_id || decoded.id);
        
        // If no user from context, use token data as fallback
        if (!user || Object.keys(user).length === 0) {
          const tokenUserData = {
            username: decoded.username || decoded.name || decoded.user_name || 'N/A',
            avatar: null,
            classid: decoded.class_id || decoded.classid || decoded.audience || 'N/A',
            Membership_status: decoded.membership_status || decoded.membership_stage || 'Member',
            role: decoded.role || decoded.user_role || (decoded.is_admin ? 'Super Admin' : 'Member'),
            email: decoded.email || null,
            converseid: decoded.converse_id || decoded.converseid || null,
            is_admin: decoded.is_admin || decoded.isAdmin || false
          };
          console.log('No context user, using token data:', tokenUserData);
          setUserInfo(tokenUserData);
          setLoading(false);
        }
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
      console.error("Failed to decode token:", err);
      setError("Failed to decode token");
      setLoading(false);
    }
  }, [user]);

  // Try to fetch from API if we still don't have complete data
  useEffect(() => {
    if (!user_id || (userInfo && userInfo.username !== 'Member')) return;

    const fetchUserInfo = async () => {
      try {
        console.log('Attempting to fetch user data from API for user_id:', user_id);
        
        // Try the profile endpoint
        const response = await api.get('/auth/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        console.log('API Response:', response);
        const userData = response.data?.data || response.data;
        console.log('User data from API:', userData);
        
        if (userData && Object.keys(userData).length > 0) {
          const apiUserData = {
            username: userData.username || userData.name || userData.user_name || userInfo?.username || 'pet',
            avatar: userData.avatar || userData.profile_image || userData.profile_picture || null,
            classid: userData.class_id || userData.classid || userData.audience || userData.class_name || userInfo?.classid || 'N/A',
            Membership_status: userData.membership_status || userData.membership_stage || userData.Membership_status || userInfo?.Membership_status || 'Member',
            role: userData.role || userData.user_role || (userData.is_admin || isAdmin ? 'Super Admin' : 'Member'),
            email: userData.email || userInfo?.email || null,
            converseid: userData.converseid || userData.converse_id || userInfo?.converseid || null,
            is_admin: userData.is_admin || userData.isAdmin || isAdmin || false
          };
          console.log('Updated user info from API:', apiUserData);
          setUserInfo(apiUserData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user info from API:', error);
        // Keep existing userInfo if API fails
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user_id, userInfo, isAdmin]);

  // Session timer
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

  // Debug current state
  useEffect(() => {
    console.log('Current UserInfo state:', userInfo);
  }, [userInfo]);

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
        {/* <div className="user"> */}
          <img className='avatar'
            src={userInfo?.avatar || "./avatar.png"} 
            alt="User Avatar" 
            onError={(e) => { e.target.src = "./avatar.png"; }}
          />
           
            <span className="status-badge">
              👤 {userInfo?.username || 'Loading...'}
              </span>
            <span className="user-info">
             ✅ {userInfo?.Membership_status || 'Member'}
              {(isAdmin || userInfo?.is_admin) && <span className="admin-badge">🛡️ {userInfo?.role || 'Admin'}</span>}
            </span>
        
        <p>
          <strong>Class:</strong>
          <span>{userInfo?.classid || 'N/A'}</span>
        </p>
        
        {userInfo?.converseid && (
          <p>
            <strong>Converse ID:</strong>
            <span style={{fontFamily: 'monospace', fontSize: '11px'}}>{userInfo.converseid}</span>
          </p>
        )}
       
        <p>
          <strong>Session:</strong>
          <span className="session-time">{activeTime}</span>
        </p>
      </div>
    </div>
  );

};

export default Userinfo;