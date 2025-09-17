// ikootaclient/src/components/admin/LiveClassManagement.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './liveClassManagement.css';

const LiveClassManagement = () => {
  const queryClient = useQueryClient();

  // Fetch live class dashboard data
  const { data: liveClassDashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['liveClassDashboard'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/classes/live/admin/dashboard');
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
    },
    retry: 3,
    refetchInterval: 60000
  });

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['pendingLiveApprovals'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/classes/live/admin/pending?limit=10');
        return data?.data || [];
      } catch (error) {
        console.error('Failed to fetch pending approvals:', error);
        return [];
      }
    },
    retry: 3,
    refetchInterval: 30000
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ scheduleId, decision, adminNotes = '' }) => {
      const { data } = await api.put(`/classes/live/admin/review/${scheduleId}`, {
        decision,
        admin_notes: adminNotes,
        notification_message: decision === 'approve'
          ? 'Your live session has been approved and participants will be notified.'
          : 'Your live session request requires revision.'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['liveClassDashboard']);
      queryClient.invalidateQueries(['pendingLiveApprovals']);
    }
  });

  const handleApproval = (scheduleId, decision, adminNotes = '') => {
    approvalMutation.mutate({ scheduleId, decision, adminNotes });
  };

  const stats = liveClassDashboard?.stats || {};

  return (
    <div className="live-class-management">
      <div className="lcm-header">
        <h2>🎥 Live Sessions Management</h2>
        <p>Manage live class sessions, approvals, and scheduling</p>
      </div>

      {/* Statistics Cards */}
      <div className="lcm-stats-grid">
        <div className="lcm-stat-card pending">
          <div className="lcm-stat-icon">⏳</div>
          <div className="lcm-stat-content">
            <h3>Pending Approval</h3>
            <span className="lcm-stat-number">{stats.pending_approval || 0}</span>
            <small>Awaiting review</small>
          </div>
        </div>

        <div className="lcm-stat-card approved">
          <div className="lcm-stat-icon">✅</div>
          <div className="lcm-stat-content">
            <h3>Approved Today</h3>
            <span className="lcm-stat-number">{stats.approved_today || 0}</span>
            <small>Sessions scheduled</small>
          </div>
        </div>

        <div className="lcm-stat-card live">
          <div className="lcm-stat-icon">🔴</div>
          <div className="lcm-stat-content">
            <h3>Currently Live</h3>
            <span className="lcm-stat-number">{stats.currently_live || 0}</span>
            <small>Active sessions</small>
          </div>
        </div>

        <div className="lcm-stat-card total">
          <div className="lcm-stat-icon">📊</div>
          <div className="lcm-stat-content">
            <h3>Total Scheduled</h3>
            <span className="lcm-stat-number">{stats.total_scheduled || 0}</span>
            <small>All sessions</small>
          </div>
        </div>

        <div className="lcm-stat-card completed">
          <div className="lcm-stat-icon">🎯</div>
          <div className="lcm-stat-content">
            <h3>This Week</h3>
            <span className="lcm-stat-number">{stats.completed_this_week || 0}</span>
            <small>Completed sessions</small>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="lcm-approvals-section">
        <h3>⏳ Pending Live Session Approvals</h3>

        {approvalsLoading ? (
          <div className="lcm-loading">
            <div className="loading-spinner"></div>
            <p>Loading pending approvals...</p>
          </div>
        ) : pendingApprovals && pendingApprovals.length > 0 ? (
          <div className="lcm-approvals-grid">
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="lcm-approval-card">
                <div className="lcm-approval-header">
                  <h4>{approval.title}</h4>
                  <span className="lcm-session-type">{approval.class_type || 'General'}</span>
                </div>

                <div className="lcm-approval-details">
                  <div className="lcm-detail-row">
                    <span className="lcm-label">Requested By:</span>
                    <span>User ID: {approval.requested_by}</span>
                  </div>
                  <div className="lcm-detail-row">
                    <span className="lcm-label">Scheduled:</span>
                    <span>{new Date(approval.scheduled_start_time).toLocaleString()}</span>
                  </div>
                  <div className="lcm-detail-row">
                    <span className="lcm-label">Duration:</span>
                    <span>{approval.estimated_duration} minutes</span>
                  </div>
                  <div className="lcm-detail-row">
                    <span className="lcm-label">Target:</span>
                    <span>{approval.target_audience}</span>
                  </div>
                  {approval.target_class_id && (
                    <div className="lcm-detail-row">
                      <span className="lcm-label">Class ID:</span>
                      <span>{approval.target_class_id}</span>
                    </div>
                  )}
                  {approval.description && (
                    <div className="lcm-detail-row">
                      <span className="lcm-label">Description:</span>
                      <span className="lcm-description">{approval.description}</span>
                    </div>
                  )}
                  {approval.special_instructions && (
                    <div className="lcm-detail-row">
                      <span className="lcm-label">Special Instructions:</span>
                      <span className="lcm-description">{approval.special_instructions}</span>
                    </div>
                  )}
                </div>

                <div className="lcm-approval-actions">
                  <button
                    className="lcm-approve-btn"
                    onClick={() => handleApproval(approval.id, 'approve')}
                    disabled={approvalMutation.isLoading}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="lcm-reject-btn"
                    onClick={() => {
                      const notes = prompt('Enter rejection reason:');
                      if (notes) {
                        handleApproval(approval.id, 'reject', notes);
                      }
                    }}
                    disabled={approvalMutation.isLoading}
                  >
                    ❌ Reject
                  </button>
                  <button
                    className="lcm-modify-btn"
                    onClick={() => {
                      const notes = prompt('Enter modification notes:');
                      if (notes) {
                        handleApproval(approval.id, 'modify', notes);
                      }
                    }}
                    disabled={approvalMutation.isLoading}
                  >
                    ✏️ Request Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lcm-no-approvals">
            <div className="lcm-no-data-icon">✨</div>
            <h4>No pending approvals</h4>
            <p>All live session requests have been reviewed!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="lcm-quick-actions">
        <h3>Quick Actions</h3>
        <div className="lcm-action-buttons">
          <button className="lcm-action-btn primary">
            📋 View All Sessions
          </button>
          <button className="lcm-action-btn secondary">
            📅 Schedule Session
          </button>
          <button className="lcm-action-btn secondary">
            📊 Analytics
          </button>
          <button
            className="lcm-action-btn tertiary"
            onClick={() => {
              queryClient.invalidateQueries(['liveClassDashboard']);
              queryClient.invalidateQueries(['pendingLiveApprovals']);
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveClassManagement;