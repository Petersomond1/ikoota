// ikootaclient/src/components/auth/Applicationsurvey.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserStatus';
import './applicationSurvey.css';

const ApplicationSurvey = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    currentLocation: '',
    phoneNumber: '',
    
    // Educational Background
    highestEducation: '',
    fieldOfStudy: '',
    currentInstitution: '',
    graduationYear: '',
    
    // Professional Background
    currentOccupation: '',
    workExperience: '',
    professionalSkills: [],
    careerGoals: '',
    
    // Interest in Ikoota
    howDidYouHear: '',
    reasonForJoining: '',
    expectedContributions: '',
    educationalGoals: '',
    
    // Additional Information
    previousMemberships: '',
    specialSkills: '',
    languagesSpoken: [],
    availabilityForEvents: '',
    
    // Agreements
    agreeToTerms: false,
    agreeToCodeOfConduct: false,
    agreeToDataProcessing: false
  });

  // Check authentication and application status
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user has already submitted application
    checkApplicationStatus();
  }, [isAuthenticated, navigate]);

  const checkApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/membership/survey/check-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.currentStatus.initial_application_status !== 'not_submitted') {
          // User has already submitted, redirect to status page
          navigate('/application-status');
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'professionalSkills' || name === 'languagesSpoken') {
        // Handle array checkboxes
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.fullName) errors.push('Full name is required');
        if (!formData.dateOfBirth) errors.push('Date of birth is required');
        if (!formData.nationality) errors.push('Nationality is required');
        if (!formData.currentLocation) errors.push('Current location is required');
        break;
        
      case 2: // Educational Background
        if (!formData.highestEducation) errors.push('Highest education is required');
        if (!formData.fieldOfStudy) errors.push('Field of study is required');
        break;
        
      case 3: // Professional Background & Interest
        if (!formData.currentOccupation) errors.push('Current occupation is required');
        if (!formData.reasonForJoining) errors.push('Reason for joining is required');
        if (!formData.educationalGoals) errors.push('Educational goals are required');
        break;
        
      case 4: // Agreements
        if (!formData.agreeToTerms) errors.push('You must agree to terms and conditions');
        if (!formData.agreeToCodeOfConduct) errors.push('You must agree to code of conduct');
        if (!formData.agreeToDataProcessing) errors.push('You must agree to data processing');
        break;
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare answers array for backend
      const answers = Object.entries(formData).map(([key, value]) => ({
        question: key,
        answer: Array.isArray(value) ? value.join(', ') : value.toString()
      }));

      const response = await fetch('/api/membership/survey/submit-application', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          applicationTicket: `APP-${user.username?.substring(0,3).toUpperCase()}-${Date.now().toString(36)}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        // Redirect to success page after delay
        setTimeout(() => {
          navigate('/application-pending', {
            state: {
              applicationTicket: data.applicationTicket,
              username: user.username
            }
          });
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error submitting application:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="survey-step">
      <h3>📋 Personal Information</h3>
      
      <div className="form-group">
        <label htmlFor="fullName">Full Name *</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="Enter your full legal name"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="nationality">Nationality *</label>
          <input
            type="text"
            id="nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            placeholder="Your nationality"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="currentLocation">Current Location *</label>
        <input
          type="text"
          id="currentLocation"
          name="currentLocation"
          value={formData.currentLocation}
          onChange={handleInputChange}
          placeholder="City, Country"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="survey-step">
      <h3>🎓 Educational Background</h3>
      
      <div className="form-group">
        <label htmlFor="highestEducation">Highest Level of Education *</label>
        <select
          id="highestEducation"
          name="highestEducation"
          value={formData.highestEducation}
          onChange={handleInputChange}
          required
        >
          <option value="">Select your highest education</option>
          <option value="high_school">High School</option>
          <option value="associate">Associate Degree</option>
          <option value="bachelor">Bachelor's Degree</option>
          <option value="master">Master's Degree</option>
          <option value="doctorate">Doctorate/PhD</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fieldOfStudy">Field of Study *</label>
          <input
            type="text"
            id="fieldOfStudy"
            name="fieldOfStudy"
            value={formData.fieldOfStudy}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science, Business, etc."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="graduationYear">Graduation Year</label>
          <input
            type="number"
            id="graduationYear"
            name="graduationYear"
            value={formData.graduationYear}
            onChange={handleInputChange}
            placeholder="YYYY"
            min="1950"
            max="2030"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="currentInstitution">Current/Most Recent Institution</label>
        <input
          type="text"
          id="currentInstitution"
          name="currentInstitution"
          value={formData.currentInstitution}
          onChange={handleInputChange}
          placeholder="University or institution name"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="survey-step">
      <h3>💼 Professional Background & Interests</h3>
      
      <div className="form-group">
        <label htmlFor="currentOccupation">Current Occupation *</label>
        <input
          type="text"
          id="currentOccupation"
          name="currentOccupation"
          value={formData.currentOccupation}
          onChange={handleInputChange}
          placeholder="Your current job title or status"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="workExperience">Years of Work Experience</label>
        <select
          id="workExperience"
          name="workExperience"
          value={formData.workExperience}
          onChange={handleInputChange}
        >
          <option value="">Select experience level</option>
          <option value="0-1">0-1 years</option>
          <option value="2-5">2-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="11-15">11-15 years</option>
          <option value="16+">16+ years</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="reasonForJoining">Why do you want to join Ikoota? *</label>
        <textarea
          id="reasonForJoining"
          name="reasonForJoining"
          value={formData.reasonForJoining}
          onChange={handleInputChange}
          placeholder="Tell us what motivates you to join our educational community..."
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="educationalGoals">What are your educational goals? *</label>
        <textarea
          id="educationalGoals"
          name="educationalGoals"
          value={formData.educationalGoals}
          onChange={handleInputChange}
          placeholder="Describe what you hope to learn or achieve through Ikoota..."
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="expectedContributions">How do you plan to contribute to the community?</label>
        <textarea
          id="expectedContributions"
          name="expectedContributions"
          value={formData.expectedContributions}
          onChange={handleInputChange}
          placeholder="Share your skills, knowledge, or ways you'd like to help..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="survey-step">
      <h3>📄 Additional Information & Agreements</h3>
      
      <div className="form-group">
        <label htmlFor="howDidYouHear">How did you hear about Ikoota?</label>
        <select
          id="howDidYouHear"
          name="howDidYouHear"
          value={formData.howDidYouHear}
          onChange={handleInputChange}
        >
          <option value="">Please select</option>
          <option value="social_media">Social Media</option>
          <option value="friend_referral">Friend/Colleague Referral</option>
          <option value="web_search">Web Search</option>
          <option value="online_community">Online Community</option>
          <option value="educational_institution">Educational Institution</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Languages Spoken</label>
        <div className="checkbox-group">
          {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Other'].map(lang => (
            <label key={lang} className="checkbox-label">
              <input
                type="checkbox"
                name="languagesSpoken"
                value={lang}
                checked={formData.languagesSpoken.includes(lang)}
                onChange={handleInputChange}
              />
              {lang}
            </label>
          ))}
        </div>
      </div>

      <div className="agreements-section">
        <h4>📋 Required Agreements</h4>
        
        <div className="agreement-item">
          <label className="agreement-label">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              required
            />
            <span className="checkmark"></span>
            I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> *
          </label>
        </div>

        <div className="agreement-item">
          <label className="agreement-label">
            <input
              type="checkbox"
              name="agreeToCodeOfConduct"
              checked={formData.agreeToCodeOfConduct}
              onChange={handleInputChange}
              required
            />
            <span className="checkmark"></span>
            I agree to follow the <a href="/code-of-conduct" target="_blank">Community Code of Conduct</a> *
          </label>
        </div>

        <div className="agreement-item">
          <label className="agreement-label">
            <input
              type="checkbox"
              name="agreeToDataProcessing"
              checked={formData.agreeToDataProcessing}
              onChange={handleInputChange}
              required
            />
            <span className="checkmark"></span>
            I consent to processing of my personal data as described in the <a href="/privacy" target="_blank">Privacy Policy</a> *
          </label>
        </div>
      </div>
    </div>
  );

  if (submitSuccess) {
    return (
      <div className="survey-container">
        <div className="survey-card success-card">
          <div className="success-icon">🎉</div>
          <h2>Application Submitted Successfully!</h2>
          <p>Thank you for completing your membership application. You will be redirected shortly...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div className="survey-header">
          <h1>🎯 Membership Application Survey</h1>
          <p>Help us get to know you better and understand your educational goals.</p>
          
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step} 
                  className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                  <span className="step-number">{step}</span>
                  <span className="step-label">
                    {step === 1 && 'Personal'}
                    {step === 2 && 'Education'}
                    {step === 3 && 'Professional'}
                    {step === 4 && 'Agreements'}
                  </span>
                </div>
              ))}
            </div>
            <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-navigation">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep}
                className="btn-secondary"
                disabled={loading}
              >
                ← Previous
              </button>
            )}
            
            <div className="nav-spacer"></div>
            
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="btn-primary"
                disabled={loading}
              >
                Next →
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-primary submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  '📤 Submit Application'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="survey-footer">
          <p>Step {currentStep} of {totalSteps} • All required fields marked with *</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSurvey;




// // ikootaclient/src/components/info/ApplicationThankyou.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useUser } from '../auth/UserStatus';
// import './applicationThankyou.css';

// const ApplicationThankyou = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, isAuthenticated } = useUser();
//   const [applicationTicket, setApplicationTicket] = useState('');
//   const [username, setUsername] = useState('');

//   useEffect(() => {
//     // Get data from navigation state or generate if needed
//     if (location.state) {
//       setApplicationTicket(location.state.applicationTicket || '');
//       setUsername(location.state.username || '');
//     } else if (user) {
//       // Generate ticket if not provided but user is authenticated
//       setUsername(user.username || user.email || 'User');
//       // You could generate a ticket here if needed
//     }
//   }, [location.state, user]);

//   const handleApplicationSurvey = () => {
//     if (!isAuthenticated) {
//       alert('Please sign in first to access the application survey.');
//       navigate('/login');
//       return;
//     }
//     navigate('/applicationsurvey');
//   };

//   const handleGoToLogin = () => {
//     navigate('/login');
//   };

//   const handleGoHome = () => {
//     navigate('/');
//   };

//   return (
//     <div className="application-thankyou-container">
//       <div className="thankyou-card">
//         <div className="thankyou-header">
//           <h1>🎉 Welcome to Ikoota!</h1>
//           <h2>Registration Successful</h2>
//         </div>

//         <div className="thankyou-content">
//           <div className="welcome-message">
//             <p>
//               <strong>Congratulations {username}!</strong>
//             </p>
//             <p>
//               Thank you for signing up and showing interest in becoming a member of our educational platform! 
//               We greatly appreciate your intention to join our community.
//             </p>
//           </div>

//           {applicationTicket && (
//             <div className="ticket-info">
//               <h3>📋 Your Application Details</h3>
//               <div className="ticket-display">
//                 <span className="ticket-label">Application Ticket:</span>
//                 <span className="ticket-number">{applicationTicket}</span>
//               </div>
//               <p className="ticket-note">
//                 Please save this ticket number for your records. You'll need it for any inquiries about your application.
//               </p>
//             </div>
//           )}

//           <div className="next-steps">
//             <h3>🚀 Next Steps to Membership</h3>
//             <div className="steps-list">
//               <div className="step">
//                 <span className="step-number">1</span>
//                 <div className="step-content">
//                   <h4>Complete Application Survey</h4>
//                   <p>
//                     Fill out our detailed application survey to help us understand your background 
//                     and interest in our educational community.
//                   </p>
//                 </div>
//               </div>
              
//               <div className="step">
//                 <span className="step-number">2</span>
//                 <div className="step-content">
//                   <h4>Application Review</h4>
//                   <p>
//                     Our team will review your application and survey responses. This process 
//                     typically takes 3-5 business days.
//                   </p>
//                 </div>
//               </div>
              
//               <div className="step">
//                 <span className="step-number">3</span>
//                 <div className="step-content">
//                   <h4>Approval Notification</h4>
//                   <p>
//                     You'll receive an email notification about your application status. 
//                     If approved, you'll gain access to our educational content.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="membership-info">
//             <h3>📚 About Ikoota Membership</h3>
//             <div className="membership-levels">
//               <div className="level">
//                 <h4>🌟 Pre-Member Access</h4>
//                 <p>After approval, you'll have access to:</p>
//                 <ul>
//                   <li>View public educational content in Towncrier</li>
//                   <li>Read community posts and resources</li>
//                   <li>Browse teaching materials</li>
//                 </ul>
//                 <p className="note">Note: Commenting and chat access requires full membership.</p>
//               </div>
              
//               <div className="level featured">
//                 <h4>💎 Full Membership</h4>
//                 <p>Apply for full membership to unlock:</p>
//                 <ul>
//                   <li>Access to exclusive Iko chat system</li>
//                   <li>Participate in discussions and comments</li>
//                   <li>Create and share educational content</li>
//                   <li>Direct interaction with community members</li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           <div className="action-buttons">
//             <button 
//               onClick={handleApplicationSurvey} 
//               className="btn-primary survey-btn"
//             >
//               📝 Fill Out Application Survey
//             </button>
            
//             <div className="secondary-actions">
//               {!isAuthenticated && (
//                 <button 
//                   onClick={handleGoToLogin} 
//                   className="btn-secondary"
//                 >
//                   🔑 Sign In to Continue
//                 </button>
//               )}
              
//               <button 
//                 onClick={handleGoHome} 
//                 className="btn-secondary"
//               >
//                 🏠 Return to Home
//               </button>
//             </div>
//           </div>

//           <div className="important-notes">
//             <h3>⚠️ Important Notes</h3>
//             <div className="notes-list">
//               <div className="note">
//                 <strong>Application Status:</strong> You can check your application status by signing in to your account.
//               </div>
//               <div className="note">
//                 <strong>Survey Completion:</strong> The application survey is required for membership consideration. 
//                 You can complete it anytime after registration.
//               </div>
//               <div className="note">
//                 <strong>Contact Support:</strong> For urgent matters, contact us at support@ikoota.com with your application ticket number.
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="thankyou-footer">
//           <p>
//             Use the link above to fill out the application survey. We will review your application shortly 
//             and notify you of the decision via email.
//           </p>
//           <div className="contact-info">
//             <p>Questions? Contact us at: <strong>support@ikoota.com</strong></p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ApplicationThankyou;