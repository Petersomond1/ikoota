// ikootaclient/src/components/admin/KeyStats.jsx
// Enhanced version with real API integration

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';
import './keyStats.css';

const fetchKeyStats = async () => {
  try {
    // First test if the server is accessible at all
    console.log('🔍 Testing backend connection...');
    
    // Try the admin stats endpoint
    const { data } = await api.get('/users/admin/stats/overview');
    console.log('✅ Successfully fetched admin stats:', data);
    return data?.overview || data?.data || data;
  } catch (error) {
    console.error('❌ Failed to fetch key stats:', error);
    
    // Enhanced error details
    console.error('🔍 Error details:', {
      status: error.status,
      message: error.message,
      url: error.url,
      fullError: error
    });
    
    // If it's a 404, suggest the backend might not be running
    if (error.status === 404) {
      console.error('⚠️ 404 Error: Backend server might not be running on port 3000, or the route might not be registered.');
      console.error('🛠️ Try: Check if backend server is running and routes are properly mounted.');
    }
    
    // If it's a 401, suggest authentication issue
    if (error.status === 401) {
      console.error('🔐 401 Error: Authentication required. User might not be logged in or have admin privileges.');
    }
    
    throw error;
  }
};

const KeyStats = () => {
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['keyStats'],
    queryFn: fetchKeyStats,
    refetchInterval: 60000, // Refresh every 30 seconds
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="key_stats loading">
        <h3>Key Statistics</h3>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="key_stats error">
        <h3>Key Statistics</h3>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>Failed to load statistics</span>
          <button onClick={() => refetch()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeStats = stats || {};
  
  return (
    <div className="key_stats">
      <div className="stats-header">
        <h3>Key Statistics</h3>
        <button onClick={() => refetch()} className="refresh-btn" title="Refresh stats">
          🔄
        </button>
      </div>
      
      <div className="stats-grid">
        {/* User Statistics */}
        <div className="stat-category">
          <h4>Users</h4>
          <div className="stat-items">
            <div className="stat-item primary">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">{safeStats.user_counts?.total || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Full Members:</span>
              <span className="stat-value">{safeStats.user_counts?.full_members || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pre-Members:</span>
              <span className="stat-value">{safeStats.user_counts?.pre_members || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">New Today:</span>
              <span className="stat-value">{safeStats.activity_metrics?.new_users_today || 0}</span>
            </div>
          </div>
        </div>

        {/* Application Statistics */}
        <div className="stat-category">
          <h4>Applications</h4>
          <div className="stat-items">
            <div className="stat-item warning">
              <span className="stat-label">Pending:</span>
              <span className="stat-value">{safeStats.application_metrics?.pending_applications || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Today:</span>
              <span className="stat-value">{safeStats.activity_metrics?.active_users_today || 0}</span>
            </div>
          </div>
        </div>

        {/* Content & Moderation */}
        <div className="stat-category">
          <h4>Content</h4>
          <div className="stat-items">
            <div className="stat-item danger">
              <span className="stat-label">Pending Reports:</span>
              <span className="stat-value">{safeStats.content_metrics?.pending_reports || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Reports:</span>
              <span className="stat-value">{safeStats.content_metrics?.total_reports || 0}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="stat-category">
          <h4>System</h4>
          <div className="stat-items">
            <div className="stat-item">
              <span className="stat-label">Banned Users:</span>
              <span className="stat-value">{safeStats.user_status?.banned || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Blocked Users:</span>
              <span className="stat-value">{safeStats.user_status?.blocked || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="action-buttons">
          {(safeStats.application_metrics?.pending_applications || 0) > 0 && (
            <a 
              href="/admin/authcontrols" 
              className="action-btn primary"
              title="Review pending applications"
            >
              Review Applications ({safeStats.application_metrics?.pending_applications})
            </a>
          )}
          {(safeStats.content_metrics?.pending_reports || 0) > 0 && (
            <a 
              href="/admin/reports" 
              className="action-btn warning"
              title="Handle pending reports"
            >
              Handle Reports ({safeStats.content_metrics?.pending_reports})
            </a>
          )}
          <a 
            href="/admin/usermanagement" 
            className="action-btn secondary"
            title="Manage users"
          >
            Manage Users
          </a>
        </div>
      </div>

      <div className="stats-footer">
        <small>Last updated: {new Date().toLocaleTimeString()}</small>
      </div>
    </div>
  );
};

export default KeyStats;
