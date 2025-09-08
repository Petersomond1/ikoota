import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './SettingsPage.css';
import { useNavigate } from 'react-router-dom';

const fetchUserSettings = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/settings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserPreferences = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/preferences', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchPrivacySettings = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/privacy-settings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updateUserSettings = async (settingsData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/users/settings', settingsData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updateUserPreferences = async (preferencesData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/users/preferences', preferencesData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updatePrivacySettings = async (privacyData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/users/privacy-settings', privacyData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updateUserPassword = async (passwordData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/users/password', passwordData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const SettingsPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('account');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [accountSettings, setAccountSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    language: 'en',
    timezone: 'UTC'
  });

  const [preferences, setPreferences] = useState({
    learning_style: 'visual',
    difficulty_level: 'intermediate',
    study_reminders: true,
    weekly_goals: true,
    progress_sharing: true,
    theme: 'light'
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'members_only',
    show_converse_id: false,
    show_mentor_status: true,
    allow_direct_messages: true,
    share_activity_status: false
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: fetchUserSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: preferencesData } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: privacyData } = useQuery({
    queryKey: ['privacySettings'],
    queryFn: fetchPrivacySettings,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['userSettings']);
      alert('Account settings updated successfully!');
    },
    onError: (error) => {
      console.error('Settings update failed:', error);
      alert('Failed to update settings. Please try again.');
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['userPreferences']);
      alert('Preferences updated successfully!');
    },
    onError: (error) => {
      console.error('Preferences update failed:', error);
      alert('Failed to update preferences. Please try again.');
    }
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: updatePrivacySettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['privacySettings']);
      alert('Privacy settings updated successfully!');
    },
    onError: (error) => {
      console.error('Privacy update failed:', error);
      alert('Failed to update privacy settings. Please try again.');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      alert('Password updated successfully!');
    },
    onError: (error) => {
      console.error('Password update failed:', error);
      alert('Failed to update password. Please check your current password and try again.');
    }
  });

  useEffect(() => {
    if (settingsData?.data) {
      setAccountSettings(prev => ({ ...prev, ...settingsData.data }));
    }
  }, [settingsData]);

  useEffect(() => {
    if (preferencesData?.data) {
      setPreferences(prev => ({ ...prev, ...preferencesData.data }));
    }
  }, [preferencesData]);

  useEffect(() => {
    if (privacyData?.data) {
      setPrivacySettings(prev => ({ ...prev, ...privacyData.data }));
    }
  }, [privacyData]);

  const handleAccountSettingChange = (key, value) => {
    setAccountSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key, value) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(accountSettings);
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleSavePrivacy = () => {
    updatePrivacyMutation.mutate(privacySettings);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      alert('New password must be at least 8 characters long!');
      return;
    }
    updatePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    });
  };

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: '⚙️' },
    { id: 'preferences', label: 'Learning Preferences', icon: '🎯' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  if (settingsLoading) {
    return (
      <div className="settings-page-container loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <div className="settings-page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-page-content">
        <div className="settings-sidebar">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-main">
          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Account Settings</h2>
                <p>Manage your basic account preferences and regional settings.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Language</label>
                  <select 
                    value={accountSettings.language}
                    onChange={(e) => handleAccountSettingChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Timezone</label>
                  <select 
                    value={accountSettings.timezone}
                    onChange={(e) => handleAccountSettingChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Africa/Nairobi">East Africa Time</option>
                    <option value="Africa/Lagos">West Africa Time</option>
                    <option value="Africa/Cairo">Central Africa Time</option>
                  </select>
                </div>
              </div>

              <div className="password-section">
                <h3>Password & Security</h3>
                <button 
                  className="change-password-btn"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Change Password
                </button>

                {showPasswordForm && (
                  <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        required
                        minLength="8"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="save-btn"
                        disabled={updatePasswordMutation.isLoading}
                      >
                        {updatePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="section-actions">
                <button 
                  className="save-settings-btn"
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isLoading}
                >
                  {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Account Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Learning Preferences</h2>
                <p>Customize your learning experience and study habits.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Learning Style</label>
                  <select 
                    value={preferences.learning_style}
                    onChange={(e) => handlePreferenceChange('learning_style', e.target.value)}
                  >
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Difficulty Level</label>
                  <select 
                    value={preferences.difficulty_level}
                    onChange={(e) => handlePreferenceChange('difficulty_level', e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Theme</label>
                  <select 
                    value={preferences.theme}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Study Reminders</h4>
                    <p>Receive reminders for scheduled study sessions</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={preferences.study_reminders}
                      onChange={(e) => handlePreferenceChange('study_reminders', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Weekly Goals</h4>
                    <p>Set and track weekly learning goals</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={preferences.weekly_goals}
                      onChange={(e) => handlePreferenceChange('weekly_goals', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Progress Sharing</h4>
                    <p>Allow sharing progress with mentors and peers</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={preferences.progress_sharing}
                      onChange={(e) => handlePreferenceChange('progress_sharing', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button 
                  className="save-settings-btn"
                  onClick={handleSavePreferences}
                  disabled={updatePreferencesMutation.isLoading}
                >
                  {updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Privacy & Security</h2>
                <p>Control your privacy settings and data sharing preferences.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Profile Visibility</label>
                  <select 
                    value={privacySettings.profile_visibility}
                    onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="members_only">Members Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Show Converse ID</h4>
                    <p>Display your anonymous communication ID to others</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={privacySettings.show_converse_id}
                      onChange={(e) => handlePrivacyChange('show_converse_id', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Show Mentor Status</h4>
                    <p>Display if you are available as a mentor</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={privacySettings.show_mentor_status}
                      onChange={(e) => handlePrivacyChange('show_mentor_status', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Allow Direct Messages</h4>
                    <p>Allow other members to send you direct messages</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={privacySettings.allow_direct_messages}
                      onChange={(e) => handlePrivacyChange('allow_direct_messages', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Share Activity Status</h4>
                    <p>Show when you are online and active</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={privacySettings.share_activity_status}
                      onChange={(e) => handlePrivacyChange('share_activity_status', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button 
                  className="save-settings-btn"
                  onClick={handleSavePrivacy}
                  disabled={updatePrivacyMutation.isLoading}
                >
                  {updatePrivacyMutation.isLoading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Choose how and when you want to receive notifications.</p>
              </div>

              <div className="toggle-settings">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Email Notifications</h4>
                    <p>Receive updates and alerts via email</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={accountSettings.email_notifications}
                      onChange={(e) => handleAccountSettingChange('email_notifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Push Notifications</h4>
                    <p>Receive instant notifications in your browser</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={accountSettings.push_notifications}
                      onChange={(e) => handleAccountSettingChange('push_notifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>SMS Notifications</h4>
                    <p>Receive important alerts via text message</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={accountSettings.sms_notifications}
                      onChange={(e) => handleAccountSettingChange('sms_notifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>Marketing Emails</h4>
                    <p>Receive updates about new features and courses</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={accountSettings.marketing_emails}
                      onChange={(e) => handleAccountSettingChange('marketing_emails', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button 
                  className="save-settings-btn"
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isLoading}
                >
                  {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;