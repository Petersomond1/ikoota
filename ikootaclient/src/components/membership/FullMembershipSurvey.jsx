// ikootaclient/src/components/membership/FullMembershipSurvey.jsx - WITH AUTOSAVE
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../auth/UserStatus';
import api from "../service/api";
import './fullMembershipSurvey.css';

const FullMembershipSurvey = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [answers, setAnswers] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'

  // ✅ AUTOSAVE: Storage keys
  const STORAGE_KEY = `full_membership_survey_${user?.id || 'guest'}`;
  const PROGRESS_KEY = `${STORAGE_KEY}_progress`;

  // Full Membership Survey Questions
  const questions = [
    {
      id: 1,
      question: "Describe your current role in education and your professional experience in teaching, learning, or educational administration.",
      placeholder: "Include your current position, years of experience, institutions you've worked with, and any educational leadership roles...",
      required: true
    },
    {
      id: 2, 
      question: "What specific educational expertise or specialization do you bring to our community? What subjects or areas are you most passionate about?",
      placeholder: "Detail your areas of expertise, specialized knowledge, subjects you teach or research, and what makes you unique...",
      required: true
    },
    {
      id: 3,
      question: "How do you envision contributing to the Ikoota community? What kind of content, discussions, or collaborations would you like to initiate or participate in?",
      placeholder: "Describe specific ways you plan to contribute, types of content you'd create, discussions you'd lead, or projects you'd collaborate on...",
      required: true
    },
    {
      id: 4,
      question: "Describe a challenging educational situation you've encountered and how you addressed it. What did you learn from this experience?",
      placeholder: "Share a specific example that demonstrates your problem-solving skills, adaptability, and learning mindset in educational contexts...",
      required: true
    },
    {
      id: 5,
      question: "What is your philosophy on collaborative learning and knowledge sharing? How do you approach working with diverse groups of educators and learners?",
      placeholder: "Explain your beliefs about collaboration, how you handle different perspectives, and your approach to inclusive education...",
      required: true
    },
    {
      id: 6,
      question: "What are your professional development goals, and how do you see Ikoota helping you achieve them? What do you hope to learn from other community members?",
      placeholder: "Outline your growth objectives, areas where you want to improve, and how you plan to leverage the community for development...",
      required: true
    },
    {
      id: 7,
      question: "How would you handle disagreements or conflicts within educational discussions? Describe your approach to maintaining professionalism in challenging conversations.",
      placeholder: "Explain your conflict resolution strategies, how you maintain respect during disagreements, and your commitment to professional discourse...",
      required: true
    },
    {
      id: 8,
      question: "Is there anything else you'd like to share about yourself, your educational journey, or your commitment to being an active and valuable member of our community?",
      placeholder: "Add any additional information that would help us understand your passion for education and community involvement...",
      required: false
    }
  ];

  // ✅ AUTOSAVE: Load saved data on component mount
  useEffect(() => {
    if (user?.id) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.answers && Array.isArray(parsedData.answers)) {
            setAnswers(parsedData.answers);
            setLastSaved(new Date(parsedData.timestamp));
            console.log('✅ Loaded saved application data:', parsedData);
          }
        } catch (error) {
          console.error('❌ Error loading saved data:', error);
        }
      }
      
      if (savedProgress) {
        try {
          const step = parseInt(savedProgress);
          if (step >= 0 && step < questions.length) {
            setCurrentStep(step);
          }
        } catch (error) {
          console.error('❌ Error loading saved progress:', error);
        }
      }
    }
  }, [user?.id]);

  // ✅ AUTOSAVE: Save data to localStorage
  const saveToLocalStorage = useCallback((answersToSave, stepToSave) => {
    if (!user?.id) return;
    
    try {
      const dataToSave = {
        answers: answersToSave,
        timestamp: new Date().toISOString(),
        currentStep: stepToSave,
        userId: user.id,
        username: user.username
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(PROGRESS_KEY, stepToSave.toString());
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      
      console.log('💾 Auto-saved application data');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
      setAutoSaveStatus('error');
    }
  }, [user?.id, STORAGE_KEY, PROGRESS_KEY]);

  // ✅ AUTOSAVE: Auto-save when answers change
  useEffect(() => {
    if (answers.some(answer => answer.trim().length > 0)) {
      setAutoSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(answers, currentStep);
      }, 2000); // Save 2 seconds after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [answers, currentStep, saveToLocalStorage]);

  // ✅ MANUAL SAVE: Function for manual save button
  const handleManualSave = () => {
    setAutoSaveStatus('saving');
    saveToLocalStorage(answers, currentStep);
  };

  // ✅ CLEAR SAVED DATA: Function to clear localStorage
  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    setLastSaved(null);
    console.log('🗑️ Cleared saved application data');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Please sign in first to access the full membership survey.');
      navigate('/login');
      return;
    }

    // Check if user has already submitted
    checkSubmissionStatus();
  }, [isAuthenticated, navigate]);

  // const checkSubmissionStatus = async () => {
  //   try {
  //     // ✅ FIXED: Use the correct endpoint with userId
  //     const response = await api.get(`/membership/full-membership-status/${user.id}`);
  //     if (response.data.hasSubmitted || response.data.status === 'pending' || response.data.status === 'approved') {
  //       setHasSubmitted(true);
  //       // Clear saved data if already submitted
  //       clearSavedData();
  //       alert('You have already submitted a full membership application.');
  //       navigate('/full-membership-info');
  //     }
  //   } catch (error) {
  //     console.error('Error checking submission status:', error);
  //     // Continue to show the form if there's an error checking status
  //   }
  // };


