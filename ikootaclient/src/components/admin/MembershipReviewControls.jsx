import React, { useState, useEffect } from 'react';
import './membershipReviewControls.css';
import api from '../service/api';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';

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
      setError(null);
      console.log('🔍 Fetching membership applications with filters:', { filterStatus, filterType, searchTerm });
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);
      
      // ✅ FIXED: Use real API call with proper GET method
      const response = await api.get(`/membership/admin/applications?${params}`);
      console.log("✅ Applications response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setApplicationsData(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (Array.isArray(response.data)) {
        setApplicationsData(response.data);
      } else {
        console.warn('⚠️ Unexpected applications response structure:', response.data);
        setApplicationsData([]);
      }
      
    } catch (error) {
      console.error('❌ Applications query failed:', error);
      setError(error.message);
      setApplicationsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching membership stats');
      
      // ✅ FIXED: Use real API call
      const response = await api.get('/membership/admin/stats');
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
      } else {
        // Fallback to empty stats if unexpected structure
        setStats({
          total_users: 0, 
          pending_initial: 0, 
          pending_full: 0, 
          approved_initial: 0, 
          approved_full: 0, 
          declined_applications: 0, 
          total_applications: 0 
        });
      }
      
    } catch (error) {
      console.error('❌ Stats query failed:', error);
      // Don't set error state for stats failure, just log it
    }
  };

  const fetchFullMembershipStats = async () => {
    try {
      console.log('🔍 Fetching full membership stats');
      
      // ✅ FIXED: Use real API call
      const response = await api.get('/membership/admin/full-membership-stats');
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
      } else {
        // Fallback to empty stats if unexpected structure
        setFullMembershipStats({
          pending_full_applications: 0, 
          approved_full_applications: 0, 
          declined_full_applications: 0, 
          total_full_applications: 0, 
          avg_full_processing_days: 0 
        });
      }
      
    } catch (error) {
      console.error('❌ Full membership stats query failed:', error);
      // Don't set error state for stats failure, just log it
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterType, searchTerm]);

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
        setIsLoading(true);
        console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
        
        // ✅ FIXED: Use proper PUT method instead of GET with method option
        const response = await api.put(`/membership/admin/applications/${applicationId}/review`, {
          status: decision, 
          adminNotes: notes || ''
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
      } finally {
        setIsLoading(false);
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
        setIsLoading(true);
        console.log('🔍 BULK: Bulk reviewing applications:', { selectedApplications, decision, notes });
        
        // ✅ FIXED: Use proper POST method instead of GET with method option
        const response = await api.post('/membership/admin/applications/bulk-review', {
          applicationIds: selectedApplications, 
          decision, 
          notes: notes || '' 
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
      } finally {
        setIsLoading(false);
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
      // Status filter - check both new and old field names for compatibility
      if (filterStatus !== 'all' && 
          app.status !== filterStatus && 
          app.approval_status !== filterStatus) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'initial' && 
            app.survey_type !== 'initial_application' && 
            app.application_type !== 'initial_application') {
          return false;
        }
        if (filterType === 'full_membership' && 
            app.survey_type !== 'full_membership' && 
            app.application_type !== 'full_membership') {
          return false;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          getFullConverseId(app),
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

  if (isLoading && applicationsData.length === 0) {
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
                  <li>Applications Count: {applicationsData?.length || 0}</li>
                  <li>Current Filter: {filterStatus}</li>
                  <li>Filter Type: {filterType}</li>
                  <li>Search Term: {searchTerm}</li>
                  <li>Is Loading: {isLoading}</li>
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
                <option value="under_review">Under Review</option>
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
                placeholder="Search by converse ID, ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedApplications.length} selected</span>
              <button 
                onClick={() => handleBulkReview('approved')}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Approve Selected'}
              </button>
              <button 
                onClick={() => handleBulkReview('declined')}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Decline Selected'}
              </button>
              <button onClick={clearSelection}>Clear Selection</button>
            </div>
          )}

          {/* Selection Controls */}
          <div className="selection-controls">
            <button onClick={selectAll}>
              Select All ({filteredApplications.length})
            </button>
            <button onClick={clearSelection}>Clear Selection</button>
          </div>

          {/* Applications List */}
          <div className="applications-list">
            {filteredApplications.length === 0 ? (
              <div className="no-applications">
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <h4>No Applications Found</h4>
                <p>No applications match the current filters.</p>
                <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
                  <p><strong>Debug Info:</strong></p>
                  <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Raw applications data: {Array.isArray(applicationsData) ? `Array(${applicationsData.length})` : typeof applicationsData}</li>
                    <li>Current status filter: "{filterStatus}"</li>
                    <li>Current type filter: "{filterType}"</li>
                    <li>Search term: "{searchTerm}"</li>
                    <li>Has error: {!!error}</li>
                    <li>Is loading: {isLoading}</li>
                  </ul>
                  <button 
                    onClick={() => fetchApplications()}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
                  >
                    🔄 Retry Fetch
                  </button>
                </div>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id || app.user_id}
                  application={app}
                  isSelected={selectedApplications.includes(app.id)}
                  onToggleSelection={() => toggleSelection(app.id)}
                  onReview={handleReview}
                  renderAnswers={renderApplicationAnswers}
                  selectedForDetails={selectedApplication}
                  onToggleDetails={setSelectedApplication}
                  isReviewing={isLoading}
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
              <div className="metric-display">
                <span className="metric-value">
                  {fullMembershipStats.avg_full_processing_days || 0}
                </span>
                <span className="metric-unit">days average</span>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Approval Rate</h4>
              <div className="metric-display">
                <span className="metric-value">
                  {fullMembershipStats.total_full_applications > 0 
                    ? Math.round((fullMembershipStats.approved_full_applications / fullMembershipStats.total_full_applications) * 100)
                    : 0}
                </span>
                <span className="metric-unit">%</span>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Total Applications</h4>
              <div className="metric-display">
                <span className="metric-value">{stats.total_applications}</span>
                <span className="metric-unit">applications</span>
              </div>
            </div>

            <div className="analytics-card">
              <h4>Full Membership Stats</h4>
              <div className="detailed-stats">
                <div className="stat-row">
                  <span>Pending:</span> 
                  <span>{fullMembershipStats.pending_full_applications}</span>
                </div>
                <div className="stat-row">
                  <span>Approved:</span> 
                  <span>{fullMembershipStats.approved_full_applications}</span>
                </div>
                <div className="stat-row">
                  <span>Declined:</span> 
                  <span>{fullMembershipStats.declined_full_applications}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for actions */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div className="loading-spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 2s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p>Processing request...</p>
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
  onToggleDetails,
  isReviewing
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
            className="selection-checkbox"
          />
          <div className="user-info">
            <h4>
              {getSecureDisplayName(application, DISPLAY_CONTEXTS.COMPACT) || 'Unknown User'}
              <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                #{application.id}
              </span>
            </h4>
            <p className="user-converse-id">{getFullConverseId(application)}</p>
            <p className="application-date">
              Applied: {application.createdAt ? 
                new Date(application.createdAt).toLocaleDateString() : 
                'Unknown date'
              }
            </p>
            <p className="application-type">
              Type: <span style={{ 
                backgroundColor: '#e9ecef', 
                padding: '2px 6px', 
                borderRadius: '3px',
                fontSize: '0.8em'
              }}>
                {(application.survey_type || application.application_type)?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            </p>
            {application.application_ticket && (
              <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                <strong>Ticket:</strong> 
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {application.application_ticket}
                </span>
              </p>
            )}
            {application.full_membership_ticket && (
              <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                <strong>FM Ticket:</strong> 
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {application.full_membership_ticket}
                </span>
              </p>
            )}
            {application.days_pending && (
              <p style={{ margin: '5px 0 0 0', color: '#e67e22', fontSize: '0.8em' }}>
                <strong>Pending:</strong> {application.days_pending} days
              </p>
            )}
          </div>
        </div>
        
        <div className="application-status">
          <span className={`status-badge ${application.status || application.approval_status || 'pending'}`}>
            {(application.status || application.approval_status || 'pending').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Application answers */}
      <div className="application-answers">
        <h5>📝 Application Responses:</h5>
        {renderAnswers(application.answers)}
      </div>

      <div className="application-actions">
        <button 
          onClick={() => onToggleDetails(showDetails ? null : application.id)}
          className="toggle-details-btn"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {((application.status === 'pending' || application.approval_status === 'pending') || 
          (!application.status && !application.approval_status)) && (
          <div className="review-actions">
            <button 
              onClick={() => onReview(application.id, 'approved', reviewNotes)}
              className="approve-btn"
              disabled={isReviewing}
            >
              {isReviewing ? '⏳ Processing...' : '✅ Approve'}
            </button>
            <button 
              onClick={() => onReview(application.id, 'declined', reviewNotes)}
              className="decline-btn"
              disabled={isReviewing}
            >
              {isReviewing ? '⏳ Processing...' : '❌ Decline'}
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="application-details">
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
          
          {(application.admin_notes || application.notes) && (
            <div className="existing-notes">
              <strong>Previous Admin Notes:</strong>
              <p>{application.admin_notes || application.notes}</p>
            </div>
          )}
          
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Application Data</summary>
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
              {JSON.stringify(application, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MembershipReviewControls;










