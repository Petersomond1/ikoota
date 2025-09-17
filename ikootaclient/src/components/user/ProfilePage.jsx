import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';

const fetchUserProfile = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserSettings = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/settings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put('/users/profile', profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const ProfilePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    location: '',
    occupation: '',
    interests: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    education_level: '',
    languages: ''
  });

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: settingsData } = useQuery({
    queryKey: ['userSettings'],
    queryFn: fetchUserSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setIsEditing(false);
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    }
  });

  useEffect(() => {
    if (profileData?.data) {
      setFormData({
        first_name: profileData.data.first_name || '',
        last_name: profileData.data.last_name || '',
        email: profileData.data.email || '',
        bio: profileData.data.bio || '',
        location: profileData.data.location || '',
        occupation: profileData.data.occupation || '',
        interests: profileData.data.interests || '',
        phone: profileData.data.phone || '',
        date_of_birth: profileData.data.date_of_birth || '',
        gender: profileData.data.gender || '',
        education_level: profileData.data.education_level || '',
        languages: profileData.data.languages || ''
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      }));
    }
  }, [profileData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profileData?.data) {
      setFormData({
        first_name: profileData.data.first_name || '',
        last_name: profileData.data.last_name || '',
        email: profileData.data.email || '',
        bio: profileData.data.bio || '',
        location: profileData.data.location || '',
        occupation: profileData.data.occupation || '',
        interests: profileData.data.interests || '',
        phone: profileData.data.phone || '',
        date_of_birth: profileData.data.date_of_birth || '',
        gender: profileData.data.gender || '',
        education_level: profileData.data.education_level || '',
        languages: profileData.data.languages || ''
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="profile-page-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              className="edit-button" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="cancel-button" 
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={handleSubmit}
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-page-content">
        <div className="profile-main-section">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {getSecureDisplayName(user, DISPLAY_CONTEXTS.COMPACT)?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h2>{user?.first_name} {user?.last_name}</h2>
              <p className="username">{getFullConverseId(user)}</p>
              <div className="membership-badge">
                <span className={`status-badge ${user?.membership_stage?.toLowerCase()}`}>
                  {user?.membership_stage || 'Member'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-details-section">
            {!isEditing ? (
              <div className="profile-view">
                <div className="profile-grid">
                  <div className="profile-field">
                    <label>Member ID</label>
                    <p>{getFullConverseId(user)}</p>
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <p>{formData.phone || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Location</label>
                    <p>{formData.location || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Occupation</label>
                    <p>{formData.occupation || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Education Level</label>
                    <p>{formData.education_level || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Languages</label>
                    <p>{formData.languages || 'Not provided'}</p>
                  </div>
                </div>
                <div className="profile-field-full">
                  <label>Bio</label>
                  <p>{formData.bio || 'No bio available'}</p>
                </div>
                <div className="profile-field-full">
                  <label>Interests</label>
                  <p>{formData.interests || 'No interests listed'}</p>
                </div>
              </div>
            ) : (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="occupation">Occupation</label>
                    <input
                      type="text"
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="education_level">Education Level</label>
                    <select
                      id="education_level"
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Education Level</option>
                      <option value="high_school">High School</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="doctorate">Doctorate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="languages">Languages</label>
                    <input
                      type="text"
                      id="languages"
                      name="languages"
                      value={formData.languages}
                      onChange={handleInputChange}
                      placeholder="e.g., English, Swahili, French"
                    />
                  </div>
                </div>
                <div className="form-group-full">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                </div>
                <div className="form-group-full">
                  <label htmlFor="interests">Interests</label>
                  <textarea
                    id="interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="What are you interested in learning about?"
                  ></textarea>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="profile-stats">
            <h3>Profile Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">
                  {new Date(user?.createdAt).toLocaleDateString() || 'N/A'}
                </span>
                <span className="stat-label">Member Since</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                </span>
                <span className="stat-label">Last Active</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button 
              className="action-btn"
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/settings')}
            >
              Account Settings
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/classes')}
            >
              My Classes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;