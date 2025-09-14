// ikootaclient/src/hooks/useUserStatus.js
import { useState, useEffect } from 'react';
import api from '../components/service/api';

export const useUserStatus = () => {
  const [userStatus, setUserStatus] = useState(null);
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NEW: Check survey status function
  const checkSurveyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No token found, skipping survey status check');
        return null;
      }

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/user/userstatus/survey/check-status');
      
      if (response.data) {
        console.log('📋 Survey status fetched:', response.data);
        setSurveyStatus(response.data);
        return response.data;
      }
    } catch (err) {
      console.log('Failed to get survey status:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        console.log('🔍 Token expired or invalid for survey check');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setSurveyStatus(null);
        return null;
      } else if (err.response?.status === 404) {
        // Survey endpoint doesn't exist or user has no survey
        console.log('🔍 No survey data found for user');
        setSurveyStatus({ needs_survey: true, survey_completed: false });
        return { needs_survey: true, survey_completed: false };
      } else {
        console.warn('⚠️ Survey status check failed:', err.message);
        return null;
      }
    }
  };

  const getUserStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated first
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No token found, skipping user status fetch');
        setUserStatus(null);
        setSurveyStatus(null);
        setLoading(false);
        return;
      }

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // ✅ ENHANCED: Fetch both user status and survey status
      const [userResponse, surveyData] = await Promise.allSettled([
        api.get('/user/userstatus/dashboard'),
        checkSurveyStatus()
      ]);

      // Handle user status response
      if (userResponse.status === 'fulfilled' && userResponse.value?.data) {
        setUserStatus(userResponse.value.data);
      } else if (userResponse.status === 'rejected') {
        const err = userResponse.reason;
        
        if (err.response?.status === 401) {
          console.log('🔍 Token expired or invalid, clearing auth data');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUserStatus(null);
          setSurveyStatus(null);
          setError(null);
        } else if (err.response?.status === 403) {
          console.log('🔍 User lacks permission for dashboard');
          setError('Access denied');
        } else {
          setError(err.message || 'Failed to fetch user status');
        }
      }

      // Survey status is already handled in checkSurveyStatus function
      
    } catch (err) {
      console.log('Failed to get user status:', err);
      setError(err.message || 'Failed to fetch user status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch user status if we have a token
    const token = localStorage.getItem('token');
    if (token) {
      getUserStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshStatus = () => {
    getUserStatus();
  };

  // ✅ NEW: Refresh only survey status
  const refreshSurveyStatus = () => {
    checkSurveyStatus();
  };

  // ✅ NEW: Helper function to determine if user should be redirected to survey
  const shouldRedirectToSurvey = () => {
    if (!userStatus || !surveyStatus) return false;
    
    // Only redirect regular users (not admins) who need to complete survey
    // Use membership_stage instead of is_member
    return (
      userStatus.role === 'user' && 
      userStatus.membership_stage !== 'member' &&
      (surveyStatus.needs_survey || !surveyStatus.survey_completed)
    );
  };

  // ✅ NEW: Helper function to get appropriate redirect path - Updated for new fields
  const getRedirectPath = () => {
    if (shouldRedirectToSurvey()) {
      return '/applicationsurvey';
    }
    
    // Use membership_stage as primary field for redirects
    if (userStatus?.role === 'admin' || userStatus?.role === 'super_admin') {
      return '/admin';
    } else if (userStatus?.membership_stage === 'member') {
      return '/iko';
    } else if (userStatus?.membership_stage === 'pre_member') {
      return '/towncrier';
    } else if (userStatus?.membership_stage === 'applicant') {
      return '/pending-verification';
    } else {
      return '/towncrier';
    }
  };

  return {
    userStatus,
    surveyStatus, // ✅ NEW: Expose survey status
    loading,
    error,
    refreshStatus,
    refreshSurveyStatus, // ✅ NEW: Function to refresh only survey status
    shouldRedirectToSurvey, // ✅ NEW: Helper for survey redirect logic
    getRedirectPath, // ✅ NEW: Helper for getting redirect path
    checkSurveyStatus // ✅ NEW: Expose survey check function
  };
};

// Also provide default export for compatibility
export default useUserStatus;

