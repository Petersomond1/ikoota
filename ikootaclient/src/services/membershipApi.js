// ikootaclient/src/services/membershipApi.js
// MEMBERSHIP API SERVICE - CONNECTS TO NEW BACKEND ROUTES

import axios from 'axios';

// ✅ SECURE CONFIGURATION: Production-first API URL determination
const getApiBaseUrl = () => {
  // Check if running on production domain
  if (window.location.hostname === 'www.ikoota.com' || window.location.hostname === 'ikoota.com') {
    return 'https://api.ikoota.com:8443/api';
  }

  // Check environment variables
  if (import.meta.env.PROD || import.meta.env.NODE_ENV === 'production') {
    return 'https://api.ikoota.com:8443/api';
  }

  // In development, use environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 Membership API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE || 'development'
});

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/membership`,
  timeout: 15000,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Membership API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      throw new Error(errorData.error || errorData.message || 'Server error');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// ===============================================
// MEMBERSHIP STATUS ENDPOINTS
// ===============================================

export const membershipApi = {
  // Get current user's membership status
  getCurrentStatus: async () => {
    return await api.get('/status');
  },

  // Get membership status by user ID (admin or own status)
  getStatusById: async (userId) => {
    return await api.get(`/status/${userId}`);
  },

  // Check application status with survey integration
  getApplicationStatus: async () => {
    return await api.get('/application/status');
  },

  // Get user dashboard data
  getDashboard: async () => {
    return await api.get('/dashboard');
  },

  // Get user permissions
  getPermissions: async () => {
    return await api.get('/permissions');
  },

  // ===============================================
  // INITIAL APPLICATION ENDPOINTS
  // ===============================================

  // Submit initial application
  submitInitialApplication: async (answers, applicationTicket) => {
    return await api.post('/apply/initial', {
      answers,
      applicationTicket,
      // Compatibility fields - include both old and new names
      survey_type: 'initial_application', // New field name
      application_type: 'initial_application', // Legacy field name
      status: 'pending', // New field name
      approval_status: 'pending', // Legacy field name
      notes: '', // New field name
      admin_notes: '' // Legacy field name
    });
  },

  // Update initial application
  updateInitialApplication: async (answers, applicationTicket) => {
    return await api.put('/apply/initial', {
      answers,
      applicationTicket
    });
  },

  // Get initial application details
  getInitialApplication: async () => {
    return await api.get('/apply/initial');
  },

  // ===============================================
  // FULL MEMBERSHIP ENDPOINTS
  // ===============================================

  // Get full membership status
  getFullMembershipStatus: async () => {
    return await api.get('/full-membership/status');
  },

  // Get full membership status by user ID
  getFullMembershipStatusById: async (userId) => {
    return await api.get(`/full-membership/status/${userId}`);
  },

  // Submit full membership application
  submitFullMembershipApplication: async (answers, membershipTicket) => {
    return await api.post('/apply/full', {
      answers,
      membershipTicket,
      // Compatibility fields - include both old and new names
      survey_type: 'full_membership', // New field name
      application_type: 'full_membership', // Legacy field name
      status: 'pending', // New field name
      approval_status: 'pending', // Legacy field name
      notes: '', // New field name
      admin_notes: '' // Legacy field name
    });
  },

  // Reapply for full membership
  reapplyFullMembership: async (answers, membershipTicket) => {
    return await api.post('/apply/full/reapply', {
      answers,
      membershipTicket
    });
  },

  // Update full membership application
  updateFullMembershipApplication: async (answers) => {
    return await api.put('/apply/full', { answers });
  },

  // Withdraw full membership application
  withdrawFullMembershipApplication: async (reason) => {
    return await api.post('/apply/full/withdraw', { reason });
  },

  // Get full membership history
  getFullMembershipHistory: async () => {
    return await api.get('/full-membership/history');
  },

  // ===============================================
  // APPLICATION MANAGEMENT ENDPOINTS
  // ===============================================

  // Get application history
  getApplicationHistory: async () => {
    return await api.get('/application-history');
  },

  // Update application answers
  updateApplicationAnswers: async (answers, applicationType = 'initial_application') => {
    return await api.put('/application/update-answers', {
      answers,
      applicationType
    });
  },

  // Withdraw application
  withdrawApplication: async (reason, applicationType = 'initial_application') => {
    return await api.post('/admin/application/withdraw', {
      reason,
      applicationType
    });
  },

  // ===============================================
  // SURVEY INTEGRATION ENDPOINTS
  // ===============================================

  // Save survey draft
  saveSurveyDraft: async (answers, applicationType = 'initial_application') => {
    return await api.post('/survey/save-draft', {
      answers,
      applicationType
    });
  },

  // Get survey drafts
  getSurveyDrafts: async (applicationType) => {
    const params = applicationType ? { applicationType } : {};
    return await api.get('/survey/drafts', { params });
  },

  // Submit survey application
  submitSurveyApplication: async (answers, applicationTicket) => {
    return await api.post('/survey/submit-applicationsurvey', {
      answers,
      applicationTicket
    });
  },

  // ===============================================
  // ACCESS TRACKING ENDPOINTS
  // ===============================================

  // Log full membership access
  logFullMembershipAccess: async () => {
    return await api.post('/log-full-membership-access');
  },

  // ===============================================
  // INFORMATION ENDPOINTS
  // ===============================================

  // Get membership requirements
  getRequirements: async (type = 'initial') => {
    return await api.get('/requirements', { params: { type } });
  },

  // Get question labels for forms
  getQuestionLabels: async () => {
    return await api.get('/question-labels');
  },

  // Get basic membership statistics
  getStats: async () => {
    return await api.get('/stats');
  },

  // ===============================================
  // ADMIN ENDPOINTS (REQUIRES ADMIN ROLE)
  // ===============================================

  admin: {
    // Get pending applications
    getPendingApplications: async (params = {}) => {
      return await api.get('/admin/pending-applications', { params });
    },

    // Get all pending applications (unified view)
    getAllPendingApplications: async (params = {}) => {
      return await api.get('/admin/applications', { params });
    },

    // Get pending full memberships
    getPendingFullMemberships: async (params = {}) => {
      return await api.get('/admin/pending-full-memberships', { params });
    },

    // Approve application
    approveApplication: async (applicationId, data) => {
      const compatibleData = {
        ...data,
        // Compatibility fields - include both old and new names
        status: data.status || 'approved', // New field name
        approval_status: data.approval_status || 'approved', // Legacy field name
        notes: data.notes || data.admin_notes || '', // New field name
        admin_notes: data.admin_notes || data.notes || '' // Legacy field name
      };
      return await api.post(`/admin/approve-application/${applicationId}`, compatibleData);
    },

    // Decline application
    declineApplication: async (applicationId, data) => {
      const compatibleData = {
        ...data,
        // Compatibility fields - include both old and new names
        status: data.status || 'rejected', // New field name
        approval_status: data.approval_status || 'rejected', // Legacy field name
        notes: data.notes || data.admin_notes || '', // New field name
        admin_notes: data.admin_notes || data.notes || '' // Legacy field name
      };
      return await api.post(`/admin/decline-application/${applicationId}`, compatibleData);
    },

    // Review application (unified)
    reviewApplication: async (applicationId, data) => {
      return await api.post(`/admin/review-application/${applicationId}`, data);
    },

    // Review full membership
    reviewFullMembership: async (applicationId, data) => {
      return await api.post(`/admin/review-full-membership/${applicationId}`, data);
    },

    // Bulk review operations
    bulkReviewApplications: async (data) => {
      return await api.post('/admin/bulk-review-applications', data);
    },

    bulkReviewFullMemberships: async (data) => {
      return await api.post('/admin/bulk-review-full-memberships', data);
    },

    // Analytics and reporting
    getOverview: async () => {
      return await api.get('/admin/overview');
    },

    getStats: async (params = {}) => {
      return await api.get('/admin/stats', { params });
    },

    getAnalytics: async (params = {}) => {
      return await api.get('/admin/analytics', { params });
    },

    getReports: async () => {
      return await api.get('/admin/reports');
    },

    getFullMembershipStats: async (params = {}) => {
      return await api.get('/admin/full-membership-stats', { params });
    },

    // User management
    searchUsers: async (params = {}) => {
      return await api.get('/admin/search-users', { params });
    },

    getAvailableMentors: async () => {
      return await api.get('/admin/available-mentors');
    },

    getAvailableClasses: async () => {
      return await api.get('/admin/available-classes');
    },

    // System management
    getSystemConfig: async () => {
      return await api.get('/admin/system-config');
    },

    updateSystemConfig: async (config) => {
      return await api.put('/admin/system-config', config);
    },

    exportData: async (params = {}) => {
      return await api.get('/admin/export', { params });
    },

    getSystemHealth: async () => {
      return await api.get('/admin/system-health');
    },

    // Notifications
    sendNotification: async (data) => {
      return await api.post('/admin/send-notification', data);
    },

    // Super admin operations
    performBatchOperations: async (data) => {
      return await api.post('/admin/batch-operations', data);
    },

    emergencyUserReset: async (userId, reason) => {
      return await api.post(`/admin/emergency-reset/${userId}`, { reason });
    },

    deleteUser: async (userId, reason) => {
      return await api.delete(`/admin/users/${userId}`, { data: { reason } });
    }
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Generate application ticket
export const generateApplicationTicket = (username, email, type = 'INITIAL') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const prefix = type === 'FULL' ? 'FMA' : 'APP';
  return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

// Check if user can access content type
export const canAccessContent = (membershipStatus, contentType) => {
  if (!membershipStatus) return false;
  
  const { membership_stage } = membershipStatus;
  
  const accessRules = {
    'towncrier': ['pre_member', 'member'],
    'iko': ['member'],
    'basic': ['applicant', 'pre_member', 'member']
  };
  
  return accessRules[contentType]?.includes(membership_stage) || false;
};

// Get next action for user based on status
export const getNextAction = (membershipStatus) => {
  if (!membershipStatus) return { action: 'apply', text: 'Apply for Membership' };
  
  const { membership_stage, user_status, needs_survey } = membershipStatus;
  
  if (membership_stage === 'member') {
    return { action: 'access_iko', text: 'Access Iko Content' };
  }
  
  if (membership_stage === 'pre_member') {
    return { action: 'apply_full', text: 'Apply for Full Membership' };
  }
  
  if (needs_survey || user_status === 'pending') {
    return { action: 'complete_survey', text: 'Complete Application' };
  }
  
  if (user_status === 'rejected') {
    return { action: 'reapply', text: 'Resubmit Application' };
  }
  
  return { action: 'apply', text: 'Apply for Membership' };
};

// Format membership status for display
export const formatMembershipStatus = (membershipStatus) => {
  if (!membershipStatus) return 'Unknown';
  
  const { membership_stage, user_status } = membershipStatus;
  
  const statusMap = {
    'member': 'Full Member',
    'pre_member': 'Pre-Member',
    'applicant': 'Applicant',
    'none': 'Guest'
  };
  
  return statusMap[membership_stage] || 'Unknown';
};

export default membershipApi;