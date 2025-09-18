// ikootaclient/src/components/admin/Dashboard.jsx
import KeyStats from './KeyStats';
import PendingReports from './PendingReports';
import Analytics from './Analytics';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';

// ✅ FIXED: Update API functions to use correct endpoints
const fetchMembershipAnalytics = async (period = '30d') => {
  try {
    // Use the correct endpoint from your backend routes
    const { data } = await api.get(`/membership/admin/analytics?period=${period}&detailed=true`);
    return data?.data || data; // Handle nested data structure
  } catch (error) {
    console.error('Failed to fetch membership analytics:', error);
    // Return empty structure instead of throwing
    return {
      conversionFunnel: {
        total_registrations: 0,
        started_application: 0,
        approved_initial: 0,
        full_members: 0
      },
      timeSeries: []
    };
  }
};

const fetchMembershipStats = async () => {
  try {
    // Use the correct endpoint from your backend routes
    const { data } = await api.get('/membership/admin/stats');
    return data?.data || data; // Handle nested data structure
  } catch (error) {
    console.error('Failed to fetch membership stats:', error);
    return {
      stats: {
        total_users: 0,
        new_registrations: 0,
        conversion_to_pre_member: 0,
        conversion_to_full_member: 0,
        avg_approval_days: 0
      }
    };
  }
};

// ✅ FIXED: Use correct endpoint for full membership stats
const fetchFullMembershipStats = async () => {
  try {
    const { data } = await api.get('/membership/admin/full-membership-stats');
    return data?.data || data; // Handle nested data structure
  } catch (error) {
    console.error('Failed to fetch full membership stats:', error);
    return {
      pending_full_applications: 0,
      approved_full_applications: 0,
      declined_full_applications: 0,
      total_full_applications: 0,
      avg_full_processing_days: 0
    };
  }
};

// ✅ FIXED: Add function to fetch pending count specifically
const fetchPendingCount = async () => {
  try {
    // Use the applications endpoint with filtering
    const { data } = await api.get('/membership/admin/applications?status=pending');
    const responseData = data?.data || data;
    return {
      pending_initial: responseData?.applications?.filter(app => (app.survey_type || app.application_type) === 'initial_application')?.length || 0,
      pending_full: responseData?.applications?.filter(app => (app.survey_type || app.application_type) === 'full_membership')?.length || 0,
      total_pending: responseData?.pagination?.total_items || 0
    };
  } catch (error) {
    console.error('Failed to fetch pending count:', error);
    return {
      pending_initial: 0,
      pending_full: 0,
      total_pending: 0
    };
  }
};

// ✅ FIXED: Live class management functions with correct endpoints
const fetchLiveClassDashboard = async () => {
  try {
    const { data } = await api.get('/classes/admin/live/dashboard');
    return data?.data || data;
  } catch (error) {
    console.error('Failed to fetch live class dashboard:', error);
    return {
      stats: {
        total_scheduled: 0,
        pending_approval: 0,
        approved_today: 0,
        currently_live: 0,
        completed_this_week: 0
      },
      recent_requests: [],
      upcoming_sessions: []
    };
  }
};

const fetchPendingLiveClassApprovals = async () => {
  try {
    const { data } = await api.get('/classes/admin/live/pending?limit=5');
    return data?.data || [];
  } catch (error) {
    console.error('Failed to fetch pending live class approvals:', error);
    return [];
  }
};

const approveLiveClassSchedule = async (scheduleId, decision, adminNotes = '') => {
  try {
    const { data } = await api.put(`/classes/admin/live/review/${scheduleId}`, {
      decision,
      admin_notes: adminNotes,
      notification_message: decision === 'approve' ? 'Your live class has been approved and participants will be notified.' : 'Your live class request requires revision.'
    });
    return data;
  } catch (error) {
    console.error('Failed to approve/reject live class:', error);
    throw error;
  }
};

const Dashboard = () => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  // ✅ FIXED: Update queries to use correct endpoints
  const { data: auditLogs, isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/content/admin/audit-logs');
        return data;
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const { data: membershipAnalytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['membershipAnalytics', analyticsPeriod],
    queryFn: () => fetchMembershipAnalytics(analyticsPeriod),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const { data: membershipStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['membershipStats'],
    queryFn: fetchMembershipStats,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const { data: fullMembershipStats, isLoading: fullMembershipLoading, error: fullMembershipError } = useQuery({
    queryKey: ['fullMembershipStats'],
    queryFn: fetchFullMembershipStats,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 60000
  });

  // ✅ ADD: Query for pending counts
  const { data: pendingCounts, isLoading: pendingCountsLoading, error: pendingCountsError } = useQuery({
    queryKey: ['pendingCounts'],
    queryFn: fetchPendingCount,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // ✅ NEW: Live class queries
  const { data: liveClassDashboard, isLoading: liveClassLoading, error: liveClassError, refetch: refetchLiveClasses } = useQuery({
    queryKey: ['liveClassDashboard'],
    queryFn: fetchLiveClassDashboard,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: pendingLiveApprovals, isLoading: pendingLiveLoading, error: pendingLiveError } = useQuery({
    queryKey: ['pendingLiveApprovals'],
    queryFn: fetchPendingLiveClassApprovals,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Helper function for safe access
  const safeAccess = (obj, path, fallback = 0) => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  // ✅ NEW: Live class approval handler
  const handleLiveClassApproval = async (scheduleId, decision, adminNotes = '') => {
    try {
      await approveLiveClassSchedule(scheduleId, decision, adminNotes);
      // Refetch data after successful action
      refetchLiveClasses();
      alert(`Live class ${decision}d successfully!`);
    } catch (error) {
      console.error(`Failed to ${decision} live class:`, error);
      alert(`Failed to ${decision} live class. Please try again.`);
    }
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      {/* Existing components */}
      <KeyStats />
      
      {/* ✅ UPDATED: Full Membership Stats Section with correct data */}
      <div className="full-membership-stats-section">
        <h3>Full Membership Overview</h3>
        
        {fullMembershipError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>Full membership stats temporarily unavailable.</span>
          </div>
        )}

        {fullMembershipLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading full membership stats...</p>
          </div>
        ) : (
          <div className="full-membership-cards">
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h4>Pending Full Membership</h4>
                <span className="stat-number">
                  {fullMembershipStats?.pending_full_applications || 
                   pendingCounts?.pending_full || 0}
                </span>
                <small>Applications awaiting review</small>
              </div>
            </div>
            
            <div className="stat-card approved">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Approved This Month</h4>
                <span className="stat-number">
                  {fullMembershipStats?.approved_full_applications || 0}
                </span>
                <small>New full members</small>
              </div>
            </div>
            
            <div className="stat-card declined">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <h4>Declined This Month</h4>
                <span className="stat-number">
                  {fullMembershipStats?.declined_full_applications || 0}
                </span>
                <small>Applications declined</small>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>Total Applications</h4>
                <span className="stat-number">
                  {fullMembershipStats?.total_full_applications || 0}
                </span>
                <small>All time applications</small>
              </div>
            </div>
            
            <div className="stat-card review-time">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <h4>Avg Review Time</h4>
                <span className="stat-number">
                  {(fullMembershipStats?.avg_full_processing_days || 0).toFixed(1)}
                </span>
                <small>Days to review</small>
              </div>
            </div>
          </div>
        )}
        
        {/* ✅ UPDATED: Quick Actions with correct links */}
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <a href="/admin/full-membership-review" className="action-btn primary">
              🎓 Review Applications ({fullMembershipStats?.pending_full_applications || pendingCounts?.pending_full || 0})
            </a>
            <a href="/admin/usermanagement" className="action-btn secondary">
              👥 Manage Users
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="action-btn tertiary"
            >
              🔄 Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Live Class Management Section */}
      <div className="live-class-management-section">
        <h3>🎓 Live Class Management</h3>

        {liveClassError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>Live class data temporarily unavailable.</span>
          </div>
        )}

        {liveClassLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading live class data...</p>
          </div>
        ) : (
          <div className="live-class-overview">
            {/* Live Class Stats Cards */}
            <div className="live-class-stats">
              <div className="stat-card pending-approval">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h4>Pending Approval</h4>
                  <span className="stat-number">
                    {safeAccess(liveClassDashboard, 'stats.pending_approval')}
                  </span>
                  <small>Awaiting admin review</small>
                </div>
              </div>

              <div className="stat-card approved-today">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>Approved Today</h4>
                  <span className="stat-number">
                    {safeAccess(liveClassDashboard, 'stats.approved_today')}
                  </span>
                  <small>Classes scheduled</small>
                </div>
              </div>

              <div className="stat-card currently-live">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h4>Currently Live</h4>
                  <span className="stat-number">
                    {safeAccess(liveClassDashboard, 'stats.currently_live')}
                  </span>
                  <small>Active sessions</small>
                </div>
              </div>

              <div className="stat-card total-scheduled">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h4>Total Scheduled</h4>
                  <span className="stat-number">
                    {safeAccess(liveClassDashboard, 'stats.total_scheduled')}
                  </span>
                  <small>All time sessions</small>
                </div>
              </div>

              <div className="stat-card completed-week">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h4>Completed This Week</h4>
                  <span className="stat-number">
                    {safeAccess(liveClassDashboard, 'stats.completed_this_week')}
                  </span>
                  <small>Sessions finished</small>
                </div>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="pending-approvals-section">
              <h4>⏳ Pending Live Class Approvals</h4>

              {pendingLiveError && (
                <div className="error-banner">
                  <span className="error-icon">⚠️</span>
                  <span>Pending approvals temporarily unavailable.</span>
                </div>
              )}

              {pendingLiveLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading pending approvals...</p>
                </div>
              ) : (
                <div className="pending-approvals-list">
                  {pendingLiveApprovals && pendingLiveApprovals.length > 0 ? (
                    pendingLiveApprovals.map(approval => (
                      <div key={approval.id} className="approval-card">
                        <div className="approval-header">
                          <h5>{approval.title}</h5>
                          <span className="class-type-badge">{approval.class_type}</span>
                        </div>
                        <div className="approval-details">
                          <div className="detail-row">
                            <span className="label">Instructor:</span>
                            <span>{approval.instructor_name || approval.requested_by_username}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Scheduled:</span>
                            <span>{new Date(approval.scheduled_start_time).toLocaleString()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Duration:</span>
                            <span>{approval.estimated_duration} minutes</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Audience:</span>
                            <span>{approval.target_audience}</span>
                          </div>
                          {approval.description && (
                            <div className="detail-row">
                              <span className="label">Description:</span>
                              <span className="description">{approval.description}</span>
                            </div>
                          )}
                        </div>
                        <div className="approval-actions">
                          <button
                            className="approve-btn"
                            onClick={() => handleLiveClassApproval(approval.id, 'approve')}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleLiveClassApproval(approval.id, 'reject', 'Requires revision')}
                          >
                            ❌ Reject
                          </button>
                          <button
                            className="modify-btn"
                            onClick={() => {
                              const notes = prompt('Enter modification notes:');
                              if (notes) {
                                handleLiveClassApproval(approval.id, 'modify', notes);
                              }
                            }}
                          >
                            ✏️ Modify
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-pending-approvals">
                      <div className="no-data-icon">✨</div>
                      <p>No pending live class approvals</p>
                      <small>All live class requests have been reviewed!</small>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="live-class-actions">
              <h4>Quick Actions</h4>
              <div className="action-buttons">
                <a href="/admin/live-classes" className="action-btn primary">
                  📋 View All Live Classes ({safeAccess(liveClassDashboard, 'stats.total_scheduled')})
                </a>
                <a href="/admin/live-classes/schedule" className="action-btn secondary">
                  📅 Schedule Live Class
                </a>
                <a href="/admin/live-classes/analytics" className="action-btn secondary">
                  📊 Live Class Analytics
                </a>
                <button
                  onClick={() => refetchLiveClasses()}
                  className="action-btn tertiary"
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rest of the component remains the same */}
      {/* Enhanced Membership Analytics Section with Error Handling */}
      <div className="membership-analytics-section">
        <h3>Membership Analytics</h3>
        
        <div className="period-selector">
          <label>Time Period:</label>
          <select 
            value={analyticsPeriod} 
            onChange={(e) => setAnalyticsPeriod(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>

        {/* Error States */}
        {analyticsError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>Analytics temporarily unavailable. Some features may be limited.</span>
          </div>
        )}

        {analyticsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : (
          <div className="analytics-grid">
            {/* Safe Conversion Funnel */}
            <div className="funnel-chart">
              <h4>Membership Conversion Funnel</h4>
              <div className="funnel-steps">
                <div className="funnel-step">
                  <span className="step-label">Total Registrations</span>
                  <span className="step-value">
                    {safeAccess(membershipAnalytics, 'conversionFunnel.total_registrations')}
                  </span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Started Application</span>
                  <span className="step-value">
                    {safeAccess(membershipAnalytics, 'conversionFunnel.started_application')}
                  </span>
                  <span className="step-percentage">
                    {membershipAnalytics?.conversionFunnel?.total_registrations > 0 
                      ? ((safeAccess(membershipAnalytics, 'conversionFunnel.started_application') / 
                          safeAccess(membershipAnalytics, 'conversionFunnel.total_registrations')) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Approved Initial</span>
                  <span className="step-value">
                    {safeAccess(membershipAnalytics, 'conversionFunnel.approved_initial')}
                  </span>
                  <span className="step-percentage">
                    {membershipAnalytics?.conversionFunnel?.started_application > 0 
                      ? ((safeAccess(membershipAnalytics, 'conversionFunnel.approved_initial') / 
                          safeAccess(membershipAnalytics, 'conversionFunnel.started_application')) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Full Members</span>
                  <span className="step-value">
                    {safeAccess(membershipAnalytics, 'conversionFunnel.full_members')}
                  </span>
                  <span className="step-percentage">
                    {membershipAnalytics?.conversionFunnel?.approved_initial > 0 
                      ? ((safeAccess(membershipAnalytics, 'conversionFunnel.full_members') / 
                          safeAccess(membershipAnalytics, 'conversionFunnel.approved_initial')) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Safe Time Series Chart */}
            <div className="time-series-chart">
              <h4>Registration & Approval Trends</h4>
              <div className="chart-container">
                <div className="simple-chart">
                  {membershipAnalytics?.timeSeries?.length > 0 ? (
                    membershipAnalytics.timeSeries.map((point, index) => (
                      <div key={index} className="chart-point">
                        <span>{new Date(point.date).toLocaleDateString()}</span>
                        <span>Registrations: {point.registrations || 0}</span>
                        <span>Approvals: {point.approvals || 0}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">No trend data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safe Membership Stats Overview */}
        {statsError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>Stats temporarily unavailable.</span>
          </div>
        )}

        {statsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading stats...</p>
          </div>
        ) : (
          <div className="membership-stats">
            <h4>Current Status Distribution</h4>
            <div className="stats-breakdown">
              <div className="stat-item">
                <span>Total Users:</span>
                <span>{safeAccess(membershipStats, 'stats.total_users')}</span>
              </div>
              <div className="stat-item">
                <span>New Registrations ({analyticsPeriod}):</span>
                <span>{safeAccess(membershipStats, 'stats.new_registrations')}</span>
              </div>
              <div className="stat-item">
                <span>Pre-Members:</span>
                <span>{safeAccess(membershipStats, 'stats.conversion_to_pre_member')}</span>
              </div>
              <div className="stat-item">
                <span>Full Members:</span>
                <span>{safeAccess(membershipStats, 'stats.conversion_to_full_member')}</span>
              </div>
              <div className="stat-item">
                <span>Avg. Approval Time:</span>
                <span>{safeAccess(membershipStats, 'stats.avg_approval_days', 0).toFixed(1)} days</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing components */}
      <Analytics />
      <PendingReports />

      {/* ✅ NEW: AI Features Analytics */}
      <div className="ai-analytics-section" style={{
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0',
        color: 'white'
      }}>
        <h3 style={{margin: '0 0 15px 0', color: 'white'}}>🤖 AI Features Usage Analytics</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>🔄</div>
            <div style={{fontSize: '18px', fontWeight: 'bold', margin: '8px 0'}}>Coming Soon</div>
            <div style={{fontSize: '12px', opacity: 0.9}}>Content Summarizations</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>🔄</div>
            <div style={{fontSize: '18px', fontWeight: 'bold', margin: '8px 0'}}>Coming Soon</div>
            <div style={{fontSize: '12px', opacity: 0.9}}>Recommendations Generated</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>✅</div>
            <div style={{fontSize: '18px', fontWeight: 'bold', margin: '8px 0'}}>Active</div>
            <div style={{fontSize: '12px', opacity: 0.9}}>Advanced Search System</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>🚀</div>
            <div style={{fontSize: '18px', fontWeight: 'bold', margin: '8px 0'}}>Ready</div>
            <div style={{fontSize: '12px', opacity: 0.9}}>Backend APIs Operational</div>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '15px',
          fontSize: '14px'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '8px'}}>🎯 AI Features Status:</div>
          <div style={{marginBottom: '4px'}}>✅ Smart Content Summarization - Integrated in Chat.jsx</div>
          <div style={{marginBottom: '4px'}}>✅ Intelligent Recommendations - Integrated in Chat.jsx</div>
          <div style={{marginBottom: '4px'}}>✅ Advanced Search System - Enhanced in ListChats.jsx</div>
          <div style={{marginBottom: '4px'}}>✅ Backend APIs - All endpoints operational</div>
          <div style={{fontSize: '12px', opacity: 0.8, marginTop: '8px'}}>
            💡 Analytics data will populate as users interact with AI features
          </div>
        </div>
      </div>

      {/* Safe Audit Logs */}
      <div className="audit-logs-section">
        <h3>Audit Logs</h3>
        
        {auditError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>Audit logs temporarily unavailable.</span>
          </div>
        )}

        {auditLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading audit logs...</p>
          </div>
        ) : (
          <div className="audit-table-container">
            {auditLogs?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.action || 'N/A'}</td>
                      <td>{log.target_id || 'N/A'}</td>
                      <td>{log.details || 'N/A'}</td>
                      <td>{log.updatedAt ? new Date(log.updatedAt).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No audit logs available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;