// ikootaclient/src/components/admin/Reports.jsx
// Enhanced version with real functionality

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './reports.css';

// API Functions
const fetchContentReports = async (filters = {}) => {
  try {
    // Filter out empty string values before sending
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const params = new URLSearchParams(cleanFilters);
    const { data } = await api.get(`/users/admin/reports?${params}`);
    return data?.data || data?.reports || data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

const resolveReport = async ({ reportId, resolution, adminNotes, actionTaken }) => {
  const { data } = await api.put(`/users/admin/reports/${reportId}/resolve`, {
    resolution,
    admin_notes: adminNotes,
    action_taken: actionTaken
  });
  return data;
};

const fetchReportStats = async () => {
  try {
    const { data } = await api.get('/users/admin/stats/overview');
    return data?.content_metrics || data?.overview?.content_metrics || {};
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return {};
  }
};

const Reports = () => {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });

  // Fetch reports
  const { 
    data: reports, 
    isLoading: reportsLoading, 
    error: reportsError 
  } = useQuery({
    queryKey: ['contentReports', filters],
    queryFn: () => fetchContentReports(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  // Fetch report statistics
  const { data: reportStats } = useQuery({
    queryKey: ['reportStats'],
    queryFn: fetchReportStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: () => {
      queryClient.invalidateQueries(['contentReports']);
      queryClient.invalidateQueries(['reportStats']);
      setSelectedReport(null);
      alert('Report resolved successfully!');
    },
    onError: (error) => {
      console.error('Failed to resolve report:', error);
      alert('Failed to resolve report: ' + (error.response?.data?.message || error.message));
    }
  });

  // Memoized filtered reports
  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports;
  }, [reports]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle report resolution
  const handleResolveReport = (report) => {
    const resolution = prompt('Enter resolution details:');
    const actionTaken = prompt('What action was taken?');
    
    if (resolution && actionTaken) {
      resolveReportMutation.mutate({
        reportId: report.id,
        resolution,
        adminNotes: `Resolved by admin: ${resolution}`,
        actionTaken
      });
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'resolved': return 'status-resolved';
      case 'dismissed': return 'status-dismissed';
      default: return 'status-unknown';
    }
  };

  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-normal';
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Content Reports Management</h2>
        <div className="header-stats">
          <span className="stat-badge pending">
            Pending: {reportStats?.pending_reports || 0}
          </span>
          <span className="stat-badge total">
            Total: {reportStats?.total_reports || 0}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        
        <div className="filter-actions">
          <button 
            onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {reportsLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      )}

      {/* Error State */}
      {reportsError && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h4>Error Loading Reports</h4>
          <p>{reportsError.message}</p>
          <button 
            onClick={() => queryClient.invalidateQueries(['contentReports'])}
            className="retry-btn"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!reportsLoading && !reportsError && (!filteredReports || filteredReports.length === 0) && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h4>No Reports Found</h4>
          <p>
            {filters.status 
              ? `No reports with status "${filters.status}"`
              : 'No content reports have been submitted yet.'
            }
          </p>
        </div>
      )}

      {/* Reports List */}
      {filteredReports && filteredReports.length > 0 && (
        <div className="reports-list">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`report-card ${report.status} ${selectedReport === report.id ? 'expanded' : ''}`}
            >
              <div className="report-header">
                <div className="report-info">
                  <h4>Report #{report.id}</h4>
                  <div className="report-meta">
                    <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                      {report.status || 'pending'}
                    </span>
                    {report.priority && (
                      <span className={`priority-badge ${getPriorityClass(report.priority)}`}>
                        {report.priority}
                      </span>
                    )}
                    <span className="report-date">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="report-actions">
                  <button
                    onClick={() => setSelectedReport(
                      selectedReport === report.id ? null : report.id
                    )}
                    className="btn-toggle"
                  >
                    {selectedReport === report.id ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              <div className="report-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Reporter:</strong>
                    <span>{report.reporter_username || `User #${report.reporter_id}`}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Reported User:</strong>
                    <span>{report.reported_username || `User #${report.reported_user_id}`}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Content Type:</strong>
                    <span>{report.content_type || 'N/A'}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Reason:</strong>
                    <span>{report.reason || 'No reason provided'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedReport === report.id && (
                <div className="report-details">
                  <div className="details-section">
                    <h5>Full Details</h5>
                    
                    {report.description && (
                      <div className="detail-item">
                        <strong>Description:</strong>
                        <p>{report.description}</p>
                      </div>
                    )}
                    
                    {report.content_id && (
                      <div className="detail-item">
                        <strong>Content ID:</strong>
                        <span className="content-link">
                          <a href={`/content/${report.content_id}`} target="_blank" rel="noopener noreferrer">
                            View Content #{report.content_id}
                          </a>
                        </span>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <strong>Submitted:</strong>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    
                    {report.admin_notes && (
                      <div className="detail-item admin-notes">
                        <strong>Admin Notes:</strong>
                        <p>{report.admin_notes}</p>
                      </div>
                    )}
                    
                    {report.reviewer_name && (
                      <div className="detail-item">
                        <strong>Reviewed by:</strong>
                        <span>{report.reviewer_name}</span>
                        <small>on {new Date(report.reviewedAt).toLocaleString()}</small>
                      </div>
                    )}
                  </div>

                  {/* Resolution Actions */}
                  {report.status === 'pending' && (
                    <div className="resolution-actions">
                      <h5>Resolve Report</h5>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleResolveReport(report)}
                          disabled={resolveReportMutation.isLoading}
                          className="btn-resolve"
                        >
                          {resolveReportMutation.isLoading ? 'Resolving...' : 'Resolve Report'}
                        </button>
                        
                        <button
                          onClick={() => {
                            resolveReportMutation.mutate({
                              reportId: report.id,
                              resolution: 'dismissed',
                              adminNotes: 'Report dismissed - no action needed',
                              actionTaken: 'dismissed'
                            });
                          }}
                          disabled={resolveReportMutation.isLoading}
                          className="btn-dismiss"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredReports && filteredReports.length >= filters.limit && (
        <div className="pagination">
          <button
            onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
            disabled={filters.page <= 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {filters.page}
          </span>
          <button
            onClick={() => handleFilterChange('page', filters.page + 1)}
            disabled={filteredReports.length < filters.limit}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="reports-summary">
        <h4>Reports Summary</h4>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Total Reports:</span>
            <span className="stat-value">{reportStats?.total_reports || 0}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Pending:</span>
            <span className="stat-value pending">{reportStats?.pending_reports || 0}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Resolved:</span>
            <span className="stat-value resolved">{reportStats?.resolved_reports || 0}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">New Today:</span>
            <span className="stat-value">{reportStats?.new_reports_today || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;