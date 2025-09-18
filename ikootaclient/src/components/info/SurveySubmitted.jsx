// ikootaclient/src/components/info/SurveySubmitted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import { getSecureDisplayName, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './surveySubmitted.css';

const SurveySubmitted = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [applicationTicket, setApplicationTicket] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (location.state) {
      setApplicationTicket(location.state.applicationTicket || '');
      // Handle both old 'username' and new 'displayName' for backward compatibility
      setUsername(location.state.displayName || location.state.username || '');
    } else if (user) {
      setUsername(getSecureDisplayName(user, DISPLAY_CONTEXTS.GREETING) || 'Member');
    }
  }, [location.state, user]);

  const copyTicketToClipboard = () => {
    if (applicationTicket) {
      navigator.clipboard.writeText(applicationTicket);
      alert('Application ticket copied to clipboard!');
    }
  };

  return (
    <div className="survey-submitted-container">
      <div className="submitted-card">
        <div className="success-animation">
          <div className="checkmark">✓</div>
        </div>

        <div className="submitted-header">
          <h1>🎉 Survey Submitted Successfully!</h1>
          <h2>Thank you, {username}!</h2>
        </div>

        <div className="submitted-content">
          <div className="confirmation-message">
            <p>
              Your application survey has been submitted successfully and is now 
              <strong> pending review</strong> by our admissions team.
            </p>
          </div>

          {applicationTicket && (
            <div className="ticket-section">
              <h3>📋 Your Application Ticket</h3>
              <div className="ticket-display">
                <div className="ticket-number" onClick={copyTicketToClipboard}>
                  {applicationTicket}
                </div>
                <button onClick={copyTicketToClipboard} className="copy-btn">
                  📋 Copy
                </button>
              </div>
              <p className="ticket-note">
                <strong>Important:</strong> Save this ticket number! You'll need it for:
              </p>
              <ul className="ticket-uses">
                <li>Tracking your application status</li>
                <li>Any inquiries about your application</li>
                <li>Contacting support if needed</li>
              </ul>
            </div>
          )}

          <div className="timeline-section">
            <h3>📅 What Happens Next?</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-marker">✅</div>
                <div className="timeline-content">
                  <h4>Survey Submitted</h4>
                  <p>Your application is now in our system</p>
                  <span className="timestamp">Just now</span>
                </div>
              </div>
              
              <div className="timeline-item pending">
                <div className="timeline-marker">⏳</div>
                <div className="timeline-content">
                  <h4>Under Review</h4>
                  <p>Our team will review your responses</p>
                  <span className="timestamp">3-5 business days</span>
                </div>
              </div>
              
              <div className="timeline-item future">
                <div className="timeline-marker">📧</div>
                <div className="timeline-content">
                  <h4>Decision Notification</h4>
                  <p>You'll receive an email with our decision</p>
                  <span className="timestamp">After review</span>
                </div>
              </div>
              
              <div className="timeline-item future">
                <div className="timeline-marker">🎓</div>
                <div className="timeline-content">
                  <h4>Platform Access</h4>
                  <p>If approved, access educational content</p>
                  <span className="timestamp">Upon approval</span>
                </div>
              </div>
            </div>
          </div>

          <div className="review-process">
            <h3>🔍 Review Process</h3>
            <div className="process-info">
              <div className="process-step">
                <h4>Pending Verification</h4>
                <p>Initial review of application completeness</p>
              </div>
              <div className="process-step">
                <h4>Suspended Verification</h4>
                <p>Additional information may be requested</p>
              </div>
              <div className="process-step">
                <h4>Approved-Verified</h4>
                <p>Welcome to the Ikoota community!</p>
              </div>
            </div>
          </div>

          <div className="waiting-period-info">
            <h3>⏰ During the Waiting Period</h3>
            <div className="waiting-actions">
              <div className="action-item">
                <span className="action-icon">📧</span>
                <div>
                  <h4>Check Your Email</h4>
                  <p>We'll send updates to {user?.email}</p>
                </div>
              </div>
              <div className="action-item">
                <span className="action-icon">🔍</span>
                <div>
                  <h4>Monitor Application Status</h4>
                  <p>Sign in periodically to check for updates</p>
                </div>
              </div>
              <div className="action-item">
                <span className="action-icon">📞</span>
                <div>
                  <h4>Contact Support if Urgent</h4>
                  <p>Email support@ikoota.com with your ticket number</p>
                </div>
              </div>
            </div>
          </div>

          <div className="access-restrictions">
            <h3>🚫 Current Access Level</h3>
            <div className="restriction-info">
              <p>
                <strong>During Review Period:</strong> Your account has limited access. 
                You cannot access the full platform until your application is approved.
              </p>
              <div className="access-levels">
                <div className="access-level denied">
                  <span className="access-icon">❌</span>
                  <span>Iko Chat System</span>
                </div>
                <div className="access-level denied">
                  <span className="access-icon">❌</span>
                  <span>Member Discussions</span>
                </div>
                <div className="access-level denied">
                  <span className="access-icon">❌</span>
                  <span>Content Creation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="urgent-contact">
            <h3>🚨 Need Urgent Access?</h3>
            <div className="urgent-info">
              <p>
                If you feel there's an urgent need for your application to be prioritized, 
                you can contact our management team:
              </p>
              <div className="contact-details">
                <div className="contact-method">
                  <span className="contact-icon">📧</span>
                  <div>
                    <strong>Email:</strong> admin@ikoota.com
                    <br />
                    <strong>Subject:</strong> Urgent Application Review - {applicationTicket}
                  </div>
                </div>
                <div className="contact-method">
                  <span className="contact-icon">📱</span>
                  <div>
                    <strong>SMS:</strong> +1 (555) 123-4567
                    <br />
                    <strong>Include:</strong> Your application ticket number
                  </div>
                </div>
              </div>
              <p className="urgent-note">
                <strong>Please include:</strong> Your application ticket number and 
                a clear reason why urgent access is needed for platform participation.
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => navigate('/towncrier')} 
              className="btn-primary"
            >
              📚 Browse Public Content
            </button>
            
            <button 
              onClick={() => navigate('/login')} 
              className="btn-secondary"
            >
              🔑 Sign In to Check Status
            </button>
            
            <button 
              onClick={() => navigate('/')} 
              className="btn-secondary"
            >
              🏠 Return to Home
            </button>
          </div>

          <div className="final-note">
            <div className="note-content">
              <h4>📝 Important Reminders</h4>
              <ul>
                <li>Keep your application ticket number safe</li>
                <li>Check your email regularly for updates</li>
                <li>Do not submit multiple applications</li>
                <li>Contact support only if urgent</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="submitted-footer">
          <p>
            Thank you for your interest in joining the Ikoota educational community. 
            We appreciate your patience during the review process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveySubmitted;