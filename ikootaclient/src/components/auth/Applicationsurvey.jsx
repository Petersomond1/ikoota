// ikootaclient/src/components/auth/Applicationsurvey.jsx - CORRECTED TO STOP AUTO REDIRECTS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserStatus';
import './applicationSurvey.css';
import api from '../service/api';
import { useDynamicLabels } from '../../hooks/useDynamicLabels';


const ApplicationSurvey = () => {
  const navigate = useNavigate();
  const { labels: dynamicLabels, loading: labelsLoading } = useDynamicLabels();
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const totalSteps = 4;

  // ✅ ADD REFS TO PREVENT API LOOPS
  const statusCheckRef = useRef(false);
  const hasCheckedStatus = useRef(false);
  const initialLoadComplete = useRef(false);

  // Storage key for this user's application data
  const STORAGE_KEY = `ikoota_application_${user?.id || 'guest'}`;
  const STEP_STORAGE_KEY = `ikoota_application_step_${user?.id || 'guest'}`;

  // Initial form data
  const initialFormData = {
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
  };

  // Form state with auto-save functionality
  const [formData, setFormData] = useState(initialFormData);

  // Load saved data from localStorage
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('📂 Loading saved application data:', Object.keys(parsedData).length, 'fields');
        
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
        
        const savedTime = parsedData._savedAt;
        if (savedTime) {
          setLastSaved(new Date(savedTime));
        }
      }
      
      if (savedStep) {
        const stepNumber = parseInt(savedStep, 10);
        if (stepNumber >= 1 && stepNumber <= totalSteps) {
          setCurrentStep(stepNumber);
          console.log('📂 Resuming from step:', stepNumber);
        }
      }
    } catch (error) {
      console.error('❌ Error loading saved data:', error);
      // If there's corrupted data, clear it
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_STORAGE_KEY);
    }
  }, [STORAGE_KEY, STEP_STORAGE_KEY, totalSteps]);

  // Save data to localStorage
  const saveToStorage = useCallback((dataToSave, stepToSave = currentStep) => {
    try {
      const saveData = {
        ...dataToSave,
        _savedAt: new Date().toISOString(),
        _version: '1.0' // For future migrations if needed
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      localStorage.setItem(STEP_STORAGE_KEY, stepToSave.toString());
      setLastSaved(new Date());
      
      console.log('💾 Auto-saved application data');
    } catch (error) {
      console.error('❌ Error saving data:', error);
      // Handle storage quota exceeded
      if (error.name === 'QuotaExceededError') {
        alert('Storage space is full. Please clear some browser data and try again.');
      }
    }
  }, [STORAGE_KEY, STEP_STORAGE_KEY, currentStep]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_STORAGE_KEY);
    setLastSaved(null);
    console.log('🗑️ Cleared saved application data');
  }, [STORAGE_KEY, STEP_STORAGE_KEY]);

  // ✅ FIXED: Status check with NO AUTO-REDIRECT
  const checkApplicationStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (statusCheckRef.current || hasCheckedStatus.current) {
      console.log('🚫 Skipping status check - already in progress or completed');
      return;
    }

    statusCheckRef.current = true;
    hasCheckedStatus.current = true;

    try {
      console.log('🔍 Checking application status... (ONE TIME ONLY)');
      
      const response = await api.get('/membership/survey/check-status');
      console.log('✅ Response data:', response.data);
      
      // ✅ CRITICAL FIX: DO NOT REDIRECT IF SURVEY NOT COMPLETED
      // Let the user stay on the survey page to complete it
      if (response.data.survey_completed) {
        console.log('✅ Survey already completed, redirecting to status page');
        clearSavedData();
        navigate('/application-status');
        return;
      }

      // ✅ If survey not completed, let user fill it out - DON'T REDIRECT
      console.log('📝 Survey not completed - allowing user to fill it out');
      
      // Only load saved data if survey not completed and we haven't loaded yet
      if (!initialLoadComplete.current) {
        loadSavedData();
        initialLoadComplete.current = true;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error checking application status:', error);
      // Don't block the user from continuing with their saved data
      if (!initialLoadComplete.current) {
        loadSavedData();
        initialLoadComplete.current = true;
      }
    } finally {
      statusCheckRef.current = false;
    }
  }, [clearSavedData, loadSavedData, navigate]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!user?.id || !initialLoadComplete.current) return; // Don't save if no user or not loaded

    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      saveToStorage(formData, currentStep);
      setTimeout(() => setIsAutoSaving(false), 500);
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, saveToStorage, user?.id]);

  // ✅ FIXED: Check authentication and application status ONCE
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Only check status once on mount
    if (!hasCheckedStatus.current) {
      console.log('🚀 Applicationsurvey mounted - checking status once');
      checkApplicationStatus();
    }
  }, [isAuthenticated, navigate, checkApplicationStatus]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      let newData = { ...prev };
      
      if (type === 'checkbox') {
        if (name === 'professionalSkills' || name === 'languagesSpoken') {
          // Handle array checkboxes
          newData[name] = checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value);
        } else {
          newData[name] = checked;
        }
      } else {
        newData[name] = value;
      }
      
      return newData;
    });
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
      const newStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(newStep);
      // Save immediately when moving to next step
      saveToStorage(formData, newStep);
    }
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    setError('');
    // Save immediately when moving to previous step
    saveToStorage(formData, newStep);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
    
  //   if (!validateStep(currentStep)) {
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     // Prepare answers array for backend
  //     const answers = Object.entries(formData)
  //       .filter(([key]) => !key.startsWith('_')) // Exclude internal keys like _savedAt
  //       .map(([key, value]) => ({
  //         question: key,
  //         answer: Array.isArray(value) ? value.join(', ') : value.toString()
  //       }));

  //     const response = await api.post('/membership/survey/submit-application', {
  //       answers,
  //       applicationTicket: `APP-${user.username?.substring(0,3).toUpperCase()}-${Date.now().toString(36)}`
  //     });

  //     const data = response.data;

  //     // Clear saved data after successful submission
  //     clearSavedData();
      
  //     setSubmitSuccess(true);
      
  //     // Redirect to success page after delay
  //     setTimeout(() => {
  //       navigate('/pending-verification', {
  //         state: {
  //           applicationTicket: data.applicationTicket,
  //           username: user.username
  //         }
  //       });
  //     }, 3000);

  //   } catch (error) {
  //     console.error('Error submitting application:', error);
      
  //     if (error.response) {
  //       setError(error.response.data?.error || error.response.data?.message || 'Failed to submit application');
  //     } else if (error.request) {
  //       setError('Network error. Please check your connection and try again.');
  //     } else {
  //       setError('An unexpected error occurred. Please try again.');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Manual save function
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateStep(currentStep)) {
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Prepare answers array for backend
    const answers = Object.entries(formData)
      .filter(([key]) => !key.startsWith('_')) // Exclude internal keys like _savedAt
      .map(([key, value]) => ({
        question: key,
        answer: Array.isArray(value) ? value.join(', ') : value.toString()
      }));

    const response = await api.post('/membership/survey/submit-application', {
      answers,
      applicationTicket: `APP-${user.username?.substring(0,3).toUpperCase()}-${Date.now().toString(36)}`,
      username: user.username, // ADD THIS LINE
      userId: user.id || user.user_id // ADD THIS LINE TOO
    });

    const data = response.data;

    // Clear saved data after successful submission
    clearSavedData();
    
    setSubmitSuccess(true);
    
    // Redirect to success page after delay
    setTimeout(() => {
      navigate('/pending-verification', {
        state: {
          applicationTicket: data.applicationTicket,
          username: user.username
        }
      });
    }, 3000);

  } catch (error) {
    console.error('Error submitting application:', error);
    
    if (error.response) {
      setError(error.response.data?.error || error.response.data?.message || 'Failed to submit application');
    } else if (error.request) {
      setError('Network error. Please check your connection and try again.');
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
  
  
  const handleManualSave = () => {
    setIsAutoSaving(true);
    saveToStorage(formData, currentStep);
    setTimeout(() => setIsAutoSaving(false), 1000);
  };

  // Clear data confirmation
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
      clearSavedData();
      setFormData(initialFormData);
      setCurrentStep(1);
    }
  };

  // Auto-save indicator component
  const AutoSaveIndicator = () => {
    if (isAutoSaving) {
      return (
        <div className="auto-save-indicator saving">
          <span className="save-spinner">⟳</span>
          Saving...
        </div>
      );
    }
    
    if (lastSaved) {
      const timeDiff = Date.now() - lastSaved.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const seconds = Math.floor((timeDiff % 60000) / 1000);
      
      let timeText;
      if (minutes > 0) {
        timeText = `${minutes}m ago`;
      } else if (seconds > 5) {
        timeText = `${seconds}s ago`;
      } else {
        timeText = 'just now';
      }
      
      return (
        <div className="auto-save-indicator saved">
          <span className="save-icon">✓</span>
          Saved {timeText}
        </div>
      );
    }
    
    return null;
  };


 const renderStep1 = () => (
    <div className="survey-step">
      <h3>📋 Personal Information</h3>
      
      <div className="form-group">
        <label htmlFor="fullName">{dynamicLabels.fullName} *</label>
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
          <label htmlFor="dateOfBirth">{dynamicLabels.dateOfBirth} *</label>
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
          <label htmlFor="nationality">{dynamicLabels.nationality} *</label>
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
        <label htmlFor="currentLocation">{dynamicLabels.currentLocation} *</label>
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
        <label htmlFor="phoneNumber">{dynamicLabels.phoneNumber}</label>
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
        <label htmlFor="highestEducation">{dynamicLabels.highestEducation} *</label>
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
          <label htmlFor="fieldOfStudy">{dynamicLabels.fieldOfStudy} *</label>
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
          <label htmlFor="graduationYear">{dynamicLabels.graduationYear}</label>
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
        <label htmlFor="currentInstitution">{dynamicLabels.currentInstitution}</label>
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
        <label htmlFor="currentOccupation">{dynamicLabels.currentOccupation} *</label>
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
        <label htmlFor="workExperience">{dynamicLabels.workExperience}</label>
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
        <label htmlFor="reasonForJoining">{dynamicLabels.reasonForJoining} *</label>
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
        <label htmlFor="educationalGoals">{dynamicLabels.educationalGoals} *</label>
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
        <label htmlFor="expectedContributions">{dynamicLabels.expectedContributions}</label>
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
        <label htmlFor="howDidYouHear">{dynamicLabels.howDidYouHear}</label>
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
        <label>{dynamicLabels.languagesSpoken}</label>
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
            {dynamicLabels.agreeToTerms} * <a href="/terms" target="_blank">(View Terms)</a>
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
            {dynamicLabels.agreeToCodeOfConduct} * <a href="/code-of-conduct" target="_blank">(View Code)</a>
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
            {dynamicLabels.agreeToDataProcessing} * <a href="/privacy" target="_blank">(View Policy)</a>
          </label>
        </div>
      </div>
    </div>
  );

  // ✅ Show loading state while labels are being fetched
  if (labelsLoading) {
    return (
      <div className="survey-container">
        <div className="survey-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p>Loading survey form...</p>
          </div>
        </div>
      </div>
    );
  }


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
          <div className="header-top">
            <h1>🎯 Membership Application Survey</h1>
            <div className="header-actions">
              <AutoSaveIndicator />
              <button 
                type="button" 
                onClick={handleManualSave}
                className="btn-save-manual"
                disabled={isAutoSaving}
                title="Save progress manually"
              >
                💾
              </button>
              <button 
                type="button" 
                onClick={handleClearData}
                className="btn-clear-data"
                title="Clear all saved data"
              >
                🗑️
              </button>
            </div>
          </div>
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
          {lastSaved && (
            <p className="auto-save-info">
              💾 Your progress is automatically saved as you type
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationSurvey;
