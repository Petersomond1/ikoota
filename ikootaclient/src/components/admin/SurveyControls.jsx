import React, { useState, useEffect } from 'react';
import './surveyControls.css';

const SurveyControls = () => {
  const [selectedSurveys, setSelectedSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('pending_surveys');
  const [isLoading, setIsLoading] = useState(false);
  const [surveysData, setSurveysData] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [questionLabels, setQuestionLabels] = useState({});
  const [error, setError] = useState(null);

  // Mock API function - replace with your actual API implementation
  const mockApiCall = async (endpoint, options = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock responses based on endpoint
    if (endpoint.includes('/admin/survey/pending')) {
      return {
        data: {
          success: true,
          data: [
            {
              id: 1,
              user_id: 101,
              username: 'survey_user1',
              user_email: 'user1@example.com',
              survey_type: 'general_survey',
              survey_category: 'feedback',
              survey_title: 'Platform Feedback Survey',
              approval_status: 'pending',
              completion_percentage: 100,
              time_spent_minutes: 15,
              answers: [
                { question: 'satisfaction', answer: 'Very satisfied' },
                { question: 'improvements', answer: 'Better mobile interface' },
                { question: 'recommendation', answer: 'Yes, definitely' }
              ],
              createdAt: '2025-01-15T10:30:00Z',
              application_ticket: 'SUR-USR1-12345'
            },
            {
              id: 2,
              user_id: 102,
              username: 'survey_user2',
              user_email: 'user2@example.com',
              survey_type: 'assessment',
              survey_category: 'general',
              survey_title: 'Skills Assessment',
              approval_status: 'pending',
              completion_percentage: 85,
              time_spent_minutes: 22,
              answers: [
                { question: 'experience_level', answer: 'Intermediate' },
                { question: 'preferred_topics', answer: 'Web Development, Data Science' },
                { question: 'learning_goals', answer: 'Advance my technical skills' }
              ],
              createdAt: '2025-01-12T14:20:00Z',
              application_ticket: 'SUR-USR2-67890'
            }
          ]
        }
      };
    } else if (endpoint.includes('/admin/survey/stats')) {
      return {
        data: {
          success: true,
          data: {
            pending: 8,
            approved: 45,
            rejected: 3,
            total: 56
          }
        }
      };
    } else if (endpoint.includes('/admin/survey/question-labels')) {
      return {
        data: {
          success: true,
          data: {
            satisfaction: 'How satisfied are you with our platform?',
            improvements: 'What improvements would you suggest?',
            recommendation: 'Would you recommend us to others?',
            experience_level: 'What is your experience level?',
            preferred_topics: 'What topics interest you most?',
            learning_goals: 'What are your learning goals?'
          }
        }
      };
    }
    
    // Default success response
    return { data: { success: true, message: 'Operation completed successfully' } };
  };

  // Detect if we're in admin context (mock implementation)
  const isInAdminContext = true;

  // Add context class to body for CSS targeting
  useEffect(() => {
    const bodyClass = 'survey-controls-in-admin';
    
    if (isInAdminContext) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }

    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [isInAdminContext]);

  // ===============================================
  // DATA FETCHING FUNCTIONS
  // ===============================================

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching surveys with filters:', { filterStatus, filterCategory, searchTerm });
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await mockApiCall(`/admin/survey/pending?${params}`);
      console.log('✅ Surveys response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setSurveysData(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (Array.isArray(response.data)) {
        setSurveysData(response.data);
      } else {
        console.warn('⚠️ Unexpected surveys response structure:', response.data);
        setSurveysData([]);
      }
      
    } catch (error) {
      console.error('❌ Surveys query failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching survey stats');
      
      const response = await mockApiCall('/admin/survey/stats');
      console.log('✅ Survey stats response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      } else if (response.data?.pending !== undefined) {
        setStats({
          pending: response.data.pending || 0,
          approved: response.data.approved || 0,
          rejected: response.data.rejected || 0,
          total: response.data.total || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Stats query failed:', error);
    }
  };

  const fetchQuestionLabels = async () => {
    try {
      const response = await mockApiCall('/admin/survey/question-labels');
      console.log('✅ Question labels response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setQuestionLabels(response.data.data);
      } else if (response.data?.labels) {
        setQuestionLabels(response.data.labels);
      } else if (typeof response.data === 'object') {
        setQuestionLabels(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching question labels:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSurveys();
  }, [filterStatus, filterCategory, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchQuestionLabels();
  }, []);

  // ===============================================
  // ACTION HANDLERS
  // ===============================================

  // Handle individual review
  const handleReview = async (surveyId, status, notes = '') => {
    if (!surveyId) {
      alert('Invalid survey ID');
      return;
    }

    const confirmMessage = `Are you sure you want to ${status} this survey?`;
    if (window.confirm(confirmMessage)) {
      try {
        setIsLoading(true);
        console.log('🔍 Reviewing survey:', { surveyId, status, notes });
        
        const response = await mockApiCall('/admin/survey/approve', {
          method: 'PUT',
          body: {
            surveyId, 
            status, 
            adminNotes: notes || ''
          }
        });
        
        console.log('✅ Survey review completed:', { surveyId, status });
        
        // Refresh data
        await fetchSurveys();
        await fetchStats();
        
        setSelectedSurveys([]);
        alert(`Survey ${status}d successfully!`);
        
      } catch (error) {
        console.error('❌ Error reviewing survey:', error);
        alert('Failed to review survey: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle bulk review
  const handleBulkReview = async (status, notes = '') => {
    if (selectedSurveys.length === 0) {
      alert('Please select surveys to review');
      return;
    }
    
    const confirmMessage = `Are you sure you want to ${status} ${selectedSurveys.length} survey(s)?`;
    if (window.confirm(confirmMessage)) {
      try {
        setIsLoading(true);
        console.log('🔍 Bulk reviewing surveys:', { selectedSurveys, status, notes });
        
        const response = await mockApiCall('/admin/survey/bulk-approve', {
          method: 'POST',
          body: {
            surveyIds: selectedSurveys, 
            decision: status, 
            notes: notes || '' 
          }
        });
        
        console.log('✅ Bulk review completed:', { count: selectedSurveys.length, status });
        
        // Refresh data
        await fetchSurveys();
        await fetchStats();
        
        setSelectedSurveys([]);
        alert(`${selectedSurveys.length} surveys ${status}d successfully!`);
        
      } catch (error) {
        console.error('❌ Error in bulk review:', error);
        alert('Failed to bulk review: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update question labels
  const updateQuestionLabels = async (labels) => {
    try {
      setIsLoading(true);
      console.log('🔍 Updating question labels:', labels);
      
      if (!labels || Object.keys(labels).length === 0) {
        throw new Error('Please provide at least one question label before saving');
      }
      
      const response = await mockApiCall('/admin/survey/question-labels', {
        method: 'PUT',
        body: { labels }
      });
      
      console.log('✅ Question labels updated successfully');
      await fetchQuestionLabels();
      alert('Survey question labels updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating question labels:', error);
      alert('Failed to update question labels: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle survey selection
  const toggleSelection = (surveyId) => {
    setSelectedSurveys(prev => 
      prev.includes(surveyId)
        ? prev.filter(id => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  // Select all surveys
  const selectAll = () => {
    if (filteredSurveys && filteredSurveys.length > 0) {
      const allIds = filteredSurveys.map(survey => survey.id);
      setSelectedSurveys(allIds);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedSurveys([]);
  };

  // ===============================================
  // QUESTION MANAGEMENT
  // ===============================================

  // Convert question labels to editable format
  useEffect(() => {
    if (questionLabels) {
      console.log('🔍 Setting question labels:', questionLabels);
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
      setSurveyQuestions([{ field: '', label: '' }]);
    }
  }, [questionLabels]);

  // Handle question label changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...surveyQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setSurveyQuestions(updatedQuestions);
  };

  // Add new question label
  const addQuestionLabel = () => {
    setSurveyQuestions([...surveyQuestions, { field: '', label: '' }]);
  };

  // Remove question label
  const removeQuestionLabel = (index) => {
    if (surveyQuestions.length > 1) {
      const newQuestions = surveyQuestions.filter((_, i) => i !== index);
      setSurveyQuestions(newQuestions);
    }
  };

  // Save question labels
  const saveQuestionLabels = () => {
    const labelsObject = {};
    surveyQuestions.forEach(item => {
      if (item.field && item.field.trim() && item.label && item.label.trim()) {
        labelsObject[item.field.trim()] = item.label.trim();
      }
    });
    
    updateQuestionLabels(labelsObject);
  };

  // ===============================================
  // UTILITY FUNCTIONS
  // ===============================================

  // Enhanced survey answers rendering
  const renderSurveyAnswers = (answers) => {
    try {
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
          return (
            <div className="invalid-answers">
              <strong>Survey Response:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                {answers}
              </pre>
            </div>
          );
        }
      } else {
        parsedAnswers = answers;
      }

      // Handle array of question-answer objects (new format)
      if (Array.isArray(parsedAnswers)) {
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
        } else {
          return (
            <div className="survey-answers-simple">
              {parsedAnswers.map((answer, index) => (
                <div key={index} className="simple-answer">
                  <strong>Answer {index + 1}:</strong> {String(answer || 'No response')}
                </div>
              ))}
            </div>
          );
        }
      }

      // Handle object format
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

      // Fallback
      return (
        <div className="fallback-answers">
          <strong>Survey Response:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
            {JSON.stringify(parsedAnswers, null, 2)}
          </pre>
        </div>
      );

    } catch (error) {
      console.error('❌ Error rendering answers:', error);
      return (
        <div className="error-answers">
          <em style={{ color: 'red' }}>Error displaying answers: {error.message}</em>
        </div>
      );
    }
  };

  // Helper function to format question labels
  const formatQuestionLabel = (questionKey) => {
    const labelMap = {
      satisfaction: 'How satisfied are you with our platform?',
      improvements: 'What improvements would you suggest?',
      recommendation: 'Would you recommend us to others?',
      experience_level: 'What is your experience level?',
      preferred_topics: 'What topics interest you most?',
      learning_goals: 'What are your learning goals?',
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

  // Helper function to format answer values
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

    if (typeof answer === 'object') {
      if (Array.isArray(answer)) {
        return <span>{answer.join(', ')}</span>;
      } else {
        return <span>{JSON.stringify(answer)}</span>;
      }
    }

    return <span>{String(answer)}</span>;
  };

  // Filter surveys
  const filteredSurveys = React.useMemo(() => {
    if (!Array.isArray(surveysData)) {
      return [];
    }
    
    return surveysData.filter(survey => {
      // Status filter
      if (filterStatus !== 'all' && survey.approval_status !== filterStatus) {
        return false;
      }
      
      // Category filter
      if (filterCategory !== 'all' && survey.survey_category !== filterCategory) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          survey?.username,
          survey?.user_email,
          survey?.survey_title,
          survey?.application_ticket
        ].filter(Boolean);
        
        const fieldMatch = searchableFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        return fieldMatch;
      }
      
      return true;
    });
  }, [surveysData, filterStatus, filterCategory, searchTerm]);

  // ===============================================
  // RENDER FUNCTIONS
  // ===============================================

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading survey administration...</p>
      </div>
    );
  }

  return (
    <div className="survey-controls-container">
      {/* Context-aware header */}
      <div className="survey-controls-header">
        <h2>Survey Administration</h2>
        {isInAdminContext && (
          <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
            (Admin Panel - Independent Survey Management)
          </small>
        )}
        
        {/* Error display */}
        {error && (
          <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #fcc' }}>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                ⚠️ API Error: {error}
              </summary>
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                <p><strong>Debugging Information:</strong></p>
                <ul>
                  <li>Error Message: {error}</li>
                  <li>Surveys Count: {surveysData?.length || 0}</li>
                  <li>Current Filter: {filterStatus}</li>
                </ul>
                <button 
                  onClick={() => fetchSurveys()} 
                  style={{ marginTop: '10px', padding: '5px 10px' }}
                >
                  🔄 Retry Fetch
                </button>
              </div>
            </details>
          </div>
        )}
        
        {/* Stats Overview */}
        {stats && (
          <div className="stats-overview">
            <div className="stat-card">
              <h4>Pending</h4>
              <span className="stat-number">{stats?.pending || 0}</span>
            </div>
            <div className="stat-card">
              <h4>Approved</h4>
              <span className="stat-number approved">{stats?.approved || 0}</span>
            </div>
            <div className="stat-card">
              <h4>Rejected</h4>
              <span className="stat-number rejected">{stats?.rejected || 0}</span>
            </div>
            <div className="stat-card">
              <h4>Total</h4>
              <span className="stat-number">{stats?.total || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'pending_surveys' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pending_surveys')}
        >
          <span>Pending Surveys</span>
          <span className="tab-count">({stats?.pending || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'question_management' ? 'active' : ''}`} 
          onClick={() => setActiveTab('question_management')}
        >
          <span>Question Management</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} 
          onClick={() => setActiveTab('analytics')}
        >
          <span>Analytics</span>
        </button>
      </div>

      {/* ===== PENDING SURVEYS TAB ===== */}
      {activeTab === 'pending_surveys' && (
        <div className="pending-surveys-section">
          {/* Enhanced Controls */}
          <div className="survey-controls">
            <div className="control-group">
              <label>Filter by Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>

            <div className="control-group">
              <label>Filter by Category:</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="category-filter"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="feedback">Feedback</option>
                <option value="assessment">Assessment</option>
                <option value="membership">Membership</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="control-group">
              <label>Search Surveys:</label>
              <input
                type="text"
                placeholder="Search by username, email, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Bulk Actions */}
            {selectedSurveys.length > 0 && (
              <div className="bulk-actions">
                <span className="selection-count">
                  {selectedSurveys.length} selected
                </span>
                <button 
                  onClick={() => handleBulkReview('approved')}
                  className="bulk-btn approve-btn"
                  disabled={isLoading}
                >
                  Approve Selected
                </button>
                <button 
                  onClick={() => handleBulkReview('rejected')}
                  className="bulk-btn reject-btn"
                  disabled={isLoading}
                >
                  Reject Selected
                </button>
                <button onClick={clearSelection} className="bulk-btn clear-btn">
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Selection Controls */}
          <div className="selection-controls">
            <button onClick={selectAll} className="select-all-btn">
              Select All ({filteredSurveys.length})
            </button>
            <button onClick={clearSelection} className="clear-selection-btn">
              Clear Selection
            </button>
          </div>

          {/* Surveys List */}
          <div className="surveys-list">
            {filteredSurveys.length === 0 ? (
              <div className="no-surveys">
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                <h4>No Surveys Found</h4>
                <p>No surveys found for the current filters.</p>
                <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
                  <p><strong>Debug Info:</strong></p>
                  <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Raw surveys data: {Array.isArray(surveysData) ? `Array(${surveysData.length})` : typeof surveysData}</li>
                    <li>Current status filter: "{filterStatus}"</li>
                    <li>Current category filter: "{filterCategory}"</li>
                    <li>Search term: "{searchTerm}"</li>
                    <li>Has error: {!!error}</li>
                    <li>Is loading: {isLoading}</li>
                  </ul>
                  <button 
                    onClick={() => fetchSurveys()}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
                  >
                    🔄 Retry Fetch
                  </button>
                </div>
              </div>
            ) : (
              filteredSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  isSelected={selectedSurveys.includes(survey.id)}
                  onToggleSelection={() => toggleSelection(survey.id)}
                  onReview={handleReview}
                  isReviewing={isLoading}
                  renderAnswers={renderSurveyAnswers}
                  selectedForDetails={selectedSurvey}
                  onToggleDetails={setSelectedSurvey}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== QUESTION MANAGEMENT TAB ===== */}
      {activeTab === 'question_management' && (
        <div className="question-management-section">
          <h3>Survey Question Management</h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Update the labels/text that appear in your survey forms. These changes will be reflected in the 
            survey forms that users fill out.
          </p>
          
          {/* Question label management interface */}
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                        disabled={isLoading}
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
          
          {/* Action buttons */}
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
              disabled={isLoading}
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
              onClick={saveQuestionLabels}
              disabled={isLoading || !Array.isArray(surveyQuestions)}
              style={{
                padding: '10px 20px',
                backgroundColor: isLoading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? '⏳ Saving...' : '💾 Save Labels'}
            </button>
          </div>
        </div>
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h3>Survey Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Submission Trends</h4>
              <div className="trend-chart">
                <p>Analytics dashboard coming soon...</p>
                <div className="chart-placeholder">
                  📈 Interactive charts will be implemented here
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Category Breakdown</h4>
              <div className="category-stats">
                <div className="category-item">
                  <span>General Surveys</span>
                  <span className="count">45</span>
                </div>
                <div className="category-item">
                  <span>Feedback Forms</span>
                  <span className="count">23</span>
                </div>
                <div className="category-item">
                  <span>Assessments</span>
                  <span className="count">12</span>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Response Quality</h4>
              <div className="quality-metrics">
                <div className="metric">
                  <span>Avg. Completion Rate</span>
                  <span className="value">87%</span>
                </div>
                <div className="metric">
                  <span>Avg. Response Time</span>
                  <span className="value">12 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading states */}
      {isLoading && (
        <div className="review-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing request...</p>
        </div>
      )}
    </div>
  );
};

// ===============================================
// SURVEY CARD COMPONENT
// ===============================================

const SurveyCard = ({ 
  survey, 
  isSelected, 
  onToggleSelection, 
  onReview, 
  isReviewing,
  renderAnswers,
  selectedForDetails,
  onToggleDetails
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const showDetails = selectedForDetails === survey.id;

  return (
    <div className={`survey-card ${isSelected ? 'selected' : ''}`}>
      <div className="survey-header">
        <div className="survey-info">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="selection-checkbox"
          />
          <div className="user-info">
            <h4>
              {survey.username || 'Unknown User'}
              <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                #{survey.id}
              </span>
            </h4>
            <p className="user-email">{survey.user_email || survey.email}</p>
            <p className="submission-date">
              Submitted: {
                survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : 
                'Unknown date'
              }
            </p>
            {survey.application_ticket && (
              <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                <strong>Ticket:</strong> 
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {survey.application_ticket}
                </span>
              </p>
            )}
            {survey.survey_title && (
              <p style={{ margin: '5px 0 0 0', color: '#444', fontSize: '0.9em' }}>
                <strong>Title:</strong> {survey.survey_title}
              </p>
            )}
            {survey.survey_category && (
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.8em' }}>
                <strong>Category:</strong> 
                <span style={{ 
                  backgroundColor: '#e9ecef', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {survey.survey_category}
                </span>
              </p>
            )}
          </div>
        </div>
        
        <div className="survey-status">
          <span className={`status-badge ${survey.approval_status || 'pending'}`}>
            {(survey.approval_status || 'pending').toUpperCase()}
          </span>
          {survey.survey_type && (
            <span className="type-badge" style={{ marginTop: '5px', display: 'block' }}>
              {survey.survey_type.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced survey answers display */}
      <div className="survey-answers-section">
        <h5>📝 Survey Responses:</h5>
        {renderAnswers(survey.answers)}
      </div>

      {/* Additional survey info */}
      {(survey.completion_percentage || survey.time_spent_minutes) && (
        <div className="survey-metrics">
          {survey.completion_percentage && (
            <span className="metric">
              Completion: {survey.completion_percentage}%
            </span>
          )}
          {survey.time_spent_minutes && (
            <span className="metric">
              Time: {survey.time_spent_minutes} min
            </span>
          )}
        </div>
      )}

      <div className="survey-actions">
        <button 
          onClick={() => onToggleDetails(showDetails ? null : survey.id)}
          className="toggle-details-btn"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {(survey.approval_status === 'pending' || !survey.approval_status) && (
          <div className="review-actions">
            <button 
              onClick={() => onReview(survey.id, 'approved', reviewNotes)}
              className="approve-btn"
              disabled={isReviewing}
            >
              {isReviewing ? '⏳ Processing...' : '✅ Approve'}
            </button>
            <button 
              onClick={() => onReview(survey.id, 'rejected', reviewNotes)}
              className="reject-btn"
              disabled={isReviewing}
            >
              {isReviewing ? '⏳ Processing...' : '❌ Reject'}
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="survey-details">
          <h5>Review & Details:</h5>
          <div className="review-notes-section">
            <label>Review Notes:</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes for this review..."
              className="review-notes-input"
            />
          </div>
          
          {survey.admin_notes && (
            <div className="existing-notes">
              <strong>Previous Admin Notes:</strong>
              <p>{survey.admin_notes}</p>
            </div>
          )}
          
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Survey Data</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.85em',
              maxHeight: '300px',
              overflow: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              {JSON.stringify(survey, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default SurveyControls;