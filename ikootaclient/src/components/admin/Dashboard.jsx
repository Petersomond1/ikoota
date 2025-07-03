// ikootaclient/src/components/admin/Dashboard.jsx
// ==================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';
import KeyStats from './KeyStats';
import PendingReports from './PendingReports';
import Analytics from './Analytics';

// NEW: Membership analytics API
const fetchMembershipAnalytics = async (period = '30d') => {
  const { data } = await api.get(`/membership/admin/analytics?period=${period}&detailed=true`);
  return data;
};

const fetchMembershipStats = async () => {
  const { data } = await api.get('/membership/admin/membership-stats');
  return data;
};

const Dashboard = () => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  // Legacy audit logs query
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const { data } = await api.get('/admin/audit-logs');
      return data;
    }
  });

  // NEW: Membership analytics queries
  const { data: membershipAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['membershipAnalytics', analyticsPeriod],
    queryFn: () => fetchMembershipAnalytics(analyticsPeriod)
  });

  const { data: membershipStats, isLoading: statsLoading } = useQuery({
    queryKey: ['membershipStats'],
    queryFn: fetchMembershipStats
  });

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      {/* Existing components */}
      <KeyStats />
      
      {/* NEW: Membership Analytics Section */}
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

        {analyticsLoading ? (
          <p>Loading analytics...</p>
        ) : membershipAnalytics && (
          <div className="analytics-grid">
            {/* Conversion Funnel */}
            <div className="funnel-chart">
              <h4>Membership Conversion Funnel</h4>
              <div className="funnel-steps">
                <div className="funnel-step">
                  <span className="step-label">Total Registrations</span>
                  <span className="step-value">{membershipAnalytics.conversionFunnel.total_registrations}</span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Started Application</span>
                  <span className="step-value">{membershipAnalytics.conversionFunnel.started_application}</span>
                  <span className="step-percentage">
                    {((membershipAnalytics.conversionFunnel.started_application / membershipAnalytics.conversionFunnel.total_registrations) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Approved Initial</span>
                  <span className="step-value">{membershipAnalytics.conversionFunnel.approved_initial}</span>
                  <span className="step-percentage">
                    {((membershipAnalytics.conversionFunnel.approved_initial / membershipAnalytics.conversionFunnel.started_application) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="funnel-step">
                  <span className="step-label">Full Members</span>
                  <span className="step-value">{membershipAnalytics.conversionFunnel.full_members}</span>
                  <span className="step-percentage">
                    {((membershipAnalytics.conversionFunnel.full_members / membershipAnalytics.conversionFunnel.approved_initial) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Time Series Chart */}
            <div className="time-series-chart">
              <h4>Registration & Approval Trends</h4>
              <div className="chart-container">
                {/* You can integrate a charting library here like Chart.js or Recharts */}
                <div className="simple-chart">
                  {membershipAnalytics.timeSeries.map((point, index) => (
                    <div key={index} className="chart-point">
                      <span>{new Date(point.date).toLocaleDateString()}</span>
                      <span>Registrations: {point.registrations}</span>
                      <span>Approvals: {point.approvals}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Stats Overview */}
        {statsLoading ? (
          <p>Loading stats...</p>
        ) : membershipStats && (
          <div className="membership-stats">
            <h4>Current Status Distribution</h4>
            <div className="stats-breakdown">
              {membershipStats.stats && (
                <>
                  <div className="stat-item">
                    <span>Total Users:</span>
                    <span>{membershipStats.stats.total_users}</span>
                  </div>
                  <div className="stat-item">
                    <span>New Registrations ({analyticsPeriod}):</span>
                    <span>{membershipStats.stats.new_registrations}</span>
                  </div>
                  <div className="stat-item">
                    <span>Pre-Members:</span>
                    <span>{membershipStats.stats.conversion_to_pre_member}</span>
                  </div>
                  <div className="stat-item">
                    <span>Full Members:</span>
                    <span>{membershipStats.stats.conversion_to_full_member}</span>
                  </div>
                  <div className="stat-item">
                    <span>Avg. Approval Time:</span>
                    <span>{membershipStats.stats.avg_approval_days?.toFixed(1)} days</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Existing components */}
      <Analytics />
      <PendingReports />

      {/* Audit Logs */}
      <div className="audit-logs-section">
        <h3>Audit Logs</h3>
        {auditLoading ? (
          <p>Loading audit logs...</p>
        ) : (
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
              {auditLogs?.map(log => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.target_id}</td>
                  <td>{log.details}</td>
                  <td>{new Date(log.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;