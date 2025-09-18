// ConverseIdControls.jsx - Admin Control Panel for Converse Identity System
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './admin.css';
import './converseId.css';

const ConverseIdControls = () => {
  const { user } = useUser();

  // Only super_admin can access identity unmasking
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>🔒 Access Restricted</h2>
          <p>This feature is only available to Super Administrators.</p>
          <p>Identity unmasking requires the highest level of administrative privileges.</p>
        </div>
      </div>
    );
  }
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [maskingReason, setMaskingReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnmaskModal, setShowUnmaskModal] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, masked, unmasked

  // Fetch identity system statistics
  const { data: identityStats, isLoading: statsLoading } = useQuery({
    queryKey: ['identity-stats'],
    queryFn: async () => {
      const { data } = await api.get('/users/admin/identity-dashboard');
      return data?.data || data;
    },
    refetchInterval: 3 * 60 * 1000, // 3 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes  
    refetchOnWindowFocus: false
  });

  // Fetch identity system health
  const { data: systemHealth } = useQuery({
    queryKey: ['identity-health'],
    queryFn: async () => {
      const { data } = await api.get('/users/admin/identity-overview');
      return data?.data || data;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
    refetchOnWindowFocus: false
  });

  // Fetch masked identities
  const { data: maskedIdentities, isLoading: identitiesLoading } = useQuery({
    queryKey: ['masked-identities', searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const { data } = await api.get(`/users/admin/search-masked-identities?${params}`);
      return data?.data || data;
    },
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    staleTime: 90 * 1000, // 90 seconds
    refetchOnWindowFocus: false
  });

  // Fetch audit trail
  const { data: auditTrail } = useQuery({
    queryKey: ['identity-audit-trail'],
    queryFn: async () => {
      const { data } = await api.get('/users/admin/identity-audit-trail');
      return data?.data || data;
    },
    refetchInterval: 4 * 60 * 1000, // 4 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false
  });

  // Mask identity mutation
  const maskIdentityMutation = useMutation({
    mutationFn: async ({ userId, reason, options }) => {
      const { data } = await api.post('/users/admin/mask-identity-advanced', {
        userId,
        reason,
        maskingOptions: options
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['masked-identities']);
      queryClient.invalidateQueries(['identity-stats']);
      setSelectedUser(null);
      setMaskingReason('');
    }
  });

  // Unmask identity mutation
  const unmaskIdentityMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      const { data } = await api.post('/users/admin/unmask-identity', {
        userId,
        reason,
        emergency: false
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['masked-identities']);
      queryClient.invalidateQueries(['identity-stats']);
      queryClient.invalidateQueries(['identity-audit-trail']);
      setShowUnmaskModal(false);
      setUnmaskReason('');
    }
  });

  // Bulk mask operation
  const bulkMaskMutation = useMutation({
    mutationFn: async ({ userIds, reason }) => {
      const { data } = await api.post('/users/admin/bulk-mask-identities', {
        userIds,
        reason
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['masked-identities']);
      queryClient.invalidateQueries(['identity-stats']);
    }
  });

  // Generate converse ID for user
  const generateConverseIdMutation = useMutation({
    mutationFn: async (userId) => {
      const { data } = await api.post('/users/admin/generate/converse-id', { userId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['masked-identities']);
    }
  });

  // Handle mask user
  const handleMaskUser = (user) => {
    setSelectedUser(user);
    // Open mask modal or form
  };

  // Handle unmask user
  const handleUnmaskUser = (user) => {
    setSelectedUser(user);
    setShowUnmaskModal(true);
  };

  // Confirm unmask
  const confirmUnmask = () => {
    if (selectedUser && unmaskReason) {
      unmaskIdentityMutation.mutate({
        userId: selectedUser.user_id || selectedUser.id,
        reason: unmaskReason
      });
    }
  };

  // Calculate statistics
  const totalUsers = identityStats?.total_users || 0;
  const maskedUsers = identityStats?.masked_users || 0;
  const maskedPercentage = totalUsers > 0 ? ((maskedUsers / totalUsers) * 100).toFixed(1) : 0;
  const recentMaskings = identityStats?.recent_maskings || 0;
  const recentUnmaskings = identityStats?.recent_unmaskings || 0;

  return (
    <div className="converse-id-controls">
      <div className="controls-header">
        <h2>🔐 Converse Identity Management</h2>
        <div className="header-stats">
          <span className="stat-badge">
            <strong>{maskedUsers}</strong> Masked Users
          </span>
          <span className="stat-badge">
            <strong>{maskedPercentage}%</strong> Privacy Rate
          </span>
          <span className={`health-badge ${systemHealth?.status || 'healthy'}`}>
            System: {systemHealth?.status || 'Healthy'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="control-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 User Identities
        </button>
        <button 
          className={activeTab === 'operations' ? 'active' : ''}
          onClick={() => setActiveTab('operations')}
        >
          ⚙️ Operations
        </button>
        <button 
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Trail
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          🔧 Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h3>System Overview</h3>
            
            {/* Statistics Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-details">
                  <div className="stat-value">{totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎭</div>
                <div className="stat-details">
                  <div className="stat-value">{maskedUsers}</div>
                  <div className="stat-label">Masked Identities</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-details">
                  <div className="stat-value">{recentMaskings}</div>
                  <div className="stat-label">Recent Maskings (7d)</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🔓</div>
                <div className="stat-details">
                  <div className="stat-value">{recentUnmaskings}</div>
                  <div className="stat-label">Recent Unmaskings (7d)</div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="system-health">
              <h4>System Health Status</h4>
              <div className="health-indicators">
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.encryption_status === 'active' ? 'green' : 'red'}`}></span>
                  <span>Encryption: {systemHealth?.encryption_status || 'Unknown'}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.vault_status === 'secure' ? 'green' : 'red'}`}></span>
                  <span>Vault: {systemHealth?.vault_status || 'Unknown'}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.audit_logging === 'enabled' ? 'green' : 'red'}`}></span>
                  <span>Audit Logging: {systemHealth?.audit_logging || 'Unknown'}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.masking_service === 'operational' ? 'green' : 'red'}`}></span>
                  <span>Masking Service: {systemHealth?.masking_service || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h4>Quick Actions</h4>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('users')}
                >
                  🔍 Search Users
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('operations')}
                >
                  🎭 Mask User
                </button>
                <button 
                  className="action-btn warning"
                  onClick={() => setActiveTab('audit')}
                >
                  📋 View Audit Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3>User Identity Management</h3>
            
            {/* Search and Filter */}
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search by converse ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Users</option>
                <option value="masked">Masked Only</option>
                <option value="unmasked">Unmasked Only</option>
              </select>
            </div>

            {/* Users List */}
            <div className="users-list">
              {identitiesLoading ? (
                <div className="loading">Loading identities...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Username</th>
                      <th>Converse ID</th>
                      <th>Status</th>
                      <th>Masked At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(maskedIdentities) ? maskedIdentities : [])?.map(user => (
                      <tr key={user.user_id || user.id}>
                        <td>{user.user_id || user.id}</td>
                        <td>{getFullConverseId(user)}</td>
                        <td>
                          <span className="converse-id">
                            {user.converse_id || 'Not Generated'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_masked ? 'masked' : 'unmasked'}`}>
                            {user.is_masked ? '🎭 Masked' : '👤 Visible'}
                          </span>
                        </td>
                        <td>
                          {user.identity_masked_at ? 
                            new Date(user.identity_masked_at).toLocaleDateString() : 
                            'Never'
                          }
                        </td>
                        <td>
                          <div className="action-buttons">
                            {!user.converse_id && (
                              <button 
                                className="btn-small primary"
                                onClick={() => generateConverseIdMutation.mutate(user.user_id || user.id)}
                              >
                                Generate ID
                              </button>
                            )}
                            {user.is_masked ? (
                              <button 
                                className="btn-small warning"
                                onClick={() => handleUnmaskUser(user)}
                              >
                                Unmask
                              </button>
                            ) : (
                              <button 
                                className="btn-small secondary"
                                onClick={() => handleMaskUser(user)}
                              >
                                Mask
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="operations-section">
            <h3>Bulk Operations</h3>
            
            <div className="operation-cards">
              {/* Bulk Mask */}
              <div className="operation-card">
                <h4>🎭 Bulk Mask Identities</h4>
                <p>Mask multiple user identities at once</p>
                <textarea
                  placeholder="Enter user IDs (comma-separated)..."
                  className="bulk-input"
                />
                <input
                  type="text"
                  placeholder="Reason for masking..."
                  className="reason-input"
                />
                <button className="btn primary">
                  Execute Bulk Mask
                </button>
              </div>

              {/* Emergency Unmask */}
              <div className="operation-card">
                <h4>🚨 Emergency Unmask</h4>
                <p>Unmask user identity for emergency situations</p>
                <input
                  type="text"
                  placeholder="User ID or Converse ID..."
                  className="user-input"
                />
                <textarea
                  placeholder="Emergency reason (required)..."
                  className="reason-input"
                />
                <button className="btn danger">
                  Emergency Unmask
                </button>
              </div>

              {/* Avatar Reset */}
              <div className="operation-card">
                <h4>🔄 Reset Avatar Configuration</h4>
                <p>Reset a user's avatar to default settings</p>
                <input
                  type="text"
                  placeholder="User ID or Converse ID..."
                  className="user-input"
                />
                <button className="btn secondary">
                  Reset Avatar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="audit-section">
            <h3>Identity Audit Trail</h3>
            
            <div className="audit-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Admin</th>
                    <th>Target User</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(auditTrail) ? auditTrail.map(entry => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`action-badge ${entry.action_type}`}>
                          {entry.action_type}
                        </span>
                      </td>
                      <td>{entry.admin_username}</td>
                      <td>{entry.target_username || entry.target_user_id}</td>
                      <td>{entry.reason || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${entry.status}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No audit trail data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-section">
            <h3>Identity System Settings</h3>
            
            <div className="settings-groups">
              <div className="settings-group">
                <h4>Privacy Defaults</h4>
                <label>
                  <input type="checkbox" defaultChecked />
                  Auto-mask new users
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  Require reason for unmasking
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  Notify users when unmasked
                </label>
                <label>
                  <input type="checkbox" />
                  Allow user-initiated unmasking
                </label>
              </div>

              <div className="settings-group">
                <h4>Avatar Configuration</h4>
                <label>
                  Default Avatar Type:
                  <select>
                    <option>Cartoon</option>
                    <option>Abstract</option>
                    <option>Geometric</option>
                    <option>Animal</option>
                  </select>
                </label>
                <label>
                  Voice Modifier Level:
                  <select>
                    <option>Light</option>
                    <option>Medium</option>
                    <option>Heavy</option>
                  </select>
                </label>
              </div>

              <div className="settings-group">
                <h4>Security Settings</h4>
                <label>
                  <input type="checkbox" defaultChecked />
                  Enable double encryption
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  Audit all unmask operations
                </label>
                <label>
                  Unmask approval threshold:
                  <select>
                    <option>1 Admin</option>
                    <option>2 Admins</option>
                    <option>3 Admins</option>
                  </select>
                </label>
              </div>
            </div>

            <button className="btn primary save-settings">
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Unmask Modal */}
      {showUnmaskModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Unmask User Identity</h3>
            <p>
              You are about to unmask <strong>{getFullConverseId(selectedUser)}</strong>.
              This action will be logged and the user will be notified.
            </p>
            <textarea
              placeholder="Please provide a detailed reason for unmasking..."
              value={unmaskReason}
              onChange={(e) => setUnmaskReason(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button 
                className="btn secondary"
                onClick={() => {
                  setShowUnmaskModal(false);
                  setUnmaskReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn warning"
                onClick={confirmUnmask}
                disabled={!unmaskReason || unmaskIdentityMutation.isPending}
              >
                Confirm Unmask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConverseIdControls;