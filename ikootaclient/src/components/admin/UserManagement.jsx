// ikootaclient/src/components/admin/UserManagement.jsx
// OPTIMIZED VERSION - Reduced API calls and improved performance

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './userManagement.css';
import {
  generateUniqueConverseId,
  generateRandomId,
  validateIdFormat,
  formatIdForDisplay
} from '../service/idGenerationService';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';

// ==================================================
// OPTIMIZED API FUNCTIONS WITH BETTER ERROR HANDLING
// ==================================================

// Optimized API calls with better error handling and caching
const fetchMembershipOverview = async () => {
  try {
    const { data } = await api.get('/membership/admin/overview');
    return data?.overview || data || {};
  } catch (error) {
    console.error('❌ Error fetching membership overview:', error);
    throw new Error('Failed to fetch membership overview');
  }
};

const fetchPendingApplications = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/membership/admin/applications?${params}`);
    return data || { applications: [], pagination: { total: 0, page: 1, totalPages: 1 } };
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    return { applications: [], pagination: { total: 0, page: 1, totalPages: 1 } };
  }
};

const fetchUsers = async () => {
  try {
    const { data } = await api.get('/users/admin/');
    
    // Handle different response formats safely
    if (data?.success && Array.isArray(data.users)) {
      return data.users;
    }
    if (data?.users && Array.isArray(data.users)) {
      return data.users;
    }
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

const fetchReports = async () => {
  try {
    const { data } = await api.get('/content/admin/reports');
    
    // Handle different response formats safely
    if (data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    if (data?.reports && Array.isArray(data.reports)) {
      return data.reports;
    }
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    return [];
  }
};

const fetchClasses = async () => {
  try {
    const { data } = await api.get('/classes/');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    return [];
  }
};

const fetchMentors = async () => {
  try {
    const { data } = await api.get('/users/admin/mentors');
    return Array.isArray(data?.mentors) ? data.mentors : [];
  } catch (error) {
    console.error('❌ Error fetching mentors:', error);
    return [];
  }
};

const exportUserData = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/users/admin/export?${params}`);
  return data;
};

const maskUserIdentity = async ({ userId, adminConverseId, mentorConverseId, classId }) => {
  const { data } = await api.post('/users/admin/identity/mask-identity', {
    userId,
    adminConverseId,
    mentorConverseId,
    classId
  });
  return data;
};

// REMOVED: fetchPendingCount - we'll get this from overview instead

// ==================================================
// OPTIMIZED QUERY CONFIGURATIONS
// ==================================================

const QUERY_CONFIG = {
  // Longer stale times to reduce unnecessary refetches
  users: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: false, // Stop automatic polling
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2
  },
  overview: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 2
  },
  reports: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 2
  },
  applications: {
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for pending items)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 2
  },
  static: {
    staleTime: 10 * 60 * 1000, // 10 minutes for classes/mentors
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1
  }
};

// ==================================================
// MAIN COMPONENT - OPTIMIZED
// ==================================================

