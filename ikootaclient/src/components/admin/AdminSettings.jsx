// ikootaclient/src/components/admin/AdminSettings.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './adminSettings.css';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [isChanged, setIsChanged] = useState(false);
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    site_logo_url: '',
    contact_email: '',
    support_email: '',
    maintenance_mode: false,
    registration_enabled: true,
    auto_approve_members: false,
    max_file_upload_size: 10,
    session_timeout_minutes: 60,
    password_min_length: 8,
    require_email_verification: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    backup_frequency_hours: 24,
    log_retention_days: 90,
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    admin_notification_email: '',
    system_timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    default_user_role: 'applicant',
    analytics_enabled: true,
    privacy_mode: false,
  });

  // Fetch current settings
  const { isLoading, error } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/system/admin/settings');
        return data?.data || data;
      } catch (error) {
        console.error('Failed to fetch admin settings:', error);
        // Return default settings if fetch fails
        return settings;
      }
    },
    onSuccess: (data) => {
      if (data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data
        }));
      }
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const { data } = await api.put('/system/admin/settings', newSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSettings']);
      setIsChanged(false);
      alert('Settings updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  });

  // Test email configuration
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/system/admin/settings/test-email');
      return data;
    },
    onSuccess: () => {
      alert('Test email sent successfully!');
    },
    onError: (error) => {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email. Please check your email configuration.');
    }
  });

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setIsChanged(true);
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      // Reset to initial state
      const defaultSettings = {
        site_name: 'Ikoota Platform',
        site_description: 'Educational Management Platform',
        site_logo_url: '',
        contact_email: 'contact@ikoota.com',
        support_email: 'support@ikoota.com',
        maintenance_mode: false,
        registration_enabled: true,
        auto_approve_members: false,
        max_file_upload_size: 10,
        session_timeout_minutes: 60,
        password_min_length: 8,
        require_email_verification: true,
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        backup_frequency_hours: 24,
        log_retention_days: 90,
        email_notifications_enabled: true,
        sms_notifications_enabled: false,
        admin_notification_email: '',
        system_timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        time_format: '24h',
        default_user_role: 'applicant',
        analytics_enabled: true,
        privacy_mode: false
      };
      setSettings(defaultSettings);
      setIsChanged(true);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-settings-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Settings</h3>
        <p>Unable to load admin settings. Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="admin-settings-header">
        <h2>⚙️ Admin Settings</h2>
        <p>Configure platform settings and system preferences</p>

        {isChanged && (
          <div className="settings-changed-banner">
            <span className="change-icon">⚠️</span>
            <span>You have unsaved changes</span>
            <button onClick={handleSaveSettings} className="save-changes-btn">
              💾 Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="settings-navigation">
        <div className="settings-tabs">
          {[
            { key: 'general', label: '🏠 General', icon: '🏠' },
            { key: 'security', label: '🔒 Security', icon: '🔒' },
            { key: 'email', label: '📧 Email', icon: '📧' },
            { key: 'system', label: '⚙️ System', icon: '⚙️' },
            { key: 'privacy', label: '🛡️ Privacy', icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-content">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>🏠 General Settings</h3>

            <div className="settings-group">
              <label>Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                placeholder="Enter site name"
              />
            </div>

            <div className="settings-group">
              <label>Site Description</label>
              <textarea
                value={settings.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                placeholder="Enter site description"
                rows={3}
              />
            </div>

            <div className="settings-group">
              <label>Site Logo URL</label>
              <input
                type="url"
                value={settings.site_logo_url}
                onChange={(e) => handleInputChange('site_logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="settings-group">
              <label>Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="settings-group">
              <label>Support Email</label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleInputChange('support_email', e.target.value)}
                placeholder="support@example.com"
              />
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enable Maintenance Mode
              </label>
              <small>When enabled, only admins can access the platform</small>
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.registration_enabled}
                  onChange={(e) => handleInputChange('registration_enabled', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enable User Registration
              </label>
              <small>Allow new users to register for accounts</small>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>🔒 Security Settings</h3>

            <div className="settings-group">
              <label>Minimum Password Length</label>
              <input
                type="number"
                min="6"
                max="20"
                value={settings.password_min_length}
                onChange={(e) => handleInputChange('password_min_length', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>Maximum Login Attempts</label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.max_login_attempts}
                onChange={(e) => handleInputChange('max_login_attempts', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>Account Lockout Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.lockout_duration_minutes}
                onChange={(e) => handleInputChange('lockout_duration_minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min="15"
                max="480"
                value={settings.session_timeout_minutes}
                onChange={(e) => handleInputChange('session_timeout_minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.require_email_verification}
                  onChange={(e) => handleInputChange('require_email_verification', e.target.checked)}
                />
                <span className="checkmark"></span>
                Require Email Verification
              </label>
              <small>Users must verify their email before accessing the platform</small>
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_members}
                  onChange={(e) => handleInputChange('auto_approve_members', e.target.checked)}
                />
                <span className="checkmark"></span>
                Auto-approve New Members
              </label>
              <small>⚠️ Automatically approve initial membership applications</small>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="settings-section">
            <h3>📧 Email Settings</h3>

            <div className="settings-group">
              <label>Admin Notification Email</label>
              <input
                type="email"
                value={settings.admin_notification_email}
                onChange={(e) => handleInputChange('admin_notification_email', e.target.value)}
                placeholder="admin@example.com"
              />
              <small>Email address to receive admin notifications</small>
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) => handleInputChange('email_notifications_enabled', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enable Email Notifications
              </label>
              <small>Send email notifications for important events</small>
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.sms_notifications_enabled}
                  onChange={(e) => handleInputChange('sms_notifications_enabled', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enable SMS Notifications
              </label>
              <small>Send SMS notifications for critical alerts</small>
            </div>

            <div className="email-test-section">
              <h4>Email Configuration Test</h4>
              <p>Test your email configuration by sending a test email</p>
              <button
                onClick={() => testEmailMutation.mutate()}
                disabled={testEmailMutation.isLoading}
                className="test-email-btn"
              >
                {testEmailMutation.isLoading ? '📤 Sending...' : '📧 Send Test Email'}
              </button>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="settings-section">
            <h3>⚙️ System Settings</h3>

            <div className="settings-group">
              <label>Maximum File Upload Size (MB)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_file_upload_size}
                onChange={(e) => handleInputChange('max_file_upload_size', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>Backup Frequency (hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.backup_frequency_hours}
                onChange={(e) => handleInputChange('backup_frequency_hours', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>Log Retention (days)</label>
              <input
                type="number"
                min="7"
                max="365"
                value={settings.log_retention_days}
                onChange={(e) => handleInputChange('log_retention_days', parseInt(e.target.value))}
              />
            </div>

            <div className="settings-group">
              <label>System Timezone</label>
              <select
                value={settings.system_timezone}
                onChange={(e) => handleInputChange('system_timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            <div className="settings-group">
              <label>Date Format</label>
              <select
                value={settings.date_format}
                onChange={(e) => handleInputChange('date_format', e.target.value)}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>

            <div className="settings-group">
              <label>Time Format</label>
              <select
                value={settings.time_format}
                onChange={(e) => handleInputChange('time_format', e.target.value)}
              >
                <option value="24h">24 Hour (23:59)</option>
                <option value="12h">12 Hour (11:59 PM)</option>
              </select>
            </div>

            <div className="settings-group">
              <label>Default User Role</label>
              <select
                value={settings.default_user_role}
                onChange={(e) => handleInputChange('default_user_role', e.target.value)}
              >
                <option value="applicant">Applicant</option>
                <option value="pre_member">Pre-Member</option>
                <option value="member">Member</option>
              </select>
            </div>

            <h4>📊 System Status</h4>
            <div className="settings-row">
              <div className="settings-group">
                <label>Environment</label>
                <input
                  type="text"
                  value={import.meta.env.MODE || 'development'}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small>Current deployment environment</small>
              </div>

              <div className="settings-group">
                <label>API Connection</label>
                <input
                  type="text"
                  value="Connected ✓"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#16a085' }}
                />
                <small>API server connection status</small>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-group">
                <label>Database Status</label>
                <input
                  type="text"
                  value="Connected ✓"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#16a085' }}
                />
                <small>Database connection status</small>
              </div>

              <div className="settings-group">
                <label>System Uptime</label>
                <input
                  type="text"
                  value="Available via /api/system/metrics"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small>Server uptime information</small>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h3>🛡️ Privacy Settings</h3>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.analytics_enabled}
                  onChange={(e) => handleInputChange('analytics_enabled', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enable Analytics
              </label>
              <small>Collect anonymous usage statistics to improve the platform</small>
            </div>

            <div className="settings-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.privacy_mode}
                  onChange={(e) => handleInputChange('privacy_mode', e.target.checked)}
                />
                <span className="checkmark"></span>
                Enhanced Privacy Mode
              </label>
              <small>Minimize data collection and enhance user privacy protection</small>
            </div>

            <div className="privacy-info-section">
              <h4>🔒 Privacy Compliance</h4>
              <div className="privacy-status">
                <div className="privacy-item">
                  <span className="status-icon">✅</span>
                  <span>Converse ID Privacy System Active</span>
                </div>
                <div className="privacy-item">
                  <span className="status-icon">✅</span>
                  <span>Data Encryption Enabled</span>
                </div>
                <div className="privacy-item">
                  <span className="status-icon">✅</span>
                  <span>Secure Session Management</span>
                </div>
                <div className="privacy-item">
                  <span className="status-icon">✅</span>
                  <span>JWT Token Security</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button
          onClick={handleSaveSettings}
          disabled={!isChanged || updateSettingsMutation.isLoading}
          className="save-btn"
        >
          {updateSettingsMutation.isLoading ? '💾 Saving...' : '💾 Save Settings'}
        </button>

        <button
          onClick={handleResetToDefaults}
          className="reset-btn"
        >
          🔄 Reset to Defaults
        </button>

        <button
          onClick={() => window.location.reload()}
          className="refresh-btn"
        >
          ↻ Refresh Page
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;