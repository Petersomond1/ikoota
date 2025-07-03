// ikootaclient/src/components/membership/FullMembershipDeclined.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './fullMembershipDeclined.css';

const FullMembershipDeclined = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="membership-declined-container">
      <div className="declined-card">
        <div className="declined-header">
          <div className="declined-icon">📋</div>
          <h1>Full Membership Application Decision</h1>
          <h2>Application Not Approved</h2>
        </div>

        <div className="declined-content">
          <div className="decision-message">
            <p>
              <strong>Dear {user?.username || 'Applicant'},</strong>
            </p>
            <p>
              After careful review by our membership committee, we regret to inform you that 
              your full membership application has not been approved at this time.
            </p>
          </div>

          <div className="feedback-section">
            <h3>📧 Detailed Feedback</h3>
            <div className="email-notice">
              <p>
                We have sent detailed feedback to your email address ({user?.email}) 
                explaining the specific reasons for this decision and providing guidance 
                for future applications.
              </p>
              <button 
                onClick={() => window.open(`mailto:${user?.email}`)} 
                className="check-email-btn"
              >
                📧 Check Your Email
              </button>
            </div>
          </div>

          <div className="reapplication-info">
            <h3>🔄 Future Application Opportunities</h3>
            <div className="reapplication-content">
              <p>
                This decision does not permanently exclude you from full membership. 
                You may reapply in the future when you have addressed the areas highlighted in our feedback.
              </p>
              
              <div className="reapplication-timeline">
                <h4>📅 Reapplication Guidelines:</h4>
                <ul>
                  <li>Wait at least 90 days before submitting a new application</li>
                  <li>Address all concerns mentioned in our feedback email</li>
                  <li>Demonstrate growth in the areas we've identified</li>
                  <li>Continue engaging as a pre-member to show commitment</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="current-status">
            <h3>📚 Your Current Access</h3>
            <div className="status-info">
              <div className="status-item">
                <span className="status-icon">🌟</span>
                <div>
                  <h4>Pre-Member Status Maintained</h4>
                  <p>You retain your current pre-member access to Towncrier educational content</p>
                </div>
              </div>
              <div className="access-details">
                <h4>✅ You Can Continue To:</h4>
                <ul>
                  <li>Browse all public educational content</li>
                  <li>Read community posts and resources</li>
                  <li>Learn from teaching materials</li>
                  <li>Prepare for future full membership application</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="improvement-suggestions">
            <h3>💡 General Improvement Areas</h3>
            <div className="suggestions-grid">
              <div className="suggestion-item">
                <span className="suggestion-icon">📖</span>
                <div>
                  <h4>Deepen Educational Expertise</h4>
                  <p>Continue developing your knowledge in your field of interest</p>
                </div>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">🤝</span>
                <div>
                  <h4>Community Engagement</h4>
                  <p>Show commitment to collaborative learning principles</p>
                </div>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">💬</span>
                <div>
                  <h4>Communication Skills</h4>
                  <p>Develop clear, professional communication abilities</p>
                </div>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">🎯</span>
                <div>
                  <h4>Clear Contribution Plan</h4>
                  <p>Articulate specific ways you'll contribute to the community</p>
                </div>
              </div>
            </div>
          </div>

          <div className="support-contact">
            <h3>❓ Questions About This Decision?</h3>
            <div className="contact-info">
              <p>
                If you have questions about this decision or need clarification about the feedback, 
                you may contact our membership committee:
              </p>
              <div className="contact-method">
                <span className="contact-icon">📧</span>
                <div>
                  <strong>Email:</strong> membership@ikoota.com
                  <br />
                  <strong>Subject:</strong> Question About Full Membership Decision
                </div>
              </div>
              <p className="contact-note">
                Please reference your membership ticket number in any correspondence.
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => navigate('/towncrier')} 
              className="btn-primary"
            >
              📚 Continue as Pre-Member
            </button>
            
            <button 
              onClick={() => window.open(`mailto:${user?.email}`)} 
              className="btn-secondary"
            >
              📧 Check Email for Details
            </button>
            
            <button 
              onClick={() => navigate('/')} 
              className="btn-secondary"
            >
              🏠 Return to Home
            </button>
          </div>
        </div>

        <div className="declined-footer">
          <p>
            We encourage you to continue your educational journey with us as a pre-member 
            and look forward to potentially welcoming you as a full member in the future.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullMembershipDeclined;