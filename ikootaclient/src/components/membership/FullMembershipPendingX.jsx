// ===============================================
// ikootaclient/src/components/membership/FullMembershipPending.jsx
// ===============================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './fullMembershipStatus.css';

const FullMembershipPending = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await api.get(`/membership/full-membership-status/${user?.user_id}`);
      setApplicationData(response.data);
    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="full-membership-status-container">
        <div className="status-card loading">
          <div className="loading-spinner"></div>
          <p>Loading application status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-membership-status-container">
      <div className="status-card pending">
        <div className="status-header">
          <div className="pending-icon">⏳</div>
          <h1>Application Under Review</h1>
          <h2>Your Full Membership Application is Being Processed</h2>
        </div>

        <div className="status-content">
          <div className="application-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <strong>Applicant:</strong> {user?.username}
              </div>
              <div className="summary-item">
                <strong>Email:</strong> {user?.email}
              </div>
              {applicationData?.ticket && (
                <div className="summary-item">
                  <strong>Application Ticket:</strong> 
                  <span className="ticket-number">{applicationData.ticket}</span>
                </div>
              )}
              <div className="summary-item">
                <strong>Current Status:</strong> 
                <span className="status-badge pending">Under Review</span>
              </div>
              {applicationData?.submittedAt && (
                <div className="summary-item">
                  <strong>Submitted:</strong> 
                  {new Date(applicationData.submittedAt).toLocaleDateString()} 
                  <small>({getTimeAgo(applicationData.submittedAt)})</small>
                </div>
              )}
            </div>
          </div>

          <div className="review-timeline">
            <h3>📋 Review Process Timeline</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-icon">✅</div>
                <div className="timeline-content">
                  <h4>Application Submitted</h4>
                  <p>Your application has been received and is in our review queue</p>
                  {applicationData?.submittedAt && (
                    <small>{new Date(applicationData.submittedAt).toLocaleDateString()}</small>
                  )}
                </div>
              </div>
              
              <div className="timeline-item active">
                <div className="timeline-icon">🔍</div>
                <div className="timeline-content">
                  <h4>Admin Review</h4>
                  <p>Our team is carefully reviewing your application and responses</p>
                  <small>Typical review time: 3-5 business days</small>
                </div>
              </div>
              
              <div className="timeline-item pending">
                <div className="timeline-icon">📧</div>
                <div className="timeline-content">
                  <h4>Decision Notification</h4>
                  <p>You'll receive an email with the decision and next steps</p>
                  <small>Notification will be sent to {user?.email}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="while-you-wait">
            <h3>⏰ While You Wait</h3>
            <div className="activities-grid">
              <div className="activity-card">
                <div className="activity-icon">📚</div>
                <h4>Continue Learning</h4>
                <p>Access Towncrier content and stay engaged with the community</p>
                <button 
                  onClick={() => navigate('/towncrier')}
                  className="btn-secondary small"
                >
                  Browse Content
                </button>
              </div>
              
              <div className="activity-card">
                <div className="activity-icon">👤</div>
                <h4>Update Profile</h4>
                <p>Enhance your profile while waiting for the review</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn-secondary small"
                >
                  Edit Profile
                </button>
              </div>
              
              <div className="activity-card">
                <div className="activity-icon">❓</div>
                <h4>Have Questions?</h4>
                <p>Contact our support team if you need assistance</p>
                <button 
                  onClick={() => window.location.href = 'mailto:support@ikoota.com'}
                  className="btn-secondary small"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          <div className="important-notes">
            <h4>📌 Important Notes</h4>
            <ul>
              <li>Please do not submit multiple applications - this may delay processing</li>
              <li>Check your email regularly for updates on your application status</li>
              <li>You can continue accessing all pre-member features while under review</li>
              <li>The review process is thorough to ensure the best community experience</li>
            </ul>
          </div>
        </div>

        <div className="status-actions">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            📊 Go to Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/towncrier')}
            className="btn-secondary"
          >
            📚 Continue Learning
          </button>
          
          <button 
            onClick={fetchApplicationStatus}
            className="btn-secondary"
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullMembershipPending;