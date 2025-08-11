// ikootaclient/src/components/auth/UserStatus.jsx - FIXED API CALLS
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

// ✅ STANDARDIZED: Two clear levels - pre_member and member
const determineUserStatus = ({ 
  role, 
  memberStatus, 
  membershipStage, 
  userId, 
  approvalStatus,
  fullMembershipApplicationStatus, // This tracks the APPLICATION, not a separate membership level
  fullMembershipAppliedAt 
}) => {
  console.log('🔍 Status determination with standardized levels:', { 
    role, memberStatus, membershipStage, userId, approvalStatus, fullMembershipApplicationStatus 
  });

  // Normalize empty strings
  const normalizedMemberStatus = memberStatus === '' ? null : memberStatus;
  const normalizedMembershipStage = membershipStage === '' ? null : membershipStage;
  const normalizedRole = role === '' ? 'user' : role;
  const normalizedApplicationStatus = fullMembershipApplicationStatus === '' ? 'not_applied' : fullMembershipApplicationStatus;

  console.log('🔧 Normalized values:', { 
    normalizedRole, 
    normalizedMemberStatus, 
    normalizedMembershipStage, 
    approvalStatus,
    normalizedApplicationStatus
  });

  // ✅ Admin check
  if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
    console.log('👑 Admin user detected');
    return {
      isMember: true, // Admins have full access
      isPendingMember: false,
      userType: 'admin',
      status: 'admin',
      canApplyForMembership: false,
      membershipApplicationStatus: 'admin_exempt',
      canAccessTowncrier: true,
      canAccessIko: true
    };
  }

  // ✅ FULL MEMBER CHECK (member level - highest non-admin level)
  if (normalizedMemberStatus === 'member' && normalizedMembershipStage === 'member') {
    console.log('💎 Full member detected');
    return {
      isMember: true,
      isPendingMember: false,
      userType: 'member',
      status: 'member',
      canApplyForMembership: false,
      membershipApplicationStatus: 'approved', // They already are members
      canAccessTowncrier: true,
      canAccessIko: true
    };
  }

  // ✅ PRE-MEMBER WITH MEMBERSHIP APPLICATION LOGIC
  if (normalizedMemberStatus === 'pre_member' || 
      normalizedMembershipStage === 'pre_member' ||
      (normalizedMemberStatus === 'granted' && normalizedMembershipStage === 'pre_member') ||
      ((normalizedMemberStatus === 'applied' || normalizedMemberStatus === null) && 
       (approvalStatus === 'granted' || approvalStatus === 'approved'))) {
    
    console.log('👤 Pre-member detected, checking membership application status...');
    
    // Handle different application states for pre-members
    switch (normalizedApplicationStatus) {
      case 'pending':
        console.log('⏳ Pre-member with pending membership application');
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member_pending_upgrade',
          canApplyForMembership: false, // Already applied
          membershipApplicationStatus: 'pending',
          canAccessTowncrier: true,
          canAccessIko: false
        };
        
      case 'approved':
        // If application approved, they should be upgraded to member
        console.log('✅ Pre-member with approved application - should be member now');
        return {
          isMember: true,
          isPendingMember: false,
          userType: 'member',
          status: 'member',
          canApplyForMembership: false,
          membershipApplicationStatus: 'approved',
          canAccessTowncrier: true,
          canAccessIko: true
        };
        
      case 'declined':
        console.log('❌ Pre-member with declined application');
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member_can_reapply',
          canApplyForMembership: true, // Can reapply
          membershipApplicationStatus: 'declined',
          canAccessTowncrier: true,
          canAccessIko: false
        };
        
      case 'not_applied':
      default:
        console.log('📝 Pre-member eligible for membership application');
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member',
          canApplyForMembership: true,
          membershipApplicationStatus: 'not_applied',
          canAccessTowncrier: true,
          canAccessIko: false
        };
    }
  }

  // ✅ Applied/Pending check (for initial applications)
  if (normalizedMemberStatus === 'applied' || normalizedMemberStatus === 'pending' || normalizedMemberStatus === null) {
    console.log('⏳ Applicant detected');
    return {
      isMember: false,
      isPendingMember: true,
      userType: 'applicant',
      status: 'pending_verification',
      canApplyForMembership: false,
      membershipApplicationStatus: 'not_eligible',
      canAccessTowncrier: false,
      canAccessIko: false
    };
  }
  
  // Denied/Suspended check
  if (normalizedMemberStatus === 'denied' || normalizedMemberStatus === 'suspended' || normalizedMemberStatus === 'declined') {
    console.log('❌ Denied user detected');
    return {
      isMember: false,
      isPendingMember: false,
      userType: 'denied',
      status: 'denied',
      canApplyForMembership: false,
      membershipApplicationStatus: 'not_eligible',
      canAccessTowncrier: false,
      canAccessIko: false
    };
  }

  // Default fallback
  console.log('⚠️ Using fallback status for authenticated user');
  return {
    isMember: false,
    isPendingMember: false,
    userType: 'authenticated',
    status: 'authenticated',
    canApplyForMembership: false,
    membershipApplicationStatus: 'unknown',
    canAccessTowncrier: false,
    canAccessIko: false
  };
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('not loaded');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializationRef = useRef(false);
  const membershipFetchRef = useRef(false);
  const lastFetchTime = useRef(0);
  const RATE_LIMIT_MS = 5000;

  console.log('🚀 Initializing UserProvider with standardized levels');

  const updateUserState = (newState) => {
    console.log('👤 User state updated:', newState);
    setUser(newState.user || null);
    setMembershipStatus(newState.membershipStatus || 'not loaded');
    setLoading(newState.loading || false);
    setError(newState.error || null);
  };

  // ✅ FIXED: Fetch membership application status with correct API path
  const fetchMembershipApplicationStatus = async (userId) => {
    try {
      // ✅ FIXED: Use correct API endpoint
      const response = await api.get(`/membership/status/${userId}`);
      console.log('✅ Membership application status response:', response.data);
      return {
        membershipApplicationStatus: response.data.status || 'not_applied',
        membershipAppliedAt: response.data.appliedAt,
        membershipReviewedAt: response.data.reviewedAt,
        membershipTicket: response.data.ticket,
        membershipAdminNotes: response.data.adminNotes
      };
    } catch (error) {
      console.log('⚠️ Membership application status not available:', error.message);
      return {
        membershipApplicationStatus: 'not_applied',
        membershipAppliedAt: null,
        membershipReviewedAt: null,
        membershipTicket: null,
        membershipAdminNotes: null
      };
    }
  };

  // ✅ FIXED: fetchMembershipStatus with correct API endpoints
  const fetchMembershipStatus = async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < RATE_LIMIT_MS) {
      console.log('🚫 Rate limited - skipping membership status fetch');
      return;
    }

    if (membershipFetchRef.current) {
      console.log('🚫 Membership fetch already in progress');
      return;
    }

    membershipFetchRef.current = true;
    lastFetchTime.current = now;

    console.log('🔍 Fetching comprehensive membership status...');
    
    try {
      const tokenData = getTokenUserData();
      if (!tokenData) {
        console.log('❌ No token data available');
        membershipFetchRef.current = false;
        return;
      }

      // ✅ FIXED: Use correct API endpoints
      const [surveyResponse, membershipApplicationData] = await Promise.allSettled([
        api.get('/user-status/survey/status'), // ✅ FIXED: Correct endpoint
        fetchMembershipApplicationStatus(tokenData.user_id)
      ]);

      let surveyData = {};
      if (surveyResponse.status === 'fulfilled') {
        surveyData = surveyResponse.value.data;
      } else {
        console.log('⚠️ Survey status fetch failed:', surveyResponse.reason?.message);
      }

      let membershipApplicationInfo = {};
      if (membershipApplicationData.status === 'fulfilled') {
        membershipApplicationInfo = membershipApplicationData.value;
      } else {
        console.log('⚠️ Membership application fetch failed:', membershipApplicationData.reason?.message);
      }

      // ✅ STANDARDIZED: Combine all data sources
      const combinedUserData = {
        user_id: tokenData.user_id,
        username: tokenData.username,
        email: tokenData.email,
        membership_stage: tokenData.membership_stage,
        is_member: tokenData.is_member,
        role: tokenData.role,
        // Initial membership data
        survey_completed: surveyData.survey_completed,
        approval_status: surveyData.approval_status,
        needs_survey: surveyData.needs_survey,
        survey_data: surveyData.survey_data,
        // ✅ STANDARDIZED: Membership application data (not separate membership level)
        ...membershipApplicationInfo
      };

      console.log('✅ Combined user data with membership application status:', combinedUserData);

      // ✅ STANDARDIZED: Status determination
      const statusResult = determineUserStatus({
        role: combinedUserData.role,
        memberStatus: combinedUserData.is_member,
        membershipStage: combinedUserData.membership_stage,
        userId: combinedUserData.user_id,
        approvalStatus: combinedUserData.approval_status,
        fullMembershipApplicationStatus: combinedUserData.membershipApplicationStatus,
        fullMembershipAppliedAt: combinedUserData.membershipAppliedAt
      });

      console.log('✅ Standardized status determined:', statusResult);

      let finalStatus = statusResult.status;

      // Additional checks for survey requirements (excluding admins and members)
      if (finalStatus !== 'admin' && finalStatus !== 'member') {
        if (surveyData.needs_survey === true || surveyData.survey_completed === false) {
          finalStatus = 'needs_application';
          console.log('🚨 User needs to complete initial application survey');
        }
      }

      updateUserState({
        user: {
          ...combinedUserData,
          ...statusResult,
          finalStatus
        },
        membershipStatus: 'loaded',
        status: finalStatus,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching membership status:', error);
      
      const tokenData = getTokenUserData();
      if (tokenData) {
        const fallbackStatus = determineUserStatus({
          role: tokenData.role,
          memberStatus: tokenData.is_member,
          membershipStage: tokenData.membership_stage,
          userId: tokenData.user_id,
          approvalStatus: null,
          fullMembershipApplicationStatus: 'not_applied'
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

  const getTokenUserData = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      
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

  const initializeUser = async () => {
    if (initializationRef.current) {
      console.log('🚫 User already initialized');
      return;
    }

    initializationRef.current = true;
    console.log('🔄 Initializing user with standardized levels...');

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

    const initialStatus = determineUserStatus({
      role: tokenData.role,
      memberStatus: tokenData.is_member,
      membershipStage: tokenData.membership_stage,
      userId: tokenData.user_id,
      approvalStatus: null,
      fullMembershipApplicationStatus: 'not_applied'
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

    await fetchMembershipStatus();
  };

  useEffect(() => {
    if (!initializationRef.current) {
      initializeUser();
    }
  }, []);

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const getUserStatus = () => {
    if (!user) return 'guest';
    
    if (user.finalStatus) {
      return user.finalStatus;
    }
    
    if (user.status) {
      return user.status;
    }
    
    const fallbackStatus = determineUserStatus({
      role: user.role,
      memberStatus: user.is_member,
      membershipStage: user.membership_stage,
      userId: user.user_id,
      approvalStatus: user.approval_status,
      fullMembershipApplicationStatus: user.membershipApplicationStatus || 'not_applied'
    });
    
    return fallbackStatus.status;
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    
    const now = Date.now();
    if (now - lastFetchTime.current > RATE_LIMIT_MS) {
      membershipFetchRef.current = false;
      await fetchMembershipStatus();
    } else {
      console.log('🚫 Refresh rate limited');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    
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

  // ✅ FIXED: Context value with correct member/pre_member distinction
  const value = {
    user,
    membershipStatus,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    getUserStatus,
    refreshUser,
    updateUser: refreshUser,
    logout,
    // ✅ FIXED: Clear status checks based on the actual user status
    isAdmin: () => getUserStatus() === 'admin',
    isMember: () => {
      const status = getUserStatus();
      // ✅ FIXED: Only return true for actual full members
      return status === 'member';
    },
    isPreMember: () => {
      const status = getUserStatus();
      return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply';
    },
    // ✅ FIXED: isPending should return true for pre-members (they are "pending" full membership)
    isPending: () => {
      const status = getUserStatus();
      return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply' || status === 'pending_verification';
    },
    needsApplication: () => getUserStatus() === 'needs_application',
    // ✅ STANDARDIZED: Application status checks
    isPendingUpgrade: () => getUserStatus() === 'pre_member_pending_upgrade',
    canReapplyForMembership: () => getUserStatus() === 'pre_member_can_reapply',
    canApplyForMembership: () => user?.canApplyForMembership === true,
    getMembershipApplicationStatus: () => user?.membershipApplicationStatus || 'not_applied',
    getMembershipTicket: () => user?.membershipTicket || null,
    canAccessIko: () => user?.canAccessIko === true,
    canAccessTowncrier: () => user?.canAccessTowncrier === true
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};



// // ikootaclient/src/components/auth/UserStatus.jsx - FIXED LOGIC
// import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// import { jwtDecode } from 'jwt-decode';
// import api from '../service/api';

// const UserContext = createContext();

// export const useUser = () => {
//   const context = useContext(UserContext);
//   if (!context) {
//     throw new Error('useUser must be used within a UserProvider');
//   }
//   return context;
// };

// // ✅ STANDARDIZED: Two clear levels - pre_member and member
// const determineUserStatus = ({ 
//   role, 
//   memberStatus, 
//   membershipStage, 
//   userId, 
//   approvalStatus,
//   fullMembershipApplicationStatus, // This tracks the APPLICATION, not a separate membership level
//   fullMembershipAppliedAt 
// }) => {
//   console.log('🔍 Status determination with standardized levels:', { 
//     role, memberStatus, membershipStage, userId, approvalStatus, fullMembershipApplicationStatus 
//   });

//   // Normalize empty strings
//   const normalizedMemberStatus = memberStatus === '' ? null : memberStatus;
//   const normalizedMembershipStage = membershipStage === '' ? null : membershipStage;
//   const normalizedRole = role === '' ? 'user' : role;
//   const normalizedApplicationStatus = fullMembershipApplicationStatus === '' ? 'not_applied' : fullMembershipApplicationStatus;

//   console.log('🔧 Normalized values:', { 
//     normalizedRole, 
//     normalizedMemberStatus, 
//     normalizedMembershipStage, 
//     approvalStatus,
//     normalizedApplicationStatus
//   });

//   // ✅ Admin check
//   if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
//     console.log('👑 Admin user detected');
//     return {
//       isMember: true, // Admins have full access
//       isPendingMember: false,
//       userType: 'admin',
//       status: 'admin',
//       canApplyForMembership: false,
//       membershipApplicationStatus: 'admin_exempt',
//       canAccessTowncrier: true,
//       canAccessIko: true
//     };
//   }

//   // ✅ FULL MEMBER CHECK (member level - highest non-admin level)
//   if (normalizedMemberStatus === 'member' && normalizedMembershipStage === 'member') {
//     console.log('💎 Full member detected');
//     return {
//       isMember: true,
//       isPendingMember: false,
//       userType: 'member',
//       status: 'member',
//       canApplyForMembership: false,
//       membershipApplicationStatus: 'approved', // They already are members
//       canAccessTowncrier: true,
//       canAccessIko: true
//     };
//   }

//   // ✅ PRE-MEMBER WITH MEMBERSHIP APPLICATION LOGIC
//   if (normalizedMemberStatus === 'pre_member' || 
//       normalizedMembershipStage === 'pre_member' ||
//       (normalizedMemberStatus === 'granted' && normalizedMembershipStage === 'pre_member') ||
//       ((normalizedMemberStatus === 'applied' || normalizedMemberStatus === null) && 
//        (approvalStatus === 'granted' || approvalStatus === 'approved'))) {
    
//     console.log('👤 Pre-member detected, checking membership application status...');
    
//     // Handle different application states for pre-members
//     switch (normalizedApplicationStatus) {
//       case 'pending':
//         console.log('⏳ Pre-member with pending membership application');
//         return {
//           isMember: false,
//           isPendingMember: true,
//           userType: 'pre_member',
//           status: 'pre_member_pending_upgrade',
//           canApplyForMembership: false, // Already applied
//           membershipApplicationStatus: 'pending',
//           canAccessTowncrier: true,
//           canAccessIko: false
//         };
        
//       case 'approved':
//         // If application approved, they should be upgraded to member
//         console.log('✅ Pre-member with approved application - should be member now');
//         return {
//           isMember: true,
//           isPendingMember: false,
//           userType: 'member',
//           status: 'member',
//           canApplyForMembership: false,
//           membershipApplicationStatus: 'approved',
//           canAccessTowncrier: true,
//           canAccessIko: true
//         };
        
//       case 'declined':
//         console.log('❌ Pre-member with declined application');
//         return {
//           isMember: false,
//           isPendingMember: true,
//           userType: 'pre_member',
//           status: 'pre_member_can_reapply',
//           canApplyForMembership: true, // Can reapply
//           membershipApplicationStatus: 'declined',
//           canAccessTowncrier: true,
//           canAccessIko: false
//         };
        
//       case 'not_applied':
//       default:
//         console.log('📝 Pre-member eligible for membership application');
//         return {
//           isMember: false,
//           isPendingMember: true,
//           userType: 'pre_member',
//           status: 'pre_member',
//           canApplyForMembership: true,
//           membershipApplicationStatus: 'not_applied',
//           canAccessTowncrier: true,
//           canAccessIko: false
//         };
//     }
//   }

//   // ✅ Applied/Pending check (for initial applications)
//   if (normalizedMemberStatus === 'applied' || normalizedMemberStatus === 'pending' || normalizedMemberStatus === null) {
//     console.log('⏳ Applicant detected');
//     return {
//       isMember: false,
//       isPendingMember: true,
//       userType: 'applicant',
//       status: 'pending_verification',
//       canApplyForMembership: false,
//       membershipApplicationStatus: 'not_eligible',
//       canAccessTowncrier: false,
//       canAccessIko: false
//     };
//   }
  
//   // Denied/Suspended check
//   if (normalizedMemberStatus === 'denied' || normalizedMemberStatus === 'suspended' || normalizedMemberStatus === 'declined') {
//     console.log('❌ Denied user detected');
//     return {
//       isMember: false,
//       isPendingMember: false,
//       userType: 'denied',
//       status: 'denied',
//       canApplyForMembership: false,
//       membershipApplicationStatus: 'not_eligible',
//       canAccessTowncrier: false,
//       canAccessIko: false
//     };
//   }

//   // Default fallback
//   console.log('⚠️ Using fallback status for authenticated user');
//   return {
//     isMember: false,
//     isPendingMember: false,
//     userType: 'authenticated',
//     status: 'authenticated',
//     canApplyForMembership: false,
//     membershipApplicationStatus: 'unknown',
//     canAccessTowncrier: false,
//     canAccessIko: false
//   };
// };

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState('not loaded');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const initializationRef = useRef(false);
//   const membershipFetchRef = useRef(false);
//   const lastFetchTime = useRef(0);
//   const RATE_LIMIT_MS = 5000;

//   console.log('🚀 Initializing UserProvider with standardized levels');

//   const updateUserState = (newState) => {
//     console.log('👤 User state updated:', newState);
//     setUser(newState.user || null);
//     setMembershipStatus(newState.membershipStatus || 'not loaded');
//     setLoading(newState.loading || false);
//     setError(newState.error || null);
//   };

//   // ✅ RENAMED: Fetch membership application status (not a separate membership level)
//   const fetchMembershipApplicationStatus = async (userId) => {
//     try {
//       const response = await api.get(`/membership/status/${userId}`);
//        console.log('✅ Membership application status response:', response.data);
//       return {
//         membershipApplicationStatus: response.data.status || 'not_applied',
//         membershipAppliedAt: response.data.appliedAt,
//         membershipReviewedAt: response.data.reviewedAt,
//         membershipTicket: response.data.ticket,
//         membershipAdminNotes: response.data.adminNotes
//       };
//     } catch (error) {
//       console.log('⚠️ Membership application status not available:', error.message);
//       return {
//         membershipApplicationStatus: 'not_applied',
//         membershipAppliedAt: null,
//         membershipReviewedAt: null,
//         membershipTicket: null,
//         membershipAdminNotes: null
//       };
//     }
//   };

//   // ✅ STANDARDIZED: fetchMembershipStatus
//   const fetchMembershipStatus = async () => {
//     const now = Date.now();
//     if (now - lastFetchTime.current < RATE_LIMIT_MS) {
//       console.log('🚫 Rate limited - skipping membership status fetch');
//       return;
//     }

//     if (membershipFetchRef.current) {
//       console.log('🚫 Membership fetch already in progress');
//       return;
//     }

//     membershipFetchRef.current = true;
//     lastFetchTime.current = now;

//     console.log('🔍 Fetching comprehensive membership status...');
    
//     try {
//       const tokenData = getTokenUserData();
//       if (!tokenData) {
//         console.log('❌ No token data available');
//         membershipFetchRef.current = false;
//         return;
//       }

//       // Fetch both initial status and membership application status
//       const [surveyResponse, membershipApplicationData] = await Promise.allSettled([
//         api.get('/user-status/survey/status'),
//         fetchMembershipApplicationStatus(tokenData.user_id)
//       ]);

//       let surveyData = {};
//       if (surveyResponse.status === 'fulfilled') {
//         surveyData = surveyResponse.value.data;
//       }

//       let membershipApplicationInfo = {};
//       if (membershipApplicationData.status === 'fulfilled') {
//         membershipApplicationInfo = membershipApplicationData.value;
//       }

//       // ✅ STANDARDIZED: Combine all data sources
//       const combinedUserData = {
//         user_id: tokenData.user_id,
//         username: tokenData.username,
//         email: tokenData.email,
//         membership_stage: tokenData.membership_stage,
//         is_member: tokenData.is_member,
//         role: tokenData.role,
//         // Initial membership data
//         survey_completed: surveyData.survey_completed,
//         approval_status: surveyData.approval_status,
//         needs_survey: surveyData.needs_survey,
//         survey_data: surveyData.survey_data,
//         // ✅ STANDARDIZED: Membership application data (not separate membership level)
//         ...membershipApplicationInfo
//       };

//       console.log('✅ Combined user data with membership application status:', combinedUserData);

//       // ✅ STANDARDIZED: Status determination
//       const statusResult = determineUserStatus({
//         role: combinedUserData.role,
//         memberStatus: combinedUserData.is_member,
//         membershipStage: combinedUserData.membership_stage,
//         userId: combinedUserData.user_id,
//         approvalStatus: combinedUserData.approval_status,
//         fullMembershipApplicationStatus: combinedUserData.membershipApplicationStatus,
//         fullMembershipAppliedAt: combinedUserData.membershipAppliedAt
//       });

//       console.log('✅ Standardized status determined:', statusResult);

//       let finalStatus = statusResult.status;

//       // Additional checks for survey requirements (excluding admins and members)
//       if (finalStatus !== 'admin' && finalStatus !== 'member') {
//         if (surveyData.needs_survey === true || surveyData.survey_completed === false) {
//           finalStatus = 'needs_application';
//           console.log('🚨 User needs to complete initial application survey');
//         }
//       }

//       updateUserState({
//         user: {
//           ...combinedUserData,
//           ...statusResult,
//           finalStatus
//         },
//         membershipStatus: 'loaded',
//         status: finalStatus,
//         loading: false,
//         error: null
//       });

//     } catch (error) {
//       console.error('❌ Error fetching membership status:', error);
      
//       const tokenData = getTokenUserData();
//       if (tokenData) {
//         const fallbackStatus = determineUserStatus({
//           role: tokenData.role,
//           memberStatus: tokenData.is_member,
//           membershipStage: tokenData.membership_stage,
//           userId: tokenData.user_id,
//           approvalStatus: null,
//           fullMembershipApplicationStatus: 'not_applied'
//         });
        
//         updateUserState({
//           user: {
//             ...tokenData,
//             ...fallbackStatus
//           },
//           membershipStatus: 'error',
//           status: fallbackStatus.status,
//           loading: false,
//           error: `API Error: ${error.message}`
//         });
//       } else {
//         updateUserState({
//           user: null,
//           membershipStatus: 'error',
//           status: 'error',
//           loading: false,
//           error: error.message
//         });
//       }
//     } finally {
//       membershipFetchRef.current = false;
//     }
//   };

//   const getTokenUserData = () => {
//     const token = localStorage.getItem('token');
//     if (!token) return null;

//     try {
//       const decoded = jwtDecode(token);
      
//       if (decoded.exp * 1000 < Date.now()) {
//         console.log('⚠️ Token expired, removing...');
//         localStorage.removeItem('token');
//         return null;
//       }

//       console.log('🔍 Token user data:', decoded);
//       return decoded;
//     } catch (error) {
//       console.error('❌ Error decoding token:', error);
//       localStorage.removeItem('token');
//       return null;
//     }
//   };

//   const initializeUser = async () => {
//     if (initializationRef.current) {
//       console.log('🚫 User already initialized');
//       return;
//     }

//     initializationRef.current = true;
//     console.log('🔄 Initializing user with standardized levels...');

//     const tokenData = getTokenUserData();
    
//     if (!tokenData) {
//       console.log('❌ No valid token found');
//       updateUserState({
//         user: null,
//         membershipStatus: 'not loaded',
//         status: 'guest',
//         loading: false,
//         error: null
//       });
//       return;
//     }

//     const initialStatus = determineUserStatus({
//       role: tokenData.role,
//       memberStatus: tokenData.is_member,
//       membershipStage: tokenData.membership_stage,
//       userId: tokenData.user_id,
//       approvalStatus: null,
//       fullMembershipApplicationStatus: 'not_applied'
//     });

//     updateUserState({
//       user: {
//         ...tokenData,
//         ...initialStatus
//       },
//       membershipStatus: 'loading',
//       status: initialStatus.status,
//       loading: true,
//       error: null
//     });

//     await fetchMembershipStatus();
//   };

//   useEffect(() => {
//     if (!initializationRef.current) {
//       initializeUser();
//     }
//   }, []);

//   const isAuthenticated = () => {
//     return !!user && !!localStorage.getItem('token');
//   };

//   const getUserStatus = () => {
//     if (!user) return 'guest';
    
//     if (user.finalStatus) {
//       return user.finalStatus;
//     }
    
//     if (user.status) {
//       return user.status;
//     }
    
//     const fallbackStatus = determineUserStatus({
//       role: user.role,
//       memberStatus: user.is_member,
//       membershipStage: user.membership_stage,
//       userId: user.user_id,
//       approvalStatus: user.approval_status,
//       fullMembershipApplicationStatus: user.membershipApplicationStatus || 'not_applied'
//     });
    
//     return fallbackStatus.status;
//   };

//   const refreshUser = async () => {
//     console.log('🔄 Refreshing user data...');
    
//     const now = Date.now();
//     if (now - lastFetchTime.current > RATE_LIMIT_MS) {
//       membershipFetchRef.current = false;
//       await fetchMembershipStatus();
//     } else {
//       console.log('🚫 Refresh rate limited');
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
    
//     initializationRef.current = false;
//     membershipFetchRef.current = false;
//     lastFetchTime.current = 0;
    
//     updateUserState({
//       user: null,
//       membershipStatus: 'not loaded',
//       status: 'guest',
//       loading: false,
//       error: null
//     });
//   };

//   // ✅ FIXED: Context value with correct member/pre_member distinction
//   const value = {
//     user,
//     membershipStatus,
//     loading,
//     error,
//     isAuthenticated: isAuthenticated(),
//     getUserStatus,
//     refreshUser,
//     updateUser: refreshUser,
//     logout,
//     // ✅ FIXED: Clear status checks based on the actual user status
//     isAdmin: () => getUserStatus() === 'admin',
//     isMember: () => {
//       const status = getUserStatus();
//       // ✅ FIXED: Only return true for actual full members
//       return status === 'member';
//     },
//     isPreMember: () => {
//       const status = getUserStatus();
//       return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply';
//     },
//     // ✅ FIXED: isPending should return true for pre-members (they are "pending" full membership)
//     isPending: () => {
//       const status = getUserStatus();
//       return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply' || status === 'pending_verification';
//     },
//     needsApplication: () => getUserStatus() === 'needs_application',
//     // ✅ STANDARDIZED: Application status checks
//     isPendingUpgrade: () => getUserStatus() === 'pre_member_pending_upgrade',
//     canReapplyForMembership: () => getUserStatus() === 'pre_member_can_reapply',
//     canApplyForMembership: () => user?.canApplyForMembership === true,
//     getMembershipApplicationStatus: () => user?.membershipApplicationStatus || 'not_applied',
//     getMembershipTicket: () => user?.membershipTicket || null,
//     canAccessIko: () => user?.canAccessIko === true,
//     canAccessTowncrier: () => user?.canAccessTowncrier === true
//   };

//   return (
//     <UserContext.Provider value={value}>
//       {children}
//     </UserContext.Provider>
//   );
// };