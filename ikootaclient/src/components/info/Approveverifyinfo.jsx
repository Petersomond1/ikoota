// ikootaclient/src/components/info/Approveverifyinfo.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './approveverifyinfo.css';

const Approveverifyinfo = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger celebration animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleProceedToTowncrier = () => {
    navigate('/towncrier');
  };

  return (
    <div className="approved-verify-container">
      {showConfetti && <div className="confetti-animation"></div>}
      
      <div className="approved-card">
        <div className="approved-header">
          <div className="success-icon">🎉</div>
          <h1>Congratulations!</h1>
          <h2>Application Approved</h2>
          <div className="celebration-text">Welcome to the Ikoota Community!</div>
        </div>

        <div className="approved-content">
          <div className="approval-message">
            <p>
              <strong>Excellent news, {user?.username || 'New Member'}!</strong>
            </p>
            <p>
              Your initial application has been <span className="highlight-success">approved</span> by our admissions team. 
              You are now a <strong>Pre-Member</strong> of the Ikoota community with access to our educational content platform.
            </p>
          </div>

          <div className="new-status">
            <h3>🔰 Your New Status</h3>
            <div className="status-upgrade">
              <div className="status-from">
                <span className="status-label">From:</span>
                <span className="status-badge applicant">Applicant</span>
              </div>
              <div className="status-arrow">→</div>
              <div className="status-to">
                <span className="status-label">To:</span>
                <span className="status-badge pre-member">Pre-Member</span>
              </div>
            </div>
          </div>

          <div className="new-access">
            <h3>🔓 What You Now Have Access To</h3>
            <div className="access-list">
              <div className="access-item granted">
                <span className="access-icon">✅</span>
                <div className="access-details">
                  <strong>Towncrier Content Platform</strong>
                  <p>Browse and read all educational teachings and community announcements</p>
                </div>
              </div>
              <div className="access-item granted">
                <span className="access-icon">✅</span>
                <div className="access-details">
                  <strong>Community Updates</strong>
                  <p>Stay informed with the latest community news and events</p>
                </div>
              </div>
              <div className="access-item granted">
                <span className="access-icon">✅</span>
                <div className="access-details">
                  <strong>Educational Resources</strong>
                  <p>Access to curated learning materials and teachings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="future-access">
            <h3>🚀 Path to Full Membership</h3>
            <p>
              As a Pre-Member, you're on the path to becoming a Full Member with even more benefits:
            </p>
            <div className="future-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💬</span>
                <span>Iko Chat System Access</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🤝</span>
                <span>Interactive Community Participation</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📝</span>
                <span>Content Creation & Sharing</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span>Advanced Learning Features</span>
              </div>
            </div>
            <div className="full-membership-note">
              <p>
                <strong>Next Step:</strong> After participating as a Pre-Member, you'll be eligible 
                to apply for Full Membership with enhanced community privileges.
              </p>
            </div>
          </div>

          <div className="action-section">
            <h3>🎯 Ready to Get Started?</h3>
            <p>
              Your journey in the Ikoota community begins now. Click below to access 
              the Towncrier platform and start exploring our educational content.
            </p>
            
            <div className="action-buttons">
              <button 
                onClick={handleProceedToTowncrier}
                className="btn-primary main-action"
              >
                🚀 Enter Towncrier Platform
              </button>
              
              <button 
                onClick={() => navigate('/')} 
                className="btn-secondary"
              >
                🏠 Return to Home
              </button>
            </div>
          </div>

          <div className="welcome-tips">
            <h3>💡 Getting Started Tips</h3>
            <div className="tips-grid">
              <div className="tip-item">
                <span className="tip-icon">📖</span>
                <div className="tip-content">
                  <strong>Explore Content</strong>
                  <p>Browse through various teachings and educational materials</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🔄</span>
                <div className="tip-content">
                  <strong>Stay Active</strong>
                  <p>Regular engagement helps with Full Membership eligibility</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📧</span>
                <div className="tip-content">
                  <strong>Check Updates</strong>
                  <p>Keep an eye on your email for community announcements</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">❓</span>
                <div className="tip-content">
                  <strong>Need Help?</strong>
                  <p>Contact support if you have any questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="approved-footer">
          <div className="footer-message">
            <p>
              <strong>Welcome to Ikoota!</strong> We're excited to have you as part of our learning community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approveverifyinfo;