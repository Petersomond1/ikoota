import React, { useState, useEffect } from 'react';
import './membershipReviewControls.css';

const MembershipReviewControls = () => {
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [isLoading, setIsLoading] = useState(false);
  const [applicationsData, setApplicationsData] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0, 
    pending_initial: 0, 
    pending_full: 0, 
    approved_initial: 0, 
    approved_full: 0, 
    declined_applications: 0, 
    total_applications: 0 
  });
  const [fullMembershipStats, setFullMembershipStats] = useState({
    pending_full_applications: 0, 
    approved_full_applications: 0, 
    declined_full_applications: 0, 
    total_full_applications: 0, 
    avg_full_processing_days: 0 
  });
  const [error, setError] = useState(null);

  // Mock API function - replace with your actual API implementation
  const mockApiCall = async (endpoint, options = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock responses based on endpoint
    if (endpoint.includes('/membership/admin/applications')) {
      return {
        data: {
          success: true,
          data: [
            {
              id: 1,
              user_id: 101,
              username: 'john_doe',
              email: 'john@example.com',
              application_type: 'initial_application',
              status: 'pending',
              approval_status: 'pending',
              application_ticket: 'APP-JOHN-12345',
              answers: [
                { question: 'fullName', answer: 'John Doe' },
                { question: 'reasonForJoining', answer: 'Interested in learning and contributing to the community' },
                { question: 'educationalGoals', answer: 'To expand my knowledge in technology and collaborate with like-minded individuals' }
              ],
              createdAt: '2025-01-15T10:30:00Z',
              days_pending: 5
            },
            {
              id: 2,
              user_id: 102,
              username: 'jane_smith',
              email: 'jane@example.com',
              application_type: 'full_membership',
              status: 'pending',
              approval_status: 'pending',
              full_membership_ticket: 'FM-JANE-67890',
              answers: [
                { question: 'whyFullMembership', answer: 'I want to take on more responsibilities and help guide new members' },
                { question: 'contributionPlans', answer: 'I plan to mentor newcomers and contribute to community projects' },
                { question: 'previousExperience', answer: '3 years in community management and project coordination' }
              ],
              createdAt: '2025-01-10T14:20:00Z',
              days_pending: 10
            }
          ]
        }
      };
    } else if (endpoint.includes('/membership/admin/stats')) {
      return {
        data: {
          success: true,
          data: {
            total_users: 150,
            pending_initial: 12,
            pending_full: 5,
            approved_initial: 98,
            approved_full: 35,
            declined_applications: 8,
            total_applications: 158
          }
        }
      };
    } else if (endpoint.includes('/membership/admin/full-membership-stats')) {
      return {
        data: {
          success: true,
          data: {
            pending_full_applications: 5,
            approved_full_applications: 35,
            declined_full_applications: 3,
            total_full_applications: 43,
            avg_full_processing_days: 7.5
          }
        }
      };
    }
    
    // Default success response
    return { data: { success: true, message: 'Operation completed successfully' } };
  };

  // Detect if we're in admin context (mock implementation)
  const isInAdminContext = true; // You can replace this with actual routing logic

  // Add context class to body for CSS targeting
  useEffect(() => {
    const bodyClass = 'membership-review-in-admin';
    
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

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching membership applications with filters:', { filterStatus, filterType });
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      
      const response = await mockApiCall(`/membership/admin/applications?${params}`);
      console.log("✅ Applications response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setApplicationsData(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (Array.isArray(response.data)) {
        setApplicationsData(response.data);
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data);
        setApplicationsData([]);
      }
      
    } catch (error) {
      console.error('❌ Applications query failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching membership stats');
      
      const response = await mockApiCall('/membership/admin/stats');
      console.log("✅ STATS SUCCESS: Response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      } else if (response.data?.stats) {
        setStats(response.data.stats);
      } else if (response.data?.total_users !== undefined) {
        setStats({
          total_users: response.data.total_users || 0,
          pending_initial: response.data.pending_initial || 0,
          pending_full: response.data.pending_full || 0,
          approved_initial: response.data.approved_initial || 0,
          approved_full: response.data.approved_full || 0,
          declined_applications: response.data.declined_applications || 0,
          total_applications: response.data.total_applications || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Stats query failed:', error);
    }
  };

  const fetchFullMembershipStats = async () => {
    try {
      console.log('🔍 Fetching full membership stats');
      
      const response = await mockApiCall('/membership/admin/full-membership-stats');
      console.log("✅ Full membership stats response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setFullMembershipStats(response.data.data);
      } else if (response.data?.pending_full_applications !== undefined) {
        setFullMembershipStats({
          pending_full_applications: response.data.pending_full_applications || 0,
          approved_full_applications: response.data.approved_full_applications || 0,
          declined_full_applications: response.data.declined_full_applications || 0,
          total_full_applications: response.data.total_full_applications || 0,
          avg_full_processing_days: response.data.avg_full_processing_days || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Full membership stats query failed:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchStats();
    fetchFullMembershipStats();
  }, []);

  // ===============================================
  // ACTION HANDLERS
  // ===============================================

  // Handle individual review
  const handleReview = async (applicationId, decision, notes = '') => {
    if (!applicationId) {
      alert('Invalid application ID');
      return;
    }

    const confirmMessage = `Are you sure you want to ${decision} this application?`;
    if (window.confirm(confirmMessage)) {
      try {
        console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
        
        const response = await mockApiCall(`/membership/admin/applications/${applicationId}/review`, {
          method: 'PUT',
          body: {
            status: decision, 
            adminNotes: notes || ''
          }
        });
        
        console.log('✅ Application review completed:', { applicationId, decision });
        
        // Refresh data
        await fetchApplications();
        await fetchStats();
        await fetchFullMembershipStats();
        
        setSelectedApplications([]);
        alert(`Application ${decision}d successfully!`);
        
      } catch (error) {
        console.error('❌ Error reviewing application:', error);
        alert('Failed to review application: ' + error.message);
      }
    }
  };

  // Handle bulk review
  const handleBulkReview = async (decision, notes = '') => {
    if (selectedApplications.length === 0) {
      alert('Please select applications to review');
      return;
    }
    
    const confirmMessage = `Are you sure you want to ${decision} ${selectedApplications.length} application(s)?`;
    if (window.confirm(confirmMessage)) {
      try {
        console.log('🔍 BULK: Bulk reviewing applications:', { selectedApplications, decision, notes });
        
        const response = await mockApiCall('/membership/admin/applications/bulk-review', {
          method: 'POST',
          body: {
            applicationIds: selectedApplications, 
            decision, 
            notes: notes || '' 
          }
        });
        
        console.log('✅ Bulk review completed:', { count: selectedApplications.length, decision });
        
        // Refresh data
        await fetchApplications();
        await fetchStats();
        await fetchFullMembershipStats();
        
        setSelectedApplications([]);
        alert(`${selectedApplications.length} applications ${decision}d successfully!`);
        
      } catch (error) {
        console.error('❌ Error in bulk review:', error);
        alert('Failed to bulk review: ' + error.message);
      }
    }
  };

  // Toggle application selection
  const toggleSelection = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  // Select all applications
  const selectAll = () => {
    if (filteredApplications && filteredApplications.length > 0) {
      const allIds = filteredApplications.map(app => app.id || app.user_id || app.application_id);
      setSelectedApplications(allIds);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedApplications([]);
  };

  // ===============================================
  // UTILITY FUNCTIONS
  // ===============================================

  // Enhanced application answers rendering
  const renderApplicationAnswers = (answers) => {
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
              <strong>Application Response:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                {answers}
              </pre>
            </div>
          );
        }
      } else {
        parsedAnswers = answers;
      }

      // Handle array format (most common)
      if (Array.isArray(parsedAnswers)) {
        // Check if it's array of objects with question/answer structure
        if (parsedAnswers.length > 0 && typeof parsedAnswers[0] === 'object' && parsedAnswers[0].question) {
          return (
            <div className="membership-answers-detailed">
              {parsedAnswers.map((answer, index) => (
                <div key={index} className="answer-item">
                  <div className="question-label">
                    <strong>{formatQuestionLabel(answer.question)}:</strong>
                  </div>
                  <div className="answer-value">
                    {formatAnswerValue(answer.answer)}
                  </div>
                </div>
              ))}
            </div>
          );
        } else {
          // Simple array format
          return (
            <div className="membership-answers-simple">
              {parsedAnswers.map((answer, index) => (
                <div key={index} className="answer-item">
                  <div className="question-label">
                    <strong>Question {index + 1}:</strong>
                  </div>
                  <div className="answer-value">
                    {answer || 'No response provided'}
                  </div>
                </div>
              ))}
            </div>
          );
        }
      }

      // Handle object format
      if (typeof parsedAnswers === 'object') {
        return (
          <div className="membership-answers-object">
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

      // Fallback
      return (
        <div className="fallback-answers">
          <strong>Application Response:</strong>
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
      whyFullMembership: 'Why do you want full membership?',
      contributionPlans: 'How will you contribute as a full member?',
      educationalGoals: 'What are your educational goals?',
      communityInvolvement: 'How do you plan to be involved in the community?',
      previousExperience: 'Previous relevant experience?',
      availability: 'What is your availability?',
      specialSkills: 'What special skills do you bring?',
      mentorshipInterest: 'Interest in mentoring others?',
      researchInterests: 'Research interests and areas of expertise?',
      collaborationStyle: 'Preferred collaboration style?',
      // Initial application questions
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
      reasonForJoining: 'Reason for Joining',
      expectedContributions: 'Expected Contributions'
    };

    return labelMap[questionKey] || 
           questionKey.charAt(0).toUpperCase() + questionKey.slice(1);
  };

  // Helper function to format answer values
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
    
    if (typeof answer === 'object') {
      if (Array.isArray(answer)) {
        return <span>{answer.join(', ')}</span>;
      } else {
        return <span>{JSON.stringify(answer)}</span>;
      }
    }
    
    return <span>{String(answer)}</span>;
  };

  // Filter applications
  const filteredApplications = React.useMemo(() => {
    if (!Array.isArray(applicationsData)) {
      return [];
    }
    
    return applicationsData.filter(app => {
      // Status filter
      if (filterStatus !== 'all' && app.status !== filterStatus && app.approval_status !== filterStatus) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'initial' && app.application_type !== 'initial_application') {
          return false;
        }
        if (filterType === 'full_membership' && app.application_type !== 'full_membership') {
          return false;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          app?.email,
          app?.username,
          app?.application_ticket,
          app?.membership_ticket,
          app?.full_membership_ticket
        ].filter(Boolean);
        
        const fieldMatch = searchableFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        return fieldMatch;
      }
      
      return true;
    });
  }, [applicationsData, filterStatus, filterType, searchTerm]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading membership applications...</p>
      </div>
    );
  }

  return (
    <div className="membership-review-container">
      {/* Context-aware header */}
      <div className="review-header">
        <h2>Membership Application Review</h2>
        {isInAdminContext && (
          <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
            (Admin Panel - All Membership Applications)
          </small>
        )}
        
        {/* Enhanced error display with debugging info */}
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
                  <li>Applications Count: {applicationsData.length}</li>
                  <li>Current Filter: {filterStatus}</li>
                </ul>
                <button 
                  onClick={() => fetchApplications()} 
                  style={{ marginTop: '10px', padding: '5px 10px' }}
                >
                  🔄 Retry Fetch
                </button>
              </div>
            </details>
          </div>
        )}

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <h4>Total Users</h4>
            <span className="stat-number">{stats.total_users}</span>
          </div>
          <div className="stat-card">
            <h4>Pending Initial</h4>
            <span className="stat-number">{stats.pending_initial}</span>
          </div>
          <div className="stat-card">
            <h4>Pending Full</h4>
            <span className="stat-number">{stats.pending_full}</span>
          </div>
          <div className="stat-card">
            <h4>Approved Initial</h4>
            <span className="stat-number approved">{stats.approved_initial}</span>
          </div>
          <div className="stat-card">
            <h4>Approved Full</h4>
            <span className="stat-number approved">{stats.approved_full}</span>
          </div>
          <div className="stat-card">
            <h4>Declined</h4>
            <span className="stat-number declined">{stats.declined_applications}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} 
          onClick={() => setActiveTab('applications')}
        >
          Applications ({applicationsData.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} 
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="applications-section">
          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="control-group">
              <label>Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div className="control-group">
              <label>Type:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="initial">Initial</option>
                <option value="full_membership">Full Membership</option>
              </select>
            </div>

            <div className="control-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search by username, email, ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedApplications.length} selected</span>
              <button onClick={() => handleBulkReview('approved')}>
                Approve Selected
              </button>
              <button onClick={() => handleBulkReview('declined')}>
                Decline Selected
              </button>
              <button onClick={clearSelection}>Clear Selection</button>
            </div>
          )}

          {/* Selection Controls */}
          <div className="selection-controls">
            <button onClick={selectAll}>Select All</button>
            <button onClick={clearSelection}>Clear Selection</button>
          </div>

          {/* Applications List */}
          <div className="applications-list">
            {filteredApplications.length === 0 ? (
              <div className="no-applications">
                <h3>No Applications Found</h3>
                <p>No applications match the current filters.</p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isSelected={selectedApplications.includes(app.id)}
                  onToggleSelection={() => toggleSelection(app.id)}
                  onReview={handleReview}
                  renderAnswers={renderApplicationAnswers}
                  selectedForDetails={selectedApplication}
                  onToggleDetails={setSelectedApplication}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h3>Application Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Processing Time</h4>
              <p>Average: {fullMembershipStats.avg_full_processing_days} days</p>
            </div>
            
            <div className="analytics-card">
              <h4>Approval Rate</h4>
              <p>
                {fullMembershipStats.total_full_applications > 0 
                  ? Math.round((fullMembershipStats.approved_full_applications / fullMembershipStats.total_full_applications) * 100)
                  : 0}%
              </p>
            </div>
            
            <div className="analytics-card">
              <h4>Total Applications</h4>
              <p>{stats.total_applications}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===============================================
// APPLICATION CARD COMPONENT
// ===============================================

const ApplicationCard = ({ 
  application, 
  isSelected, 
  onToggleSelection, 
  onReview,
  renderAnswers,
  selectedForDetails,
  onToggleDetails
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const showDetails = selectedForDetails === application.id;

  return (
    <div className={`application-card ${isSelected ? 'selected' : ''}`}>
      <div className="application-header">
        <div className="application-info">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
          />
          <div className="user-info">
            <h4>{application.username || 'Unknown User'}</h4>
            <p>{application.email}</p>
            <p>Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
            <p>Type: {application.application_type}</p>
            {application.application_ticket && (
              <p>Ticket: {application.application_ticket}</p>
            )}
            {application.full_membership_ticket && (
              <p>FM Ticket: {application.full_membership_ticket}</p>
            )}
          </div>
        </div>
        
        <div className="application-status">
          <span className={`status-badge ${application.approval_status || application.status}`}>
            {(application.approval_status || application.status || 'pending').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Application answers */}
      <div className="application-answers">
        <h5>Application Responses:</h5>
        {renderAnswers(application.answers)}
      </div>

      <div className="application-actions">
        <button 
          onClick={() => onToggleDetails(showDetails ? null : application.id)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {(application.approval_status === 'pending' || application.status === 'pending') && (
          <div className="review-actions">
            <button 
              onClick={() => onReview(application.id, 'approved', reviewNotes)}
              className="approve-btn"
            >
              Approve
            </button>
            <button 
              onClick={() => onReview(application.id, 'declined', reviewNotes)}
              className="decline-btn"
            >
              Decline
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="application-details">
          <h5>Review Details:</h5>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add notes for this review..."
          />
          
          <details>
            <summary>Raw Application Data</summary>
            <pre>{JSON.stringify(application, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MembershipReviewControls;