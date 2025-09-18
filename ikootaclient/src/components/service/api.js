//ikootaclient\src\components\service\api.js - Unified API configuration
import axios from 'axios';

// ✅ SECURE CONFIGURATION: Production-first API URL determination with environment variable priority
const getApiBaseUrl = () => {
  // Check environment variables first (highest priority)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('🔧 Using environment API URL:', envApiUrl);
    return envApiUrl;
  }

  // FORCE PRODUCTION API FOR ANY NON-LOCALHOST HOSTNAME
  if (window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('localhost')) {
    console.log('🚀 FORCED PRODUCTION API - hostname:', window.location.hostname);
    return 'https://api.ikoota.com:3000/api';
  }

  // Check if running on production domain (additional check)
  if (window.location.hostname === 'www.ikoota.com' || window.location.hostname === 'ikoota.com') {
    console.log('🌐 PRODUCTION DOMAIN DETECTED');
    return 'https://api.ikoota.com:3000/api';
  }

  // Check environment variables for production mode
  if (import.meta.env.PROD || import.meta.env.NODE_ENV === 'production') {
    console.log('🏭 PRODUCTION ENV DETECTED');
    return 'https://api.ikoota.com:3000/api';
  }

  // 🔧 SMART DEVELOPMENT PORT DETECTION
  // Use default development URL if no environment variable

  // Default to port 3000 (currently running), with fallback to 3002, 3001
  console.log('🛠️ DEVELOPMENT MODE - using smart port detection (3000 current, 3002/3001 fallback)');
  return 'http://localhost:3000/api';
};

// 🚀 SMART PORT AUTO-DETECTION SYSTEM
let API_BASE_URL = getApiBaseUrl();
let detectedWorkingPort = null;

// Auto-detect working API port in development
const detectWorkingPort = async () => {
  if (!API_BASE_URL.includes('localhost')) {
    return API_BASE_URL; // Production - no need to detect
  }

  const portsToTry = [3000, 3002, 3001]; // Try common ports (3000 is currently running)

  for (const port of portsToTry) {
    try {
      const testUrl = `http://localhost:${port}/health`;
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (response.ok) {
        const newApiUrl = `http://localhost:${port}/api`;
        console.log(`✅ PORT AUTO-DETECTED: Found working API at port ${port}`);
        detectedWorkingPort = port;
        return newApiUrl;
      }
    } catch (error) {
      console.log(`❌ Port ${port} not responding:`, error.message);
    }
  }

  console.log('⚠️ No working port detected, using default:', API_BASE_URL);
  return API_BASE_URL;
};

// Initialize with smart detection
if (API_BASE_URL.includes('localhost')) {
  detectWorkingPort().then(workingUrl => {
    if (workingUrl !== API_BASE_URL) {
      API_BASE_URL = workingUrl;
      console.log('🔄 API URL updated to working port:', API_BASE_URL);
      // Update the api instance with new URL
      window.apiPortUpdated = true;
    }
  });
}

console.log('🔧 Unified API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE || 'development',
  autoDetection: API_BASE_URL.includes('localhost') ? 'enabled' : 'disabled'
});

// Create shared axios configuration
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        headers: config.headers
      });

      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Handle response errors globally
  instance.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error('❌ API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message
      });

      // Check for HTML response (routing issue)
      if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
        console.error('❌ Received HTML instead of JSON - this is a routing/proxy issue');
        console.error('Full HTML response:', error.response.data.substring(0, 200));
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        console.log('🔐 Unauthorized - removing token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }

      // Enhance error object with useful info
      const enhancedError = {
        ...error,
        message: error.response?.data?.message ||
                 error.response?.data?.error ||
                 error.message ||
                 'Network Error',
        status: error.response?.status,
        url: error.config?.url
      };

      return Promise.reject(enhancedError);
    }
  );

  return instance;
};

// Create main API instance
const api = createApiInstance(API_BASE_URL);

// Create membership-specific API instance
const membershipApiInstance = createApiInstance(`${API_BASE_URL}/membership`);

