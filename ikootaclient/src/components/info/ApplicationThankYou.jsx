// ikootaclient/src/components/info/ApplicationThankyou.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import { getSecureDisplayName, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './applicationThankyou.css';

const ApplicationThankyou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useUser();
  const [applicationTicket, setApplicationTicket] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Get data from navigation state or generate if needed
    if (location.state) {
      setApplicationTicket(location.state.applicationTicket || '');
      // Handle both old 'username' and new 'displayName' for backward compatibility
      setUsername(location.state.displayName || location.state.username || '');
    } else if (user) {
      // Generate ticket if not provided but user is authenticated
      setUsername(getSecureDisplayName(user, DISPLAY_CONTEXTS.GREETING) || 'Member');
      // You could generate a ticket here if needed
    }
  }, [location.state, user]);

  const handleApplicationSurvey = () => {
    if (!isAuthenticated) {
      alert('Please sign in first to access the application survey.');
      navigate('/login');
      return;
    }
    navigate('/applicationsurvey');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="application-thankyou-container">
      <div className="thankyou-card">
        <div className="thankyou-header">
          <h1>🎉 Welcome to Ikoota!</h1>
          <h2>Registration Successful</h2>
        </div>

        <div className="thankyou-content">
          <div className="welcome-message">
            <p>
              <strong>Congratulations {username}!</strong>
            </p>
            <p>
              Thank you for signing up and showing interest in becoming a member of our educational platform! 
              We greatly appreciate your intention to join our community.
            </p>
          </div>

          {applicationTicket && (
            <div className="ticket-info">
              <h3>📋 Your Application Details</h3>
              <div className="ticket-display">
                <span className="ticket-label">Application Ticket:</span>
                <span className="ticket-number">{applicationTicket}</span>
              </div>
              <p className="ticket-note">
                Please save this ticket number for your records. You'll need it for any inquiries about your application.
              </p>
            </div>
          )}

          <div className="next-steps">
            <h3>🚀 Next Steps to Membership</h3>
            <div className="steps-list">
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <h4>Complete Application Survey</h4>
                  <p>
                    Fill out our detailed application survey to help us understand your background 
                    and interest in our educational community.
                  </p>
                </div>
              </div>
              
              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <h4>Application Review</h4>
                  <p>
                    Our team will review your application and survey responses. This process 
                    typically takes 3-5 business days.
                  </p>
                </div>
              </div>
              
              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <h4>Approval Notification</h4>
                  <p>
                    You'll receive an email notification about your application status. 
                    If approved, you'll gain access to our educational content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="membership-info">
            <h3>📚 About Ikoota Membership</h3>
            <div className="membership-levels">
              <div className="level">
                <h4>🌟 Pre-Member Access</h4>
                <p>After approval, you'll have access to:</p>
                <ul>
                  <li>View public educational content in Towncrier</li>
                  <li>Read community posts and resources</li>
                  <li>Browse teaching materials</li>
                </ul>
                <p className="note">Note: Commenting and chat access requires full membership.</p>
              </div>
              
              <div className="level featured">
                <h4>💎 Full Membership</h4>
                <p>Apply for full membership to unlock:</p>
                <ul>
                  <li>Access to exclusive Iko chat system</li>
                  <li>Participate in discussions and comments</li>
                  <li>Create and share educational content</li>
                  <li>Direct interaction with community members</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={handleApplicationSurvey} 
              className="btn-primary survey-btn"
            >
              📝 Fill Out Application Survey
            </button>
            
            <div className="secondary-actions">
              {!isAuthenticated && (
                <button 
                  onClick={handleGoToLogin} 
                  className="btn-secondary"
                >
                  🔑 Sign In to Continue
                </button>
              )}
              
              <button 
                onClick={handleGoHome} 
                className="btn-secondary"
              >
                🏠 Return to Home
              </button>
            </div>
          </div>

          <div className="important-notes">
            <h3>⚠️ Important Notes</h3>
            <div className="notes-list">
              <div className="note">
                <strong>Application Status:</strong> You can check your application status by signing in to your account.
              </div>
              <div className="note">
                <strong>Survey Completion:</strong> The application survey is required for membership consideration. 
                You can complete it anytime after registration.
              </div>
              <div className="note">
                <strong>Contact Support:</strong> For urgent matters, contact us at support@ikoota.com with your application ticket number.
              </div>
            </div>
          </div>
        </div>

        <div className="thankyou-footer">
          <p>
            Use the link above to fill out the application survey. We will review your application shortly 
            and notify you of the decision via email.
          </p>
          <div className="contact-info">
            <p>Questions? Contact us at: <strong>support@ikoota.com</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationThankyou;