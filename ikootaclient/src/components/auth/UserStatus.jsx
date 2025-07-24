// ikootaclient/src/components/auth/UserStatus.jsx - FINAL RECOMMENDED VERSION
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../service/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// ✅ ENHANCED: Status determination function with CRITICAL FIX for pre_member handling
const determineUserStatus = ({ role, memberStatus, membershipStage, userId, approvalStatus }) => {
  console.log('🔍 Enhanced status determination:', { role, memberStatus, membershipStage, userId, approvalStatus });

  // ✅ CRITICAL: Normalize empty strings to handle database inconsistencies
  const normalizedMemberStatus = memberStatus === '' ? null : memberStatus;
  const normalizedMembershipStage = membershipStage === '' ? null : membershipStage;
  const normalizedRole = role === '' ? 'user' : role;

  console.log('🔧 Normalized values:', { 
    normalizedRole, 
    normalizedMemberStatus, 
    normalizedMembershipStage, 
    approvalStatus 
  });

  // ✅ Admin check with both admin and super_admin
  if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
    console.log('👑 Admin user detected');
    return {
      isFullMember: true,
      isPendingMember: false,
      userType: 'admin',
      status: 'admin'
    };
  }

  // ✅ CRITICAL: Pre-member check FIRST (before full member check)
  // This handles Monika's case: is_member='pre_member', membership_stage='pre_member'
  if (normalizedMemberStatus === 'pre_member' || 
      normalizedMembershipStage === 'pre_member' ||
      (normalizedMemberStatus === 'granted' && normalizedMembershipStage === 'pre_member') ||
      // ✅ MONIKA'S ORIGINAL CASE: Empty/null member status but approval_status is granted
      ((normalizedMemberStatus === 'applied' || normalizedMemberStatus === null) && (approvalStatus === 'granted' || approvalStatus === 'approved'))) {
    console.log('👤 Pre-member detected (approved user with towncrier access)');
    return {
      isFullMember: false,
      isPendingMember: true,
      userType: 'pre_member',
      status: 'pre_member'
    };
  }

  // ✅ Full member check - ONLY when BOTH are 'member' (and NOT pre_member)
  if (normalizedMemberStatus === 'member' && normalizedMembershipStage === 'member') {
    console.log('💎 Full member detected');
    return {
      isFullMember: true,
      isPendingMember: false,
      userType: 'full_member',
      status: 'full_member'
    };
  }
  
  // ✅ Applied/Pending check (including null/empty as applied)
  if (normalizedMemberStatus === 'applied' || normalizedMemberStatus === 'pending' || normalizedMemberStatus === null) {
    console.log('⏳ Applicant detected');
    return {
      isFullMember: false,
      isPendingMember: true,
      userType: 'applicant',
      status: 'pending_verification'
    };
  }
  
  // Denied/Suspended check
  if (normalizedMemberStatus === 'denied' || normalizedMemberStatus === 'suspended' || normalizedMemberStatus === 'declined') {
    console.log('❌ Denied user detected');
    return {
      isFullMember: false,
      isPendingMember: false,
      userType: 'denied',
      status: 'denied'
    };
  }

  // Default fallback
  console.log('⚠️ Using fallback status for authenticated user');
  return {
    isFullMember: false,
    isPendingMember: false,
    userType: 'authenticated',
    status: 'authenticated'
  };
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('not loaded');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Keep all existing refs to prevent duplicate API calls
  const initializationRef = useRef(false);
  const membershipFetchRef = useRef(false);
  const lastFetchTime = useRef(0);

  // ✅ Keep existing rate limiting
  const RATE_LIMIT_MS = 5000;

  console.log('🚀 Initializing UserProvider');

  // ✅ Keep existing updateUserState function unchanged
  const updateUserState = (newState) => {
    console.log('👤 User state updated:', newState);
    setUser(newState.user || null);
    setMembershipStatus(newState.membershipStatus || 'not loaded');
    setLoading(newState.loading || false);
    setError(newState.error || null);
  };

  // ✅ ENHANCED: fetchMembershipStatus with CRITICAL FIX for approval_status parameter
  const fetchMembershipStatus = async () => {
    // Keep existing rate limiting check
    const now = Date.now();
    if (now - lastFetchTime.current < RATE_LIMIT_MS) {
      console.log('🚫 Rate limited - skipping membership status fetch');
      return;
    }

    // Keep existing duplicate call prevention
    if (membershipFetchRef.current) {
      console.log('🚫 Membership fetch already in progress');
      return;
    }

    membershipFetchRef.current = true;
    lastFetchTime.current = now;

    console.log('🔍 Fetching membership status...');
    
    try {
      const response = await api.get('/membership/survey/check-status');
      console.log('✅ Survey check response:', response.data);

      const tokenData = getTokenUserData();
      if (!tokenData) {
        console.log('❌ No token data available');
        membershipFetchRef.current = false;
        return;
      }

      // ✅ ENHANCED: Combine token data with API response INCLUDING approval_status
      const combinedUserData = {
        user_id: tokenData.user_id,
        username: tokenData.username,
        email: tokenData.email,
        membership_stage: tokenData.membership_stage,
        is_member: tokenData.is_member,
        role: tokenData.role,
        // Add API response data
        survey_completed: response.data.survey_completed,
        approval_status: response.data.approval_status, // ✅ CRITICAL: Include approval status
        needs_survey: response.data.needs_survey,
        survey_data: response.data.survey_data
      };

      console.log('✅ Combined user data:', combinedUserData);

      // ✅ CRITICAL FIX: Use enhanced status determination WITH approvalStatus parameter
      const statusResult = determineUserStatus({
        role: combinedUserData.role,
        memberStatus: combinedUserData.is_member,
        membershipStage: combinedUserData.membership_stage,
        userId: combinedUserData.user_id,
        approvalStatus: combinedUserData.approval_status // ✅ THIS IS THE KEY!
      });

      console.log('✅ Status determined:', statusResult);

      // ✅ Keep existing final status logic
      let finalStatus = statusResult.status;

      // Additional checks for survey requirements (but not for admins, full members, or pre-members)
      if (finalStatus !== 'admin' && finalStatus !== 'full_member' && finalStatus !== 'pre_member') {
        if (response.data.needs_survey === true || response.data.survey_completed === false) {
          finalStatus = 'needs_application';
          console.log('🚨 SECURITY: User needs to complete application survey');
        }
      }

      // ✅ Keep existing user state update structure
      updateUserState({
        user: {
          ...combinedUserData,
          ...statusResult, // Include the status result in user object
          finalStatus // Add the final computed status
        },
        membershipStatus: 'loaded',
        status: finalStatus,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching membership status:', error);
      
      // ✅ ENHANCED: Better error handling with token data fallback
      const tokenData = getTokenUserData();
      if (tokenData) {
        // Use token data even if API call fails
        const fallbackStatus = determineUserStatus({
          role: tokenData.role,
          memberStatus: tokenData.is_member,
          membershipStage: tokenData.membership_stage,
          userId: tokenData.user_id,
          approvalStatus: null // ✅ Pass null for approval status in fallback
        });
        
        updateUserState({
          user: {
            ...tokenData,
            ...fallbackStatus
          },
          membershipStatus: 'error',
          status: fallbackStatus.status,
          loading: false,
          error: `API Error: ${error.message}`
        });
      } else {
        updateUserState({
          user: null,
          membershipStatus: 'error',
          status: 'error',
          loading: false,
          error: error.message
        });
      }
    } finally {
      membershipFetchRef.current = false;
    }
  };

  // ✅ Keep existing getTokenUserData function unchanged
  const getTokenUserData = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        console.log('⚠️ Token expired, removing...');
        localStorage.removeItem('token');
        return null;
      }

      console.log('🔍 Token user data:', decoded);
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      localStorage.removeItem('token');
      return null;
    }
  };

  // ✅ ENHANCED: initializeUser with approval_status support but keeping existing structure
  const initializeUser = async () => {
    if (initializationRef.current) {
      console.log('🚫 User already initialized');
      return;
    }

    initializationRef.current = true;
    console.log('🔄 Initializing user...');

    const tokenData = getTokenUserData();
    
    if (!tokenData) {
      console.log('❌ No valid token found');
      updateUserState({
        user: null,
        membershipStatus: 'not loaded',
        status: 'guest',
        loading: false,
        error: null
      });
      return;
    }

    // ✅ ENHANCED: Set initial user data from token with approval_status support
    const initialStatus = determineUserStatus({
      role: tokenData.role,
      memberStatus: tokenData.is_member,
      membershipStage: tokenData.membership_stage,
      userId: tokenData.user_id,
      approvalStatus: null // ✅ No approval status from token alone
    });

    updateUserState({
      user: {
        ...tokenData,
        ...initialStatus
      },
      membershipStatus: 'loading',
      status: initialStatus.status,
      loading: true,
      error: null
    });

    // Fetch additional membership data
    await fetchMembershipStatus();
  };

  // ✅ Keep existing useEffect unchanged
  useEffect(() => {
    if (!initializationRef.current) {
      initializeUser();
    }
  }, []);

  // ✅ Keep existing isAuthenticated function unchanged
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  // ✅ ENHANCED: getUserStatus with approval_status support in fallback
  const getUserStatus = () => {
    if (!user) return 'guest';
    
    // ✅ Keep existing priority order
    if (user.finalStatus) {
      return user.finalStatus;
    }
    
    if (user.status) {
      return user.status;
    }
    
    // ✅ CRITICAL FIX: Fallback with approval status support
    const fallbackStatus = determineUserStatus({
      role: user.role,
      memberStatus: user.is_member,
      membershipStage: user.membership_stage,
      userId: user.user_id,
      approvalStatus: user.approval_status // ✅ Include approval status in fallback
    });
    
    return fallbackStatus.status;
  };

  // ✅ Keep existing refreshUser function unchanged
  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    
    // Reset refs to allow fresh fetch
    const now = Date.now();
    if (now - lastFetchTime.current > RATE_LIMIT_MS) {
      membershipFetchRef.current = false;
      await fetchMembershipStatus();
    } else {
      console.log('🚫 Refresh rate limited');
    }
  };

  // ✅ Keep existing updateUser function unchanged
  const updateUser = async () => {
    console.log('🔄 Updating user context...');
    await refreshUser();
  };

  // ✅ Keep existing logout function unchanged
  const logout = () => {
    localStorage.removeItem('token');
    
    // Reset all refs
    initializationRef.current = false;
    membershipFetchRef.current = false;
    lastFetchTime.current = 0;
    
    updateUserState({
      user: null,
      membershipStatus: 'not loaded',
      status: 'guest',
      loading: false,
      error: null
    });
  };

  // ✅ Keep existing comprehensive context value unchanged
  const value = {
    user,
    membershipStatus,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    getUserStatus,
    refreshUser,
    updateUser, // Keep this alias for compatibility
    logout,
    // ✅ Keep existing helpful methods
    isAdmin: () => getUserStatus() === 'admin',
    isFullMember: () => getUserStatus() === 'full_member',
    isPreMember: () => getUserStatus() === 'pre_member',
    isPending: () => getUserStatus() === 'pending_verification',
    needsApplication: () => getUserStatus() === 'needs_application'
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};