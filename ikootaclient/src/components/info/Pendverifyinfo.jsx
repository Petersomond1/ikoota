// ikootaclient/src/components/info/Pendverifyinfo.jsx - SAFE VERSION WITH NO AUTO REDIRECTS
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './pendverifyinfo.css';

const Pendverifyinfo = () => {
  const navigate = useNavigate();
  const { user, membershipStatus, getUserStatus } = useUser();

  // ✅ Get actual survey completion status from API data
  const surveyCompleted = user?.survey_completed || membershipStatus?.survey_completed;
  const approvalStatus = user?.approval_status || membershipStatus?.approval_status;
  const needsSurvey = user?.needs_survey || membershipStatus?.needs_survey;
  const currentUserStatus = getUserStatus();

  console.log('📊 Pendverifyinfo Status Check:', {
    currentUserStatus,
    surveyCompleted,
    needsSurvey,
    approvalStatus,
    userMemberStatus: user?.is_member,
    membershipStage: user?.membership_stage
  });

  // ✅ COMPLETELY REMOVED useEffect WITH AUTOMATIC REDIRECT
  // No more automatic redirects that cause loops
  // Users must manually choose to complete the survey

  return (
    <div className="pending-verify-container">
      <div className="pending-card">
        <div className="pending-header">
          <div className="pending-icon">⏳</div>
          <h1>Application Under Review</h1>
          <h2>Pending Verification</h2>
        </div>

        <div className="pending-content">
          <div className="status-message">
            <p>
              <strong>Hello {user?.username || 'Applicant'},</strong>
            </p>
            <p>
              Your application and survey responses are currently being reviewed by our admissions team. 
              We appreciate your patience during this process.
            </p>
          </div>

          <div className="review-status">
            <h3>📊 Current Status: <span className="status-badge pending">Pending Review</span></h3>
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Application Submitted:</span>
                <span className="detail-value">✅ Complete</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Survey Completed:</span>
                <span className="detail-value">
                  {surveyCompleted ? '✅ Complete' : '⏳ In Progress'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Review Status:</span>
                <span className="detail-value">
                  {approvalStatus === 'pending' ? '⏳ In Progress' : '🔍 Under Review'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Timeline:</span>
                <span className="detail-value">3-5 Business Days</span>
              </div>
            </div>
          </div>

          <div className="access-restrictions">
            <h3>🚫 Current Access Limitations</h3>
            <p>
              While your application is pending, you have limited access to the platform:
            </p>
            <div className="restrictions-list">
              <div className="restriction-item denied">
                <span className="restriction-icon">❌</span>
                <span>Iko Chat System Access</span>
              </div>
              <div className="restriction-item denied">
                <span className="restriction-icon">❌</span>
                <span>Member Discussions</span>
              </div>
              <div className="restriction-item denied">
                <span className="restriction-icon">❌</span>
                <span>Content Creation & Posting</span>
              </div>
              <div className="restriction-item allowed">
                <span className="restriction-icon">✅</span>
                <span>Browse Public Educational Content</span>
              </div>
              <div className="restriction-item allowed">
                <span className="restriction-icon">✅</span>
                <span>Access Landing Page & Public Information</span>
              </div>
            </div>
          </div>

          {/* ✅ Show survey completion section if not completed - MANUAL NAVIGATION ONLY */}
          {!surveyCompleted && needsSurvey && (
            <div className="incomplete-survey" style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#856404', marginTop: '0' }}>📋 Complete Your Application Survey</h3>
              <p style={{ color: '#856404' }}>
                <strong>Action Required:</strong> Your application survey is not yet complete. 
                To expedite your review process and move forward, please complete your application survey.
              </p>
              <button 
                onClick={() => {
                  console.log('🔄 Manual navigation to application survey');
                  navigate('/applicationsurvey');
                }} 
                className="btn-primary"
                style={{ 
                  marginBottom: '10px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📝 Complete Application Survey Now
              </button>
              <p style={{ fontSize: '14px', color: '#856404', margin: '10px 0 0 0', fontWeight: 'bold' }}>
                <strong>Important:</strong> Your application cannot proceed without completing the survey.
              </p>
            </div>
          )}

          {/* ✅ Show different message if survey is completed */}
          {surveyCompleted && (
            <div className="survey-completed" style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#155724', marginTop: '0' }}>✅ Survey Completed</h3>
              <p style={{ color: '#155724' }}>
                <strong>Great!</strong> Your application survey has been completed and submitted. 
                Your application is now under review by our admissions team.
              </p>
            </div>
          )}

          <div className="urgent-access">
            <h3>🚨 Need Urgent Access?</h3>
            <div className="urgent-content">
              <p>
                If you believe there's an urgent need for your application to be prioritized 
                for platform participation, you can contact our management team:
              </p>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-header">
                    <span className="method-icon">📧</span>
                    <strong>Email Support</strong>
                  </div>
                  <div className="method-details">
                    <p><strong>Address:</strong> admin@ikoota.com</p>
                    <p><strong>Subject:</strong> Urgent Application Review Request</p>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="method-header">
                    <span className="method-icon">📱</span>
                    <strong>SMS/WhatsApp</strong>
                  </div>
                  <div className="method-details">
                    <p><strong>Number:</strong> +1 (555) 123-4567</p>
                    <p><strong>Hours:</strong> 9 AM - 5 PM EST</p>
                  </div>
                </div>
              </div>

              <div className="urgent-requirements">
                <h4>📋 Include in Your Message:</h4>
                <ul>
                  <li>Your full name and username</li>
                  <li>Email address used for registration</li>
                  <li>Application ticket number (if available)</li>
                  <li>Clear reason for urgency</li>
                  <li>Specific need for platform participation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h3>⏭️ What to Expect</h3>
            <div className="steps-timeline">
              <div className="step completed">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <h4>Application Received</h4>
                  <p>Your registration is in our system</p>
                </div>
              </div>
              <div className={`step ${surveyCompleted ? 'completed' : 'current'}`}>
                <span className="step-icon">{surveyCompleted ? '✅' : '📝'}</span>
                <div className="step-content">
                  <h4>Survey Completion</h4>
                  <p>{surveyCompleted ? 'Survey responses submitted' : 'Complete your application survey'}</p>
                </div>
              </div>
              <div className={`step ${surveyCompleted ? 'current' : 'future'}`}>
                <span className="step-icon">🔍</span>
                <div className="step-content">
                  <h4>Under Review</h4>
                  <p>Team is evaluating your application</p>
                </div>
              </div>
              <div className="step future">
                <span className="step-icon">📧</span>
                <div className="step-content">
                  <h4>Decision Notification</h4>
                  <p>Email notification with final decision</p>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary"
            >
              📊 My Dashboard
            </button>
            
            <button 
              onClick={() => navigate('/')} 
              className="btn-secondary"
            >
              🏠 Return to Home
            </button>
          </div>
        </div>

        <div className="pending-footer">
          <p>
            <strong>Important:</strong> Attempting to create multiple accounts or 
            resubmit applications will not expedite the review process.
          </p>
          <p>
            <strong>Note:</strong> You can return to the home page at any time to learn more about our platform 
            while waiting for your application review.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pendverifyinfo;

