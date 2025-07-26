// ===============================================
// ikootaclient/src/components/membership/FullMembershipApproved.jsx
// ===============================================
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './fullMembershipStatus.css';

const FullMembershipApproved = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useUser();
  
  const membershipTicket = location.state?.membershipTicket || user?.fullMembershipTicket;
  const username = user?.username;

  useEffect(() => {
    // Refresh user status to get latest membership data
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="full-membership-status-container">
      <div className="status-card approved">
        <div className="status-header">
          <div className="success-icon">🎉</div>
          <h1>Congratulations!</h1>
          <h2>Your Full Membership Application Has Been Approved</h2>
        </div>

        <div className="status-content">
          <div className="approval-details">
            <div className="detail-item">
              <strong>Applicant:</strong> {username}
            </div>
            {membershipTicket && (
              <div className="detail-item">
                <strong>Application Ticket:</strong> 
                <span className="ticket-number">{membershipTicket}</span>
              </div>
            )}
            <div className="detail-item">
              <strong>New Status:</strong> 
              <span className="status-badge success">Full Member</span>
            </div>
            <div className="detail-item">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="membership-benefits">
            <h3>🎊 Your New Full Member Benefits:</h3>
            <ul className="benefits-list">
              <li>✅ <strong>Iko Chat Access:</strong> Participate in our exclusive member chat platform</li>
              <li>✅ <strong>Advanced Content:</strong> Access to premium educational materials</li>
              <li>✅ <strong>Direct Mentorship:</strong> Connect with experienced mentors</li>
              <li>✅ <strong>Community Projects:</strong> Collaborate on member-only initiatives</li>
              <li>✅ <strong>Priority Support:</strong> Faster response times for assistance</li>
              <li>✅ <strong>Networking Events:</strong> Invitations to exclusive member gatherings</li>
            </ul>
          </div>

          <div className="next-steps">
            <h3>🚀 What's Next?</h3>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-icon">💬</div>
                <h4>Start Chatting</h4>
                <p>Jump into Iko Chat and introduce yourself to the community</p>
                <button 
                  onClick={() => navigate('/iko')}
                  className="btn-primary"
                >
                  Access Iko Chat
                </button>
              </div>
              
              <div className="step-card">
                <div className="step-icon">👤</div>
                <h4>Complete Profile</h4>
                <p>Update your profile with your interests and expertise</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn-secondary"
                >
                  Edit Profile
                </button>
              </div>
              
              <div className="step-card">
                <div className="step-icon">📚</div>
                <h4>Explore Content</h4>
                <p>Access advanced educational materials and resources</p>
                <button 
                  onClick={() => navigate('/towncrier')}
                  className="btn-secondary"
                >
                  Browse Content
                </button>
              </div>
            </div>
          </div>

          <div className="support-info">
            <h4>📞 Need Help?</h4>
            <p>If you have any questions about your new membership benefits, please contact our support team:</p>
            <div className="contact-options">
              <span>📧 support@ikoota.com</span>
              <span>💬 Use the help chat in your dashboard</span>
            </div>
          </div>
        </div>

        <div className="status-actions">
          <button 
            onClick={() => navigate('/iko')}
            className="btn-primary large"
          >
            🚀 Start Your Full Member Journey
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            📊 Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullMembershipApproved;