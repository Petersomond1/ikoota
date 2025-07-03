// ikootaclient/src/components/info/Suspendedverifyinfo.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './suspendedverifyinfo.css';

const Suspendedverifyinfo = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="suspended-verify-container">
      <div className="suspended-card">
        <div className="suspended-header">
          <div className="suspended-icon">⚠️</div>
          <h1>Application Suspended</h1>
          <h2>Additional Information Required</h2>
        </div>

        <div className="suspended-content">
          <div className="status-message">
            <p>
              <strong>Hello {user?.username || 'Applicant'},</strong>
            </p>
            <p>
              Your application review has been temporarily suspended. This typically means 
              we need additional information or clarification before proceeding.
            </p>
          </div>

          <div className="suspension-reasons">
            <h3>🔍 Common Reasons for Suspension</h3>
            <div className="reasons-list">
              <div className="reason-item">
                <span className="reason-icon">📝</span>
                <div>
                  <h4>Incomplete Information</h4>
                  <p>Some survey responses may need more detail</p>
                </div>
              </div>
              <div className="reason-item">
                <span className="reason-icon">❓</span>
                <div>
                  <h4>Clarification Needed</h4>
                  <p>Certain answers require additional explanation</p>
                </div>
              </div>
              <div className="reason-item">
                <span className="reason-icon">📋</span>
                <div>
                  <h4>Additional Documentation</h4>
                  <p>Supporting documents may be required</p>
                </div>
              </div>
            </div>
          </div>

          <div className="next-actions">
            <h3>📧 Check Your Email</h3>
            <div className="email-instructions">
              <p>
                We have sent detailed instructions to <strong>{user?.email}</strong> 
                explaining what additional information is needed.
              </p>
              <div className="email-checklist">
                <h4>📋 Please Check:</h4>
                <ul>
                  <li>Your inbox for our latest email</li>
                  <li>Spam/junk folder (emails might be filtered)</li>
                  <li>Promotions tab (if using Gmail)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="resolution-steps">
            <h3>🔧 How to Resolve</h3>
            <div className="resolution-timeline">
              <div className="resolution-step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <h4>Read Our Email Carefully</h4>
                  <p>Review the specific requirements mentioned</p>
                </div>
              </div>
              <div className="resolution-step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <h4>Prepare Required Information</h4>
                  <p>Gather any additional documents or details</p>
                </div>
              </div>
              <div className="resolution-step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <h4>Respond to Our Email</h4>
                  <p>Reply with the requested information</p>
                </div>
              </div>
              <div className="resolution-step">
                <span className="step-number">4</span>
                <div className="step-content">
                  <h4>Resume Review Process</h4>
                  <p>We'll continue evaluating your application</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-support">
            <h3>❓ Need Help?</h3>
            <div className="support-options">
              <div className="support-option">
                <span className="support-icon">📧</span>
                <div>
                  <h4>Email Support</h4>
                  <p><strong>support@ikoota.com</strong></p>
                  <p>For questions about suspension requirements</p>
                </div>
              </div>
              <div className="support-option">
                <span className="support-icon">💬</span>
                <div>
                  <h4>Reply to Our Email</h4>
                  <p>Best method for application-specific questions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => window.open('mailto:' + user?.email)} 
              className="btn-primary"
            >
              📧 Check Email
            </button>
            
            <button 
              onClick={() => navigate('/towncrier')} 
              className="btn-secondary"
            >
              📚 Browse Content Meanwhile
            </button>
          </div>
        </div>

        <div className="suspended-footer">
          <p>
            <strong>Timeline:</strong> Most suspensions are resolved within 24-48 hours 
            after receiving the requested information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Suspendedverifyinfo;