const checkSubmissionStatus = async () => {
  try {
    // ✅ FIXED: Properly extract userId and handle undefined case
    const userId = user?.user_id || user?.id;
    
    if (!userId) {
      console.log('No user ID available');
      return;
    }

    console.log('🔍 Checking submission status for user:', userId);
    
    const response = await api.get(`/membership/full-membership/status/${user.id}`);
    
    console.log('✅ Submission status response:', response.data);
    
    if (response.data.hasApplication || 
        response.data.status === 'pending' || 
        response.data.status === 'approved') {
      setHasSubmitted(true);
      // Clear saved data if already submitted
      clearSavedData();
      alert('You have already submitted a full membership application.');
      navigate('/full-membership-info');
    }
  } catch (error) {
    console.log('Error checking submission status:', error);
    
    // If it's a 404 or 403, that means no application exists, so continue
    if (error.response?.status === 404 || error.response?.status === 403) {
      console.log('No existing application found, proceeding with form');
      return;
    }
    
    // For other errors, continue to show the form
    console.log('API error, but continuing to show form');
  }
};

  const generateMembershipTicket = () => {
    const username = user?.username || 'USER';
    const email = user?.email || 'user@example.com';
    const usernamePrefix = username.substring(0, 3).toUpperCase();
    const emailPrefix = email.split('@')[0].substring(0, 3).toUpperCase();
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
    
    return `FM${usernamePrefix}${emailPrefix}${dateStr}${timeStr}`; // FM = Full Membership
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required answers
    const requiredAnswers = questions.filter(q => q.required).map((q, index) => answers[index]);
    if (requiredAnswers.some(answer => !answer.trim())) {
      alert('Please answer all required questions before submitting.');
      return;
    }

    setLoading(true);
    
    try {
      const membershipTicket = generateMembershipTicket();
      
      const response = await api.post('/membership/full-membership/submit-full-membership', {
        answers: answers,
        membershipTicket: membershipTicket,
        userId: user.id,
        userEmail: user.email,
        username: user.username,
        applicationType: 'full_membership'
      });

      if (response.status === 200 || response.status === 201) {
        // ✅ SUCCESS: Clear saved data after successful submission
        clearSavedData();
        
        alert(`Full Membership application submitted successfully!\n\nYour Membership Ticket: ${membershipTicket}\n\nPlease save this number for your records.`);
        
        navigate('/full-membership-submitted', { 
          state: { 
            membershipTicket: membershipTicket,
            username: user.username 
          }
        });
      }
    } catch (error) {
      console.error('Error submitting full membership survey:', error);
      alert(`Failed to submit application: ${error.response?.data?.message || 'Please try again. Your progress has been saved.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = value;
    setAnswers(updatedAnswers);
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveToLocalStorage(answers, newStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      saveToLocalStorage(answers, newStep);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    saveToLocalStorage(answers, step);
  };

  const getCompletionPercentage = () => {
    const answeredCount = answers.filter(answer => answer.trim()).length;
    return Math.round((answeredCount / questions.length) * 100);
  };

  const getAutoSaveStatusDisplay = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return { text: '💾 Saving...', color: '#f59e0b' };
      case 'saved':
        return lastSaved ? { 
          text: `✅ Saved ${lastSaved.toLocaleTimeString()}`, 
          color: '#10b981' 
        } : { text: '✅ Saved', color: '#10b981' };
      case 'error':
        return { text: '⚠️ Save failed', color: '#ef4444' };
      default:
        return { text: '', color: '#6b7280' };
    }
  };

  if (hasSubmitted) {
    return (
      <div className="survey-container">
        <div className="submitted-message">
          <h2>Application Already Submitted</h2>
          <p>You have already submitted your full membership application.</p>
          <button onClick={() => navigate('/full-membership-info')} className="btn-primary">
            View Application Status
          </button>
        </div>
      </div>
    );
  }

  const autoSaveDisplay = getAutoSaveStatusDisplay();

  return (
    <div className="full-membership-survey-container">
      <div className="survey-card">
        <div className="survey-header">
          <h1>🎓 Full Membership Application Survey</h1>
          <p>Complete this comprehensive survey to apply for full membership</p>
          
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
            <div className="progress-info">
              <span>{getCompletionPercentage()}% Complete</span>
              <span>{answers.filter(a => a.trim()).length} of {questions.length} answered</span>
            </div>
          </div>

          {/* ✅ AUTOSAVE STATUS DISPLAY */}
          <div className="autosave-status" style={{ 
            marginTop: '10px', 
            fontSize: '0.9rem',
            color: autoSaveDisplay.color 
          }}>
            {autoSaveDisplay.text}
          </div>
        </div>

        <div className="applicant-info">
          <p><strong>Applicant:</strong> {user?.username} ({user?.email})</p>
          <p><strong>Current Status:</strong> Pre-Member</p>
          <p><strong>Application Type:</strong> Full Membership</p>
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
          {/* ✅ SAVE CONTROLS */}
          <div className="save-controls" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Your progress is automatically saved as you type
            </div>
            <button 
              type="button"
              onClick={handleManualSave}
              className="btn-save"
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              💾 Save Now
            </button>
          </div>

          <div className="question-navigation">
            <div className="question-tabs">
              {questions.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`question-tab ${currentStep === index ? 'active' : ''} ${answers[index].trim() ? 'completed' : ''}`}
                  onClick={() => goToStep(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="current-question">
            <div className="question-header">
              <span className="question-number">Question {currentStep + 1} of {questions.length}</span>
              {questions[currentStep].required && <span className="required-indicator">* Required</span>}
            </div>
            
            <label className="question-label">
              {questions[currentStep].question}
            </label>
            
            <textarea
              value={answers[currentStep]}
              onChange={(e) => handleInputChange(currentStep, e.target.value)}
              placeholder={questions[currentStep].placeholder}
              className="answer-input"
              rows="6"
              required={questions[currentStep].required}
            />
            
            <div className="character-count">
              {answers[currentStep].length} characters
              {answers[currentStep].length < 50 && questions[currentStep].required && (
                <span className="min-length-warning"> (Minimum 50 characters recommended)</span>
              )}
            </div>
          </div>

          <div className="navigation-buttons">
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={currentStep === 0}
              className="btn-nav prev"
            >
              ← Previous
            </button>
            
            {currentStep < questions.length - 1 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="btn-nav next"
              >
                Next →
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading || answers.filter((a, i) => questions[i].required).some(a => !a.trim())}
                className="btn-submit"
              >
                {loading ? 'Submitting Application...' : 'Submit Full Membership Application'}
              </button>
            )}
          </div>

          <div className="survey-overview">
            <h4>📋 Questions Overview</h4>
            <div className="questions-list">
              {questions.map((q, index) => (
                <div 
                  key={q.id} 
                  className={`question-overview-item ${answers[index].trim() ? 'answered' : ''} ${currentStep === index ? 'current' : ''}`}
                  onClick={() => goToStep(index)}
                >
                  <span className="question-num">Q{index + 1}</span>
                  <span className="question-brief">{q.question.substring(0, 60)}...</span>
                  <span className="question-status">
                    {answers[index].trim() ? '✓' : (q.required ? '*' : '○')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="application-info">
            <h4>ℹ️ Application Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <strong>Review Timeline:</strong> 5-7 business days
              </div>
              <div className="info-item">
                <strong>Decision Notification:</strong> Via email
              </div>
              <div className="info-item">
                <strong>Application Tracking:</strong> Unique ticket number provided
              </div>
              <div className="info-item">
                <strong>Support Contact:</strong> support@ikoota.com
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/full-membership-info')}
              className="btn-cancel"
            >
              ← Back to Information
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/towncrier')}
              className="btn-cancel"
            >
              Cancel & Return to Towncrier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FullMembershipSurvey;