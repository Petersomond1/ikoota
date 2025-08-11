// ikootaclient/src/components/membership/FullMembershipInfo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './fullMembershipInfo.css';

const FullMembershipInfo = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [hasAccessedBefore, setHasAccessedBefore] = useState(false);
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Please sign in first to access membership applications.');
      navigate('/login');
      return;
    }

    // Check if user is eligible for full membership application
    checkMembershipEligibility();
  }, [isAuthenticated, navigate]);

  const checkMembershipEligibility = async () => {
    try {
      const response = await api.get('/api/membership/full-membership/status');
      const { hasAccessed, hasSubmitted, status, isPreMember } = response.data;
      
      if (!isPreMember) {
        alert('You must be a pre-member first before applying for full membership.');
        navigate('/towncrier');
        return;
      }

      setHasAccessedBefore(hasAccessed);
      setHasSubmittedApplication(hasSubmitted);
      setApplicationStatus(status);

      // Log first-time access
      if (!hasAccessed) {
        await api.post('/api/membership/full-membership/log-access');
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      alert('Error checking your membership status. Please try again.');
      navigate('/towncrier');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSurvey = () => {
    navigate('/full-membership-survey');
  };

  const handleGoBack = () => {
    navigate('/towncrier');
  };

  if (loading) {
    return (
      <div className="membership-info-container">
        <div className="loading-message">
          <p>Loading membership information...</p>
        </div>
      </div>
    );
  }

  // If user has already submitted application
  if (hasSubmittedApplication) {
    return (
      <div className="membership-info-container">
        <div className="membership-card submitted-state">
          <div className="membership-header">
            <h1>📋 Full Membership Application Status</h1>
          </div>

          <div className="status-display">
            <div className={`status-badge ${applicationStatus}`}>
              {applicationStatus === 'pending' && '⏳ Under Review'}
              {applicationStatus === 'suspended' && '⚠️ Additional Info Required'}
              {applicationStatus === 'approved' && '✅ Approved'}
              {applicationStatus === 'declined' && '❌ Declined'}
            </div>
          </div>

          <div className="status-content">
            {applicationStatus === 'pending' && (
              <div className="pending-info">
                <h3>Your Application is Under Review</h3>
                <p>Our team is currently reviewing your full membership application. You'll receive an email notification once the review is complete.</p>
                <div className="timeline">
                  <div className="timeline-item completed">✅ Application Submitted</div>
                  <div className="timeline-item current">🔍 Under Review</div>
                  <div className="timeline-item future">📧 Decision Notification</div>
                </div>
              </div>
            )}

            {applicationStatus === 'suspended' && (
              <div className="suspended-info">
                <h3>Additional Information Required</h3>
                <p>Your application has been temporarily suspended pending additional information. Please check your email for specific requirements.</p>
                <button onClick={() => navigate('/full-membership-suspended')} className="btn-primary">
                  View Requirements
                </button>
              </div>
            )}

            {applicationStatus === 'approved' && (
              <div className="approved-info">
                <h3>🎉 Congratulations! You're Now a Full Member</h3>
                <p>Your full membership has been approved. You now have access to all platform features including the Iko chat system.</p>
                <button onClick={() => navigate('/iko')} className="btn-primary">
                  Access Iko Chat System
                </button>
              </div>
            )}

            {applicationStatus === 'declined' && (
              <div className="declined-info">
                <h3>Application Not Approved</h3>
                <p>Your full membership application was not approved at this time. Please check your email for feedback and reapplication guidelines.</p>
                <button onClick={() => navigate('/full-membership-declined')} className="btn-secondary">
                  View Feedback
                </button>
              </div>
            )}
          </div>

          <div className="back-action">
            <button onClick={handleGoBack} className="btn-back">
              ← Back to Towncrier
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main membership information page
  return (
    <div className="membership-info-container">
      <div className="membership-card">
        <div className="membership-header">
          <h1>🎓 Full Membership Application</h1>
          <h2>Join the Complete Ikoota Community</h2>
        </div>

        <div className="welcome-message">
          <p>
            <strong>Welcome, {user?.username}!</strong>
          </p>
          <p>
            As a pre-member, you've already experienced our educational content in Towncrier. 
            Now you can apply for full membership to unlock the complete Ikoota experience.
          </p>
        </div>

        <div className="membership-benefits">
          <h3>🌟 Full Membership Benefits</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">💬</span>
              <div className="benefit-content">
                <h4>Iko Chat System Access</h4>
                <p>Join exclusive member discussions and real-time conversations</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💭</span>
              <div className="benefit-content">
                <h4>Comment & Engage</h4>
                <p>Participate in discussions on educational content and posts</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✍️</span>
              <div className="benefit-content">
                <h4>Create & Share</h4>
                <p>Contribute your own educational content and teaching materials</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🤝</span>
              <div className="benefit-content">
                <h4>Community Collaboration</h4>
                <p>Work directly with other educators and learners</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📚</span>
              <div className="benefit-content">
                <h4>Advanced Resources</h4>
                <p>Access member-only educational materials and tools</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <div className="benefit-content">
                <h4>Personalized Learning</h4>
                <p>Customized content recommendations and learning paths</p>
              </div>
            </div>
          </div>
        </div>

        <div className="membership-expectations">
          <h3>📋 Membership Expectations</h3>
          <div className="expectations-content">
            <div className="expectation-section">
              <h4>🎯 Our Mission</h4>
              <p>
                Ikoota is dedicated to creating a high-quality educational community where 
                verified educators and serious learners collaborate to advance education 
                through innovative teaching methods and meaningful discussions.
              </p>
            </div>
            
            <div className="expectation-section">
              <h4>🌟 Community Values</h4>
              <ul>
                <li><strong>Excellence:</strong> Commitment to high-quality educational content</li>
                <li><strong>Respect:</strong> Treating all community members with dignity</li>
                <li><strong>Collaboration:</strong> Working together for mutual growth</li>
                <li><strong>Innovation:</strong> Embracing new educational technologies and methods</li>
                <li><strong>Integrity:</strong> Honest and ethical participation in all activities</li>
              </ul>
            </div>

            <div className="expectation-section">
              <h4>👥 Member Responsibilities</h4>
              <ul>
                <li>Contribute meaningfully to discussions and content</li>
                <li>Maintain professional and respectful communication</li>
                <li>Share knowledge and expertise with the community</li>
                <li>Follow community guidelines and platform rules</li>
                <li>Support fellow members' learning and growth</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="platform-overview">
          <h3>🏛️ About Our Educational Platform</h3>
          <div className="platform-content">
            <div className="platform-section">
              <h4>📚 Educational Focus</h4>
              <p>
                Our platform serves as a comprehensive educational ecosystem where 
                teachers, students, researchers, and lifelong learners come together 
                to share knowledge, collaborate on projects, and advance the field of education.
              </p>
            </div>

            <div className="platform-section">
              <h4>💬 Chat & Discussion System</h4>
              <p>
                The Iko chat system facilitates real-time collaboration, allowing members 
                to engage in focused educational discussions, share resources instantly, 
                and build lasting professional relationships.
              </p>
            </div>

            <div className="platform-section">
              <h4>🔐 Quality Assurance</h4>
              <p>
                Our two-stage membership process ensures that all full members are 
                committed to maintaining the high standards of educational discourse 
                and collaborative learning that define our community.
              </p>
            </div>
          </div>
        </div>

        <div className="application-process">
          <h3>📝 Application Process Overview</h3>
          <div className="process-steps">
            <div className="process-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Complete Membership Survey</h4>
                <p>Answer detailed questions about your educational background and goals</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Application Review</h4>
                <p>Our team evaluates your responses and commitment to education</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Decision & Access</h4>
                <p>Receive notification and gain full platform access upon approval</p>
              </div>
            </div>
          </div>
        </div>

        <div className="important-notes">
          <h3>⚠️ Important Information</h3>
          <div className="notes-list">
            <div className="note-item">
              <span className="note-icon">📋</span>
              <div>
                <h4>Application Requirements</h4>
                <p>All questions in the membership survey must be answered thoroughly and honestly.</p>
              </div>
            </div>
            <div className="note-item">
              <span className="note-icon">⏰</span>
              <div>
                <h4>Review Timeline</h4>
                <p>Full membership applications typically take 5-7 business days to review.</p>
              </div>
            </div>
            <div className="note-item">
              <span className="note-icon">🔄</span>
              <div>
                <h4>One Application Only</h4>
                <p>You may only submit one full membership application. Make it count!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleProceedToSurvey} 
            className="btn-primary application-btn"
          >
            📝 Begin Full Membership Application
          </button>
          
          <button 
            onClick={handleGoBack} 
            className="btn-secondary"
          >
            ← Back to Towncrier
          </button>
        </div>

        <div className="first-access-note">
          {!hasAccessedBefore && (
            <div className="access-logged">
              <p>
                📊 <strong>Note:</strong> Your access to this membership information page has been 
                logged for record-keeping purposes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullMembershipInfo;