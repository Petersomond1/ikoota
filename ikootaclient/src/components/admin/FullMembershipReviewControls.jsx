// ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// FIXED VERSION: Corrected API endpoints and error handling

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import './FullMembershipReviewControls.css';

// ✅ Use your existing API service
let api;
try {
  api = require('../service/api').default;
} catch (error) {
  console.log('Custom API service not found, using fetch');
  api = null;
}

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

  // ✅ FIXED: Enhanced API call function with proper endpoint detection
  const makeApiCall = async (endpoint, options = {}) => {
    try {
      console.log('🔍 API: Making request to endpoint:', endpoint);
      
      if (api) {
        // Use custom API service if available
        const method = options.method?.toLowerCase() || 'get';
        if (method === 'get') {
          return await api.get(endpoint);
        } else if (method === 'put') {
          return await api.put(endpoint, options.body);
        } else if (method === 'post') {
          return await api.post(endpoint, options.body);
        }
      } else {
        // ✅ FIXED: Build correct URL based on server setup
        let fullUrl;
        
        // Check if endpoint already starts with /api
        if (endpoint.startsWith('/api/')) {
          fullUrl = endpoint; // Use as-is
        } else if (endpoint.startsWith('/admin/')) {
          // Admin endpoints need /api prefix
          fullUrl = `/api${endpoint}`;
        } else if (endpoint.startsWith('/')) {
          // Other endpoints need /api prefix
          fullUrl = `/api${endpoint}`;
        } else {
          // No leading slash, add /api/
          fullUrl = `/api/${endpoint}`;
        }

        console.log('🔍 FETCH: Final URL:', fullUrl);
        
        const response = await fetch(fullUrl, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        console.log('📡 FETCH: Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('📄 FETCH: Raw response preview:', text.substring(0, 100) + '...');
        
        // Check if response is JSON
        try {
          const jsonData = JSON.parse(text);
          return { data: jsonData };
        } catch (parseError) {
          console.error('❌ FETCH: Failed to parse JSON. Response was:', text.substring(0, 500));
          throw new Error(`Invalid JSON response from ${fullUrl}. Got: ${text.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.error('❌ API Call failed for endpoint:', endpoint, error);
      throw error;
    }
  };

  // ✅ FIXED: Applications query with corrected endpoint
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
        
        // ✅ Try multiple endpoint patterns to find the working one
        const endpoints = [
          `/admin/membership/applications?status=${filterStatus}`,
          `/api/admin/membership/applications?status=${filterStatus}`,
          `/admin/membership/full-membership-applications?status=${filterStatus}`
        ];

        let lastError;
        for (const endpoint of endpoints) {
          try {
            console.log('🔍 TRYING: Endpoint:', endpoint);
            const response = await makeApiCall(endpoint);
            console.log("✅ SUCCESS: Response from", endpoint, ":", response);
            
            // Handle different response structures
            if (response?.data?.success && response.data?.data) {
              return Array.isArray(response.data.data) ? response.data.data : [];
            } else if (Array.isArray(response?.data)) {
              return response.data;
            } else if (response?.data) {
              return [];
            }
          } catch (error) {
            console.log('❌ FAILED: Endpoint', endpoint, 'error:', error.message);
            lastError = error;
            continue;
          }
        }
        
        // If all endpoints failed, throw the last error
        throw lastError || new Error('All endpoint attempts failed');
        
      } catch (error) {
        console.error('❌ Applications query failed:', error);
        return []; // Return empty array instead of throwing
      }
    },
    retry: 1,
    retryDelay: 1000,
    initialData: [],
    keepPreviousData: true
  });

  // ✅ FIXED: Stats query with corrected endpoint
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['admin', 'membership', 'stats'],
    queryFn: async () => {
      try {
        console.log('🔍 QUERY: Fetching membership stats');
        
        // ✅ Try multiple endpoint patterns for stats
        const endpoints = [
          '/admin/membership/full-membership-stats',
          '/api/admin/membership/full-membership-stats',
          '/admin/membership/stats'
        ];

        let lastError;
        for (const endpoint of endpoints) {
          try {
            console.log('🔍 TRYING: Stats endpoint:', endpoint);
            const response = await makeApiCall(endpoint);
            console.log("✅ STATS SUCCESS: Response from", endpoint, ":", response);
            
            // Handle different response structures
            if (response?.data?.success && response.data?.data) {
              return response.data.data;
            } else if (response?.data) {
              // Try to extract stats from response
              const data = response.data;
              return {
                pending: data.pending || data.pendingCount || 0,
                approved: data.approved || data.approvedCount || 0,
                declined: data.declined || data.declinedCount || 0,
                total: data.total || data.totalApplications || 0
              };
            }
          } catch (error) {
            console.log('❌ FAILED: Stats endpoint', endpoint, 'error:', error.message);
            lastError = error;
            continue;
          }
        }
        
        // Return default stats if all endpoints failed
        console.warn('⚠️ All stats endpoints failed, using defaults');
        return { pending: 0, approved: 0, declined: 0, total: 0 };
        
      } catch (error) {
        console.error('❌ Stats query failed, using defaults:', error);
        return { pending: 0, approved: 0, declined: 0, total: 0 };
      }
    },
    retry: 1,
    retryDelay: 1000,
    initialData: { pending: 0, approved: 0, declined: 0, total: 0 }
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

  // ✅ Review individual application mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ applicationId, decision, notes }) => {
      console.log('🔍 REVIEW: Reviewing application:', { applicationId, decision, notes });
      
      const endpoints = [
        `/admin/membership/review/${applicationId}`,
        `/admin/membership/full-membership/review/${applicationId}`
      ];

      let lastError;
      for (const endpoint of endpoints) {
        try {
          const response = await makeApiCall(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ 
              status: decision, 
              adminNotes: notes || ''
            })
          });
          return response.data;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      throw lastError || new Error('Review failed');
    },
    onSuccess: (data, variables) => {
      console.log('✅ Application review completed:', variables);
      queryClient.invalidateQueries(['admin', 'membership']);
      setSelectedApplications([]);
      alert(`Application ${variables.decision}d successfully!`);
    },
    onError: (error) => {
      console.error('❌ Error reviewing application:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Failed to review application: ' + errorMessage);
    }
  });

  // ✅ Bulk review mutation
  const bulkReviewMutation = useMutation({
    mutationFn: async ({ applicationIds, decision, notes }) => {
      console.log('🔍 BULK: Bulk reviewing applications:', { applicationIds, decision, notes });
      
      const endpoints = [
        '/admin/membership/bulk-review',
        '/admin/membership/full-membership/bulk-review'
      ];

      let lastError;
      for (const endpoint of endpoints) {
        try {
          const response = await makeApiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify({ 
              applicationIds, 
              decision, 
              notes: notes || '' 
            })
          });
          return response.data;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      throw lastError || new Error('Bulk review failed');
    },
    onSuccess: (data, variables) => {
      console.log('✅ Bulk review completed:', variables);
      queryClient.invalidateQueries(['admin', 'membership']);
      setSelectedApplications([]);
      alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
    },
    onError: (error) => {
      console.error('❌ Error in bulk review:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
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
        app?.user_email,
        app?.user_name,
        app?.username,
        app?.email,
        app?.membership_ticket,
        app?.ticket
      ].filter(Boolean);
      
      // Check if any field contains the search term
      const fieldMatch = searchableFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
      
      // Check answers/responses
      const answersMatch = (
        (typeof app?.answers === 'string' && app.answers.toLowerCase().includes(searchLower)) ||
        (typeof app?.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchLower)) ||
        (Array.isArray(app?.answers) && app.answers.some(answer => 
          typeof answer === 'string' && answer.toLowerCase().includes(searchLower)
        ))
      );
      
      return fieldMatch || answersMatch;
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
            placeholder="Search by email, name, ticket, or responses..."
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
              onClick={() => handleBulkReview('approve')}
              className="bulk-btn approve-btn"
              disabled={bulkReviewMutation.isPending}
            >
              Approve Selected
            </button>
            <button 
              onClick={() => handleBulkReview('decline')}
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
                <li>Database has 1 pending application (user_id: 7, status: pending)</li>
              </ul>
              <button 
                onClick={() => {
                  console.log('📊 Debug dump:', { 
                    applications, 
                    applicationsData, 
                    filteredApplications, 
                    applicationsError,
                    applicationsLoading 
                  });
                  alert('Check browser console for debug info');
                }}
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
              >
                🔍 Debug Data
              </button>
              <button 
                onClick={() => refetchApplications()}
                style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
              >
                🔄 Retry Fetch
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
              {application.user_name || application.username || 'Unknown User'}
              <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                #{applicationId}
              </span>
            </h4>
            <p className="user-email">{application.user_email || application.email}</p>
            <p className="submission-date">
              Submitted: {
                application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
                application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 
                'Unknown date'
              }
            </p>
            {(application.membership_ticket || application.ticket) && (
              <p style={{ margin: '0', color: '#666', fontSize: '0.8em' }}>
                <strong>Ticket:</strong> 
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}>
                  {application.membership_ticket || application.ticket}
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
        {renderAnswers(application.answers || application.responses)}
      </div>

      {/* Admin Notes */}
      {(application.admin_notes || application.adminNotes) && (
        <div style={{ 
          backgroundColor: '#e8f4fd', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <strong>Admin Notes:</strong> {application.admin_notes || application.adminNotes}
        </div>
      )}

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
// // FIXED VERSION: Proper error handling and data sourcing

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

//   // ✅ FIXED: Enhanced API call function with better error handling
//   const makeApiCall = async (url, options = {}) => {
//     try {
//       if (api) {
//         const method = options.method?.toLowerCase() || 'get';
//         if (method === 'get') {
//           return await api.get(url);
//         } else if (method === 'put') {
//           return await api.put(url, options.body);
//         } else if (method === 'post') {
//           return await api.post(url, options.body);
//         }
//       } else {
//         // Fallback to fetch
//         const fullUrl = url.startsWith('/') ? `/api${url}` : url;
//         console.log('🔍 FETCH: Making request to:', fullUrl);
        
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
//         console.log('📄 FETCH: Raw response text:', text.substring(0, 200) + '...');
        
//         // Check if response is JSON
//         try {
//           const jsonData = JSON.parse(text);
//           return { data: jsonData };
//         } catch (parseError) {
//           console.error('❌ FETCH: Failed to parse JSON:', parseError);
//           throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
//         }
//       }
//     } catch (error) {
//       console.error('❌ API Call failed:', error);
//       throw error;
//     }
//   };

//   // ✅ FIXED: Applications query with comprehensive error handling
//   const { 
//     data: applicationsData, 
//     isLoading: applicationsLoading, 
//     error: applicationsError, 
//     refetch: refetchApplications 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       try {
//         console.log('🔍 SAFE: Fetching applications from:', `/admin/membership/applications?status=${filterStatus}`);
//         const response = await makeApiCall(`/admin/membership/applications?status=${filterStatus}`);
//         console.log("✅ SAFE: Raw API response:", response);
        
//         // ✅ Handle the safe approach response structure
//         if (response?.data?.success && response.data?.data) {
//           // Handle different possible structures from safe approach
//           if (Array.isArray(response.data.data)) {
//             console.log('📋 SAFE: Found applications array:', response.data.data.length);
//             return response.data.data;
//           } else if (response.data.data.applications && Array.isArray(response.data.data.applications)) {
//             console.log('📋 SAFE: Found nested applications array:', response.data.data.applications.length);
//             return response.data.data.applications;
//           } else {
//             console.warn('⚠️ SAFE: Unexpected data structure, returning empty array');
//             return [];
//           }
//         } else if (Array.isArray(response?.data)) {
//           console.log('📋 SAFE: Found direct array:', response.data.length);
//           return response.data;
//         } else {
//           console.warn('⚠️ SAFE: No valid data found, returning empty array');
//           return [];
//         }
//       } catch (error) {
//         console.error('❌ SAFE: Applications query failed:', error);
//         // Return empty array instead of throwing - React Query will handle the error
//         return [];
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//     // ✅ Provide default data to prevent undefined errors
//     initialData: [],
//     // ✅ Keep previous data while refetching
//     keepPreviousData: true
//   });

//   // ✅ FIXED: Stats query with better error handling
//   const { 
//     data: stats, 
//     isLoading: statsLoading, 
//     error: statsError 
//   } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 SAFE: Fetching stats from:', `/admin/membership/full-membership-stats`);
//         const response = await makeApiCall('/admin/membership/full-membership-stats');
//         console.log("✅ SAFE: Stats response:", response);
        
//         // Handle both old and new response structures
//         if (response?.data?.success) {
//           // New safe approach structure
//           if (response.data?.data) {
//             return response.data.data;
//           }
//           // Direct stats in response
//           return {
//             pending: response.data.pending || response.data.pendingCount || 0,
//             approved: response.data.approved || response.data.approvedCount || 0,
//             declined: response.data.declined || response.data.declinedCount || 0,
//             total: response.data.total || response.data.totalApplications || 0
//           };
//         }
//         // Fallback structure
//         return response?.data || { pending: 0, approved: 0, declined: 0, total: 0 };
//       } catch (error) {
//         console.error('❌ SAFE: Stats API failed, using defaults:', error);
//         // Return default stats if API fails
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//     // ✅ Provide default data
//     initialData: { pending: 0, approved: 0, declined: 0, total: 0 }
//   });

//   // ✅ FIXED: Ensure applications is always an array with better safety
//   const applications = React.useMemo(() => {
//     // Always ensure we have a valid array
//     if (!applicationsData) {
//       console.log('📋 SAFE: No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 SAFE: Applications is array:', applicationsData.length);
//       return applicationsData;
//     }
    
//     console.warn('⚠️ SAFE: Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // ✅ SAFE: Review individual application mutation with improved error handling
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 SAFE: Reviewing application:', { applicationId, decision, notes });
//       const response = await makeApiCall(`/admin/membership/review/${applicationId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ 
//           status: decision, 
//           adminNotes: notes || ''
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ SAFE: Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ SAFE: Error reviewing application:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//       alert('Failed to review application: ' + errorMessage);
//     }
//   });

//   // ✅ SAFE: Bulk review mutation with proper data structure
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 SAFE: Bulk reviewing applications:', { applicationIds, decision, notes });
//       const response = await makeApiCall('/admin/membership/bulk-review', {
//         method: 'POST',
//         body: JSON.stringify({ 
//           applicationIds, 
//           decision, 
//           notes: notes || '' 
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ SAFE: Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ SAFE: Error in bulk review:', error);
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

//   // ✅ SAFE: Enhanced application answers rendering with better compatibility
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

//       // Handle array format (most common from your database)
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
//       console.error('❌ SAFE: Error rendering answers:', error);
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

//   // ✅ SAFE: Filter applications with improved field compatibility
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

//   // ✅ FIXED: Better error handling that doesn't break the component
//   if (applicationsError && applications.length === 0) {
//     return (
//       <div className="error-container">
//         <h3>Error Loading Applications</h3>
//         <p>{applicationsError.message}</p>
//         <button onClick={() => refetchApplications()} className="retry-button">
//           Retry
//         </button>
//         <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//           <h4>🔍 Debug Information:</h4>
//           <pre style={{ fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
//             {JSON.stringify({
//               error: applicationsError.message,
//               status: applicationsError.response?.status,
//               data: applicationsError.response?.data,
//               endpoint: '/api/admin/membership/applications',
//               hasApplicationsData: !!applicationsData,
//               applicationsLength: applications?.length || 0
//             }, null, 2)}
//           </pre>
//         </div>
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
        
//         {/* ✅ FIXED: Error display for applications without breaking UI */}
//         {applicationsError && (
//           <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #fcc' }}>
//             <small>⚠️ Applications data error: {applicationsError.message}</small>
//             <button 
//               onClick={() => refetchApplications()} 
//               style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//             >
//               🔄 Retry
//             </button>
//           </div>
//         )}
        
//         {/* Stats Overview with error handling */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || stats?.pendingCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || stats?.approvedCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || stats?.declinedCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || stats?.totalApplications || 0}</span>
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
//                 <li>API endpoint: /admin/membership/applications (SAFE approach)</li>
//                 <li>Search term: "{searchTerm}"</li>
//                 <li>Has error: {!!applicationsError}</li>
//                 <li>Is loading: {applicationsLoading}</li>
//               </ul>
//               <button 
//                 onClick={() => {
//                   console.log('📊 SAFE: Debug dump:', { 
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

// // ✅ SAFE: Enhanced Application Card Component with better field compatibility
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





// // ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// // SAFE VERSION: Handles database structure changes and API compatibility

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

//   // ✅ SAFE API call function
//   const makeApiCall = async (url, options = {}) => {
//     if (api) {
//       const method = options.method?.toLowerCase() || 'get';
//       if (method === 'get') {
//         return await api.get(url);
//       } else if (method === 'put') {
//         return await api.put(url, options.body);
//       } else if (method === 'post') {
//         return await api.post(url, options.body);
//       }
//     } else {
//       // Fallback to fetch
//       const response = await fetch(url.startsWith('/') ? `/api${url}` : url, {
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers
//         },
//         ...options
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       return { data: await response.json() };
//     }
//   };

//   // ✅ SAFE: Fetch applications with improved data handling
//   const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError, refetch } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       console.log('🔍 SAFE: Fetching applications from:', `/api/admin/membership/applications`);
//       const response = await makeApiCall(`/api/admin/membership/applications?status=${filterStatus}`);
//       console.log("✅ SAFE: Raw API response:", response);
      
//       // ✅ Handle the safe approach response structure
//       if (response?.data?.success && response.data?.data) {
//         // Handle different possible structures from safe approach
//         if (Array.isArray(response.data.data)) {
//           return response.data.data;
//         } else if (response.data.data.applications && Array.isArray(response.data.data.applications)) {
//           return response.data.data.applications;
//         } else {
//           console.warn('⚠️ SAFE: Unexpected data structure, returning empty array');
//           return [];
//         }
//       } else if (Array.isArray(response?.data)) {
//         return response.data;
//       } else {
//         console.warn('⚠️ SAFE: No valid data found, returning empty array');
//         return [];
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // ✅ SAFE: Fetch stats with improved error handling
//   const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 SAFE: Fetching stats from:', `/api/admin/membership/full-membership-stats`);
//         const response = await makeApiCall('/api/admin/membership/full-membership-stats');
//         console.log("✅ SAFE: Stats response:", response);
        
//         // Handle both old and new response structures
//         if (response?.data?.success) {
//           // New safe approach structure
//           if (response.data?.data) {
//             return response.data.data;
//           }
//           // Direct stats in response
//           return {
//             pending: response.data.pending || response.data.pendingCount || 0,
//             approved: response.data.approved || response.data.approvedCount || 0,
//             declined: response.data.declined || response.data.declinedCount || 0,
//             total: response.data.total || response.data.totalApplications || 0
//           };
//         }
//         // Fallback structure
//         return response?.data || { pending: 0, approved: 0, declined: 0, total: 0 };
//       } catch (error) {
//         console.error('❌ SAFE: Stats API failed, using defaults:', error);
//         // Return default stats if API fails
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//   });

//   // ✅ SAFE: Ensure applications is always an array with better error handling
//   const applications = React.useMemo(() => {
//     if (!applicationsData) {
//       console.log('📋 SAFE: No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 SAFE: Applications is array:', applicationsData.length);
//       return applicationsData;
//     }
    
//     console.warn('⚠️ SAFE: Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // ✅ SAFE: Review individual application mutation with improved error handling
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 SAFE: Reviewing application:', { applicationId, decision, notes });
//       const response = await makeApiCall(`/api/admin/membership/review/${applicationId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ 
//           status: decision, 
//           adminNotes: notes || ''
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ SAFE: Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ SAFE: Error reviewing application:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//       alert('Failed to review application: ' + errorMessage);
//     }
//   });

//   // ✅ SAFE: Bulk review mutation with proper data structure
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 SAFE: Bulk reviewing applications:', { applicationIds, decision, notes });
//       const response = await makeApiCall('/api/admin/membership/bulk-review', {
//         method: 'POST',
//         body: JSON.stringify({ 
//           applicationIds, 
//           decision, 
//           notes: notes || '' 
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ SAFE: Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision}d successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ SAFE: Error in bulk review:', error);
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

//   // ✅ SAFE: Enhanced application answers rendering with better compatibility
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

//       // Handle array format (most common from your database)
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
//       console.error('❌ SAFE: Error rendering answers:', error);
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

//   // ✅ SAFE: Filter applications with improved field compatibility
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

//   // if (applicationsError) {
//   //   return (
//   //     <div className="error-container">
//   //       <h3>Error Loading Applications</h3>
//   //       <p>{applicationsError.message}</p>
//   //       <button onClick={() => refetch()} className="retry-button">
//   //         Retry
//   //       </button>
//   //       <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//   //         <h4>🔍 Debug Information:</h4>
//   //         <pre style={{ fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
//   //           {JSON.stringify({
//   //             error: applicationsError.message,
//   //             status: applicationsError.response?.status,
//   //             data: applicationsError.response?.data,
//   //             endpoint: '/api/admin/membership/applications'
//   //           }, null, 2)}
//   //         </pre>
//   //       </div>
//   //     </div>
//   //   );
//   // }

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
        
//         {/* Stats Overview with error handling */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || stats?.pendingCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || stats?.approvedCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || stats?.declinedCount || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || stats?.totalApplications || 0}</span>
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
//                 <li>API endpoint: /admin/membership/applications (SAFE approach)</li>
//                 <li>Search term: "{searchTerm}"</li>
//               </ul>
//               <button 
//                 onClick={() => {
//                   console.log('📊 SAFE: Debug dump:', { applications, applicationsData, filteredApplications });
//                   alert('Check browser console for debug info');
//                 }}
//                 style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔍 Debug Data
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

// // ✅ SAFE: Enhanced Application Card Component with better field compatibility
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






// import React, { useState } from 'react';

// const APIEndpointTester = () => {
//   const [results, setResults] = useState({});
//   const [loading, setLoading] = useState({});

//   const testEndpoint = async (name, url) => {
//     setLoading(prev => ({ ...prev, [name]: true }));
    
//     try {
//       console.log(`🔍 Testing ${name} at: ${url}`);
      
//       const response = await fetch(url, {
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       console.log(`📊 ${name} response status:`, response.status);
      
//       const contentType = response.headers.get('content-type');
//       console.log(`📊 ${name} content-type:`, contentType);
      
//       if (contentType && contentType.includes('application/json')) {
//         const data = await response.json();
//         console.log(`✅ ${name} JSON data:`, data);
        
//         setResults(prev => ({
//           ...prev,
//           [name]: {
//             success: true,
//             status: response.status,
//             data: data,
//             contentType: contentType
//           }
//         }));
//       } else {
//         const text = await response.text();
//         console.log(`❌ ${name} returned HTML:`, text.substring(0, 200));
        
//         setResults(prev => ({
//           ...prev,
//           [name]: {
//             success: false,
//             status: response.status,
//             error: 'Returned HTML instead of JSON',
//             contentType: contentType,
//             preview: text.substring(0, 200)
//           }
//         }));
//       }
//     } catch (error) {
//       console.error(`❌ ${name} failed:`, error);
//       setResults(prev => ({
//         ...prev,
//         [name]: {
//           success: false,
//           error: error.message
//         }
//       }));
//     } finally {
//       setLoading(prev => ({ ...prev, [name]: false }));
//     }
//   };

//   const endpoints = [
//     {
//       name: 'Pending Count',
//       url: '/api/admin/membership/pending-count'
//     },
//     {
//       name: 'Full Membership Stats',
//       url: '/api/admin/membership/full-membership-stats'
//     },
//     {
//       name: 'Membership Applications',
//       url: '/api/admin/membership/applications'
//     },
//     {
//       name: 'Application Stats',
//       url: '/api/admin/applications/stats'
//     }
//   ];

//   const testAll = () => {
//     endpoints.forEach(endpoint => {
//       testEndpoint(endpoint.name, endpoint.url);
//     });
//   };

//   return (
//     <div style={{ padding: '20px', fontFamily: 'monospace' }}>
//       <h2>🔍 API Endpoint Tester</h2>
      
//       <div style={{ marginBottom: '20px' }}>
//         <button 
//           onClick={testAll}
//           style={{
//             padding: '10px 20px',
//             backgroundColor: '#007bff',
//             color: 'white',
//             border: 'none',
//             borderRadius: '5px',
//             cursor: 'pointer',
//             marginRight: '10px'
//           }}
//         >
//           🚀 Test All Endpoints
//         </button>
//       </div>

//       <div style={{ display: 'grid', gap: '20px' }}>
//         {endpoints.map(endpoint => (
//           <div key={endpoint.name} style={{
//             border: '1px solid #ddd',
//             borderRadius: '8px',
//             padding: '15px',
//             backgroundColor: '#f8f9fa'
//           }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//               <h4 style={{ margin: 0 }}>{endpoint.name}</h4>
//               <button
//                 onClick={() => testEndpoint(endpoint.name, endpoint.url)}
//                 disabled={loading[endpoint.name]}
//                 style={{
//                   padding: '5px 10px',
//                   backgroundColor: '#28a745',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '3px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 {loading[endpoint.name] ? '⏳' : '🔍'} Test
//               </button>
//             </div>
            
//             <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
//               <strong>URL:</strong> {endpoint.url}
//             </div>

//             {results[endpoint.name] && (
//               <div style={{
//                 padding: '10px',
//                 borderRadius: '4px',
//                 backgroundColor: results[endpoint.name].success ? '#d4edda' : '#f8d7da',
//                 border: `1px solid ${results[endpoint.name].success ? '#c3e6cb' : '#f5c6cb'}`
//               }}>
//                 <div style={{ marginBottom: '5px' }}>
//                   <strong>Status:</strong> {results[endpoint.name].status || 'N/A'}
//                 </div>
                
//                 {results[endpoint.name].contentType && (
//                   <div style={{ marginBottom: '5px' }}>
//                     <strong>Content-Type:</strong> {results[endpoint.name].contentType}
//                   </div>
//                 )}

//                 {results[endpoint.name].success ? (
//                   <div>
//                     <strong>✅ Success!</strong>
//                     <details style={{ marginTop: '5px' }}>
//                       <summary style={{ cursor: 'pointer' }}>View Response Data</summary>
//                       <pre style={{
//                         marginTop: '5px',
//                         padding: '10px',
//                         backgroundColor: '#ffffff',
//                         border: '1px solid #ddd',
//                         borderRadius: '3px',
//                         fontSize: '0.8em',
//                         overflow: 'auto',
//                         maxHeight: '200px'
//                       }}>
//                         {JSON.stringify(results[endpoint.name].data, null, 2)}
//                       </pre>
//                     </details>
//                   </div>
//                 ) : (
//                   <div>
//                     <strong>❌ Failed:</strong> {results[endpoint.name].error}
//                     {results[endpoint.name].preview && (
//                       <details style={{ marginTop: '5px' }}>
//                         <summary style={{ cursor: 'pointer' }}>View HTML Response</summary>
//                         <pre style={{
//                           marginTop: '5px',
//                           padding: '10px',
//                           backgroundColor: '#ffffff',
//                           border: '1px solid #ddd',
//                           borderRadius: '3px',
//                           fontSize: '0.8em',
//                           overflow: 'auto',
//                           maxHeight: '100px'
//                         }}>
//                           {results[endpoint.name].preview}...
//                         </pre>
//                       </details>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//         <h4>🔍 Debug Instructions:</h4>
//         <ol>
//           <li>Click "Test All Endpoints" to check each API endpoint</li>
//           <li>Check which endpoints return JSON vs HTML</li>
//           <li>Look at the browser console for detailed logs</li>
//           <li>If endpoints return HTML, your routes might not be loaded properly</li>
//         </ol>
//       </div>
//     </div>
//   );
// };

// export default APIEndpointTester;






// // ikootaclient/src/components/admin/FullMembershipReviewControls.jsx
// // WORKING VERSION: Handles undefined data and mismatched endpoints

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

//   // ✅ WORKING API call function
//   const makeApiCall = async (url, options = {}) => {
//     if (api) {
//       const method = options.method?.toLowerCase() || 'get';
//       if (method === 'get') {
//         return await api.get(url);
//       } else if (method === 'put') {
//         return await api.put(url, options.body);
//       } else if (method === 'post') {
//         return await api.post(url, options.body);
//       }
//     } else {
//       // Fallback to fetch
//       const response = await fetch(url.startsWith('/') ? `/api${url}` : url, {
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers
//         },
//         ...options
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       return { data: await response.json() };
//     }
//   };

//   // ✅ FIXED: Fetch applications with proper endpoint from your logs
//   const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError, refetch } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//               console.log('🔍 Fetching applications from:', `/api/admin/membership/applications`);
//       const response = await makeApiCall(`/api/admin/membership/applications?status=${filterStatus}`);
//       console.log("✅ Raw API response:", response);
      
//       // ✅ FIXED: Handle the exact response structure from your API
//       if (response?.data?.success && response.data?.data) {
//         // Handle different possible structures
//         if (Array.isArray(response.data.data)) {
//           return response.data.data;
//         } else if (response.data.data.applications && Array.isArray(response.data.data.applications)) {
//           return response.data.data.applications;
//         } else {
//           console.warn('⚠️ Unexpected data structure, returning empty array');
//           return [];
//         }
//       } else if (Array.isArray(response?.data)) {
//         return response.data;
//       } else {
//         console.warn('⚠️ No valid data found, returning empty array');
//         return [];
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Fetch stats with working endpoint 
//   const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 Fetching stats from:', `/api/admin/membership/full-membership-stats`);
//         const response = await makeApiCall('/api/admin/membership/full-membership-stats');
//         console.log("✅ Stats response:", response);
        
//         if (response?.data?.success && response.data?.data) {
//           return response.data.data;
//         }
//         return response?.data || { pending: 0, approved: 0, declined: 0, total: 0 };
//       } catch (error) {
//         console.error('❌ Stats API failed, using defaults:', error);
//         // Return default stats if API fails
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Ensure applications is always an array
//   const applications = React.useMemo(() => {
//     if (!applicationsData) {
//       console.log('📋 No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 Applications is array:', applicationsData.length);
//       return applicationsData;
//     }
    
//     console.warn('⚠️ Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // Review individual application mutation
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 Reviewing application:', { applicationId, decision, notes });
//       const response = await makeApiCall(`/api/admin/membership/review/${applicationId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ 
//           status: decision, 
//           decision, 
//           notes,
//           adminNotes: notes 
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error reviewing application:', error);
//       alert('Failed to review application: ' + (error.response?.data?.message || error.message));
//     }
//   });

//   // Bulk review mutation
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 Bulk reviewing applications:', { applicationIds, decision, notes });
//       const response = await makeApiCall('/api/admin/membership/bulk-review', {
//         method: 'POST',
//         body: JSON.stringify({ applicationIds, decision, notes })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error in bulk review:', error);
//       alert('Failed to bulk review: ' + (error.response?.data?.message || error.message));
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
//       const allIds = filteredApplications.map(app => app.id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // Enhanced application answers rendering
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
//               <strong>Raw Answer Data:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format (from FullMembershipSurvey.jsx)
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

//   // ✅ FIXED: Filter applications with proper null checking
//   const filteredApplications = React.useMemo(() => {
//     if (!Array.isArray(applications)) {
//       return [];
//     }
    
//     return applications.filter(app => 
//       app?.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (typeof app?.answers === 'string' && app.answers.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (typeof app?.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchTerm.toLowerCase()))
//     );
//   }, [applications, searchTerm]);

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   if (applicationsError) {
//     return (
//       <div className="error-container">
//         <h3>Error Loading Applications</h3>
//         <p>{applicationsError.message}</p>
//         <button onClick={() => refetch()} className="retry-button">
//           Retry
//         </button>
//         <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//           <h4>🔍 Debug Information:</h4>
//           <pre style={{ fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
//             {JSON.stringify({
//               error: applicationsError.message,
//               status: applicationsError.response?.status,
//               data: applicationsError.response?.data,
//               endpoint: '/api/admin/membership/applications'
//             }, null, 2)}
//           </pre>
//         </div>
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
        
//         {/* Stats Overview with error handling */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || stats?.pending_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || stats?.approved_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || stats?.declined_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || stats?.total_applications || 0}</span>
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
//             placeholder="Search by email, name, or responses..."
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
//                 <li>API endpoint: /admin/membership/applications</li>
//                 <li>Search term: "{searchTerm}"</li>
//               </ul>
//               <button 
//                 onClick={() => {
//                   console.log('📊 Debug dump:', { applications, applicationsData, filteredApplications });
//                   alert('Check browser console for debug info');
//                 }}
//                 style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔍 Debug Data
//               </button>
//             </div>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id)}
//               onToggleSelection={() => toggleSelection(application.id)}
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

// // Enhanced Application Card Component
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
//   const showDetails = selectedForDetails === application.id;

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
//                 #{application.id}
//               </span>
//             </h4>
//             <p className="user-email">{application.user_email || application.email}</p>
//             <p className="submission-date">
//               Submitted: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
//                          application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown date'}
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
//         {renderAnswers(application.answers || application.responses)}
//       </div>

//       {/* Admin Notes */}
//       {application.admin_notes && (
//         <div style={{ 
//           backgroundColor: '#e8f4fd', 
//           padding: '10px', 
//           borderRadius: '5px',
//           marginBottom: '15px'
//         }}>
//           <strong>Admin Notes:</strong> {application.admin_notes}
//         </div>
//       )}

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : application.id)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(application.id, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(application.id, 'declined', reviewNotes)}
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
// // WORKING VERSION: Handles undefined data and mismatched endpoints

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

//   // ✅ WORKING API call function
//   const makeApiCall = async (url, options = {}) => {
//     if (api) {
//       const method = options.method?.toLowerCase() || 'get';
//       if (method === 'get') {
//         return await api.get(url);
//       } else if (method === 'put') {
//         return await api.put(url, options.body);
//       } else if (method === 'post') {
//         return await api.post(url, options.body);
//       }
//     } else {
//       // Fallback to fetch
//       const response = await fetch(url.startsWith('/') ? `/api${url}` : url, {
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers
//         },
//         ...options
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       return { data: await response.json() };
//     }
//   };

//   // ✅ FIXED: Fetch applications with proper endpoint from your logs
//   const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError, refetch } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       console.log('🔍 Fetching applications from:', `/admin/membership/applications`);
//       const response = await makeApiCall(`/admin/membership/applications?status=${filterStatus}`);
//       console.log("✅ Raw API response:", response);
      
//       // ✅ FIXED: Handle the exact response structure from your API
//       if (response?.data?.success && response.data?.data) {
//         // Handle different possible structures
//         if (Array.isArray(response.data.data)) {
//           return response.data.data;
//         } else if (response.data.data.applications && Array.isArray(response.data.data.applications)) {
//           return response.data.data.applications;
//         } else {
//           console.warn('⚠️ Unexpected data structure, returning empty array');
//           return [];
//         }
//       } else if (Array.isArray(response?.data)) {
//         return response.data;
//       } else {
//         console.warn('⚠️ No valid data found, returning empty array');
//         return [];
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Fetch stats with working endpoint 
//   const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 Fetching stats from:', `/api/admin/membership/full-membership-stats`);
//         const response = await makeApiCall('/api/admin/membership/full-membership-stats');
//         console.log("✅ Stats response:", response);
        
//         if (response?.data?.success && response.data?.data) {
//           return response.data.data;
//         }
//         return response?.data || { pending: 0, approved: 0, declined: 0, total: 0 };
//       } catch (error) {
//         console.error('❌ Stats API failed, using defaults:', error);
//         // Return default stats if API fails
//         return { pending: 0, approved: 0, declined: 0, total: 0 };
//       }
//     },
//     retry: 1,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Ensure applications is always an array
//   const applications = React.useMemo(() => {
//     if (!applicationsData) {
//       console.log('📋 No applications data, returning empty array');
//       return [];
//     }
    
//     if (Array.isArray(applicationsData)) {
//       console.log('📋 Applications is array:', applicationsData.length);
//       return applicationsData;
//     }
    
//     console.warn('⚠️ Applications data is not array:', applicationsData);
//     return [];
//   }, [applicationsData]);

//   // Review individual application mutation
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 Reviewing application:', { applicationId, decision, notes });
//       const response = await makeApiCall(`/admin/membership/review/${applicationId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ 
//           status: decision, 
//           decision, 
//           notes,
//           adminNotes: notes 
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error reviewing application:', error);
//       alert('Failed to review application: ' + (error.response?.data?.message || error.message));
//     }
//   });

//   // Bulk review mutation
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 Bulk reviewing applications:', { applicationIds, decision, notes });
//       const response = await makeApiCall('/admin/membership/bulk-review', {
//         method: 'POST',
//         body: JSON.stringify({ applicationIds, decision, notes })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error in bulk review:', error);
//       alert('Failed to bulk review: ' + (error.response?.data?.message || error.message));
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
//       const allIds = filteredApplications.map(app => app.id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // Enhanced application answers rendering
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
//               <strong>Raw Answer Data:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format (from FullMembershipSurvey.jsx)
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

//   // ✅ FIXED: Filter applications with proper null checking
//   const filteredApplications = React.useMemo(() => {
//     if (!Array.isArray(applications)) {
//       return [];
//     }
    
//     return applications.filter(app => 
//       app?.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (typeof app?.answers === 'string' && app.answers.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (typeof app?.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchTerm.toLowerCase()))
//     );
//   }, [applications, searchTerm]);

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   if (applicationsError) {
//     return (
//       <div className="error-container">
//         <h3>Error Loading Applications</h3>
//         <p>{applicationsError.message}</p>
//         <button onClick={() => refetch()} className="retry-button">
//           Retry
//         </button>
//         <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//           <h4>🔍 Debug Information:</h4>
//           <pre style={{ fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
//             {JSON.stringify({
//               error: applicationsError.message,
//               status: applicationsError.response?.status,
//               data: applicationsError.response?.data,
//               endpoint: '/admin/membership/applications'
//             }, null, 2)}
//           </pre>
//         </div>
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
        
//         {/* Stats Overview with error handling */}
//         {stats && !statsError && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || stats?.pending_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || stats?.approved_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || stats?.declined_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || stats?.total_applications || 0}</span>
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
//             placeholder="Search by email, name, or responses..."
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
//                 <li>API endpoint: /admin/membership/applications</li>
//                 <li>Search term: "{searchTerm}"</li>
//               </ul>
//               <button 
//                 onClick={() => {
//                   console.log('📊 Debug dump:', { applications, applicationsData, filteredApplications });
//                   alert('Check browser console for debug info');
//                 }}
//                 style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.8em' }}
//               >
//                 🔍 Debug Data
//               </button>
//             </div>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id)}
//               onToggleSelection={() => toggleSelection(application.id)}
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

// // Enhanced Application Card Component
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
//   const showDetails = selectedForDetails === application.id;

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
//                 #{application.id}
//               </span>
//             </h4>
//             <p className="user-email">{application.user_email || application.email}</p>
//             <p className="submission-date">
//               Submitted: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
//                          application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown date'}
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
//         {renderAnswers(application.answers || application.responses)}
//       </div>

//       {/* Admin Notes */}
//       {application.admin_notes && (
//         <div style={{ 
//           backgroundColor: '#e8f4fd', 
//           padding: '10px', 
//           borderRadius: '5px',
//           marginBottom: '15px'
//         }}>
//           <strong>Admin Notes:</strong> {application.admin_notes}
//         </div>
//       )}

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : application.id)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(application.id, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(application.id, 'declined', reviewNotes)}
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
// // FIXED VERSION: Properly integrates with fullMembershipService.js

// import React, { useState, useEffect } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { useLocation } from 'react-router-dom';
// import './FullMembershipReviewControls.css';

// // ✅ FIXED: Use the proper service instead of custom API calls
// import {
//   useFullMembershipApplications,
//   useReviewFullMembershipApplication,
//   useApplicationStatistics,
//   useSendApplicationFeedback,
//   useBulkReviewApplications,
//   formatApplicationStatus,
//   calculateDaysPending
// } from '../service/fullMembershipService';

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

//   // ✅ FIXED: Use the service hooks instead of custom queries
//   const { 
//     data: applicationsData, 
//     isLoading: applicationsLoading, 
//     error: applicationsError, 
//     refetch 
//   } = useFullMembershipApplications(
//     { status: filterStatus },
//     {
//       retry: 2,
//       retryDelay: 1000,
//     }
//   );

//   const { 
//     data: stats, 
//     isLoading: statsLoading 
//   } = useApplicationStatistics({
//     retry: 1,
//     retryDelay: 1000,
//   });

//   // ✅ FIXED: Use service mutations
//   const reviewMutation = useReviewFullMembershipApplication();
//   const bulkReviewMutation = useBulkReviewApplications();
//   const sendFeedbackMutation = useSendApplicationFeedback();

//   // ✅ FIXED: Handle different response formats from your API
//   const applications = React.useMemo(() => {
//     if (!applicationsData) return [];
    
//     // Handle different possible response structures
//     if (applicationsData.success && applicationsData.data?.applications) {
//       return applicationsData.data.applications;
//     } else if (applicationsData.success && applicationsData.data) {
//       return Array.isArray(applicationsData.data) ? applicationsData.data : [applicationsData.data];
//     } else if (Array.isArray(applicationsData)) {
//       return applicationsData;
//     } else {
//       console.warn('⚠️ Unexpected applications format:', applicationsData);
//       return [];
//     }
//   }, [applicationsData]);

//   // Handle individual review
//   const handleReview = async (applicationId, decision, notes = '') => {
//     if (!applicationId) {
//       alert('Invalid application ID');
//       return;
//     }

//     const confirmMessage = `Are you sure you want to ${decision} this application?`;
//     if (window.confirm(confirmMessage)) {
//       try {
//         await reviewMutation.mutateAsync({
//           applicationId,
//           status: decision,
//           adminNotes: notes
//         });
        
//         // Invalidate and refetch queries
//         queryClient.invalidateQueries(['fullMembershipApplications']);
//         queryClient.invalidateQueries(['applicationStatistics']);
//         setSelectedApplications([]);
//         alert(`Application ${decision} successfully!`);
//       } catch (error) {
//         console.error('❌ Error reviewing application:', error);
//         alert('Failed to review application: ' + (error.response?.data?.message || error.message));
//       }
//     }
//   };

//   // Handle bulk review
//   const handleBulkReview = async (decision, notes = '') => {
//     if (selectedApplications.length === 0) {
//       alert('Please select applications to review');
//       return;
//     }
    
//     const confirmMessage = `Are you sure you want to ${decision} ${selectedApplications.length} application(s)?`;
//     if (window.confirm(confirmMessage)) {
//       try {
//         await bulkReviewMutation.mutateAsync({
//           applicationIds: selectedApplications,
//           action: decision,
//           adminNotes: notes
//         });
        
//         // Invalidate and refetch queries
//         queryClient.invalidateQueries(['fullMembershipApplications']);
//         queryClient.invalidateQueries(['applicationStatistics']);
//         setSelectedApplications([]);
//         alert(`${selectedApplications.length} applications ${decision} successfully!`);
//       } catch (error) {
//         console.error('❌ Error in bulk review:', error);
//         alert('Failed to bulk review: ' + (error.response?.data?.message || error.message));
//       }
//     }
//   };

//   // Handle sending feedback email
//   const handleSendFeedback = async (email, status, applicantName, membershipTicket) => {
//     if (!email) {
//       alert('Email address is required');
//       return;
//     }
    
//     try {
//       await sendFeedbackMutation.mutateAsync({
//         email,
//         status,
//         applicantName,
//         membershipTicket
//       });
//       alert('Feedback email sent successfully!');
//     } catch (error) {
//       console.error('❌ Error sending feedback email:', error);
//       alert('Failed to send feedback email: ' + (error.response?.data?.message || error.message));
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
//     if (filteredApplications) {
//       const allIds = filteredApplications.map(app => app.id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // Enhanced application answers rendering
//   const renderApplicationAnswers = (answers) => {
//     try {
//       console.log('🔍 Rendering application answers:', answers, typeof answers);
      
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
//           console.warn('⚠️ Error parsing JSON string:', parseError);
//           return (
//             <div className="invalid-answers">
//               <strong>Raw Answer Data:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format (from FullMembershipSurvey.jsx)
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

//   // Filter applications based on search term
//   const filteredApplications = applications?.filter(app => 
//     app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (typeof app.answers === 'string' && app.answers.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (typeof app.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchTerm.toLowerCase()))
//   ) || [];

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   if (applicationsError) {
//     return (
//       <div className="error-container">
//         <h3>Error Loading Applications</h3>
//         <p>{applicationsError.message}</p>
//         <button onClick={() => refetch()} className="retry-button">
//           Retry
//         </button>
//         <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
//           <h4>🔍 Debug Information:</h4>
//           <pre style={{ fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
//             {JSON.stringify({
//               error: applicationsError.message,
//               status: applicationsError.response?.status,
//               data: applicationsError.response?.data
//             }, null, 2)}
//           </pre>
//         </div>
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
        
//         {/* Stats Overview */}
//         {stats && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.pending || stats?.pending_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.approved || stats?.approved_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.declined || stats?.declined_count || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.total || stats?.total_applications || 0}</span>
//             </div>
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
//             placeholder="Search by email, name, or responses..."
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
//               <p>Possible reasons:</p>
//               <ul style={{ textAlign: 'left', display: 'inline-block' }}>
//                 <li>No applications have been submitted yet</li>
//                 <li>Applications are in a different status than "{filterStatus}"</li>
//                 <li>Search filters are too restrictive</li>
//                 <li>API endpoint configuration issue</li>
//               </ul>
//             </div>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id)}
//               onToggleSelection={() => toggleSelection(application.id)}
//               onReview={handleReview}
//               onSendFeedback={handleSendFeedback}
//               isReviewing={reviewMutation.isPending}
//               isSendingEmail={sendFeedbackMutation.isPending}
//               renderAnswers={renderApplicationAnswers}
//               selectedForDetails={selectedApplication}
//               onToggleDetails={setSelectedApplication}
//             />
//           ))
//         )}
//       </div>

//       {/* Loading states */}
//       {(reviewMutation.isPending || bulkReviewMutation.isPending || sendFeedbackMutation.isPending) && (
//         <div className="review-loading-overlay">
//           <div className="loading-spinner"></div>
//           <p>
//             {reviewMutation.isPending && 'Processing review...'}
//             {bulkReviewMutation.isPending && 'Processing bulk review...'}
//             {sendFeedbackMutation.isPending && 'Sending email...'}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// // Enhanced Application Card Component
// const EnhancedApplicationCard = ({ 
//   application, 
//   isSelected, 
//   onToggleSelection, 
//   onReview, 
//   onSendFeedback,
//   isReviewing,
//   isSendingEmail,
//   renderAnswers,
//   selectedForDetails,
//   onToggleDetails
// }) => {
//   const [reviewNotes, setReviewNotes] = useState('');
//   const showDetails = selectedForDetails === application.id;

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
//                 #{application.id}
//               </span>
//             </h4>
//             <p className="user-email">{application.user_email || application.email}</p>
//             <p className="submission-date">
//               Submitted: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
//                          application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown date'}
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
//         {renderAnswers(application.answers || application.responses)}
//       </div>

//       {/* Admin Notes */}
//       {application.admin_notes && (
//         <div style={{ 
//           backgroundColor: '#e8f4fd', 
//           padding: '10px', 
//           borderRadius: '5px',
//           marginBottom: '15px'
//         }}>
//           <strong>Admin Notes:</strong> {application.admin_notes}
//         </div>
//       )}

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : application.id)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(application.id, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(application.id, 'declined', reviewNotes)}
//               className="decline-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '❌ Decline'}
//             </button>
//           </div>
//         )}

//         {(application.user_email || application.email) && (
//           <button
//             onClick={() => onSendFeedback(
//               application.user_email || application.email, 
//               application.status, 
//               application.user_name || application.username,
//               application.membership_ticket
//             )}
//             disabled={isSendingEmail}
//             className="email-btn"
//             style={{
//               padding: '8px 16px',
//               backgroundColor: '#007bff',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer',
//               fontSize: '14px'
//             }}
//           >
//             {isSendingEmail ? '📧 Sending...' : '📧 Send Status Email'}
//           </button>
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
// // MERGED VERSION: Combines the best of both approaches
// import React, { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useLocation } from 'react-router-dom';
// import './FullMembershipReviewControls.css';

// // ✅ Try to use custom api service, fallback to fetch
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

//   // ✅ Detect if we're in admin context
//   const isInAdminContext = location.pathname.includes('/admin');

//   // ✅ Add context class to body for CSS targeting
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

//   // ✅ Enhanced API call function
//   const makeApiCall = async (url, options = {}) => {
//     if (api) {
//       // Use custom API service if available
//       const method = options.method?.toLowerCase() || 'get';
//       if (method === 'get') {
//         return await api.get(url);
//       } else if (method === 'put') {
//         return await api.put(url, options.body);
//       } else if (method === 'post') {
//         return await api.post(url, options.body);
//       }
//     } else {
//       // Fallback to fetch
//       const response = await fetch(url.startsWith('/') ? `/api${url}` : url, {
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers
//         },
//         ...options
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       return { data: await response.json() };
//     }
//   };

//   // ✅ Fetch membership applications with enhanced error handling
//   const { data: applications, isLoading: applicationsLoading, error: applicationsError, refetch } = useQuery({
//     queryKey: ['admin', 'membership', 'applications', filterStatus],
//     queryFn: async () => {
//       console.log('🔍 Fetching full membership applications...');
//       const response = await makeApiCall(`/api/admin/membership/applications?status=${filterStatus}`);
//       console.log("✅ Applications response:", response.data);
      
//       // Handle different response formats
//       if (response.data?.success && response.data?.data?.applications) {
//         return response.data.data.applications;
//       } else if (response.data?.success && response.data?.data) {
//         return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
//       } else if (Array.isArray(response.data)) {
//         return response.data;
//       } else {
//         console.warn('⚠️ Unexpected applications format:', response.data);
//         return [];
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // ✅ Fetch membership stats
//   const { data: stats, isLoading: statsLoading } = useQuery({
//     queryKey: ['admin', 'membership', 'stats'],
//     queryFn: async () => {
//       console.log('🔍 Fetching membership statistics...');
//       const response = await makeApiCall('/api/admin/membership/full-membership-stats');
//       console.log("✅ Stats response:", response.data);
      
//       if (response.data?.success && response.data?.data) {
//         return response.data.data;
//       }
//       return response.data || { statistics: {}, recentActivity: [] };
//     },
//     retry: 1,
//     retryDelay: 1000,
//   });

//   // ✅ Review individual application mutation
//   const reviewMutation = useMutation({
//     mutationFn: async ({ applicationId, decision, notes }) => {
//       console.log('🔍 Reviewing application:', { applicationId, decision, notes });
//       const response = await makeApiCall(`/api/admin/membership/review/${applicationId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ 
//           status: decision, 
//           decision, 
//           notes,
//           adminNotes: notes 
//         })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Application review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`Application ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error reviewing application:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to review application';
//       alert('Failed to review application: ' + errorMessage);
//     }
//   });

//   // ✅ Bulk review mutation
//   const bulkReviewMutation = useMutation({
//     mutationFn: async ({ applicationIds, decision, notes }) => {
//       console.log('🔍 Bulk reviewing applications:', { applicationIds, decision, notes });
//       const response = await makeApiCall('/api/admin/membership/bulk-review', {
//         method: 'POST',
//         body: JSON.stringify({ applicationIds, decision, notes })
//       });
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       console.log('✅ Bulk review completed:', variables);
//       queryClient.invalidateQueries(['admin', 'membership']);
//       setSelectedApplications([]);
//       alert(`${variables.applicationIds.length} applications ${variables.decision} successfully!`);
//     },
//     onError: (error) => {
//       console.error('❌ Error in bulk review:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to bulk review applications';
//       alert('Failed to bulk review: ' + errorMessage);
//     }
//   });

//   // ✅ Send feedback email mutation
//   const sendFeedbackMutation = useMutation({
//     mutationFn: async ({ email, status, applicantName, membershipTicket }) => {
//       console.log('🔍 Sending feedback email:', { email, status });
//       const response = await makeApiCall('/api/email/send-membership-feedback', {
//         method: 'POST',
//         body: JSON.stringify({ 
//           email, 
//           status,
//           applicantName,
//           membershipTicket,
//           template: status === "approved" ? "full_membership_approved" : "full_membership_declined"
//         })
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       console.log('✅ Feedback email sent successfully');
//       alert('Feedback email sent successfully!');
//     },
//     onError: (error) => {
//       console.error('❌ Error sending feedback email:', error);
//       alert('Failed to send feedback email: ' + (error.response?.data?.message || error.message));
//     }
//   });

//   // ✅ Handle individual review
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

//   // ✅ Handle bulk review
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

//   // ✅ Handle sending feedback email
//   const handleSendFeedback = (email, status, applicantName, membershipTicket) => {
//     if (!email) {
//       alert('Email address is required');
//       return;
//     }
//     sendFeedbackMutation.mutate({ email, status, applicantName, membershipTicket });
//   };

//   // ✅ Toggle application selection
//   const toggleSelection = (applicationId) => {
//     setSelectedApplications(prev => 
//       prev.includes(applicationId)
//         ? prev.filter(id => id !== applicationId)
//         : [...prev, applicationId]
//     );
//   };

//   // ✅ Select all applications
//   const selectAll = () => {
//     if (filteredApplications) {
//       const allIds = filteredApplications.map(app => app.id);
//       setSelectedApplications(allIds);
//     }
//   };

//   // ✅ Clear selection
//   const clearSelection = () => {
//     setSelectedApplications([]);
//   };

//   // ✅ Enhanced application answers rendering
//   const renderApplicationAnswers = (answers) => {
//     try {
//       console.log('🔍 Rendering application answers:', answers, typeof answers);
      
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
//           console.warn('⚠️ Error parsing JSON string:', parseError);
//           return (
//             <div className="invalid-answers">
//               <strong>Raw Answer Data:</strong>
//               <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
//                 {answers}
//               </pre>
//             </div>
//           );
//         }
//       } else {
//         parsedAnswers = answers;
//       }

//       // Handle array format
//       if (Array.isArray(parsedAnswers)) {
//         return (
//           <div className="full-membership-answers">
//             {parsedAnswers.map((item, index) => {
//               if (typeof item === 'object' && item.question && item.answer) {
//                 return (
//                   <div key={index} className="answer-item">
//                     <div className="question-label">
//                       <strong>{item.question}:</strong>
//                     </div>
//                     <div className="answer-value">
//                       {formatAnswerValue(item.answer)}
//                     </div>
//                   </div>
//                 );
//               } else {
//                 return (
//                   <div key={index} className="simple-answer">
//                     <strong>Answer {index + 1}:</strong> {item || 'No response'}
//                   </div>
//                 );
//               }
//             })}
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

//   // ✅ Helper function to format question labels
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

//   // ✅ Helper function to format answer values
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

//   // ✅ Filter applications based on search term
//   const filteredApplications = applications?.filter(app => 
//     app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (typeof app.answers === 'string' && app.answers.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (typeof app.responses === 'object' && JSON.stringify(app.responses).toLowerCase().includes(searchTerm.toLowerCase()))
//   ) || [];

//   if (applicationsLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading membership applications...</p>
//       </div>
//     );
//   }

//   if (applicationsError) {
//     return (
//       <div className="error-container">
//         <h3>Error Loading Applications</h3>
//         <p>{applicationsError.message}</p>
//         <button onClick={() => refetch()} className="retry-button">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="membership-review-container">
//       {/* ✅ Context-aware header */}
//       <div className="review-header">
//         <h2>Full Membership Review</h2>
//         {isInAdminContext && (
//           <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
//             (Admin Panel - Pre-member → Member Applications)
//           </small>
//         )}
        
//         {/* ✅ Enhanced Stats Overview */}
//         {(stats?.statistics || stats) && (
//           <div className="stats-overview">
//             <div className="stat-card">
//               <h4>Pending</h4>
//               <span className="stat-number">{stats?.statistics?.pending_count || stats?.pending || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Approved</h4>
//               <span className="stat-number approved">{stats?.statistics?.approved_count || stats?.approved || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Declined</h4>
//               <span className="stat-number declined">{stats?.statistics?.declined_count || stats?.declined || 0}</span>
//             </div>
//             <div className="stat-card">
//               <h4>Total</h4>
//               <span className="stat-number">{stats?.statistics?.total_applications || stats?.total || 0}</span>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ✅ Enhanced Controls */}
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
//             placeholder="Search by email, name, or responses..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-input"
//           />
//         </div>

//         {/* ✅ Enhanced Bulk Actions */}
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

//       {/* ✅ Selection Controls */}
//       <div className="selection-controls">
//         <button onClick={selectAll} className="select-all-btn">
//           Select All ({filteredApplications.length})
//         </button>
//         <button onClick={clearSelection} className="clear-selection-btn">
//           Clear Selection
//         </button>
//       </div>

//       {/* ✅ Enhanced Applications List */}
//       <div className="applications-list">
//         {filteredApplications.length === 0 ? (
//           <div className="no-applications">
//             <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
//             <h4>No Full Membership Applications</h4>
//             <p>No applications found for the current filters.</p>
//           </div>
//         ) : (
//           filteredApplications.map((application) => (
//             <EnhancedApplicationCard
//               key={application.id}
//               application={application}
//               isSelected={selectedApplications.includes(application.id)}
//               onToggleSelection={() => toggleSelection(application.id)}
//               onReview={handleReview}
//               onSendFeedback={handleSendFeedback}
//               isReviewing={reviewMutation.isPending}
//               isSendingEmail={sendFeedbackMutation.isPending}
//               renderAnswers={renderApplicationAnswers}
//               selectedForDetails={selectedApplication}
//               onToggleDetails={setSelectedApplication}
//             />
//           ))
//         )}
//       </div>

//       {/* ✅ Loading states */}
//       {(reviewMutation.isPending || bulkReviewMutation.isPending || sendFeedbackMutation.isPending) && (
//         <div className="review-loading-overlay">
//           <div className="loading-spinner"></div>
//           <p>
//             {reviewMutation.isPending && 'Processing review...'}
//             {bulkReviewMutation.isPending && 'Processing bulk review...'}
//             {sendFeedbackMutation.isPending && 'Sending email...'}
//           </p>
//         </div>
//       )}

//       {/* ✅ Recent Activity Section */}
//       {stats?.recentActivity && stats.recentActivity.length > 0 && (
//         <div className="recent-activity-section">
//           <h3>📈 Recent Activity</h3>
//           <div className="recent-activity-list">
//             {stats.recentActivity.map((activity, index) => (
//               <div key={activity.id || index} className="activity-item">
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <div>
//                     <strong>{activity.username}</strong> - {activity.status}
//                     {activity.reviewer_name && (
//                       <span style={{ color: '#666', fontSize: '0.9em' }}>
//                         {' '}by {activity.reviewer_name}
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ color: '#666', fontSize: '0.85em' }}>
//                     {activity.reviewedAt ? new Date(activity.reviewedAt).toLocaleDateString() : 'Recently'}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
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
//   onSendFeedback,
//   isReviewing,
//   isSendingEmail,
//   renderAnswers,
//   selectedForDetails,
//   onToggleDetails
// }) => {
//   const [reviewNotes, setReviewNotes] = useState('');
//   const showDetails = selectedForDetails === application.id;

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
//                 #{application.id}
//               </span>
//             </h4>
//             <p className="user-email">{application.user_email || application.email}</p>
//             <p className="submission-date">
//               Submitted: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 
//                          application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown date'}
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

//       {/* ✅ Enhanced application answers display */}
//       <div className="application-answers-section">
//         <h5>📝 Application Responses:</h5>
//         {renderAnswers(application.answers || application.responses)}
//       </div>

//       {/* Admin Notes */}
//       {application.admin_notes && (
//         <div style={{ 
//           backgroundColor: '#e8f4fd', 
//           padding: '10px', 
//           borderRadius: '5px',
//           marginBottom: '15px'
//         }}>
//           <strong>Admin Notes:</strong> {application.admin_notes}
//         </div>
//       )}

//       <div className="application-actions">
//         <button 
//           onClick={() => onToggleDetails(showDetails ? null : application.id)}
//           className="toggle-details-btn"
//         >
//           {showDetails ? 'Hide Details' : 'Show Details'}
//         </button>
        
//         {(application.status === 'pending' || !application.status) && (
//           <div className="review-actions">
//             <button 
//               onClick={() => onReview(application.id, 'approved', reviewNotes)}
//               className="approve-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '✅ Approve'}
//             </button>
//             <button 
//               onClick={() => onReview(application.id, 'declined', reviewNotes)}
//               className="decline-btn"
//               disabled={isReviewing}
//             >
//               {isReviewing ? '⏳ Processing...' : '❌ Decline'}
//             </button>
//           </div>
//         )}

//         {(application.user_email || application.email) && (
//           <button
//             onClick={() => onSendFeedback(
//               application.user_email || application.email, 
//               application.status, 
//               application.user_name || application.username,
//               application.membership_ticket
//             )}
//             disabled={isSendingEmail}
//             className="email-btn"
//             style={{
//               padding: '8px 16px',
//               backgroundColor: '#007bff',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer',
//               fontSize: '14px'
//             }}
//           >
//             {isSendingEmail ? '📧 Sending...' : '📧 Send Status Email'}
//           </button>
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