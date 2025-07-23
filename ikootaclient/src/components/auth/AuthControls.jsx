//ikootaclient/src/components/auth/AuthControls.jsx - FIXED SURVEY ANSWER DISPLAY
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../service/api";
import "./authControls.css";

const AuthControls = () => {
  const queryClient = useQueryClient();
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

  // Fetch survey questions
  const { data: questions, refetch: fetchQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ["fetchSurveyQuestions"],
    queryFn: async () => {
      console.log('🔍 Fetching survey questions...');
      const res = await api.get("/survey/questions");
      console.log("✅ Questions response:", res.data);
      return res.data;
    },
    retry: 2,
    retryDelay: 1000,
  });

  // ✅ FIXED: Enhanced survey logs fetch with better error handling
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
        const res = await api.get("/survey/logs");
        console.log("✅ Survey logs response:", res.data);
        
        // ✅ Handle different response formats
        if (res.data?.success && res.data?.data) {
          return res.data.data; // New format with success wrapper
        } else if (Array.isArray(res.data)) {
          return res.data; // Direct array format
        } else if (res.data?.logs) {
          return res.data.logs; // Alternative format
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

  // Update survey questions
  const { mutate: updateQuestions, isLoading: updatingQuestions } = useMutation({
    mutationFn: (questions) => {
      console.log('🔍 Updating questions:', questions);
      return api.put("/survey/questions", { questions });
    },
    onSuccess: () => {
      console.log('✅ Questions updated successfully');
      fetchQuestions();
    },
    onError: (error) => {
      console.error('❌ Error updating questions:', error);
      alert('Failed to update questions: ' + error.message);
    }
  });

  // ✅ FIXED: Enhanced approval status update
  const { mutate: updateApprovalStatus, isLoading: updatingApproval } = useMutation({
    mutationFn: ({ surveyId, userId, status }) => {
      console.log('🔍 Updating approval status:', { surveyId, userId, status });
      return api.put("/survey/approve", { surveyId, userId, status });
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

  // Update user role
  const { mutate: updateUserRole, isLoading: updatingRole } = useMutation({
    mutationFn: ({ userId, role }) => {
      console.log('🔍 Updating user role:', { userId, role });
      return api.put("/users/role", { userId, role });
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

  useEffect(() => {
    if (questions) {
      console.log('🔍 Setting survey questions:', questions);
      setSurveyQuestions(questions);
    }
  }, [questions]);

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...surveyQuestions];
    updatedQuestions[index] = value;
    setSurveyQuestions(updatedQuestions);
  };

  const handleApproveOrDecline = (surveyId, userId, status) => {
    console.log('🔍 Handling approval/decline:', { surveyId, userId, status });
    updateApprovalStatus({ surveyId, userId, status });
  };

  const handleSendFeedback = (email, status) => {
    console.log('🔍 Sending feedback:', { email, status });
    const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
    api.post("/email/send", { email, template: feedbackTemplate, status })
      .then(() => {
        console.log('✅ Feedback sent successfully');
        alert('Feedback email sent successfully!');
      })
      .catch((error) => {
        console.error('❌ Error sending feedback:', error);
        alert('Failed to send feedback email: ' + error.message);
      });
  };

  // ✅ FIXED: Enhanced survey display with proper answer formatting
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
                {answers}
              </pre>
            </div>
          );
        }
      } else {
        parsedAnswers = answers;
      }

      console.log('🔍 Parsed answers:', parsedAnswers);

      // ✅ Handle array of question-answer objects (new format)
      if (Array.isArray(parsedAnswers)) {
        // Check if it's array of objects with question/answer structure
        if (parsedAnswers.length > 0 && typeof parsedAnswers[0] === 'object' && parsedAnswers[0].question) {
          return (
            <div className="survey-answers-detailed">
              {parsedAnswers.map((item, index) => (
                <div key={index} className="answer-item">
                  <div className="question-label">
                    <strong>{formatQuestionLabel(item.question)}:</strong>
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
                    <strong>Answer {index + 1}:</strong> {answer || 'No response'}
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }

      // ✅ Handle object format (alternative format)
      if (typeof parsedAnswers === 'object') {
        return (
          <div className="survey-answers-object">
            {Object.entries(parsedAnswers).map(([key, value], index) => (
              <div key={index} className="answer-item">
                <div className="question-label">
                  <strong>{formatQuestionLabel(key)}:</strong>
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

  // ✅ Helper function to format answer values
  const formatAnswerValue = (answer) => {
    if (answer === true || answer === 'true') {
      return <span style={{ color: 'green' }}>✅ Yes</span>;
    }
    if (answer === false || answer === 'false') {
      return <span style={{ color: 'red' }}>❌ No</span>;
    }
    if (!answer || answer === '') {
      return <em style={{ color: '#888' }}>Not provided</em>;
    }
    return answer;
  };

  return (
    <div className="auth_controls_body">
      <div className="admin_controls_header">Auth Controls</div>

      {/* Section: Edit Survey Questions */}
      <div className="section">
        <h3>Edit Survey Questions</h3>
        {questionsLoading && <p>Loading questions...</p>}
        {surveyQuestions?.map((question, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              disabled={updatingQuestions}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        ))}
        <button 
          onClick={() => updateQuestions(surveyQuestions)}
          disabled={updatingQuestions}
        >
          {updatingQuestions ? 'Updating...' : 'Update Questions'}
        </button>
      </div>

      {/* Section: Fetch and Vet Survey Forms */}
      <div className="section">
        <h3>Vetting Survey Forms</h3>
        
        {surveysLoading && <p>Loading survey logs...</p>}
        
        {surveysError && (
          <div style={{color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px'}}>
            Error loading surveys: {surveysError.message}
            <button onClick={() => fetchSurveyLogs()} style={{marginLeft: '10px'}}>
              Retry
            </button>
          </div>
        )}
        
        {surveys && Array.isArray(surveys) ? (
          surveys.length > 0 ? (
            surveys.map((survey) => (
              <div key={survey.id} className="survey-log enhanced" style={{
                border: '2px solid #ddd', 
                padding: '20px', 
                margin: '15px 0', 
                borderRadius: '8px',
                backgroundColor: survey.approval_status === 'pending' ? '#fff8dc' : '#f9f9f9'
              }}>
                {/* ✅ Enhanced Survey Header */}
                <div className="survey-header" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <h4 style={{ margin: '0', color: '#333' }}>
                      Survey #{survey.id} - {survey.username}
                    </h4>
                    <p style={{ 
                      margin: '5px 0 0 0', 
                      color: survey.approval_status === 'pending' ? '#f39c12' : 
                            survey.approval_status === 'approved' ? '#27ae60' : '#e74c3c'
                    }}>
                      Status: <strong>{survey.approval_status.toUpperCase()}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      Submitted: {new Date(survey.createdAt).toLocaleDateString()}
                    </div>
                    {survey.application_ticket && (
                      <div style={{ fontSize: '0.8em', color: '#888' }}>
                        Ticket: {survey.application_ticket}
                      </div>
                    )}
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

                {/* ✅ ENHANCED: Properly formatted answers */}
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
                
                {/* Action Buttons */}
                <div className="survey-actions" style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #eee'
                }}>
                  <button 
                    onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}
                    disabled={updatingApproval || survey.approval_status === 'approved'}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: survey.approval_status === 'approved' ? '#95a5a6' : '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: survey.approval_status === 'approved' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {survey.approval_status === 'approved' ? '✅ Already Approved' : '✅ Approve'}
                  </button>
                  
                  <button 
                    onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}
                    disabled={updatingApproval || survey.approval_status === 'declined'}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: survey.approval_status === 'declined' ? '#95a5a6' : '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: survey.approval_status === 'declined' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {survey.approval_status === 'declined' ? '❌ Already Declined' : '❌ Decline'}
                  </button>
                  
                  {survey.user_email && (
                    <button
                      onClick={() => handleSendFeedback(survey.user_email, survey.approval_status)}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      📧 Send Feedback
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>📋 No survey submissions found.</p>
            </div>
          )
        ) : (
          <div style={{ color: 'red', padding: '10px' }}>
            <p>⚠️ Survey data is not in the expected format.</p>
          </div>
        )}
      </div>

      {/* Section: Role Management */}
      <div className="section">
        <h3>Manage User Roles</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="User ID"
            value={userRoleUpdates.userId}
            onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
            disabled={updatingRole}
            style={{ minWidth: '120px' }}
          />
          <select
            value={userRoleUpdates.role}
            onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
            disabled={updatingRole}
            style={{ minWidth: '150px' }}
          >
            <option value="">Select Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button 
            onClick={() => updateUserRole(userRoleUpdates)}
            disabled={updatingRole || !userRoleUpdates.userId || !userRoleUpdates.role}
          >
            {updatingRole ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </div>

      {/* ✅ Add enhanced CSS for survey answers */}
      <style jsx>{`
        .survey-answers-detailed .answer-item {
          margin-bottom: 12px;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #3498db;
        }
        
        .survey-answers-detailed .question-label {
          color: #2c3e50;
          font-size: 0.9em;
          margin-bottom: 4px;
        }
        
        .survey-answers-detailed .answer-value {
          color: #34495e;
          padding-left: 10px;
          font-size: 0.95em;
        }
        
        .survey-answers-simple .simple-answer {
          margin-bottom: 8px;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 3px;
        }
        
        .survey-answers-object .answer-item {
          margin-bottom: 10px;
          padding: 8px;
          background: #ffffff;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }
        
        .no-answers, .invalid-answers, .error-answers {
          padding: 15px;
          text-align: center;
          background: #f8f9fa;
          border-radius: 5px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default AuthControls;


// //ikootaclient\src\components\auth\Applicationsurvey.jsx
// import React, { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "../service/api";
// import "./authControls.css";

// const AuthControls = () => {
//   const queryClient = useQueryClient();
//   const [surveyQuestions, setSurveyQuestions] = useState([]);
//   const [selectedSurvey, setSelectedSurvey] = useState(null);
//   const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

//   // Fetch survey questions
//   const { data: questions, refetch: fetchQuestions, isLoading: questionsLoading } = useQuery({
//     queryKey: ["fetchSurveyQuestions"],
//     queryFn: async () => {
//       console.log('🔍 Fetching survey questions...');
//       const res = await api.get("/survey/questions");
//       console.log("✅ Questions response:", res.data);
//       return res.data;
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Enhanced survey logs fetch with better error handling
//   const { 
//     data: surveys, 
//     refetch: fetchSurveyLogs, 
//     isLoading: surveysLoading,
//     error: surveysError 
//   } = useQuery({
//     queryKey: ["fetchSurveyLogs"],
//     queryFn: async () => {
//       console.log('🔍 Fetching survey logs...');
//       try {
//         const res = await api.get("/survey/logs");
//         console.log("✅ Survey logs response:", res.data);
        
//         // ✅ Handle different response formats
//         if (res.data?.success && res.data?.data) {
//           return res.data.data; // New format with success wrapper
//         } else if (Array.isArray(res.data)) {
//           return res.data; // Direct array format
//         } else if (res.data?.logs) {
//           return res.data.logs; // Alternative format
//         } else {
//           console.warn('⚠️ Unexpected survey logs format:', res.data);
//           return [];
//         }
//       } catch (error) {
//         console.error('❌ Survey logs fetch error:', error);
//         if (error.response?.status === 403) {
//           throw new Error('Admin privileges required to view survey logs');
//         }
//         throw error;
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//     onError: (error) => {
//       console.error('❌ Survey logs query error:', error);
//     }
//   });

//   // Update survey questions
//   const { mutate: updateQuestions, isLoading: updatingQuestions } = useMutation({
//     mutationFn: (questions) => {
//       console.log('🔍 Updating questions:', questions);
//       return api.put("/survey/questions", { questions });
//     },
//     onSuccess: () => {
//       console.log('✅ Questions updated successfully');
//       fetchQuestions();
//     },
//     onError: (error) => {
//       console.error('❌ Error updating questions:', error);
//       alert('Failed to update questions: ' + error.message);
//     }
//   });

//   // ✅ FIXED: Enhanced approval status update
//   const { mutate: updateApprovalStatus, isLoading: updatingApproval } = useMutation({
//     mutationFn: ({ surveyId, userId, status }) => {
//       console.log('🔍 Updating approval status:', { surveyId, userId, status });
//       return api.put("/survey/approve", { surveyId, userId, status });
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Approval status updated:', variables);
//       fetchSurveyLogs();
//       alert(`Application ${variables.status} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error updating approval status:', error);
//       alert('Failed to update approval status: ' + error.message);
//     }
//   });

//   // Update user role
//   const { mutate: updateUserRole, isLoading: updatingRole } = useMutation({
//     mutationFn: ({ userId, role }) => {
//       console.log('🔍 Updating user role:', { userId, role });
//       return api.put("/users/role", { userId, role });
//     },
//     onSuccess: () => {
//       console.log('✅ User role updated successfully');
//       alert("User role updated successfully.");
//       setUserRoleUpdates({ userId: "", role: "" });
//     },
//     onError: (error) => {
//       console.error('❌ Error updating user role:', error);
//       alert('Failed to update user role: ' + error.message);
//     }
//   });

//   useEffect(() => {
//     if (questions) {
//       console.log('🔍 Setting survey questions:', questions);
//       setSurveyQuestions(questions);
//     }
//   }, [questions]);

//   const handleQuestionChange = (index, value) => {
//     const updatedQuestions = [...surveyQuestions];
//     updatedQuestions[index] = value;
//     setSurveyQuestions(updatedQuestions);
//   };

//   const handleApproveOrDecline = (surveyId, userId, status) => {
//     console.log('🔍 Handling approval/decline:', { surveyId, userId, status });
//     updateApprovalStatus({ surveyId, userId, status });
//   };

//   const handleSendFeedback = (email, status) => {
//     console.log('🔍 Sending feedback:', { email, status });
//     const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
//     api.post("/email/send", { email, template: feedbackTemplate, status })
//       .then(() => {
//         console.log('✅ Feedback sent successfully');
//         alert('Feedback email sent successfully!');
//       })
//       .catch((error) => {
//         console.error('❌ Error sending feedback:', error);
//         alert('Failed to send feedback email: ' + error.message);
//       });
//   };

//   // ✅ Enhanced survey display with better data parsing
//   const renderSurveyAnswers = (answers) => {
//     try {
//       if (typeof answers === 'string') {
//         const parsed = JSON.parse(answers);
//         if (Array.isArray(parsed)) {
//           return parsed.join(', ');
//         } else if (typeof parsed === 'object') {
//           return Object.entries(parsed)
//             .map(([key, value]) => `${key}: ${value}`)
//             .join(', ');
//         }
//       }
//       return answers || 'No answers provided';
//     } catch (error) {
//       console.warn('⚠️ Error parsing survey answers:', error);
//       return answers || 'Invalid answer format';
//     }
//   };

//   return (
//     <div className="auth_controls_body">
//       <div className="admin_controls_header">Auth Controls</div>

//       {/* Section: Edit Survey Questions */}
//       <div className="section">
//         <h3>Edit Survey Questions</h3>
//         {questionsLoading && <p>Loading questions...</p>}
//         {surveyQuestions?.map((question, index) => (
//           <div key={index}>
//             <input
//               type="text"
//               value={question}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//               disabled={updatingQuestions}
//             />
//           </div>
//         ))}
//         <button 
//           onClick={() => updateQuestions(surveyQuestions)}
//           disabled={updatingQuestions}
//         >
//           {updatingQuestions ? 'Updating...' : 'Update Questions'}
//         </button>
//       </div>

//       {/* Section: Fetch and Vet Survey Forms */}
//       <div className="section">
//         <h3>Vetting Survey Forms</h3>
        
//         {surveysLoading && <p>Loading survey logs...</p>}
        
//         {surveysError && (
//           <div style={{color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px'}}>
//             Error loading surveys: {surveysError.message}
//             <button onClick={() => fetchSurveyLogs()} style={{marginLeft: '10px'}}>
//               Retry
//             </button>
//           </div>
//         )}
        
//         {surveys && Array.isArray(surveys) ? (
//           surveys.length > 0 ? (
//             surveys.map((survey) => (
//               <div key={survey.id} className="survey-log" style={{
//                 border: '1px solid #ddd', 
//                 padding: '15px', 
//                 margin: '10px 0', 
//                 borderRadius: '5px'
//               }}>
//                 <p><strong>Survey ID:</strong> {survey.id}</p>
//                 <p><strong>User ID:</strong> {survey.user_id}</p>
//                 <p><strong>Username:</strong> {survey.username || 'N/A'}</p>
//                 <p><strong>Email:</strong> {survey.user_email || 'N/A'}</p>
//                 <p><strong>Application Type:</strong> {survey.application_type || 'initial_application'}</p>
//                 <p><strong>Status:</strong> <span style={{
//                   color: survey.approval_status === 'approved' ? 'green' : 
//                         survey.approval_status === 'declined' ? 'red' : 'orange'
//                 }}>{survey.approval_status}</span></p>
//                 <p><strong>Submitted:</strong> {new Date(survey.createdAt).toLocaleDateString()}</p>
//                 <p><strong>Answers:</strong> {renderSurveyAnswers(survey.answers)}</p>
//                 {survey.admin_notes && <p><strong>Admin Notes:</strong> {survey.admin_notes}</p>}
                
//                 <div style={{marginTop: '10px'}}>
//                   <button 
//                     onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}
//                     disabled={updatingApproval || survey.approval_status === 'approved'}
//                     style={{marginRight: '10px', backgroundColor: 'green', color: 'white'}}
//                   >
//                     {survey.approval_status === 'approved' ? 'Already Approved' : 'Approve'}
//                   </button>
//                   <button 
//                     onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}
//                     disabled={updatingApproval || survey.approval_status === 'declined'}
//                     style={{marginRight: '10px', backgroundColor: 'red', color: 'white'}}
//                   >
//                     {survey.approval_status === 'declined' ? 'Already Declined' : 'Decline'}
//                   </button>
//                   {survey.user_email && (
//                     <button
//                       onClick={() => handleSendFeedback(survey.user_email, survey.approval_status)}
//                       style={{backgroundColor: 'blue', color: 'white'}}
//                     >
//                       Send Feedback
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p>No survey submissions found.</p>
//           )
//         ) : (
//           <p>Survey data is not in the expected format.</p>
//         )}
//       </div>

//       {/* Section: Role Management */}
//       <div className="section">
//         <h3>Manage User Roles</h3>
//         <input
//           type="text"
//           placeholder="User ID"
//           value={userRoleUpdates.userId}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
//           disabled={updatingRole}
//         />
//         <select
//           value={userRoleUpdates.role}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
//           disabled={updatingRole}
//         >
//           <option value="">Select Role</option>
//           <option value="super_admin">Super Admin</option>
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>
//         <button 
//           onClick={() => updateUserRole(userRoleUpdates)}
//           disabled={updatingRole || !userRoleUpdates.userId || !userRoleUpdates.role}
//         >
//           {updatingRole ? 'Updating...' : 'Update Role'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AuthControls;


// //ikootaclient\src\components\auth\Applicationsurvey.jsx
// import React, { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "../service/api";
// import "./authControls.css";

// const AuthControls = () => {
//   const queryClient = useQueryClient();
//   const [surveyQuestions, setSurveyQuestions] = useState([]);
//   const [selectedSurvey, setSelectedSurvey] = useState(null);
//   const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

//   // Fetch survey questions
//   const { data: questions, refetch: fetchQuestions } = useQuery({
//     queryKey: ["fetchSurveyQuestions"],
//     queryFn: async () => {
//       const res = await api.get("/survey/questions");
//       console.log("questions at authcontrols", res.data);
//       return res.data;
//     },
//   });

//   // Fetch survey logs
//   const { data: surveys, refetch: fetchSurveyLogs } = useQuery({
//     queryKey: ["fetchSurveyLogs"],
//     queryFn: async () => {
//       const res = await api.get("/survey/logs");
//       console.log("surveys at authcontrols", res.data);
//       return res.data;
//     },
//   });

//   // Update survey questions
//   const { mutate: updateQuestions } = useMutation({
//     mutationFn: (questions) => api.put("/survey/questions", { questions }),
//     onSuccess: () => fetchQuestions(),
//   });

//   // Update user approval status
//   const { mutate: updateApprovalStatus } = useMutation({
//     mutationFn: ({ surveyId, userId, status }) => api.put("/survey/approve", { surveyId, userId, status }),
//     onSuccess: () => fetchSurveyLogs(),
//   });

//   // Update user role
//   const { mutate: updateUserRole } = useMutation({
//     mutationFn: ({ userId, role }) => api.put("/users/role", { userId, role }),
//     onSuccess: () => alert("User role updated successfully."),
//   });

//   useEffect(() => {
//     if (questions) setSurveyQuestions(questions);
//   }, [questions]);

//   const handleQuestionChange = (index, value) => {
//     const updatedQuestions = [...surveyQuestions];
//     updatedQuestions[index] = value;
//     setSurveyQuestions(updatedQuestions);
//   };

//   const handleApproveOrDecline = (surveyId, userId, status) => {
//     updateApprovalStatus({ surveyId, userId, status });
//   };

//   const handleSendFeedback = (email, status) => {
//     const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
//     api.post("/email/send", { email, template: feedbackTemplate, status });
//   };

//   return (
//     <div className="auth_controls_body">
//       <div className="admin_controls_header">Auth Controls</div>

//       {/* Section: Edit Survey Questions */}
//       <div className="section">
//         <h3>Edit Survey Questions</h3>
//         {surveyQuestions?.map((question, index) => (
//           <div key={index}>
//             <input
//               type="text"
//               value={question}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//             />
//           </div>
//         ))}
//         <button onClick={() => updateQuestions(surveyQuestions)}>Update Questions</button>
//       </div>

//       {/* Section: Fetch and Vet Survey Forms */}
//       <div className="section">
//         <h3>Vetting Survey Forms</h3>
//         {Array.isArray(surveys) && surveys.map((survey) => (
//           <div key={survey.id} className="survey-log">
//             <p>User ID: {survey.user_id}</p>
//             <p>Answers: {survey.answers}</p>
//             <p>Status: {survey.approval_status}</p>
//             <div>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}>
//                 Approve
//               </button>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}>
//                 Decline
//               </button>
//               <button
//                 onClick={() =>
//                   handleSendFeedback(survey.user_email, survey.approval_status === "granted")
//                 }
//               >
//                 Send Feedback
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Section: Role Management */}
//       <div className="section">
//         <h3>Manage User Roles</h3>
//         <input
//           type="text"
//           placeholder="User ID"
//           value={userRoleUpdates.userId}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
//         />
//         <select
//           value={userRoleUpdates.role}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
//         >
//           <option value="">Select Role</option>
//           <option value="super_admin">Super Admin</option>
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>
//         <button onClick={() => updateUserRole(userRoleUpdates)}>Update Role</button>
//       </div>
//     </div>
//   );
// };

// export default AuthControls;


//NOTE ERROR1 useQuery hook uses the object form as required by React Queryv5 is used above as against that below.

//NOTE ERROR2    The error `Uncaught TypeError: surveys.map is not a function` indicates that the `surveys` variable is not an array when the `map` function is called. This can happen if the API response is not as expected or if the data is not properly initialized.
//To resolve this issue, we need to ensure that the `surveys` variable is always an array before calling the `map` function. Additionally, we should verify that the API endpoints are correctly aligned between the frontend and backend.
//Step 1: Ensure `surveys` is Always an Array
//Update the `AuthControls` component to ensure that `surveys` is always an array before calling the `map` function.





// import React, { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "../service/api";
// import "./authControls.css";

// const AuthControls = () => {
//    const queryClient = useQueryClient();
//   const [surveyQuestions, setSurveyQuestions] = useState([]);
//   const [selectedSurvey, setSelectedSurvey] = useState(null);
//   const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

//   // Fetch survey questions
//   const { data: questions, refetch: fetchQuestions } = useQuery(
//     ["fetchSurveyQuestions"],
//     async () => {
//       const res = await api.get("/survey/questions");
//       console.log("questions at authcontrols", res.data);
//       return res.data;
//     }
//   );

//   // Fetch surveylogs
//   const { data: surveys, refetch: fetchSurveyLogs } = useQuery(
//     ["fetchSurveyLogs"],
//     async () => {
//       const res = await api.get("/survey/logs");
//       console.log("surveys at authcontrols", res.data);
//       return res.data;
//     }
//   );

//   // Update survey questions
//   const { mutate: updateQuestions } = useMutation(
//     (questions) => api.put("/survey/questions", { questions }),
//     {
//       onSuccess: () => fetchQuestions(),
//     }
//   );

//   // Update user approval status
//   const { mutate: updateApprovalStatus } = useMutation(
//     ({ surveyId, userId, status }) => api.put("/survey/approve", { surveyId, userId, status }),
//     {
//       onSuccess: () => fetchSurveyLogs(),
//     }
//   );

//   // Update user role
//   const { mutate: updateUserRole } = useMutation(
//     ({ userId, role }) => api.put("/users/role", { userId, role }),
//     {
//       onSuccess: () => alert("User role updated successfully."),
//     }
//   );

//   useEffect(() => {
//     if (questions) setSurveyQuestions(questions);
//   }, [questions]);

//   const handleQuestionChange = (index, value) => {
//     const updatedQuestions = [...surveyQuestions];
//     updatedQuestions[index] = value;
//     setSurveyQuestions(updatedQuestions);
//   };

//   const handleApproveOrDecline = (surveyId, userId, status) => {
//     updateApprovalStatus({ surveyId, userId, status });
//   };

//   const handleSendFeedback = (email, status) => {
//     const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
//     api.post("/email/send", { email, template: feedbackTemplate, status });
//   };

//   return (
//     <div className="auth_controls_body">
//       <div className="admin_controls_header">Auth Controls</div>

//       {/* Section: Edit Survey Questions */}
//       <div className="section">
//         <h3>Edit Survey Questions</h3>
//         {surveyQuestions.map((question, index) => (
//           <div key={index}>
//             <input
//               type="text"
//               value={question}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//             />
//           </div>
//         ))}
//         <button onClick={() => updateQuestions(surveyQuestions)}>Update Questions</button>
//       </div>

//       {/* Section: Fetch and Vet Survey Forms */}
//       <div className="section">
//         <h3>Vetting Survey Forms</h3>
//         {surveys?.map((survey) => (
//           <div key={survey.id} className="survey-log">
//             <p>User ID: {survey.user_id}</p>
//             <p>Answers: {survey.answers}</p>
//             <p>Status: {survey.approval_status}</p>
//             <div>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}>
//                 Approve
//               </button>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}>
//                 Decline
//               </button>
//               <button
//                 onClick={() =>
//                   handleSendFeedback(survey.user_email, survey.approval_status === "granted")
//                 }
//               >
//                 Send Feedback
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Section: Role Management */}
//       <div className="section">
//         <h3>Manage User Roles</h3>
//         <input
//           type="text"
//           placeholder="User ID"
//           value={userRoleUpdates.userId}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
//         />
//         <select
//           value={userRoleUpdates.role}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
//         >
//           <option value="">Select Role</option>
//           <option value="super_admin">Super Admin</option>
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>
//         <button onClick={() => updateUserRole(userRoleUpdates)}>Update Role</button>
//       </div>
//     </div>
//   );
// };

// export default AuthControls;


//implement approval process of application survey with update on users column.
//--fetch survey,update column, generate ID,

// editing of the questions/survey that is presented to new users as applicationsurvey form, fetching of the filled and submitted application survey forms for vetting, and the vetting (approval or declining) of the application survey forms and corresponding feedback to the new user applicants.
//authControls.jsx is part of the Admin management system and it will be linked and displayed inside the Admin.jsx, I want to manage all that concerns authentication. 

//surveylogs, and reply to users' applications (approveverifyinfo, pendverifyinfo, suspendedverifyinfo/declined, verifySurvey? ) after vetting of applicationsurvey forms will be managed at reports.
//assign roles and their permissions. super_admin, admin and user.

//Authorization or Approvals of Posting of teachings or content; that's the starting of a teaching presentation in towncrier or a chat in iko that will first be in pending status will be managed here at authcontrols? fetching of pending, approved, declined, suspended, and deleted teachings or content will be managed at reports. also, 

// what is there to manage in the signup, login, the thank you page, the forgot password and password-Reset process? 

// userlogs, and other logs will be managed at reports.
//Admin Report will manage the report logs, banning, flagged, 