const UserManagement = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('membership_overview');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'submittedAt',
    sortOrder: 'ASC'
  });

  // ===== OPTIMIZED REACT QUERY HOOKS =====

  // Users query with optimized config
  const { 
    data: rawUsers, 
    isLoading: usersLoading, 
    isError: usersError, 
    error: usersErrorData 
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    ...QUERY_CONFIG.users,
    onError: (error) => {
      console.error('❌ Users query error:', error);
    }
  });

  // Overview query - replaces the constant polling of pending-count
  const { 
    data: membershipOverview, 
    isLoading: overviewLoading, 
    error: overviewError 
  } = useQuery({
    queryKey: ['membershipOverview'],
    queryFn: fetchMembershipOverview,
    ...QUERY_CONFIG.overview
  });

  // Reports query with optimized config
  const { 
    data: rawReports, 
    isLoading: reportsLoading, 
    error: reportsError 
  } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    ...QUERY_CONFIG.reports,
    onError: (error) => {
      console.error('❌ Reports query error:', error);
    }
  });

  // Applications query - only fetch when needed
  const { 
    data: pendingApplications, 
    isLoading: applicationsLoading, 
    error: applicationsError 
  } = useQuery({
    queryKey: ['pendingApplications', activeTab, filters],
    queryFn: () => fetchPendingApplications({
      ...filters,
      stage: activeTab === 'membership_pending' ? 'initial' : 'full_membership'
    }),
    enabled: activeTab === 'membership_pending' || activeTab === 'membership_full',
    ...QUERY_CONFIG.applications
  });

  // Static data queries - least frequent updates
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    ...QUERY_CONFIG.static
  });

  const { data: mentors } = useQuery({
    queryKey: ['mentors'],
    queryFn: fetchMentors,
    ...QUERY_CONFIG.static
  });

  // ===== MEMOIZED DATA PROCESSING =====

  const users = useMemo(() => {
    if (!rawUsers) return [];
    if (Array.isArray(rawUsers)) return rawUsers;
    if (rawUsers.users && Array.isArray(rawUsers.users)) return rawUsers.users;
    return [];
  }, [rawUsers]);

  const reports = useMemo(() => {
    if (!rawReports) return [];
    if (Array.isArray(rawReports)) return rawReports;
    if (rawReports.reports && Array.isArray(rawReports.reports)) return rawReports.reports;
    return [];
  }, [rawReports]);

  // Memoized statistics to reduce calculations
  const statistics = useMemo(() => {
    return {
      totalUsers: users?.length || 0,
      activeMembers: users?.filter(u => u?.membership_stage === 'member').length || 0,
      pendingApplications: users?.filter(u => u?.membership_stage === 'applicant').length || 0,
      totalReports: reports?.length || 0,
      pendingReports: reports?.filter(r => r?.status === 'pending').length || 0
    };
  }, [users, reports]);

  const filteredUsers = useMemo(() => {
    try {
      const userArray = Array.isArray(users) ? users : [];
      
      switch (activeTab) {
        case 'legacy_pending':
          return userArray.filter(user => user?.membership_stage === 'applicant');
        case 'legacy_granted':
          return userArray.filter(user => user?.membership_stage === 'member');
        case 'legacy_declined':
          return userArray.filter(user => user?.initial_application_status === 'declined' || user?.application_status === 'declined');
        default:
          return userArray;
      }
    } catch (error) {
      console.error('❌ Error filtering users:', error);
      return [];
    }
  }, [users, activeTab]);

  // ===== OPTIMIZED EVENT HANDLERS =====

  // Throttled refresh function to prevent excessive API calls
  const handleRefreshData = useCallback(() => {
    // Only invalidate queries that are currently needed
    const queriesToInvalidate = ['users', 'membershipOverview', 'reports'];
    
    if (activeTab === 'membership_pending' || activeTab === 'membership_full') {
      queriesToInvalidate.push('pendingApplications');
    }
    
    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries([queryKey]);
    });
    
    alert('Data refreshed successfully!');
  }, [queryClient, activeTab]);

  const handleTabChange = useCallback((newTab) => {
    try {
      setActiveTab(newTab);
      setSelectedUsers([]);
      
      // Pre-fetch data for the new tab if needed
      if (newTab === 'membership_pending' || newTab === 'membership_full') {
        queryClient.prefetchQuery({
          queryKey: ['pendingApplications', newTab, filters],
          queryFn: () => fetchPendingApplications({
            ...filters,
            stage: newTab === 'membership_pending' ? 'initial' : 'full_membership'
          }),
          ...QUERY_CONFIG.applications
        });
      }
    } catch (error) {
      console.error('❌ Error changing tab:', error);
    }
  }, [queryClient, filters]);

  // ===== UTILITY FUNCTIONS =====

  const formatUserDisplayName = useCallback((user) => {
    if (!user) return 'Unknown User';
    if (user.is_identity_masked && user.converse_id) {
      return user.converse_id;
    }
    return getFullConverseId(user);
  }, []);

  const getStatusBadgeClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'granted':
        return 'status-success';
      case 'rejected':
      case 'declined':
        return 'status-danger';
      case 'pending':
      case 'applied':
        return 'status-warning';
      default:
        return 'status-default';
    }
  }, []);

  // ===== ERROR BOUNDARY =====
  
  if (usersError && reportsError) {
    return (
      <div className="user-management-container">
        <div className="error-state major">
          <div className="error-icon">⚠️</div>
          <h3>System Error</h3>
          <p>Unable to load essential data. Please try refreshing the page.</p>
          <div className="error-actions">
            <button onClick={handleRefreshData} className="btn-retry">
              🔄 Retry
            </button>
            <button onClick={() => window.location.reload()} className="btn-reload">
              🔃 Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====

  return (
    <div className="user-management-container">
      <div className="header-section">
        <h2>User Management System</h2>
        <div className="header-actions">
          <button onClick={handleRefreshData} className="btn-refresh">
            🔄 Refresh Data
          </button>
          <div className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Optimized Tab Navigation with Real-time Counts */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'membership_overview' ? 'active' : ''}`} 
          onClick={() => handleTabChange('membership_overview')}
        >
          <span>Overview</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'membership_pending' ? 'active' : ''}`} 
          onClick={() => handleTabChange('membership_pending')}
        >
          <span>Pending Applications</span>
          <span className="tab-count">({statistics.pendingApplications})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'all_users' ? 'active' : ''}`} 
          onClick={() => handleTabChange('all_users')}
        >
          <span>All Users</span>
          <span className="tab-count">({statistics.totalUsers})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => handleTabChange('reports')}
        >
          <span>Reports</span>
          <span className="tab-count">({statistics.totalReports})</span>
        </button>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'membership_overview' && (
        <div className="overview-section">
          <h3>System Overview</h3>
          {overviewLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading overview...</p>
            </div>
          ) : overviewError ? (
            <div className="error-state">
              <p>Error loading overview: {overviewError.message}</p>
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h4>Total Users</h4>
                  <span className="stat-number">{statistics.totalUsers}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>Active Members</h4>
                  <span className="stat-number">{statistics.activeMembers}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h4>Pending Applications</h4>
                  <span className="stat-number">{statistics.pendingApplications}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h4>Active Reports</h4>
                  <span className="stat-number">{statistics.pendingReports}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ALL USERS TAB ===== */}
      {activeTab === 'all_users' && (
        <div className="all-users-section">
          <div className="section-header">
            <h3>All Users ({statistics.totalUsers})</h3>
          </div>
          
          {usersLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : usersError ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading users: {usersErrorData?.message || 'Unknown error'}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['users'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          ) : !users?.length ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h4>No Users Found</h4>
              <p>No users are registered in the system yet.</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="user-row">
                      <td className="user-cell">
                        <div className="user-info">
                          <div className="user-avatar small">
                            {getSecureDisplayName(user, DISPLAY_CONTEXTS.COMPACT)?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="user-details">
                            <span className="username">{getFullConverseId(user)}</span>
                            <span className="user-id">ID: {user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="converse-cell">{getFullConverseId(user)}</td>
                      <td className="role-cell">
                        <span className={`role-badge role-${user.role}`}>{user.role}</span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${getStatusBadgeClass(user.membership_stage)}`}>
                          {user.membership_stage || 'none'}
                        </span>
                        {user.isblocked && <span className="status-badge blocked">Blocked</span>}
                        {user.isbanned && <span className="status-badge banned">Banned</span>}
                      </td>
                      <td className="joined-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {activeTab === 'reports' && (
        <div className="reports-section">
          <div className="section-header">
            <h3>User Reports ({statistics.totalReports})</h3>
          </div>
          
          {reportsLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : reportsError ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading reports: {reportsError.message}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['reports'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          ) : !reports?.length ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No Reports Found</h4>
              <p>No user reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <span className="report-id">Report #{report.id}</span>
                    <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="report-date">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="report-content">
                    <p><strong>Reporter:</strong> {report.reporter_id}</p>
                    <p><strong>Reported User:</strong> {report.reported_id}</p>
                    <p><strong>Reason:</strong> {report.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== PENDING APPLICATIONS TAB ===== */}
      {activeTab === 'membership_pending' && (
        <div className="pending-applications-section">
          <div className="section-header">
            <h3>Pending Applications ({pendingApplications?.pagination?.total || 0})</h3>
          </div>
          
          {applicationsLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading applications...</p>
            </div>
          ) : applicationsError ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading applications: {applicationsError.message}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['pendingApplications'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          ) : !pendingApplications?.applications?.length ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No Applications Found</h4>
              <p>No pending applications at this time.</p>
            </div>
          ) : (
            <div className="applications-list">
              {pendingApplications.applications.map((application) => (
                <div key={application.application_id} className="application-card">
                  <div className="application-header">
                    <div className="user-info">
                      <h4 className="username">{getFullConverseId(application)}</h4>
                      <span className="user-id">ID: {application.user_id}</span>
                    </div>
                    
                    <div className="application-meta">
                      <div className="timing-info">
                        <span className="days-pending">
                          {application.days_pending} day{application.days_pending !== 1 ? 's' : ''} pending
                        </span>
                        <span className="submitted-date">
                          Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="application-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Stage:</strong> 
                        <span>{application.membership_stage || 'Initial Application'}</span>
                      </div>
                      {application.application_ticket && (
                        <div className="detail-item">
                          <strong>Ticket:</strong> 
                          <span className="ticket-number">{application.application_ticket}</span>
                        </div>
                      )}
                      {(application.admin_notes || application.notes) && (
                        <div className="detail-item">
                          <strong>Admin Notes:</strong> 
                          <span className="admin-note">{application.admin_notes || application.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="application-actions">
                    <button 
                      onClick={() => console.log('Approve', application.user_id)}
                      className="btn-approve"
                      title="Approve this application"
                    >
                      <span className="btn-icon">✅</span>
                      Approve
                    </button>
                    <button 
                      onClick={() => console.log('Reject', application.user_id)}
                      className="btn-reject"
                      title="Reject this application"
                    >
                      <span className="btn-icon">❌</span>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer with Optimized Statistics */}
      <div className="footer-info">
        <div className="system-stats">
          <span>Total Users: {statistics.totalUsers}</span>
          <span>•</span>
          <span>Active Members: {statistics.activeMembers}</span>
          <span>•</span>
          <span>Pending Reports: {statistics.pendingReports}</span>
          <span>•</span>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="version-info">
          <small>User Management System v3.1 - Performance Optimized</small>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;



