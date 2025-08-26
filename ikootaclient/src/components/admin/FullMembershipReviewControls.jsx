// ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// COMPLETELY FIXED VERSION - Direct API integration without custom fetch wrapper

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../service/api'; // Use the fixed api service
import './FullMembershipReviewControls.css';

const FullMembershipReviewControls = () => {
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const location = useLocation();

  // Detect if we're in admin context
  const isInAdminContext = location.pathname.includes('/admin');

  // Add context class to body for CSS targeting
  useEffect(() => {
    const bodyClass = 'full-membership-review-in-admin';
    
    if (isInAdminContext) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }

    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [isInAdminContext]);

  // ✅ FIXED: Direct API calls using the axios instance
  const testAdminEndpoints = async () => {
    try {
      console.log('🧪 Testing admin endpoints...');
      
      // Test 1: Simple admin test endpoint
      console.log('🧪 Testing admin test endpoint...');
      const testResponse = await api.get('/membership/admin/test');
      console.log('✅ Admin test response:', testResponse.data);

      // Test 2: Applications endpoint
      console.log('🧪 Testing applications endpoint...');
      const appsResponse = await api.get('/membership/admin/applications?status=pending');
      console.log('✅ Applications response:', appsResponse.data);

      // Test 3: Stats endpoint
      console.log('🧪 Testing stats endpoint...');
      const statsResponse = await api.get('/membership/admin/full-membership-stats');
      console.log('✅ Stats response:', statsResponse.data);

    } catch (error) {
      console.error('❌ Admin endpoint test failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        url: error.url
      });
    }
  };

  // ✅ Run tests on component mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Running admin endpoint tests...');
      testAdminEndpoints();
    }
  }, []); // Empty dependency array means run once on mount

  // ✅ FIXED: Applications query using direct axios calls
  const { 
    data: applicationsData, 
    isLoading: applicationsLoading, 
    error: applicationsError, 
    refetch: refetchApplications 
  } = useQuery({
    queryKey: ['admin', 'membership', 'applications', filterStatus],
    queryFn: async () => {
      try {
        console.log('🔍 QUERY: Fetching applications with status:', filterStatus);
        
        const response = await api.get(`/membership/admin/applications?status=${filterStatus}`);
        console.log("✅ SUCCESS: Applications response:", response.data);
        
        // Handle your backend response structure
        if (response.data?.success && response.data?.data) {
          return Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('⚠️ Unexpected response structure:', response.data);
          return [];
        }
        
      } catch (error) {
        console.error('❌ Applications query failed:', error);
        throw error; // Let React Query handle the error
      }
    },
    retry: 2,
    retryDelay: 1000,
    initialData: [],
    keepPreviousData: true
  });

  // ✅ FIXED: Stats query using direct axios calls
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['admin', 'membership', 'stats'],
    queryFn: async () => {
      try {
        console.log('🔍 QUERY: Fetching membership stats');
        
        const response = await api.get('/membership/admin/full-membership-stats');
        console.log("✅ STATS SUCCESS: Response:", response.data);
        
        // Handle your backend response structure
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        } else if (response.data?.pending !== undefined) {
          // Direct stats object
          return {
            pending: response.data.pending || 0,
            approved: response.data.approved || 0,
            declined: response.data.declined || 0,
            suspended: response.data.suspended || 0,
            total: response.data.total || 0
          };
        } else {
          console.warn('⚠️ Unexpected stats response:', response.data);
          return { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 };
        }
        
      } catch (error) {
        console.error('❌ Stats query failed:', error);
        return { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 };
      }
    },
    retry: 1,
    retryDelay: 1000,
    initialData: { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 }
  });

  // ✅ Ensure applications is always an array
  const applications = React.useMemo(() => {
    if (!applicationsData) {
      console.log('📋 No applications data, returning empty array');
      return [];
    }
    
    if (Array.isArray(applicationsData)) {
      console.log('📋 Applications is array with', applicationsData.length, 'items');
      return applicationsData;
    }
    
    console.warn('⚠️ Applications data is not array:', applicationsData);
    return [];
  }, [applicationsData]);

  // ✅ FIXED: Review mutation using direct axios calls
  const reviewMutation = useMutation({
    mutationFn: async ({ applicationId, decision, notes }) => {
      console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
      
      const response = await api.put(`/membership/admin/applications/${applicationId}/review`, {
        status: decision, 
        adminNotes: notes || ''
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Application review completed:', variables);
      queryClient.invalidateQueries(['admin', 'membership']);
      setSelectedApplications([]);
      alert(`Application ${variables.decision}d successfully!`);
    },
    onError: (error) => {
      console.error('❌ Error reviewing application:', error);
      const errorMessage = error.message || 'Unknown error';
      alert('Failed to review application: ' + errorMessage);
    }
  });

  // ✅ FIXED: Bulk review mutation using direct axios calls
  const bulkReviewMutation = useMutation({
    mutationFn: async ({ applicationIds, decision, notes }) => {
      console.log('🔍 BULK: Bulk reviewing applications:', { applicationIds, decision, notes });
      
      const response = await api.post('/membership/admin/applications/bulk-review', {
        applicationIds, 
        decision, 
        notes: notes || '' 
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Bulk review completed:', variables);
      queryClient.invalidateQueries(['admin', 'membership']);
      setSelectedApplications([]);
      alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
    },
    onError: (error) => {
      console.error('❌ Error in bulk review:', error);
      const errorMessage = error.message || 'Unknown error';
      alert('Failed to bulk review: ' + errorMessage);
    }
  });

  // Handle individual review
  const handleReview = (applicationId, decision, notes = '') => {
    if (!applicationId) {
      alert('Invalid application ID');
      return;
    }

    const confirmMessage = `Are you sure you want to ${decision} this application?`;
    if (window.confirm(confirmMessage)) {
      reviewMutation.mutate({ applicationId, decision, notes });
    }
  };

  // Handle bulk review
  const handleBulkReview = (decision, notes = '') => {
    if (selectedApplications.length === 0) {
      alert('Please select applications to review');
      return;
    }
    
    const confirmMessage = `Are you sure you want to ${decision} ${selectedApplications.length} application(s)?`;
    if (window.confirm(confirmMessage)) {
      bulkReviewMutation.mutate({ 
        applicationIds: selectedApplications, 
        decision, 
        notes 
      });
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
      const allIds = filteredApplications.map(app => app.id || app.user_id);
      setSelectedApplications(allIds);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedApplications([]);
  };

  // ✅ Enhanced application answers rendering
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
        return (
          <div className="full-membership-answers">
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

      // Handle object format
      if (typeof parsedAnswers === 'object') {
        return (
          <div className="full-membership-answers-object">
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
      collaborationStyle: 'Preferred collaboration style?'
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
    return answer;
  };

  // ✅ Filter applications
  const filteredApplications = React.useMemo(() => {
    if (!Array.isArray(applications)) {
      return [];
    }
    
    return applications.filter(app => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Check various possible field names for compatibility
      const searchableFields = [
        app?.email,
        app?.username,
        app?.membership_ticket
      ].filter(Boolean);
      
      // Check if any field contains the search term
      const fieldMatch = searchableFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
      
      return fieldMatch;
    });
  }, [applications, searchTerm]);

  if (applicationsLoading) {
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
        <h2>Full Membership Review</h2>
        {isInAdminContext && (
          <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
            (Admin Panel - Pre-member → Member Applications)
          </small>
        )}
        
        {/* ✅ Enhanced error display with debugging info */}
        {applicationsError && (
          <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #fcc' }}>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                ⚠️ API Error: {applicationsError.message}
              </summary>
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                <p><strong>Debugging Information:</strong></p>
                <ul>
                  <li>Error Type: {applicationsError.name}</li>
                  <li>Error Message: {applicationsError.message}</li>
                  <li>Status Code: {applicationsError.status}</li>
                  <li>URL: {applicationsError.url}</li>
                  <li>Applications Count: {applications.length}</li>
                  <li>Current Filter: {filterStatus}</li>
                </ul>
                <button 
                  onClick={() => refetchApplications()} 
                  style={{ marginTop: '10px', padding: '5px 10px' }}
                >
                  🔄 Retry Fetch
                </button>
              </div>
            </details>
          </div>
        )}
        
        {/* Stats Overview */}
        {stats && !statsError && (
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
              <h4>Declined</h4>
              <span className="stat-number declined">{stats?.declined || 0}</span>
            </div>
            <div className="stat-card">
              <h4>Total</h4>
              <span className="stat-number">{stats?.total || 0}</span>
            </div>
          </div>
        )}

        {statsError && (
          <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            <small>⚠️ Stats temporarily unavailable: {statsError.message}</small>
          </div>
        )}
      </div>

      {/* Enhanced Controls */}
      <div className="review-controls">
        <div className="control-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="control-group">
          <label>Search Applications:</label>
          <input
            type="text"
            placeholder="Search by email, name, ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">
              {selectedApplications.length} selected
            </span>
            <button 
              onClick={() => handleBulkReview('approved')}
              className="bulk-btn approve-btn"
              disabled={bulkReviewMutation.isPending}
            >
              Approve Selected
            </button>
            <button 
              onClick={() => handleBulkReview('declined')}
              className="bulk-btn decline-btn"
              disabled={bulkReviewMutation.isPending}
            >
              Decline Selected
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
          Select All ({filteredApplications.length})
        </button>
        <button onClick={clearSelection} className="clear-selection-btn">
          Clear Selection
        </button>
      </div>

      {/* Applications List */}
      <div className="applications-list">
        {filteredApplications.length === 0 ? (
          <div className="no-applications">
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
            <h4>No Full Membership Applications</h4>
            <p>No applications found for the current filters.</p>
            <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
              <p><strong>Debug Info:</strong></p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>Raw applications data: {Array.isArray(applications) ? `Array(${applications.length})` : typeof applications}</li>
                <li>Current filter: "{filterStatus}"</li>
                <li>Search term: "{searchTerm}"</li>
                <li>Has error: {!!applicationsError}</li>
                <li>Is loading: {applicationsLoading}</li>
              </ul>
              <button 
                onClick={() => refetchApplications()}
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
              >
                🔄 Retry Fetch
              </button>
              <button 
                onClick={() => testAdminEndpoints()}
                style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
              >
                🧪 Test Admin APIs
              </button>
            </div>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <EnhancedApplicationCard
              key={application.id || application.user_id}
              application={application}
              isSelected={selectedApplications.includes(application.id || application.user_id)}
              onToggleSelection={() => toggleSelection(application.id || application.user_id)}
              onReview={handleReview}
              isReviewing={reviewMutation.isPending}
              renderAnswers={renderApplicationAnswers}
              selectedForDetails={selectedApplication}
              onToggleDetails={setSelectedApplication}
            />
          ))
        )}
      </div>

      {/* Loading states */}
      {(reviewMutation.isPending || bulkReviewMutation.isPending) && (
        <div className="review-loading-overlay">
          <div className="loading-spinner"></div>
          <p>
            {reviewMutation.isPending && 'Processing review...'}
            {bulkReviewMutation.isPending && 'Processing bulk review...'}
          </p>
        </div>
      )}
    </div>
  );
};

// ✅ Enhanced Application Card Component
const EnhancedApplicationCard = ({ 
  application, 
  isSelected, 
  onToggleSelection, 
  onReview, 
  isReviewing,
  renderAnswers,
  selectedForDetails,
  onToggleDetails
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const applicationId = application.id || application.user_id;
  const showDetails = selectedForDetails === applicationId;

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
              {application.username || 'Unknown User'}
              <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                #{applicationId}
              </span>
            </h4>
            <p className="user-email">{application.email}</p>
            <p className="submission-date">
              Submitted: {
                application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 
                'Unknown date'
              }
            </p>
            {application.membership_ticket && (
              <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                <strong>Ticket:</strong> 
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {application.membership_ticket}
                </span>
              </p>
            )}
          </div>
        </div>
        
        <div className="application-status">
          <span className={`status-badge ${application.status || 'pending'}`}>
            {(application.status || 'pending').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Enhanced application answers display */}
      <div className="application-answers-section">
        <h5>📝 Application Responses:</h5>
        {renderAnswers(application.answers)}
      </div>

      <div className="application-actions">
        <button 
          onClick={() => onToggleDetails(showDetails ? null : applicationId)}
          className="toggle-details-btn"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {(application.status === 'pending' || !application.status) && (
          <div className="review-actions">
            <button 
              onClick={() => onReview(applicationId, 'approved', reviewNotes)}
              className="approve-btn"
              disabled={isReviewing}
            >
              {isReviewing ? '⏳ Processing...' : '✅ Approve'}
            </button>
            <button 
              onClick={() => onReview(applicationId, 'declined', reviewNotes)}
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
          <h5>Full Application Details:</h5>
          <div className="review-notes-section">
            <label>Review Notes:</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes for this review..."
              className="review-notes-input"
            />
          </div>
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

export default FullMembershipReviewControls;




// // ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// // FIXED VERSION: Robust API calls that work with your backend endpoints

// import React, { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useLocation } from 'react-router-dom';
// import './FullMembershipReviewControls.css';

// const FullMembershipReviewControls = () => {
//   const [selectedApplications, setSelectedApplications] = useState([]);
//   const [selectedApplication, setSelectedApplication] = useState(null);
//   const [filterStatus, setFilterStatus] = useState('pending');
//   const [searchTerm, setSearchTerm] = useState('');
//   const queryClient = useQueryClient();
//   const location = useLocation();

//   // Detect if we're in admin context
//   const isInAdminContext = location.pathname.includes('/admin');

//   // Add context class to body for CSS targeting
//   useEffect(() => {
//     const bodyClass = 'full-membership-review-in-admin';
    
//     if (isInAdminContext) {
//       document.body.classList.add(bodyClass);
//     } else {
//       document.body.classList.remove(bodyClass);
//     }

//     return () => {
//       document.body.classList.remove(bodyClass);
//     };
//   }, [isInAdminContext]);

//   // ✅ ROBUST API CALL FUNCTION - No dependency on external API service
//   const makeApiCall = async (endpoint, options = {}) => {
//     try {
//       console.log('🔍 API: Making request to endpoint:', endpoint);
      
//       // ✅ DIRECT FETCH - Build correct URL
//       let fullUrl;
      
//       // Always ensure we have the correct API prefix
//       if (endpoint.startsWith('/api/')) {
//         fullUrl = endpoint; // Already has /api prefix
//       } else if (endpoint.startsWith('/admin/')) {
//         fullUrl = `/api${endpoint}`; // Add /api prefix to admin routes
//       } else if (endpoint.startsWith('/')) {
//         fullUrl = `/api${endpoint}`; // Add /api prefix to other routes
//       } else {
//         fullUrl = `/api/${endpoint}`; // Add /api/ prefix
//       }

//       console.log('🔍 FETCH: Final URL:', fullUrl);
      
//       // Get token from localStorage for authentication
//       const token = localStorage.getItem('token');
      
//       const response = await fetch(fullUrl, {
//         method: options.method || 'GET',
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': token ? `Bearer ${token}` : '',
//           ...options.headers
//         },
//         body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
//       });
      
//       console.log('📡 FETCH: Response status:', response.status, response.statusText);
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       const text = await response.text();
//       console.log('📄 FETCH: Raw response preview:', text.substring(0, 100) + '...');
      
//       // Parse JSON response
//       try {
//         const jsonData = JSON.parse(text);
//         return { data: jsonData };
//       } catch (parseError) {
//         console.error('❌ FETCH: Failed to parse JSON. Response was:', text.substring(0, 500));
//         throw new Error(`Invalid JSON response from ${fullUrl}. Got: ${text.substring(0, 100)}...`);
//       }
//     } catch (error) {
//       console.error('❌ API Call failed for endpoint:', endpoint, error);
//       throw error;
//     }
//   };

//   // ✅ FIXED TEST FUNCTION - No dependency on external API
//   const testAdminEndpoints = async () => {
//     try {
//       // Test 1: Simple admin test endpoint
//       console.log('🧪 Testing admin test endpoint...');
//       const testResponse = await makeApiCall('/membership/admin/test');
//       console.log('✅ Admin test response:', testResponse.data);

//       // Test 2: Applications endpoint
//       console.log('🧪 Testing applications endpoint...');
//       const appsResponse = await makeApiCall('/membership/admin/applications?status=pending');
//       console.log('✅ Applications response:', appsResponse.data);

//       // Test 3: Stats endpoint
//       console.log('🧪 Testing stats endpoint...');
//       const statsResponse = await makeApiCall('/membership/admin/full-membership-stats');
//       console.log('✅ Stats response:', statsResponse.data);

//     } catch (error) {
//       console.error('❌ Admin endpoint test failed:', error);
//       // Show user-friendly error information
//       console.error('Error details:', {
//         message: error.message,
//         name: error.name
//       });
//     }
//   };

//   // ✅ Run tests on component mount (development only)
//   useEffect(() => {
//     if (process.env.NODE_ENV === 'development') {
//       console.log('🧪 Running admin endpoint tests...');
//       testAdminEndpoints();
//     }
//   }, []); // Empty dependency array means run once on mount

//   // ✅ APPLICATIONS QUERY - Direct API calls to your backend endpoints
//   const { 
//     data: applicationsData, 
//     isLoading: applicationsLoading, 
//     error: applicationsError, 
//     refetch: refetchApplications 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       try {
//         console.log('🔍 QUERY: Fetching applications with status:', filterStatus);
        
//         // ✅ DIRECT CALL to your backend endpoint
//         const response = await makeApiCall(`/membership/admin/applications?status=${filterStatus}`);
//         console.log("✅ SUCCESS: Applications response:", response);
        
//         // Handle your backend response structure
//         if (response?.data?.success && response.data?.data) {
//           return Array.isArray(response.data.data) ? response.data.data : [];
//         } else if (Array.isArray(response?.data)) {
//           return response.data;
//         } else {
//           console.warn('⚠️ Unexpected response structure:', response);
//           return [];
//         }
        
//       } catch (error) {
//         console.error('❌ Applications query failed:', error);
//         return []; // Return empty array instead of throwing
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//     initialData: [],
//     keepPreviousData: true
//   });

//   // ✅ STATS QUERY - Direct API calls to your backend endpoints
//   const { 
//     data: stats, 
//     isLoading: statsLoading, 
//     error: statsError 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 QUERY: Fetching membership stats');
        
//         // ✅ DIRECT CALL to your backend endpoint
//         const response = await makeApiCall('/membership/admin/full-membership-stats');
//         console.log("✅ STATS SUCCESS: Response:", response);
        
//         // Handle your backend response structure
//         if (response?.data?.success && response.data?.data) {
//           return response.data.data;
//         } else if (response?.data) {
//           // Extract stats from response
//           const data = response.data;
//           return {
//             pending: data.pending || 0,
//             approved: data.approved || 0,
//             declined: data.declined || 0,
//             suspended: data.suspended || 0,
//             total: data.total || 0
//           };
//         } else {
//           console.warn('⚠️ Unexpected stats response:', response);
//           return { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 };
//         }
        
//       } catch (error) {
//         console.error('❌ Stats query failed, using defaults:', error);
//         return { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//     initialData: { pending: 0, approved: 0, declined: 0, suspended: 0, total: 0 }
//   });

//   // ✅ Ensure applications is always an array
//   const applications = React.useMemo(() => {
//     if (!applicationsData) {
//       console.log('📋 No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 Applications is array with', applicationsData.length, 'items');
//       return applicationsData;
//     }
    
//     console.warn('⚠️ Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // ✅ REVIEW MUTATION - Direct API calls to your backend endpoints
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
      
//       const response = await makeApiCall(`/membership/admin/applications/${applicationId}/review`, {
//         method: 'PUT',
//         body: { 
//           status: decision, 
//           adminNotes: notes || ''
//         }
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error reviewing application:', error);
//       const errorMessage = error.message || 'Unknown error';
//       alert('Failed to review application: ' + errorMessage);
//     }
//   });

//   // ✅ BULK REVIEW MUTATION - Direct API calls to your backend endpoints
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 BULK: Bulk reviewing applications:', { applicationIds, decision, notes });
      
//       const response = await makeApiCall('/membership/admin/applications/bulk-review', {
//         method: 'POST',
//         body: { 
//           applicationIds, 
//           decision, 
//           notes: notes || '' 
//         }
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error in bulk review:', error);
//       const errorMessage = error.message || 'Unknown error';
//       alert('Failed to bulk review: ' + errorMessage);
//     }
//   });

//   // Handle individual review
//   const handleReview = (applicationId, decision, notes = '') => {
//     if (!applicationId) {
//       alert('Invalid application ID');
//       return;
//     }

//     const confirmMessage = `Are you sure you want to ${decision} this application?`;
//     if (window.confirm(confirmMessage)) {
//       reviewMutation.mutate({ applicationId, decision, notes });
//     }
//   };

//   // Handle bulk review
//   const handleBulkReview = (decision, notes = '') => {
//     if (selectedApplications.length === 0) {
//       alert('Please select applications to review');
//       return;
//     }
    
//     const confirmMessage = `Are you sure you want to ${decision} ${selectedApplications.length} application(s)?`;
//     if (window.confirm(confirmMessage)) {
//       bulkReviewMutation.mutate({ 
//         applicationIds: selectedApplications, 
//         decision, 
//         notes 
//       });
//     }
//   };

//   // Toggle application selection
//   const toggleSelection = (applicationId) => {
//     setSelectedApplications(prev => 
//       prev.includes(applicationId)
//         ? prev.filter(id => id !== applicationId)
//         : [...prev, applicationId]
//     );
//   };

//   // Select all applications
//   const selectAll = () => {
//     if (filteredApplications && filteredApplications.length > 0) {
//       const allIds = filteredApplications.map(app => app.id || app.user_id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // ✅ Enhanced application answers rendering
//   const renderApplicationAnswers = (answers) => {
//     try {
//       if (!answers) {
//         return (
//           <div className="no-answers">
//             <em>No answers provided</em>
//           </div>
//         );
//       }

//       let parsedAnswers;

//       // Handle string JSON data
//       if (typeof answers === 'string') {
//         try {
//           parsedAnswers = JSON.parse(answers);
//         } catch (parseError) {
//           return (
//             <div className="invalid-answers">
//               <strong>Application Response:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format (most common)
//       if (Array.isArray(parsedAnswers)) {
//         return (
//           <div className="full-membership-answers">
//             {parsedAnswers.map((answer, index) => (
//               <div key={index} className="answer-item">
//                 <div className="question-label">
//                   <strong>Question {index + 1}:</strong>
//                 </div>
//                 <div className="answer-value">
//                   {answer || 'No response provided'}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//       }

//       // Handle object format
//       if (typeof parsedAnswers === 'object') {
//         return (
//           <div className="full-membership-answers-object">
//             {Object.entries(parsedAnswers).map(([key, value], index) => (
//               <div key={index} className="answer-item">
//                 <div className="question-label">
//                   <strong>{formatQuestionLabel(key)}:</strong>
//                 </div>
//                 <div className="answer-value">
//                   {formatAnswerValue(value)}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//       }

//       // Fallback
//       return (
//         <div className="fallback-answers">
//           <strong>Application Response:</strong>
//           <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//             {JSON.stringify(parsedAnswers, null, 2)}
//           </pre>
//         </div>
//       );

//     } catch (error) {
//       console.error('❌ Error rendering answers:', error);
//       return (
//         <div className="error-answers">
//           <em style={{ color: 'red' }}>Error displaying answers: {error.message}</em>
//         </div>
//       );
//     }
//   };

//   // Helper function to format question labels
//   const formatQuestionLabel = (questionKey) => {
//     const labelMap = {
//       whyFullMembership: 'Why do you want full membership?',
//       contributionPlans: 'How will you contribute as a full member?',
//       educationalGoals: 'What are your educational goals?',
//       communityInvolvement: 'How do you plan to be involved in the community?',
//       previousExperience: 'Previous relevant experience?',
//       availability: 'What is your availability?',
//       specialSkills: 'What special skills do you bring?',
//       mentorshipInterest: 'Interest in mentoring others?',
//       researchInterests: 'Research interests and areas of expertise?',
//       collaborationStyle: 'Preferred collaboration style?'
//     };

//     return labelMap[questionKey] || 
//            questionKey.charAt(0).toUpperCase() + questionKey.slice(1);
//   };

//   // Helper function to format answer values
//   const formatAnswerValue = (answer) => {
//     if (answer === true || answer === 'true') {
//       return <span style={{ color: 'green' }}>✅ Yes</span>;
//     }
//     if (answer === false || answer === 'false') {
//       return <span style={{ color: 'red' }}>❌ No</span>;
//     }
//     if (!answer || answer === '') {
//       return <em style={{ color: '#888' }}>Not provided</em>;
//     }
//     return answer;
//   };

//   // ✅ Filter applications
//   const filteredApplications = React.useMemo(() => {
//     if (!Array.isArray(applications)) {
//       return [];
//     }
    
//     return applications.filter(app => {
//       if (!searchTerm) return true;
      
//       const searchLower = searchTerm.toLowerCase();
      
//       // Check various possible field names for compatibility
//       const searchableFields = [
//         app?.email,
//         app?.username,
//         app?.membership_ticket
//       ].filter(Boolean);
      
//       // Check if any field contains the search term
//       const fieldMatch = searchableFields.some(field => 
//         field.toLowerCase().includes(searchLower)
//       );
      
//       return fieldMatch;
//     });
//   }, [applications, searchTerm]);

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="membership-review-container">
//       {/* Context-aware header */}
//       <div className="review-header">
//         <h2>Full Membership Review</h2>
//         {isInAdminContext && (
//           <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
//             (Admin Panel - Pre-member → Member Applications)
//           </small>
//         )}
        
//         {/* ✅ Enhanced error display with debugging info */}
//         {applicationsError && (
//           <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #fcc' }}>
//             <details>
//               <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
//                 ⚠️ API Error: {applicationsError.message}
//               </summary>
//               <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
//                 <p><strong>Debugging Information:</strong></p>
//                 <ul>
//                   <li>Error Type: {applicationsError.name}</li>
//                   <li>Error Message: {applicationsError.message}</li>
//                   <li>Applications Count: {applications.length}</li>
//                   <li>Current Filter: {filterStatus}</li>
//                 </ul>
//                 <button 
//                   onClick={() => refetchApplications()} 
//                   style={{ marginTop: '10px', padding: '5px 10px' }}
//                 >
//                   🔄 Retry Fetch
//                 </button>
//               </div>
//             </details>
//           </div>
//         )}
        
//         {/* Stats Overview */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || 0}</span>
//             </div>
//           </div>
//         )}

//         {statsError && (
//           <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
//             <small>⚠️ Stats temporarily unavailable: {statsError.message}</small>
//           </div>
//         )}
//       </div>

//       {/* Enhanced Controls */}
//       <div className="review-controls">
//         <div className="control-group">
//           <label>Filter by Status:</label>
//           <select 
//             value={filterStatus} 
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="status-filter"
//           >
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="declined">Declined</option>
//             <option value="all">All</option>
//           </select>
//         </div>

//         <div className="control-group">
//           <label>Search Applications:</label>
//           <input
//             type="text"
//             placeholder="Search by email, name, ticket..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-input"
//           />
//         </div>

//         {/* Bulk Actions */}
//         {selectedApplications.length > 0 && (
//           <div className="bulk-actions">
//             <span className="selection-count">
//               {selectedApplications.length} selected
//             </span>
//             <button 
//               onClick={() => handleBulkReview('approved')}
//               className="bulk-btn approve-btn"
//               disabled={bulkReviewMutation.isPending}
//             >
//               Approve Selected
//             </button>
//             <button 
//               onClick={() => handleBulkReview('declined')}
//               className="bulk-btn decline-btn"
//               disabled={bulkReviewMutation.isPending}
//             >
//               Decline Selected
//             </button>
//             <button onClick={clearSelection} className="bulk-btn clear-btn">
//               Clear Selection
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Selection Controls */}
//       <div className="selection-controls">
//         <button onClick={selectAll} className="select-all-btn">
//           Select All ({filteredApplications.length})
//         </button>
//         <button onClick={clearSelection} className="clear-selection-btn">
//           Clear Selection
//         </button>
//       </div>

//       {/* Applications List */}
//       <div className="applications-list">
//         {filteredApplications.length === 0 ? (
//           <div className="no-applications">
//             <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
//             <h4>No Full Membership Applications</h4>
//             <p>No applications found for the current filters.</p>
//             <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
//               <p><strong>Debug Info:</strong></p>
//               <ul style={{ textAlign: 'left', display: 'inline-block' }}>
//                 <li>Raw applications data: {Array.isArray(applications) ? `Array(${applications.length})` : typeof applications}</li>
//                 <li>Current filter: "{filterStatus}"</li>
//                 <li>Search term: "{searchTerm}"</li>
//                 <li>Has error: {!!applicationsError}</li>
//                 <li>Is loading: {applicationsLoading}</li>
//               </ul>
//               <button 
//                 onClick={() => refetchApplications()}
//                 style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔄 Retry Fetch
//               </button>
//               <button 
//                 onClick={() => testAdminEndpoints()}
//                 style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🧪 Test Admin APIs
//               </button>
//             </div>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id || application.user_id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id || application.user_id)}
//               onToggleSelection={() => toggleSelection(application.id || application.user_id)}
//               onReview={handleReview}
//               isReviewing={reviewMutation.isPending}
//               renderAnswers={renderApplicationAnswers}
//               selectedForDetails={selectedApplication}
//               onToggleDetails={setSelectedApplication}
//             />
//           ))
//         )}
//       </div>

//       {/* Loading states */}
//       {(reviewMutation.isPending || bulkReviewMutation.isPending) && (
//         <div className="review-loading-overlay">
//           <div className="loading-spinner"></div>
//           <p>
//             {reviewMutation.isPending && 'Processing review...'}
//             {bulkReviewMutation.isPending && 'Processing bulk review...'}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// // ✅ Enhanced Application Card Component
// const EnhancedApplicationCard = ({ 
//   application, 
//   isSelected, 
//   onToggleSelection, 
//   onReview, 
//   isReviewing,
//   renderAnswers,
//   selectedForDetails,
//   onToggleDetails
// }) => {
//   const [reviewNotes, setReviewNotes] = useState('');
//   const applicationId = application.id || application.user_id;
//   const showDetails = selectedForDetails === applicationId;

//   return (
//     <div className={`application-card ${isSelected ? 'selected' : ''}`}>
//       <div className="application-header">
//         <div className="application-info">
//           <input
//             type="checkbox"
//             checked={isSelected}
//             onChange={onToggleSelection}
//             className="selection-checkbox"
//           />
//           <div className="user-info">
//             <h4>
//               {application.username || 'Unknown User'}
//               <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
//                 #{applicationId}
//               </span>
//             </h4>
//             <p className="user-email">{application.email}</p>
//             <p className="submission-date">
//               Submitted: {
//                 application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 
//                 'Unknown date'
//               }
//             </p>
//             {application.membership_ticket && (
//               <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
//                 <strong>Ticket:</strong> 
//                 <span style={{ 
//                   fontFamily: 'monospace', 
//                   backgroundColor: '#f0f0f0', 
//                   padding: '2px 6px', 
//                   borderRadius: '3px',
//                   marginLeft: '5px'
//                 }}>
//                   {application.membership_ticket}
//                 </span>
//               </p>
//             )}
//           </div>
//         </div>
        
//         <div className="application-status">
//           <span className={`status-badge ${application.status || 'pending'}`}>
//             {(application.status || 'pending').toUpperCase()}
//           </span>
//         </div>
//       </div>

//       {/* Enhanced application answers display */}
//       <div className="application-answers-section">
//         <h5>📝 Application Responses:</h5>
//         {renderAnswers(application.answers)}
//       </div>

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : applicationId)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(applicationId, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(applicationId, 'declined', reviewNotes)}
//               className="decline-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '❌ Decline'}
//             </button>
//           </div>
//         )}
//       </div>

//       {showDetails && (
//         <div className="application-details">
//           <h5>Full Application Details:</h5>
//           <div className="review-notes-section">
//             <label>Review Notes:</label>
//             <textarea
//               value={reviewNotes}
//               onChange={(e) => setReviewNotes(e.target.value)}
//               placeholder="Add notes for this review..."
//               className="review-notes-input"
//             />
//           </div>
//           <details style={{ marginTop: '15px' }}>
//             <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Application Data</summary>
//             <pre style={{ 
//               whiteSpace: 'pre-wrap', 
//               fontSize: '0.85em',
//               maxHeight: '300px',
//               overflow: 'auto',
//               backgroundColor: '#f8f9fa',
//               padding: '10px',
//               borderRadius: '4px',
//               marginTop: '10px'
//             }}>
//               {JSON.stringify(application, null, 2)}
//             </pre>
//           </details>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FullMembershipReviewControls;







// // ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// // FIXED VERSION: Corrected API endpoints and error handling

// import React, { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useLocation } from 'react-router-dom';
// import './FullMembershipReviewControls.css';

// // ✅ Use your existing API service
// let api;
// try {
//   api = require('../service/api').default;
// } catch (error) {
//   console.log('Custom API service not found, using fetch');
//   api = null;
// }

// const FullMembershipReviewControls = () => {
//   const [selectedApplications, setSelectedApplications] = useState([]);
//   const [selectedApplication, setSelectedApplication] = useState(null);
//   const [filterStatus, setFilterStatus] = useState('pending');
//   const [searchTerm, setSearchTerm] = useState('');
//   const queryClient = useQueryClient();
//   const location = useLocation();

//   // Detect if we're in admin context
//   const isInAdminContext = location.pathname.includes('/admin');

//   // Add context class to body for CSS targeting
//   useEffect(() => {
//     const bodyClass = 'full-membership-review-in-admin';
    
//     if (isInAdminContext) {
//       document.body.classList.add(bodyClass);
//     } else {
//       document.body.classList.remove(bodyClass);
//     }

//     return () => {
//       document.body.classList.remove(bodyClass);
//     };
//   }, [isInAdminContext]);

//   // ✅ FIXED: Enhanced API call function with proper endpoint detection
//   const makeApiCall = async (endpoint, options = {}) => {
//     try {
//       console.log('🔍 API: Making request to endpoint:', endpoint);
      
//       if (api) {
//         // Use custom API service if available
//         const method = options.method?.toLowerCase() || 'get';
//         if (method === 'get') {
//           return await api.get(endpoint);
//         } else if (method === 'put') {
//           return await api.put(endpoint, options.body);
//         } else if (method === 'post') {
//           return await api.post(endpoint, options.body);
//         }
//       } else {
//         // ✅ FIXED: Build correct URL based on server setup
//         let fullUrl;
        
//         // Check if endpoint already starts with /api
//         if (endpoint.startsWith('/api/')) {
//           fullUrl = endpoint; // Use as-is
//         } else if (endpoint.startsWith('/admin/')) {
//           // Admin endpoints need /api prefix
//           fullUrl = `/api${endpoint}`;
//         } else if (endpoint.startsWith('/')) {
//           // Other endpoints need /api prefix
//           fullUrl = `/api${endpoint}`;
//         } else {
//           // No leading slash, add /api/
//           fullUrl = `/api/${endpoint}`;
//         }

//         console.log('🔍 FETCH: Final URL:', fullUrl);
        
//         const response = await fetch(fullUrl, {
//           credentials: 'include',
//           headers: {
//             'Content-Type': 'application/json',
//             ...options.headers
//           },
//           ...options
//         });
        
//         console.log('📡 FETCH: Response status:', response.status, response.statusText);
        
//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }
        
//         const text = await response.text();
//         console.log('📄 FETCH: Raw response preview:', text.substring(0, 100) + '...');
        
//         // Check if response is JSON
//         try {
//           const jsonData = JSON.parse(text);
//           return { data: jsonData };
//         } catch (parseError) {
//           console.error('❌ FETCH: Failed to parse JSON. Response was:', text.substring(0, 500));
//           throw new Error(`Invalid JSON response from ${fullUrl}. Got: ${text.substring(0, 100)}...`);
//         }
//       }
//     } catch (error) {
//       console.error('❌ API Call failed for endpoint:', endpoint, error);
//       throw error;
//     }
//   };


//  // ✅ TEST FUNCTION: Add this after makeApiCall function
//   const testAdminEndpoints = async () => {
//     try {
//       // Test 1: Simple admin test endpoint
//       console.log('🧪 Testing admin test endpoint...');
//       const testResponse = await api.get('/membership/admin/test');
//       console.log('✅ Admin test response:', testResponse.data);

//       // Test 2: Applications endpoint
//       console.log('🧪 Testing applications endpoint...');
//       const appsResponse = await api.get('/membership/admin/applications?status=pending');
//       console.log('✅ Applications response:', appsResponse.data);

//       // Test 3: Stats endpoint
//       console.log('🧪 Testing stats endpoint...');
//       const statsResponse = await api.get('/membership/admin/full-membership-stats');
//       console.log('✅ Stats response:', statsResponse.data);

//     } catch (error) {
//       console.error('❌ Admin endpoint test failed:', error);
//       console.error('Response data:', error.response?.data);
//       console.error('Response status:', error.response?.status);
//       console.error('Response headers:', error.response?.headers);
//     }
//   };

//   // ✅ ALSO ADD: useEffect to automatically run tests on component mount
//   useEffect(() => {
//     // Run endpoint tests when component mounts (development only)
//     if (process.env.NODE_ENV === 'development') {
//       console.log('🧪 Running admin endpoint tests...');
//       testAdminEndpoints();
//     }
//   }, []); // Empty dependency array means run once on mount



//   // ✅ FIXED: Applications query with corrected endpoint
//   const { 
//     data: applicationsData, 
//     isLoading: applicationsLoading, 
//     error: applicationsError, 
//     refetch: refetchApplications 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       try {
//         console.log('🔍 QUERY: Fetching applications with status:', filterStatus);
        
//         // ✅ Try multiple endpoint patterns to find the working one
//         const endpoints = [
//           `/membership/admin/applications?status=${filterStatus}`,
//           `/api/membership/admin/applications?status=${filterStatus}`,
//           `/membership/admin/full-membership-applications?status=${filterStatus}`
//         ];

//         let lastError;
//         for (const endpoint of endpoints) {
//           try {
//             console.log('🔍 TRYING: Endpoint:', endpoint);
//             const response = await makeApiCall(endpoint);
//             console.log("✅ SUCCESS: Response from", endpoint, ":", response);
            
//             // Handle different response structures
//             if (response?.data?.success && response.data?.data) {
//               return Array.isArray(response.data.data) ? response.data.data : [];
//             } else if (Array.isArray(response?.data)) {
//               return response.data;
//             } else if (response?.data) {
//               return [];
//             }
//           } catch (error) {
//             console.log('❌ FAILED: Endpoint', endpoint, 'error:', error.message);
//             lastError = error;
//             continue;
//           }
//         }
        
//         // If all endpoints failed, throw the last error
//         throw lastError || new Error('All endpoint attempts failed');
        
//       } catch (error) {
//         console.error('❌ Applications query failed:', error);
//         return []; // Return empty array instead of throwing
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//     initialData: [],
//     keepPreviousData: true
//   });

//   // ✅ FIXED: Stats query with corrected endpoint
//   const { 
//     data: stats, 
//     isLoading: statsLoading, 
//     error: statsError 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 QUERY: Fetching membership stats');
        
//         // ✅ Try multiple endpoint patterns for stats
//         const endpoints = [
//           '/membership/admin/full-membership-stats',
//           '/api/membership/admin/full-membership-stats',
//           '/membership/admin/stats'
//         ];

//         let lastError;
//         for (const endpoint of endpoints) {
//           try {
//             console.log('🔍 TRYING: Stats endpoint:', endpoint);
//             const response = await makeApiCall(endpoint);
//             console.log("✅ STATS SUCCESS: Response from", endpoint, ":", response);
            
//             // Handle different response structures
//             if (response?.data?.success && response.data?.data) {
//               return response.data.data;
//             } else if (response?.data) {
//               // Try to extract stats from response
//               const data = response.data;
//               return {
//                 pending: data.pending || data.pendingCount || 0,
//                 approved: data.approved || data.approvedCount || 0,
//                 declined: data.declined || data.declinedCount || 0,
//                 total: data.total || data.totalApplications || 0
//               };
//             }
//           } catch (error) {
//             console.log('❌ FAILED: Stats endpoint', endpoint, 'error:', error.message);
//             lastError = error;
//             continue;
//           }
//         }
        
//         // Return default stats if all endpoints failed
//         console.warn('⚠️ All stats endpoints failed, using defaults');
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
        
//       } catch (error) {
//         console.error('❌ Stats query failed, using defaults:', error);
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//     initialData: { pending: 0, approved: 0, declined: 0, total: 0 }
//   });

//   // ✅ Ensure applications is always an array
//   const applications = React.useMemo(() => {
//     if (!applicationsData) {
//       console.log('📋 No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 Applications is array with', applicationsData.length, 'items');
//       return applicationsData;
//     }
    
//     console.warn('⚠️ Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // ✅ Review individual application mutation
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
      
//       const endpoints = [
//         `/membership/admin/review/${applicationId}`,
//         `/membership/admin/full-membership/review/${applicationId}`
//       ];

//       let lastError;
//       for (const endpoint of endpoints) {
//         try {
//           const response = await makeApiCall(endpoint, {
//             method: 'PUT',
//             body: JSON.stringify({ 
//               status: decision, 
//               adminNotes: notes || ''
//             })
//           });
//           return response.data;
//         } catch (error) {
//           lastError = error;
//           continue;
//         }
//       }
      
//       throw lastError || new Error('Review failed');
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error reviewing application:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//       alert('Failed to review application: ' + errorMessage);
//     }
//   });

//   // ✅ Bulk review mutation
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 BULK: Bulk reviewing applications:', { applicationIds, decision, notes });
      
//       const endpoints = [
//         '/membership/admin/bulk-review',
//         '/membership/admin/full-membership/bulk-review'
//       ];

//       let lastError;
//       for (const endpoint of endpoints) {
//         try {
//           const response = await makeApiCall(endpoint, {
//             method: 'POST',
//             body: JSON.stringify({ 
//               applicationIds, 
//               decision, 
//               notes: notes || '' 
//             })
//           });
//           return response.data;
//         } catch (error) {
//           lastError = error;
//           continue;
//         }
//       }
      
//       throw lastError || new Error('Bulk review failed');
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error in bulk review:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//       alert('Failed to bulk review: ' + errorMessage);
//     }
//   });

//   // Handle individual review
//   const handleReview = (applicationId, decision, notes = '') => {
//     if (!applicationId) {
//       alert('Invalid application ID');
//       return;
//     }

//     const confirmMessage = `Are you sure you want to ${decision} this application?`;
//     if (window.confirm(confirmMessage)) {
//       reviewMutation.mutate({ applicationId, decision, notes });
//     }
//   };

//   // Handle bulk review
//   const handleBulkReview = (decision, notes = '') => {
//     if (selectedApplications.length === 0) {
//       alert('Please select applications to review');
//       return;
//     }
    
//     const confirmMessage = `Are you sure you want to ${decision} ${selectedApplications.length} application(s)?`;
//     if (window.confirm(confirmMessage)) {
//       bulkReviewMutation.mutate({ 
//         applicationIds: selectedApplications, 
//         decision, 
//         notes 
//       });
//     }
//   };

//   // Toggle application selection
//   const toggleSelection = (applicationId) => {
//     setSelectedApplications(prev => 
//       prev.includes(applicationId)
//         ? prev.filter(id => id !== applicationId)
//         : [...prev, applicationId]
//     );
//   };

//   // Select all applications
//   const selectAll = () => {
//     if (filteredApplications && filteredApplications.length > 0) {
//       const allIds = filteredApplications.map(app => app.id || app.user_id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // ✅ Enhanced application answers rendering
//   const renderApplicationAnswers = (answers) => {
//     try {
//       if (!answers) {
//         return (
//           <div className="no-answers">
//             <em>No answers provided</em>
//           </div>
//         );
//       }

//       let parsedAnswers;

//       // Handle string JSON data
//       if (typeof answers === 'string') {
//         try {
//           parsedAnswers = JSON.parse(answers);
//         } catch (parseError) {
//           return (
//             <div className="invalid-answers">
//               <strong>Application Response:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format (most common)
//       if (Array.isArray(parsedAnswers)) {
//         return (
//           <div className="full-membership-answers">
//             {parsedAnswers.map((answer, index) => (
//               <div key={index} className="answer-item">
//                 <div className="question-label">
//                   <strong>Question {index + 1}:</strong>
//                 </div>
//                 <div className="answer-value">
//                   {answer || 'No response provided'}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//       }

//       // Handle object format
//       if (typeof parsedAnswers === 'object') {
//         return (
//           <div className="full-membership-answers-object">
//             {Object.entries(parsedAnswers).map(([key, value], index) => (
//               <div key={index} className="answer-item">
//                 <div className="question-label">
//                   <strong>{formatQuestionLabel(key)}:</strong>
//                 </div>
//                 <div className="answer-value">
//                   {formatAnswerValue(value)}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//       }

//       // Fallback
//       return (
//         <div className="fallback-answers">
//           <strong>Application Response:</strong>
//           <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//             {JSON.stringify(parsedAnswers, null, 2)}
//           </pre>
//         </div>
//       );

//     } catch (error) {
//       console.error('❌ Error rendering answers:', error);
//       return (
//         <div className="error-answers">
//           <em style={{ color: 'red' }}>Error displaying answers: {error.message}</em>
//         </div>
//       );
//     }
//   };

//   // Helper function to format question labels
//   const formatQuestionLabel = (questionKey) => {
//     const labelMap = {
//       whyFullMembership: 'Why do you want full membership?',
//       contributionPlans: 'How will you contribute as a full member?',
//       educationalGoals: 'What are your educational goals?',
//       communityInvolvement: 'How do you plan to be involved in the community?',
//       previousExperience: 'Previous relevant experience?',
//       availability: 'What is your availability?',
//       specialSkills: 'What special skills do you bring?',
//       mentorshipInterest: 'Interest in mentoring others?',
//       researchInterests: 'Research interests and areas of expertise?',
//       collaborationStyle: 'Preferred collaboration style?'
//     };

//     return labelMap[questionKey] || 
//            questionKey.charAt(0).toUpperCase() + questionKey.slice(1);
//   };

//   // Helper function to format answer values
//   const formatAnswerValue = (answer) => {
//     if (answer === true || answer === 'true') {
//       return <span style={{ color: 'green' }}>✅ Yes</span>;
//     }
//     if (answer === false || answer === 'false') {
//       return <span style={{ color: 'red' }}>❌ No</span>;
//     }
//     if (!answer || answer === '') {
//       return <em style={{ color: '#888' }}>Not provided</em>;
//     }
//     return answer;
//   };

//   // ✅ Filter applications
//   const filteredApplications = React.useMemo(() => {
//     if (!Array.isArray(applications)) {
//       return [];
//     }
    
//     return applications.filter(app => {
//       if (!searchTerm) return true;
      
//       const searchLower = searchTerm.toLowerCase();
      
//       // Check various possible field names for compatibility
//       const searchableFields = [
//         app?.user_email,
//         app?.user_name,
//         app?.username,
//         app?.email,
//         app?.membership_ticket,
//         app?.ticket
//       ].filter(Boolean);
      
//       // Check if any field contains the search term
//       const fieldMatch = searchableFields.some(field => 
//         field.toLowerCase().includes(searchLower)
//       );
      
//       // Check answers/responses
//       const answersMatch = (
//         (typeof app?.answers === 'string' && app.answers.toLowerCase().includes(searchLower)) ||
//         (typeof app?.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchLower)) ||
//         (Array.isArray(app?.answers) && app.answers.some(answer => 
//           typeof answer === 'string' && answer.toLowerCase().includes(searchLower)
//         ))
//       );
      
//       return fieldMatch || answersMatch;
//     });
//   }, [applications, searchTerm]);

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="membership-review-container">
//       {/* Context-aware header */}
//       <div className="review-header">
//         <h2>Full Membership Review</h2>
//         {isInAdminContext && (
//           <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
//             (Admin Panel - Pre-member → Member Applications)
//           </small>
//         )}
        
//         {/* ✅ Enhanced error display with debugging info */}
//         {applicationsError && (
//           <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #fcc' }}>
//             <details>
//               <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
//                 ⚠️ API Error: {applicationsError.message}
//               </summary>
//               <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
//                 <p><strong>Debugging Information:</strong></p>
//                 <ul>
//                   <li>Error Type: {applicationsError.name}</li>
//                   <li>Error Message: {applicationsError.message}</li>
//                   <li>Applications Count: {applications.length}</li>
//                   <li>Current Filter: {filterStatus}</li>
//                 </ul>
//                 <button 
//                   onClick={() => refetchApplications()} 
//                   style={{ marginTop: '10px', padding: '5px 10px' }}
//                 >
//                   🔄 Retry Fetch
//                 </button>
//               </div>
//             </details>
//           </div>
//         )}
        
//         {/* Stats Overview */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || 0}</span>
//             </div>
//           </div>
//         )}

//         {statsError && (
//           <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
//             <small>⚠️ Stats temporarily unavailable: {statsError.message}</small>
//           </div>
//         )}
//       </div>

//       {/* Enhanced Controls */}
//       <div className="review-controls">
//         <div className="control-group">
//           <label>Filter by Status:</label>
//           <select 
//             value={filterStatus} 
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="status-filter"
//           >
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="declined">Declined</option>
//             <option value="all">All</option>
//           </select>
//         </div>

//         <div className="control-group">
//           <label>Search Applications:</label>
//           <input
//             type="text"
//             placeholder="Search by email, name, ticket, or responses..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-input"
//           />
//         </div>

//         {/* Bulk Actions */}
//         {selectedApplications.length > 0 && (
//           <div className="bulk-actions">
//             <span className="selection-count">
//               {selectedApplications.length} selected
//             </span>
//             <button 
//               onClick={() => handleBulkReview('approve')}
//               className="bulk-btn approve-btn"
//               disabled={bulkReviewMutation.isPending}
//             >
//               Approve Selected
//             </button>
//             <button 
//               onClick={() => handleBulkReview('decline')}
//               className="bulk-btn decline-btn"
//               disabled={bulkReviewMutation.isPending}
//             >
//               Decline Selected
//             </button>
//             <button onClick={clearSelection} className="bulk-btn clear-btn">
//               Clear Selection
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Selection Controls */}
//       <div className="selection-controls">
//         <button onClick={selectAll} className="select-all-btn">
//           Select All ({filteredApplications.length})
//         </button>
//         <button onClick={clearSelection} className="clear-selection-btn">
//           Clear Selection
//         </button>
//       </div>

//       {/* Applications List */}
//       <div className="applications-list">
//         {filteredApplications.length === 0 ? (
//           <div className="no-applications">
//             <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
//             <h4>No Full Membership Applications</h4>
//             <p>No applications found for the current filters.</p>
//             <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
//               <p><strong>Debug Info:</strong></p>
//               <ul style={{ textAlign: 'left', display: 'inline-block' }}>
//                 <li>Raw applications data: {Array.isArray(applications) ? `Array(${applications.length})` : typeof applications}</li>
//                 <li>Current filter: "{filterStatus}"</li>
//                 <li>Search term: "{searchTerm}"</li>
//                 <li>Has error: {!!applicationsError}</li>
//                 <li>Is loading: {applicationsLoading}</li>
//                 <li>Database has 1 pending application (user_id: 7, status: pending)</li>
//               </ul>
//               <button 
//                 onClick={() => {
//                   console.log('📊 Debug dump:', { 
//                     applications, 
//                     applicationsData, 
//                     filteredApplications, 
//                     applicationsError,
//                     applicationsLoading 
//                   });
//                   alert('Check browser console for debug info');
//                 }}
//                 style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔍 Debug Data
//               </button>
//               <button 
//                 onClick={() => refetchApplications()}
//                 style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔄 Retry Fetch
//               </button>
//             </div>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id || application.user_id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id || application.user_id)}
//               onToggleSelection={() => toggleSelection(application.id || application.user_id)}
//               onReview={handleReview}
//               isReviewing={reviewMutation.isPending}
//               renderAnswers={renderApplicationAnswers}
//               selectedForDetails={selectedApplication}
//               onToggleDetails={setSelectedApplication}
//             />
//           ))
//         )}
//       </div>

//       {/* Loading states */}
//       {(reviewMutation.isPending || bulkReviewMutation.isPending) && (
//         <div className="review-loading-overlay">
//           <div className="loading-spinner"></div>
//           <p>
//             {reviewMutation.isPending && 'Processing review...'}
//             {bulkReviewMutation.isPending && 'Processing bulk review...'}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// // ✅ Enhanced Application Card Component
// const EnhancedApplicationCard = ({ 
//   application, 
//   isSelected, 
//   onToggleSelection, 
//   onReview, 
//   isReviewing,
//   renderAnswers,
//   selectedForDetails,
//   onToggleDetails
// }) => {
//   const [reviewNotes, setReviewNotes] = useState('');
//   const applicationId = application.id || application.user_id;
//   const showDetails = selectedForDetails === applicationId;

//   return (
//     <div className={`application-card ${isSelected ? 'selected' : ''}`}>
//       <div className="application-header">
//         <div className="application-info">
//           <input
//             type="checkbox"
//             checked={isSelected}
//             onChange={onToggleSelection}
//             className="selection-checkbox"
//           />
//           <div className="user-info">
//             <h4>
//               {application.user_name || application.username || 'Unknown User'}
//               <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
//                 #{applicationId}
//               </span>
//             </h4>
//             <p className="user-email">{application.user_email || application.email}</p>
//             <p className="submission-date">
//               Submitted: {
//                 application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
//                 application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 
//                 'Unknown date'
//               }
//             </p>
//             {(application.membership_ticket || application.ticket) && (
//               <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
//                 <strong>Ticket:</strong> 
//                 <span style={{ 
//                   fontFamily: 'monospace', 
//                   backgroundColor: '#f0f0f0', 
//                   padding: '2px 6px', 
//                   borderRadius: '3px',
//                   marginLeft: '5px'
//                 }}>
//                   {application.membership_ticket || application.ticket}
//                 </span>
//               </p>
//             )}
//           </div>
//         </div>
        
//         <div className="application-status">
//           <span className={`status-badge ${application.status || 'pending'}`}>
//             {(application.status || 'pending').toUpperCase()}
//           </span>
//         </div>
//       </div>

//       {/* Enhanced application answers display */}
//       <div className="application-answers-section">
//         <h5>📝 Application Responses:</h5>
//         {renderAnswers(application.answers || application.responses)}
//       </div>

//       {/* Admin Notes */}
//       {(application.admin_notes || application.adminNotes) && (
//         <div style={{ 
//           backgroundColor: '#e8f4fd', 
//           padding: '10px', 
//           borderRadius: '5px',
//           marginBottom: '15px'
//         }}>
//           <strong>Admin Notes:</strong> {application.admin_notes || application.adminNotes}
//         </div>
//       )}

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : applicationId)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(applicationId, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(applicationId, 'declined', reviewNotes)}
//               className="decline-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '❌ Decline'}
//             </button>
//           </div>
//         )}
//       </div>

//       {showDetails && (
//         <div className="application-details">
//           <h5>Full Application Details:</h5>
//           <div className="review-notes-section">
//             <label>Review Notes:</label>
//             <textarea
//               value={reviewNotes}
//               onChange={(e) => setReviewNotes(e.target.value)}
//               placeholder="Add notes for this review..."
//               className="review-notes-input"
//             />
//           </div>
//           <details style={{ marginTop: '15px' }}>
//             <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Application Data</summary>
//             <pre style={{ 
//               whiteSpace: 'pre-wrap', 
//               fontSize: '0.85em',
//               maxHeight: '300px',
//               overflow: 'auto',
//               backgroundColor: '#f8f9fa',
//               padding: '10px',
//               borderRadius: '4px',
//               marginTop: '10px'
//             }}>
//               {JSON.stringify(application, null, 2)}
//             </pre>
//           </details>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FullMembershipReviewControls;


