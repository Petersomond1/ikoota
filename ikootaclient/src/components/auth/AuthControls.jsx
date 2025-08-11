//ikootaclient/src/components/auth/AuthControls.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import api from "../service/api";
import "./authControls.css";

const AuthControls = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

  // ✅ Detect if we're in admin context
  const isInAdminContext = location.pathname.includes('/admin');

  // ✅ Add context class to body for CSS targeting
  useEffect(() => {
    const bodyClass = 'auth-controls-in-admin';
    
    if (isInAdminContext) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [isInAdminContext]);

  // ✅ Fetch question labels
  const { data: questionLabels, refetch: fetchQuestionLabels, isLoading: labelsLoading } = useQuery({
    queryKey: ["fetchQuestionLabels"],
    queryFn: async () => {
      console.log('🔍 Fetching question labels...');
      try {
        const res = await api.get("/admin/survey/question-labels");
        console.log("✅ Question labels response:", res.data);
        
        // Handle different response formats from API
        if (res.data?.success && res.data?.data) {
          return res.data.data; // New format: {success: true, data: {...}}
        } else if (res.data?.labels) {
          return res.data.labels; // Backup format with labels field
        } else if (Array.isArray(res.data)) {
          // Convert array to object format if needed
          const labelsObj = {};
          res.data.forEach((item, index) => {
            if (typeof item === 'object' && item.label) {
              labelsObj[item.id || `field_${index}`] = item.label;
            }
          });
          return labelsObj;
        } else if (typeof res.data === 'object') {
          return res.data; // Direct object format
        } else {
          console.warn('⚠️ Unexpected labels format:', res.data);
          return {}; // Fallback to empty object
        }
      } catch (error) {
        console.error('❌ Error fetching question labels:', error);
        return {};
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // ✅ Fetch survey logs with enhanced error handling
  const { 
    data: surveys, 
    refetch: fetchSurveyLogs, 
    isLoading: surveysLoading,
    error: surveysError 
  } = useQuery({
    queryKey: ["fetchSurveyLogs"],
    queryFn: async () => {
      console.log('🔍 Fetching survey logs...');
      try {
        const res = await api.get("/admin/survey/logs");
        console.log("✅ Survey logs response:", res.data);
        
        // Handle different response formats
        if (res.data?.success && res.data?.data) {
          return Array.isArray(res.data.data) ? res.data.data : [];
        } else if (Array.isArray(res.data)) {
          return res.data; // Direct array format
        } else if (res.data?.logs) {
          return Array.isArray(res.data.logs) ? res.data.logs : [];
        } else {
          console.warn('⚠️ Unexpected survey logs format:', res.data);
          return [];
        }
      } catch (error) {
        console.error('❌ Survey logs fetch error:', error);
        if (error.response?.status === 403) {
          throw new Error('Admin privileges required to view survey logs');
        }
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Survey logs query error:', error);
    }
  });

  // ✅ Update question labels mutation
  const { mutate: updateLabels, isLoading: updatingLabels } = useMutation({
    mutationFn: (labels) => {
      console.log('🔍 Updating question labels:', labels);
      
      if (!labels || Object.keys(labels).length === 0) {
        throw new Error('Please provide at least one question label before saving');
      }
      
      return api.put("/admin/survey/question-labels", { labels });
    },
    onSuccess: () => {
      console.log('✅ Question labels updated successfully');
      fetchQuestionLabels();
      alert('Survey question labels updated successfully!');
    },
    onError: (error) => {
      console.error('❌ Error updating question labels:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update question labels';
      alert('Failed to update question labels: ' + errorMessage);
    }
  });

  // ✅ Update approval status mutation
  const { mutate: updateApprovalStatus, isLoading: updatingApproval } = useMutation({
    mutationFn: ({ surveyId, userId, status }) => {
      console.log('🔍 Updating approval status:', { surveyId, userId, status });
      return api.put("/admin/survey/approve", { surveyId, userId, status });
    },
    onSuccess: (data, variables) => {
      console.log('✅ Approval status updated:', variables);
      fetchSurveyLogs();
      alert(`Application ${variables.status} successfully!`);
    },
    onError: (error) => {
      console.error('❌ Error updating approval status:', error);
      alert('Failed to update approval status: ' + error.message);
    }
  });

  // ✅ Update user role mutation
  const { mutate: updateUserRole, isLoading: updatingRole } = useMutation({
    mutationFn: ({ userId, role }) => {
      console.log('🔍 Updating user role:', { userId, role });
      return api.put("/admin/users/role", { userId, role });
    },
    onSuccess: () => {
      console.log('✅ User role updated successfully');
      alert("User role updated successfully.");
      setUserRoleUpdates({ userId: "", role: "" });
    },
    onError: (error) => {
      console.error('❌ Error updating user role:', error);
      alert('Failed to update user role: ' + error.message);
    }
  });

  // ✅ Convert question labels to editable format
  useEffect(() => {
    if (questionLabels) {
      console.log('🔍 Setting question labels:', questionLabels);
      // Convert labels object to editable array format for the UI
      if (typeof questionLabels === 'object') {
        const labelsArray = Object.entries(questionLabels).map(([field, label]) => ({
          field,
          label: typeof label === 'string' ? label : String(label)
        }));
        setSurveyQuestions(labelsArray.length > 0 ? labelsArray : [{ field: '', label: '' }]);
      } else {
        setSurveyQuestions([{ field: '', label: '' }]);
      }
    } else {
      // If no labels loaded, start with one empty entry
      setSurveyQuestions([{ field: '', label: '' }]);
    }
  }, [questionLabels]);

  // ✅ Handle question label changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...surveyQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setSurveyQuestions(updatedQuestions);
  };

  // ✅ Add new question label
  const addQuestionLabel = () => {
    setSurveyQuestions([...surveyQuestions, { field: '', label: '' }]);
  };

  // ✅ Remove question label
  const removeQuestionLabel = (index) => {
    if (surveyQuestions.length > 1) {
      const newQuestions = surveyQuestions.filter((_, i) => i !== index);
      setSurveyQuestions(newQuestions);
    }
  };

  // ✅ Load current form labels from your actual form
  const loadCurrentFormLabels = () => {
    const currentFormLabels = [
      { field: 'fullName', label: 'Full Name' },
      { field: 'dateOfBirth', label: 'Date of Birth' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'currentLocation', label: 'Current Location' },
      { field: 'phoneNumber', label: 'Phone Number' },
      { field: 'highestEducation', label: 'Highest Level of Education' },
      { field: 'fieldOfStudy', label: 'Field of Study' },
      { field: 'currentInstitution', label: 'Current/Most Recent Institution' },
      { field: 'graduationYear', label: 'Graduation Year' },
      { field: 'currentOccupation', label: 'Current Occupation' },
      { field: 'workExperience', label: 'Years of Work Experience' },
      { field: 'reasonForJoining', label: 'Why do you want to join Ikoota?' },
      { field: 'educationalGoals', label: 'What are your educational goals?' },
      { field: 'expectedContributions', label: 'How do you plan to contribute to the community?' },
      { field: 'howDidYouHear', label: 'How did you hear about Ikoota?' },
      { field: 'languagesSpoken', label: 'Languages Spoken' },
      { field: 'agreeToTerms', label: 'I agree to the Terms and Conditions' },
      { field: 'agreeToCodeOfConduct', label: 'I agree to follow the Community Code of Conduct' },
      { field: 'agreeToDataProcessing', label: 'I consent to processing of my personal data' }
    ];
    setSurveyQuestions(currentFormLabels);
  };

  // ✅ Save question labels
  const saveQuestionLabels = () => {
    // Convert array format back to object format for API
    const labelsObject = {};
    surveyQuestions.forEach(item => {
      if (item.field && item.field.trim() && item.label && item.label.trim()) {
        labelsObject[item.field.trim()] = item.label.trim();
      }
    });
    
    updateLabels(labelsObject);
  };

  // ✅ Handle approval/decline actions
  const handleApproveOrDecline = (surveyId, userId, status) => {
    console.log('🔍 Handling approval/decline:', { surveyId, userId, status });
    updateApprovalStatus({ surveyId, userId, status });
  };

  // ✅ Send feedback email
  const handleSendFeedback = (email, status) => {
    console.log('🔍 Sending feedback:', { email, status });
    const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
    api.post("/communication/email/send", { email, template: feedbackTemplate, status })
      .then(() => {
        console.log('✅ Feedback sent successfully');
        alert('Feedback email sent successfully!');
      })
      .catch((error) => {
        console.error('❌ Error sending feedback:', error);
        alert('Failed to send feedback email: ' + error.message);
      });
  };

  // ✅ FIXED: Enhanced survey answers rendering with proper error handling
  const renderSurveyAnswers = (answers) => {
    try {
      console.log('🔍 Raw answers data:', answers, typeof answers);
      
      if (!answers) {
        return (
          <div className="no-answers">
            <em>No answers provided</em>
          </div>
        );
      }

      let parsedAnswers;

      // Handle string JSON data
      if (typeof answers === 'string') {
        try {
          parsedAnswers = JSON.parse(answers);
        } catch (parseError) {
          console.warn('⚠️ Error parsing JSON string:', parseError);
          return (
            <div className="invalid-answers">
              <strong>Raw Answer Data:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                {String(answers)}
              </pre>
            </div>
          );
        }
      } else {
        parsedAnswers = answers;
      }

      console.log('🔍 Parsed answers:', parsedAnswers);

      // Handle array of question-answer objects (new format)
      if (Array.isArray(parsedAnswers)) {
        // Check if it's array of objects with question/answer structure
        if (parsedAnswers.length > 0 && typeof parsedAnswers[0] === 'object' && parsedAnswers[0].question) {
          return (
            <div className="survey-answers-detailed">
              {parsedAnswers.map((item, index) => (
                <div key={index} className="answer-item">
                  <div className="question-label">
                    <strong>{formatQuestionLabel(String(item.question))}:</strong>
                  </div>
                  <div className="answer-value">
                    {formatAnswerValue(item.answer)}
                  </div>
                </div>
              ))}
            </div>
          );
        } 
        // Handle simple array format (old format)
        else {
          return (
            <div className="survey-answers-simple">
              <div className="answer-list">
                {parsedAnswers.map((answer, index) => (
                  <div key={index} className="simple-answer">
                    <strong>Answer {index + 1}:</strong> {String(answer || 'No response')}
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }

      // Handle object format (alternative format)
      if (typeof parsedAnswers === 'object' && parsedAnswers !== null) {
        return (
          <div className="survey-answers-object">
            {Object.entries(parsedAnswers).map(([key, value], index) => (
              <div key={index} className="answer-item">
                <div className="question-label">
                  <strong>{formatQuestionLabel(String(key))}:</strong>
                </div>
                <div className="answer-value">
                  {formatAnswerValue(value)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // Fallback for any other format
      return (
        <div className="fallback-answers">
          <strong>Survey Response:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
            {JSON.stringify(parsedAnswers, null, 2)}
          </pre>
        </div>
      );

    } catch (error) {
      console.error('❌ Critical error in renderSurveyAnswers:', error);
      return (
        <div className="error-answers">
          <em style={{ color: 'red' }}>Error displaying answers: {error.message}</em>
          <details style={{ marginTop: '10px' }}>
            <summary>Raw Data (for debugging)</summary>
            <pre style={{ fontSize: '0.8em', background: '#f5f5f5', padding: '10px' }}>
              {JSON.stringify(answers, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
  };

  // ✅ Helper function to format question labels
  const formatQuestionLabel = (questionKey) => {
    if (!questionKey || typeof questionKey !== 'string') {
      return 'Unknown Question';
    }

    const labelMap = {
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      nationality: 'Nationality',
      currentLocation: 'Current Location',
      phoneNumber: 'Phone Number',
      highestEducation: 'Highest Education',
      fieldOfStudy: 'Field of Study',
      currentInstitution: 'Current Institution',
      graduationYear: 'Graduation Year',
      currentOccupation: 'Current Occupation',
      workExperience: 'Work Experience',
      professionalSkills: 'Professional Skills',
      careerGoals: 'Career Goals',
      howDidYouHear: 'How Did You Hear About Us',
      reasonForJoining: 'Reason for Joining',
      expectedContributions: 'Expected Contributions',
      educationalGoals: 'Educational Goals',
      previousMemberships: 'Previous Memberships',
      specialSkills: 'Special Skills',
      languagesSpoken: 'Languages Spoken',
      availabilityForEvents: 'Availability for Events',
      agreeToTerms: 'Agree to Terms',
      agreeToCodeOfConduct: 'Agree to Code of Conduct',
      agreeToDataProcessing: 'Agree to Data Processing'
    };

    return labelMap[questionKey] || questionKey.charAt(0).toUpperCase() + questionKey.slice(1);
  };

  // ✅ FIXED: Helper function to format answer values - prevent object rendering
  const formatAnswerValue = (answer) => {
    if (answer === null || answer === undefined) {
      return <em style={{ color: '#888' }}>Not provided</em>;
    }

    if (answer === true || answer === 'true') {
      return <span style={{ color: 'green' }}>✅ Yes</span>;
    }
    if (answer === false || answer === 'false') {
      return <span style={{ color: 'red' }}>❌ No</span>;
    }
    if (answer === '' || (typeof answer === 'string' && answer.trim() === '')) {
      return <em style={{ color: '#888' }}>Not provided</em>;
    }

    // CRITICAL FIX: Handle objects and arrays properly
    if (typeof answer === 'object') {
      if (Array.isArray(answer)) {
        return <span>{answer.join(', ')}</span>;
      } else {
        // Don't render objects directly - convert to string
        return <span>{JSON.stringify(answer)}</span>;
      }
    }

    // Convert everything else to string safely
    return <span>{String(answer)}</span>;
  };

  return (
    <div className="auth_controls_body">
      {/* ✅ Context-aware header */}
      <div className="admin_controls_header">
        Auth Controls
        {isInAdminContext && (
          <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
            (Admin Panel)
          </small>
        )}
      </div>

      {/* Section: Edit Survey Question Labels */}
      <div className="section">
        <h3>Edit Survey Question Labels</h3>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Update the labels/text that appear in your survey form. These changes will be reflected in the 
          Applicationsurvey.jsx form that users fill out.
        </p>
        
        {labelsLoading && <p>Loading question labels...</p>}
        
        {/* ✅ Question label management interface */}
        <div className="question-labels-container">
          {Array.isArray(surveyQuestions) && surveyQuestions.map((item, index) => (
            <div key={index} className="question-label-item" style={{ 
              marginBottom: '15px', 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '60px', fontWeight: 'bold', color: '#666' }}>
                    #{index + 1}
                  </span>
                  <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                    <div style={{ flex: '0 0 200px' }}>
                      <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={item.field || ''}
                        onChange={(e) => handleQuestionChange(index, 'field', e.target.value)}
                        disabled={updatingLabels}
                        placeholder="e.g., fullName"
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                        Label Text (What users see)
                      </label>
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => handleQuestionChange(index, 'label', e.target.value)}
                        disabled={updatingLabels}
                        placeholder="e.g., Full Name"
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                  {surveyQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestionLabel(index)}
                      disabled={updatingLabels}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Remove this question label"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* ✅ Action buttons */}
        <div className="question-labels-actions" style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={addQuestionLabel}
            disabled={updatingLabels}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ Add Label
          </button>
          
          <button
            type="button"
            onClick={loadCurrentFormLabels}
            disabled={updatingLabels}
            style={{
              padding: '10px 15px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 Load Current Form Labels
          </button>
          
          <button 
            onClick={saveQuestionLabels}
            disabled={updatingLabels || !Array.isArray(surveyQuestions)}
            style={{
              padding: '10px 20px',
              backgroundColor: updatingLabels ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: updatingLabels ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {updatingLabels ? '⏳ Saving...' : '💾 Save Labels'}
          </button>
        </div>
        
        {/* ✅ Helpful info */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f4f8', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#0c5460'
        }}>
          <strong>📌 How This Works:</strong>
          <ul style={{ marginLeft: '20px', marginBottom: '0', marginTop: '8px' }}>
            <li><strong>Field Name:</strong> Must match the field names in your Applicationsurvey.jsx component</li>
            <li><strong>Label Text:</strong> This is what users will see as the question/label text</li>
            <li><strong>Dynamic Updates:</strong> Changes here will update the actual survey form users fill out</li>
            <li><strong>Load Current:</strong> Use "Load Current Form Labels" to see your existing form fields</li>
          </ul>
        </div>
        
        {/* ✅ Preview section */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Preview of Current Labels:</h4>
          <div style={{ fontSize: '13px', color: '#6c757d' }}>
            {surveyQuestions.filter(item => item.field && item.label).length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {surveyQuestions
                  .filter(item => item.field && item.label)
                  .map((item, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                      <strong>{item.field}:</strong> "{item.label}"
                    </div>
                  ))
                }
              </div>
            ) : (
              <em>No valid labels configured yet. Use "Load Current Form Labels" to get started.</em>
            )}
          </div>
        </div>
      </div>

      {/* Section: Fetch and Vet Survey Forms */}
      <div className="section">
        <h3>Vetting Survey Forms</h3>
        
        {/* ✅ Survey logs loading and error states */}
        {surveysLoading && (
          <div className="loading-state">
            <p>Loading survey submissions...</p>
          </div>
        )}
        
        {surveysError && (
          <div className="error-state" style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px', marginBottom: '10px' }}>
            <strong>Error loading surveys:</strong> {surveysError.message}
            <button 
              onClick={() => fetchSurveyLogs()} 
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ✅ Display survey submissions */}
        {surveys && Array.isArray(surveys) && surveys.length > 0 ? (
          <div className="surveys-list">
            {surveys.map((survey, index) => (
              <div key={survey.id || index} className="survey-item" style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: survey.approval_status === 'approved' ? '#f0f8f0' : 
                               survey.approval_status === 'declined' ? '#fff0f0' : '#fff'
              }}>
                {/* ✅ Survey header with user info */}
                <div className="survey-header" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div className="user-info">
                    <h4 style={{ margin: '0 0 5px 0' }}>
                      Survey #{survey.id} - {survey.username || 'Unknown User'}
                    </h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                      Email: {survey.user_email || 'No email'}
                    </p>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                      Submitted: {survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                    {survey.application_ticket && (
                      <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                        Ticket: {survey.application_ticket}
                      </p>
                    )}
                  </div>
                  
                  <div className="status-badge">
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '0.8em',
                      fontWeight: 'bold',
                      backgroundColor: survey.approval_status === 'approved' ? '#d4edda' : 
                                     survey.approval_status === 'declined' ? '#f8d7da' : 
                                     survey.approval_status === 'granted' ? '#d4edda' : '#fff3cd',
                      color: survey.approval_status === 'approved' ? '#155724' : 
                             survey.approval_status === 'declined' ? '#721c24' : 
                             survey.approval_status === 'granted' ? '#155724' : '#856404'
                    }}>
                      {survey.approval_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* ✅ Basic Info Grid */}
                <div className="survey-info" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '20px'
                }}>
                  <div><strong>User ID:</strong> {survey.user_id}</div>
                  <div><strong>Email:</strong> {survey.user_email || 'N/A'}</div>
                  <div><strong>Application Type:</strong> {survey.application_type || 'initial_application'}</div>
                  <div><strong>Membership Stage:</strong> {survey.membership_stage || 'N/A'}</div>
                </div>

                {/* ✅ Survey answers display */}
                <div className="survey-answers-section" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '15px'
                }}>
                  <h5 style={{ marginTop: '0', marginBottom: '15px', color: '#495057' }}>
                    📝 Survey Responses:
                  </h5>
                  {renderSurveyAnswers(survey.answers)}
                </div>

                {/* Admin Notes */}
                {survey.admin_notes && (
                  <div style={{ 
                    backgroundColor: '#e8f4fd', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '15px'
                  }}>
                    <strong>Admin Notes:</strong> {survey.admin_notes}
                  </div>
                )}

                {/* ✅ Action buttons */}
                <div className="survey-actions" style={{ 
                  marginTop: '15px', 
                  paddingTop: '15px', 
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleApproveOrDecline(survey.id, survey.user_id, 'approved')}
                    disabled={updatingApproval || survey.approval_status === 'approved' || survey.approval_status === 'granted'}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: (survey.approval_status === 'approved' || survey.approval_status === 'granted') ? '#95a5a6' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (survey.approval_status === 'approved' || survey.approval_status === 'granted') ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {(survey.approval_status === 'approved' || survey.approval_status === 'granted') ? '✅ Already Approved' : 
                     updatingApproval ? 'Processing...' : '✅ Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleApproveOrDecline(survey.id, survey.user_id, 'declined')}
                    disabled={updatingApproval || survey.approval_status === 'declined'}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: survey.approval_status === 'declined' ? '#95a5a6' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: survey.approval_status === 'declined' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {survey.approval_status === 'declined' ? '❌ Already Declined' : 
                     updatingApproval ? 'Processing...' : '❌ Decline'}
                  </button>
                  
                  {survey.user_email && (
                    <button
                      onClick={() => handleSendFeedback(survey.user_email, survey.approval_status)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📧 Send Feedback
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedSurvey(selectedSurvey === survey.id ? null : survey.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedSurvey === survey.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {/* ✅ Detailed view when selected */}
                {selectedSurvey === survey.id && (
                  <div className="survey-details" style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <h5>Full Survey Details:</h5>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85em',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(survey, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !surveysLoading && !surveysError && (
            <div className="no-surveys" style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              No survey submissions found.
            </div>
          )
        )}

        {/* ✅ Refresh button */}
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => fetchSurveyLogs()}
            disabled={surveysLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {surveysLoading ? 'Refreshing...' : 'Refresh Survey List'}
          </button>
        </div>
      </div>

      {/* Section: Update User Roles */}
      <div className="section">
        <h3>Update User Roles</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="User ID"
            value={userRoleUpdates.userId}
            onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
            disabled={updatingRole}
            style={{ padding: '8px', minWidth: '200px' }}
          />
          <select
            value={userRoleUpdates.role}
            onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
            disabled={updatingRole}
            style={{ padding: '8px', minWidth: '150px' }}
          >
            <option value="">Select Role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
          </select>
          <button
            onClick={() => updateUserRole(userRoleUpdates)}
            disabled={updatingRole || !userRoleUpdates.userId || !userRoleUpdates.role}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {updatingRole ? 'Updating...' : 'Update Role'}
          </button>
        </div>
        <small style={{ color: '#666' }}>
          Enter the user ID and select a new role to update user permissions.
        </small>
      </div>

      {/* ✅ Context-aware footer */}
      <div className="auth-controls-footer" style={{ 
        marginTop: '30px', 
        paddingTop: '20px', 
        borderTop: '1px solid #eee',
        fontSize: '0.9em',
        color: '#666'
      }}>
        {isInAdminContext ? (
          <p>You are viewing AuthControls in Admin Panel context with full administrative privileges.</p>
        ) : (
          <p>AuthControls running in standalone mode.</p>
        )}
      </div>
    </div>
  );
};

export default AuthControls;