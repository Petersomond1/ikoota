// ikootaclient/src/components/service/fullMembershipService.js
// Service functions for Full Membership Review Operations
// Parallel to surveypageservice.js but for full membership applications

import { useMutation, useQuery } from '@tanstack/react-query';
import api from './api';

// =====================================================
// SUBMISSION SERVICES (for applicants)
// =====================================================

/**
 * Submit full membership application
 * Used by pre-members applying for full membership
 */
const submitFullMembershipApplication = async (applicationData) => {
  console.log('🔍 Submitting full membership application:', applicationData);
  
  // Add compatibility fields to the application data
  const compatibleData = {
    ...applicationData,
    // Compatibility fields - include both old and new names
    survey_type: applicationData.survey_type || 'full_membership', // New field name
    application_type: applicationData.application_type || 'full_membership', // Legacy field name
    status: applicationData.status || 'pending', // New field name
    approval_status: applicationData.approval_status || 'pending', // Legacy field name
    notes: applicationData.notes || '', // New field name
    admin_notes: applicationData.admin_notes || '' // Legacy field name
  };
  
  const res = await api.post('/membership/full-membership/submit-full-membership', compatibleData, { 
    withCredentials: true 
  });
  
  console.log('✅ Full membership submission response:', res.data);
  return res.data;
};

/**
 * Reapply for full membership (after decline)
 */
const reapplyFullMembership = async (applicationData) => {
  console.log('🔍 Reapplying for full membership:', applicationData);
  
  const res = await api.post('/membership/full-membership/reapply-full-membership', applicationData, { 
    withCredentials: true 
  });
  
  console.log('✅ Full membership reapplication response:', res.data);
  return res.data;
};

/**
 * Get user's full membership status
 */
const getFullMembershipStatus = async (userId) => {
  console.log('🔍 Fetching full membership status for user:', userId);
  
  const res = await api.get(`/membership/full-membership/status/${userId}`, { 
    withCredentials: true 
  });
  
  console.log('✅ Full membership status response:', res.data);
  return res.data;
};

// =====================================================
// ADMIN REVIEW SERVICES
// =====================================================

/**
 * Fetch all full membership applications (Admin)
 */
const fetchFullMembershipApplications = async (filters = {}) => {
  console.log('🔍 Fetching full membership applications with filters:', filters);
  
  const params = new URLSearchParams({
    status: 'pending',
    limit: 50,
    offset: 0,
    ...filters
  });
  
  const res = await api.get(`/membership/admin/applications?${params}`, { 
    withCredentials: true 
  });
  
  console.log('✅ Full membership applications response:', res.data);
  return res.data;
};

/**
 * Review full membership application (Admin approve/decline)
 */
const reviewFullMembershipApplication = async ({ applicationId, status, adminNotes }) => {
  console.log('🔍 Reviewing full membership application:', { applicationId, status, adminNotes });
  
  if (!['approved', 'declined'].includes(status)) {
    throw new Error('Invalid status. Must be "approved" or "declined"');
  }
  
  const res = await api.put(`/membership/admin/applications/${applicationId}/review`, {
    // Compatibility fields - include both old and new names
    status, // New field name
    approval_status: status, // Legacy field name
    notes: adminNotes || '', // New field name
    adminNotes: adminNotes || '', // Middle compatibility field
    admin_notes: adminNotes || '' // Legacy field name
  }, { 
    withCredentials: true 
  });
  
  console.log('✅ Application review response:', res.data);
  return res.data;
};

/**
 * Get application statistics (Admin)
 */
const getApplicationStatistics = async () => {
  console.log('🔍 Fetching application statistics...');
  
  const res = await api.get('/membership/admin/stats', { 
    withCredentials: true 
  });
  
  console.log('✅ Application statistics response:', res.data);
  return res.data;
};

/**
 * Send feedback email for application decision
 */
const sendApplicationFeedbackEmail = async ({ email, status, applicantName, membershipTicket, customMessage }) => {
  console.log('🔍 Sending application feedback email:', { email, status, applicantName });
  
  const res = await api.post('/communication/email/send-membership-feedback', {
    email,
    status,
    applicantName,
    membershipTicket,
    customMessage,
    template: status === 'approved' ? 'full_membership_approved' : 'full_membership_declined'
  }, { 
    withCredentials: true 
  });
  
  console.log('✅ Feedback email response:', res.data);
  return res.data;
};

/**
 * Bulk operations for multiple applications (Admin)
 */
const bulkReviewApplications = async ({ applicationIds, action, adminNotes }) => {
  console.log('🔍 Bulk reviewing applications:', { applicationIds, action, adminNotes });
  
  const res = await api.post('/membership/admin/applications/bulk-review', {
    applicationIds,
    action,
    adminNotes
  }, { 
    withCredentials: true 
  });
  
  console.log('✅ Bulk review response:', res.data);
  return res.data;
};

/**
 * Export applications data (Admin)
 */
const exportApplicationsData = async (filters = {}) => {
  console.log('🔍 Exporting applications data with filters:', filters);
  
  const params = new URLSearchParams(filters);
  const res = await api.get(`/membership/admin/applications/export?${params}`, { 
    withCredentials: true,
    responseType: 'blob' // For file download
  });
  
  console.log('✅ Export completed');
  return res.data;
};

// =====================================================
// REACT QUERY HOOKS FOR APPLICANTS
// =====================================================

/**
 * Hook for submitting full membership application
 */
export const useSubmitFullMembershipApplication = () => {
  return useMutation({
    mutationFn: submitFullMembershipApplication,
    onSuccess: (data) => {
      console.log('✅ Full membership application submitted successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Full membership application submission failed:', error);
    }
  });
};

/**
 * Hook for reapplying for full membership
 */
export const useReapplyFullMembership = () => {
  return useMutation({
    mutationFn: reapplyFullMembership,
    onSuccess: (data) => {
      console.log('✅ Full membership reapplication submitted successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Full membership reapplication failed:', error);
    }
  });
};

/**
 * Hook for fetching user's full membership status
 */
export const useFullMembershipStatus = (userId, options = {}) => {
  return useQuery({
    queryKey: ['fullMembershipStatus', userId],
    queryFn: () => getFullMembershipStatus(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

// =====================================================
// REACT QUERY HOOKS FOR ADMIN REVIEW
// =====================================================

/**
 * Hook for fetching full membership applications (Admin)
 */
export const useFullMembershipApplications = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['fullMembershipApplications', filters],
    queryFn: () => fetchFullMembershipApplications(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Hook for reviewing full membership application (Admin)
 */
export const useReviewFullMembershipApplication = () => {
  return useMutation({
    mutationFn: reviewFullMembershipApplication,
    onSuccess: (data, variables) => {
      console.log('✅ Application review completed:', variables.status);
    },
    onError: (error) => {
      console.error('❌ Application review failed:', error);
    }
  });
};

/**
 * Hook for fetching application statistics (Admin)
 */
export const useApplicationStatistics = (options = {}) => {
  return useQuery({
    queryKey: ['applicationStatistics'],
    queryFn: getApplicationStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

/**
 * Hook for sending feedback emails
 */
export const useSendApplicationFeedback = () => {
  return useMutation({
    mutationFn: sendApplicationFeedbackEmail,
    onSuccess: (data) => {
      console.log('✅ Feedback email sent successfully');
    },
    onError: (error) => {
      console.error('❌ Feedback email failed:', error);
    }
  });
};

/**
 * Hook for bulk reviewing applications (Admin)
 */
export const useBulkReviewApplications = () => {
  return useMutation({
    mutationFn: bulkReviewApplications,
    onSuccess: (data, variables) => {
      console.log('✅ Bulk review completed:', variables.action);
    },
    onError: (error) => {
      console.error('❌ Bulk review failed:', error);
    }
  });
};

/**
 * Hook for exporting applications data (Admin)
 */
export const useExportApplicationsData = () => {
  return useMutation({
    mutationFn: exportApplicationsData,
    onSuccess: (data) => {
      console.log('✅ Applications data exported successfully');
      
      // Trigger file download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full_membership_applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('❌ Export failed:', error);
    }
  });
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format application status for display
 */
export const formatApplicationStatus = (status) => {
  const statusMap = {
    'not_applied': { text: 'Not Applied', color: 'gray', icon: '📋' },
    'pending': { text: 'Under Review', color: 'yellow', icon: '⏳' },
    'approved': { text: 'Approved', color: 'green', icon: '✅' },
    'declined': { text: 'Declined', color: 'red', icon: '❌' }
  };
  
  return statusMap[status] || { text: status, color: 'gray', icon: '❓' };
};

/**
 * Calculate days since application submission
 */
export const calculateDaysPending = (submittedAt) => {
  if (!submittedAt) return 0;
  
  const submissionDate = new Date(submittedAt);
  const now = new Date();
  const diffTime = Math.abs(now - submissionDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Validate application data before submission
 */
export const validateApplicationData = (applicationData) => {
  const errors = [];
  
  if (!applicationData.answers || !Array.isArray(applicationData.answers)) {
    errors.push('Application answers are required');
  }
  
  if (!applicationData.membershipTicket) {
    errors.push('Membership ticket is required');
  }
  
  if (applicationData.answers && applicationData.answers.length === 0) {
    errors.push('At least one application answer is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate membership ticket (utility function)
 */
export const generateMembershipTicket = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `FM-${timestamp}-${randomStr}`.toUpperCase();
};

// =====================================================
// DEFAULT EXPORT WITH ALL FUNCTIONS
// =====================================================

export default {
  // Service functions
  submitFullMembershipApplication,
  reapplyFullMembership,
  getFullMembershipStatus,
  fetchFullMembershipApplications,
  reviewFullMembershipApplication,
  getApplicationStatistics,
  sendApplicationFeedbackEmail,
  bulkReviewApplications,
  exportApplicationsData,
  
  // React Query hooks
  useSubmitFullMembershipApplication,
  useReapplyFullMembership,
  useFullMembershipStatus,
  useFullMembershipApplications,
  useReviewFullMembershipApplication,
  useApplicationStatistics,
  useSendApplicationFeedback,
  useBulkReviewApplications,
  useExportApplicationsData,
  
  // Utility functions
  formatApplicationStatus,
  calculateDaysPending,
  validateApplicationData,
  generateMembershipTicket
};