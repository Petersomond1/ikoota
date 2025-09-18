// ikootaclient/src/components/membership/FullMembershipSubmitted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import { getSecureDisplayName, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './fullMembershipSubmitted.css';

const FullMembershipSubmitted = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [membershipTicket, setMembershipTicket] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (location.state) {
      setMembershipTicket(location.state.membershipTicket || '');
      // Handle both old 'username' and new 'displayName' for backward compatibility
      setUsername(location.state.displayName || location.state.username || '');
    } else if (user) {
      setUsername(getSecureDisplayName(user, DISPLAY_CONTEXTS.GREETING) || 'Member');
    }
  }, [location.state, user]);

  const copyTicketToClipboard = () => {
    if (membershipTicket) {
      navigator.clipboard.writeText(membershipTicket);
      alert('Membership ticket copied to clipboard!');
    }
  };

  return (
    <div className="membership-submitted-container">
      <div className="submitted-card">
        <div className="success-animation">
          <div className="checkmark">✓</div>
        </div>

        <div className="submitted-header">
          <h1>🎉 Full Membership Application Submitted!</h1>
          <h2>Thank you, {username}!</h2>
        </div>

        <div className="submitted-content">
          <div className="confirmation-message">
            <p>
              Your full membership application has been submitted successfully and is now 
              <strong> under review</strong> by our membership committee.
            </p>
          </div>

          {membershipTicket && (
            <div className="ticket-section">
              <h3>🎫 Your Membership Application Ticket</h3>
              <div className="ticket-display">
                <div className="ticket-number" onClick={copyTicketToClipboard}>
                  {membershipTicket}
                </div>
                <button onClick={copyTicketToClipboard} className="copy-btn">
                  📋 Copy
                </button>
              </div>
              <p className="ticket-note">
                <strong>Important:</strong> Save this ticket number! You'll need it for:
              </p>
              <ul className="ticket-uses">
                <li>Tracking your full membership application status</li>
                <li>Any inquiries about your application</li>
                <li>Contacting support if needed</li>
                <li>Reference during the review process</li>
              </ul>
            </div>
          )}

          <div className="timeline-section">
            <h3>📅 Full Membership Review Process</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-marker">✅</div>
                <div className="timeline-content">
                  <h4>Application Submitted</h4>
                  <p>Your full membership survey is in our system</p>
                  <span className="timestamp">Just now</span>
                </div>
              </div>
              
              <div className="timeline-item pending">
                <div className="timeline-marker">👥</div>
                <div className="timeline-content">
                  <h4>Committee Review</h4>
                  <p>Membership committee evaluating your application</p>
                  <span className="timestamp">5-7 business days</span>
                </div>
              </div>
              
              <div className="timeline-item future">
                <div className="timeline-marker">📧</div>
                <div className="timeline-content">
                  <h4>Decision Notification</h4>
                  <p>Email notification with final decision</p>
                  <span className="timestamp">After review</span>
                </div>
              </div>
              
              <div className="timeline-item future">
                <div className="timeline-marker">💎</div>
                <div className="timeline-content">
                  <h4>Full Member Access</h4>
                  <p>If approved, complete platform access granted</p>
                  <span className="timestamp">Upon approval</span>
                </div>
              </div>
            </div>
          </div>

          <div className="review-outcomes">
            <h3>📊 Possible Review Outcomes</h3>
            <div className="outcomes-grid">
              <div className="outcome-item approved">
                <span className="outcome-icon">✅</span>
                <div className="outcome-content">
                  <h4>Approved - Full Member</h4>
                  <p>Complete access to Iko chat, commenting, and content creation</p>
                </div>
              </div>
              <div className="outcome-item suspended">
                <span className="outcome-icon">⚠️</span>
                <div className="outcome-content">
                  <h4>Suspended - More Info Needed</h4>
                  <p>Additional information or clarification required</p>
                </div>
              </div>
              <div className="outcome-item declined">
                <span className="outcome-icon">❌</span>
                <div className="outcome-content">
                  <h4>Declined - Reapply Later</h4>
                  <p>Application not approved, with guidance for future applications</p>
                </div>
              </div>
            </div>
          </div>

          <div className="current-access">
            <h3>📚 Current Access Level</h3>
            <div className="access-info">
              <div className="access-status">
                <span className="status-icon">🌟</span>
                <div>
                  <h4>Pre-Member Status</h4>
                  <p>You continue to have read-only access to Towncrier educational content while your full membership application is under review.</p>
                </div>
              </div>
              
              <div className="access-limitations">
                <h4>⚠️ Current Limitations (Until Full Membership Approval):</h4>
                <ul>
                  <li>❌ No access to Iko chat system</li>
                  <li>❌ Cannot comment on posts or discussions</li>
                  <li>❌ Cannot create or share content</li>
                  <li>❌ Limited interaction with other members</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="during-review">
            <h3>⏰ During the Review Period</h3>
            <div className="review-guidelines">
              <div className="guideline-item">
                <span className="guideline-icon">📧</span>
                <div>
                  <h4>Monitor Your Email</h4>
                  <p>We'll send updates to {user?.email}</p>
                </div>
              </div>
              <div className="guideline-item">
                <span className="guideline-icon">🚫</span>
                <div>
                  <h4>No Additional Applications</h4>
                  <p>Please do not submit multiple full membership applications</p>
                </div>
              </div>
              <div className="guideline-item">
                <span className="guideline-icon">📞</span>
                <div>
                  <h4>Contact Support if Needed</h4>
                  <p>Email support@ikoota.com with your ticket number for urgent matters</p>
                </div>
              </div>
            </div>
          </div>

          <div className="urgent-contact">
            <h3>🚨 Need Urgent Consideration?</h3>
            <div className="urgent-info">
              <p>
                If you have compelling reasons why your full membership application should be expedited, 
                you can contact our membership committee:
              </p>
              
              <div className="contact-details">
                <div className="contact-method">
                  <span className="contact-icon">📧</span>
                  <div>
                    <strong>Email:</strong> membership@ikoota.com
                    <br />
                    <strong>Subject:</strong> Urgent Full Membership Review - {membershipTicket}
                  </div>
                </div>
              </div>
              <p className="urgent-note">
                <strong>Please include:</strong> Your membership ticket number and specific, compelling reasons 
                why expedited review is necessary for your educational goals or professional requirements.
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => navigate('/towncrier')} 
              className="btn-primary"
            >
              📚 Continue Browsing Content
            </button>
            
            <button 
              onClick={() => navigate('/full-membership-info')} 
              className="btn-secondary"
            >
              📊 Check Application Status
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
                <li>Keep your membership ticket number ({membershipTicket}) safe</li>
                <li>Check your email regularly for review updates</li>
                <li>Continue engaging with pre-member content during review</li>
                <li>Do not submit duplicate applications</li>
                <li>Contact support only for urgent matters</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="submitted-footer">
          <p>
            Thank you for your commitment to becoming a full member of the Ikoota educational community. 
            We appreciate your patience during our thorough review process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullMembershipSubmitted;