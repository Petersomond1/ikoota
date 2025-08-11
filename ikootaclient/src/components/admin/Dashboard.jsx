// ikootaclient/src/components/admin/Dashboard.jsx
import KeyStats from './KeyStats';
import PendingReports from './PendingReports';
import Analytics from './Analytics';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';

// Update your API functions to handle errors better
const fetchMembershipAnalytics = async (period = '30d') => {
  try {
    const { data } = await api.get(`/admin/membership/analytics?period=${period}&detailed=true`);
    return data;
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
    const { data } = await api.get('/admin/membership/stats');
    return data;
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

// ✅ ADD: Fetch full membership specific stats
const fetchFullMembershipStats = async () => {
  try {
    const { data } = await api.get('/admin/membership/full-membership-stats');
    return data;
  } catch (error) {
    console.error('Failed to fetch full membership stats:', error);
    return {
      pendingCount: 0,
      approvedCount: 0,
      declinedCount: 0,
      totalApplications: 0,
      avgReviewTime: 0
    };
  }
};

// Update your queries to handle errors better
const Dashboard = () => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  // Legacy audit logs query with error handling
  const { data: auditLogs, isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/content/admin/audit-logs');
        return data;
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return []; // Return empty array instead of throwing
      }
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Membership analytics queries with error handling
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

  // ✅ ADD: Full membership stats query
  const { data: fullMembershipStats, isLoading: fullMembershipLoading, error: fullMembershipError } = useQuery({
    queryKey: ['fullMembershipStats'],
    queryFn: fetchFullMembershipStats,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 60000 // Refresh every minute
  });

  // Helper function for safe access
  const safeAccess = (obj, path, fallback = 0) => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      {/* Existing components */}
      <KeyStats />
      
      {/* ✅ ADD: Full Membership Stats Section */}
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
                <span className="stat-number">{fullMembershipStats?.pendingCount || 0}</span>
                <small>Applications awaiting review</small>
              </div>
            </div>
            
            <div className="stat-card approved">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Approved This Month</h4>
                <span className="stat-number">{fullMembershipStats?.approvedCount || 0}</span>
                <small>New full members</small>
              </div>
            </div>
            
            <div className="stat-card declined">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <h4>Declined This Month</h4>
                <span className="stat-number">{fullMembershipStats?.declinedCount || 0}</span>
                <small>Applications declined</small>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>Total Applications</h4>
                <span className="stat-number">{fullMembershipStats?.totalApplications || 0}</span>
                <small>All time applications</small>
              </div>
            </div>
            
            <div className="stat-card review-time">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <h4>Avg Review Time</h4>
                <span className="stat-number">{(fullMembershipStats?.avgReviewTime || 0).toFixed(1)}</span>
                <small>Days to review</small>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <a href="/admin/full-membership-review" className="action-btn primary">
              🎓 Review Applications ({fullMembershipStats?.pendingCount || 0})
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