// Handle responses for membership API (return data directly for compatibility)
membershipApiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Membership API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response.data; // Return data directly for membershipApi compatibility
  },
  (error) => {
    console.error('❌ Membership API Error:', error);

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
// MEMBERSHIP API ENDPOINTS
// ===============================================

export const membershipApi = {
  // Get current user's membership status
  getCurrentStatus: async () => {
    return await membershipApiInstance.get('/status');
  },

  // Get membership status by user ID (admin or own status)
  getStatusById: async (userId) => {
    return await membershipApiInstance.get(`/status/${userId}`);
  },

  // Check application status with survey integration
  getApplicationStatus: async () => {
    return await membershipApiInstance.get('/application/status');
  },

  // Get user dashboard data
  getDashboard: async () => {
    return await membershipApiInstance.get('/dashboard');
  },

  // Get user permissions
  getPermissions: async () => {
    return await membershipApiInstance.get('/permissions');
  },

  // ===============================================
  // INITIAL APPLICATION ENDPOINTS
  // ===============================================

  // Submit initial application
  submitInitialApplication: async (answers, applicationTicket) => {
    return await membershipApiInstance.post('/apply/initial', {
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
    return await membershipApiInstance.put('/apply/initial', {
      answers,
      applicationTicket
    });
  },

  // Get initial application details
  getInitialApplication: async () => {
    return await membershipApiInstance.get('/apply/initial');
  },

  // ===============================================
  // FULL MEMBERSHIP ENDPOINTS
  // ===============================================

  // Get full membership status
  getFullMembershipStatus: async () => {
    return await membershipApiInstance.get('/full-membership/status');
  },

  // Get full membership status by user ID
  getFullMembershipStatusById: async (userId) => {
    return await membershipApiInstance.get(`/full-membership/status/${userId}`);
  },

  // Submit full membership application
  submitFullMembershipApplication: async (answers, membershipTicket) => {
    return await membershipApiInstance.post('/apply/full', {
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
    return await membershipApiInstance.post('/apply/full/reapply', {
      answers,
      membershipTicket
    });
  },

  // Update full membership application
  updateFullMembershipApplication: async (answers) => {
    return await membershipApiInstance.put('/apply/full', { answers });
  },

  // Withdraw full membership application
  withdrawFullMembershipApplication: async (reason) => {
    return await membershipApiInstance.post('/apply/full/withdraw', { reason });
  },

  // Get full membership history
  getFullMembershipHistory: async () => {
    return await membershipApiInstance.get('/full-membership/history');
  },

  // ===============================================
  // APPLICATION MANAGEMENT ENDPOINTS
  // ===============================================

  // Get application history
  getApplicationHistory: async () => {
    return await membershipApiInstance.get('/application-history');
  },

  // Update application answers
  updateApplicationAnswers: async (answers, applicationType = 'initial_application') => {
    return await membershipApiInstance.put('/application/update-answers', {
      answers,
      applicationType
    });
  },

  // Withdraw application
  withdrawApplication: async (reason, applicationType = 'initial_application') => {
    return await membershipApiInstance.post('/admin/application/withdraw', {
      reason,
      applicationType
    });
  },

  // ===============================================
  // SURVEY INTEGRATION ENDPOINTS
  // ===============================================

  // Save survey draft
  saveSurveyDraft: async (answers, applicationType = 'initial_application') => {
    return await membershipApiInstance.post('/survey/save-draft', {
      answers,
      applicationType
    });
  },

  // Get survey drafts
  getSurveyDrafts: async (applicationType) => {
    const params = applicationType ? { applicationType } : {};
    return await membershipApiInstance.get('/survey/drafts', { params });
  },

  // Submit survey application
  submitSurveyApplication: async (answers, applicationTicket) => {
    return await membershipApiInstance.post('/survey/submit-applicationsurvey', {
      answers,
      applicationTicket
    });
  },

  // ===============================================
  // ACCESS TRACKING ENDPOINTS
  // ===============================================

  // Log full membership access
  logFullMembershipAccess: async () => {
    return await membershipApiInstance.post('/log-full-membership-access');
  },

  // ===============================================
  // INFORMATION ENDPOINTS
  // ===============================================

  // Get membership requirements
  getRequirements: async (type = 'initial') => {
    return await membershipApiInstance.get('/requirements', { params: { type } });
  },

  // Get question labels for forms
  getQuestionLabels: async () => {
    return await membershipApiInstance.get('/question-labels');
  },

  // Get basic membership statistics
  getStats: async () => {
    return await membershipApiInstance.get('/stats');
  },

  // ===============================================
  // ADMIN ENDPOINTS (REQUIRES ADMIN ROLE)
  // ===============================================

  admin: {
    // Get pending applications
    getPendingApplications: async (params = {}) => {
      return await membershipApiInstance.get('/admin/pending-applications', { params });
    },

    // Get all pending applications (unified view)
    getAllPendingApplications: async (params = {}) => {
      return await membershipApiInstance.get('/admin/applications', { params });
    },

    // Get pending full memberships
    getPendingFullMemberships: async (params = {}) => {
      return await membershipApiInstance.get('/admin/pending-full-memberships', { params });
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
      return await membershipApiInstance.post(`/admin/approve-application/${applicationId}`, compatibleData);
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
      return await membershipApiInstance.post(`/admin/decline-application/${applicationId}`, compatibleData);
    },

    // Review application (unified)
    reviewApplication: async (applicationId, data) => {
      return await membershipApiInstance.post(`/admin/review-application/${applicationId}`, data);
    },

    // Review full membership
    reviewFullMembership: async (applicationId, data) => {
      return await membershipApiInstance.post(`/admin/review-full-membership/${applicationId}`, data);
    },

    // Bulk review operations
    bulkReviewApplications: async (data) => {
      return await membershipApiInstance.post('/admin/bulk-review-applications', data);
    },

    bulkReviewFullMemberships: async (data) => {
      return await membershipApiInstance.post('/admin/bulk-review-full-memberships', data);
    },

    // Analytics and reporting
    getOverview: async () => {
      return await membershipApiInstance.get('/admin/overview');
    },

    getStats: async (params = {}) => {
      return await membershipApiInstance.get('/admin/stats', { params });
    },

    getAnalytics: async (params = {}) => {
      return await membershipApiInstance.get('/admin/analytics', { params });
    },

    getReports: async () => {
      return await membershipApiInstance.get('/admin/reports');
    },

    getFullMembershipStats: async (params = {}) => {
      return await membershipApiInstance.get('/admin/full-membership-stats', { params });
    },

    // User management
    searchUsers: async (params = {}) => {
      return await membershipApiInstance.get('/admin/search-users', { params });
    },

    getAvailableMentors: async () => {
      return await membershipApiInstance.get('/admin/available-mentors');
    },

    getAvailableClasses: async () => {
      return await membershipApiInstance.get('/admin/available-classes');
    },

    // System management
    getSystemConfig: async () => {
      return await membershipApiInstance.get('/admin/system-config');
    },

    updateSystemConfig: async (config) => {
      return await membershipApiInstance.put('/admin/system-config', config);
    },

    exportData: async (params = {}) => {
      return await membershipApiInstance.get('/admin/export', { params });
    },

    getSystemHealth: async () => {
      return await membershipApiInstance.get('/admin/system-health');
    },

    // Notifications
    sendNotification: async (data) => {
      return await membershipApiInstance.post('/admin/send-notification', data);
    },

    // Super admin operations
    performBatchOperations: async (data) => {
      return await membershipApiInstance.post('/admin/batch-operations', data);
    },

    emergencyUserReset: async (userId, reason) => {
      return await membershipApiInstance.post(`/admin/emergency-reset/${userId}`, { reason });
    },

    deleteUser: async (userId, reason) => {
      return await membershipApiInstance.delete(`/admin/users/${userId}`, { data: { reason } });
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

// 🔧 DEVELOPMENT DEBUGGING UTILITIES
if (import.meta.env.DEV) {
  window.apiDev = {
    getCurrentPort: () => detectedWorkingPort,
    getCurrentBaseUrl: () => API_BASE_URL,
    getEnvironment: () => ({
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      viteApiUrl: import.meta.env.VITE_API_URL,
      detectedPort: detectedWorkingPort,
      currentBaseUrl: API_BASE_URL
    }),
    testPort: async (port) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: AbortSignal.timeout(2000)
        });
        console.log(`Port ${port}:`, response.ok ? '✅ Working' : '❌ Not responding');
        return response.ok;
      } catch (error) {
        console.log(`Port ${port}: ❌ Error -`, error.message);
        return false;
      }
    },
    redetectPort: () => detectWorkingPort()
  };

  console.log('🛠️ Development utilities available at window.apiDev');
  console.log('🔧 Try: window.apiDev.getEnvironment()');
}

export default api;



