// ikootaclient/src/components/auth/UserStatus.jsx
// ==================================================
// FIXED VERSION - PROPER PENDING USER HANDLING
// ==================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIXED: Determine user status based on your actual routes
  const determineUserStatus = useCallback((userData) => {
    if (!userData) {
      return {
        isMember: false,
        isPending: false,
        isAuthenticated: false,
        userType: 'guest'
      };
    }

    const role = userData.role?.toLowerCase();
    const memberStatus = userData.is_member?.toLowerCase();
    const membershipStage = userData.membership_stage?.toLowerCase();

    console.log('🔍 Status determination input:', {
      role,
      memberStatus,
      membershipStage,
      userId: userData.id || userData.user_id
    });

    // ✅ Admin and super_admin are always full members
    if (role === 'admin' || role === 'super_admin') {
      console.log('✅ Admin/Super-admin detected');
      return {
        isMember: true,
        isPending: false,
        isAuthenticated: true,
        userType: 'admin'
      };
    }

    // ✅ Regular users - check membership status
    // Based on your database: 'member', 'granted', 'pending', 'applied'
    const isFullMember = (
      memberStatus === 'member' || 
      memberStatus === 'granted' ||
      membershipStage === 'member'
    );

    const isPendingMember = (
      memberStatus === 'applied' || 
      memberStatus === 'pending' ||
      membershipStage === 'applicant' ||
      membershipStage === 'pre_member'
    );

    console.log('✅ Status determined:', {
      isFullMember,
      isPendingMember,
      userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
    });

    return {
      isMember: isFullMember,
      isPending: isPendingMember,
      isAuthenticated: true,
      userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
    };
  }, []);

  const getUserFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (!tokenCookie) return null;
      
      const cookieToken = tokenCookie.split("=")[1];
      if (!cookieToken) return null;
      
      try {
        const decoded = jwtDecode(cookieToken);
        if (decoded.exp * 1000 < Date.now()) {
          document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          return null;
        }
        return decoded;
      } catch (error) {
        console.error('Error decoding cookie token:', error);
        return null;
      }
    }
    
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  // ✅ ENHANCED: Fetch membership status with proper API endpoints
  const fetchMembershipStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No token found for membership status fetch');
        return null;
      }

      console.log('🔍 Fetching membership status...');
      
      // ✅ Try survey check first for more detailed status, then dashboard
      let response;
      try {
        response = await api.get('/membership/survey/check-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Survey check response:', response.data);
      } catch (surveyError) {
        console.warn('⚠️ Survey check failed, trying dashboard');
        try {
          response = await api.get('/membership/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Dashboard response:', response.data);
        } catch (dashboardError) {
          console.error('❌ Both endpoints failed');
          throw surveyError;
        }
      }
      
      setError(null);
      return response.data;
      
    } catch (error) {
      console.error('❌ Failed to fetch membership status:', error);
      
      if (error.response?.status === 401) {
        console.log('🔐 Authentication failed, clearing tokens');
        localStorage.removeItem("token");
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        setError('Authentication expired. Please log in again.');
        return null;
      }
      
      if (error.response?.status === 403) {
        setError('Access denied. You may not have permission to access this resource.');
        return null;
      }
      
      if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
        return null;
      }
      
      setError(`Failed to load user data: ${error.message}`);
      return null;
    }
  }, []);

  const updateUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Get user from token first
      const tokenUser = getUserFromToken();
      console.log('🔍 Token user data:', tokenUser);
      
      if (!tokenUser) {
        setUser(null);
        setMembershipStatus(null);
        setLoading(false);
        return;
      }
      
      // ✅ Fetch detailed membership data
      const membershipData = await fetchMembershipStatus();
      setMembershipStatus(membershipData);
      
      // ✅ Combine token data with membership data
      let combinedUserData = tokenUser;
      
      if (membershipData) {
        // Handle different response formats
        if (membershipData.membershipStatus) {
          combinedUserData = { ...tokenUser, ...membershipData.membershipStatus };
        } else if (membershipData.user) {
          combinedUserData = { ...tokenUser, ...membershipData.user };
        } else if (membershipData.success && membershipData.data) {
          combinedUserData = { ...tokenUser, ...membershipData.data };
        } else {
          // ✅ NEW: Handle direct survey response format
          combinedUserData = { ...tokenUser, ...membershipData };
        }
      }
      
      console.log('✅ Combined user data:', combinedUserData);
      
      // ✅ Determine status and set user
      const statusInfo = determineUserStatus(combinedUserData);
      const enhancedUser = { ...combinedUserData, ...statusInfo };
      
      setUser(enhancedUser);
      
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError(`Failed to update user data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserFromToken, fetchMembershipStatus, determineUserStatus]);

  const logout = useCallback(() => {
    console.log('🚪 Logging out user');
    localStorage.removeItem("token");
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setMembershipStatus(null);
    setError(null);
  }, []);

  // ✅ FIXED: User status detection with proper survey completion check
  const getUserStatus = useCallback(() => {
    try {
      if (!user) return 'guest';
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        return 'admin';
      }
      
      console.log('🔍 SECURITY CHECK - Status details:', { 
        approval_status: user.approval_status || membershipStatus?.approval_status,
        needs_survey: user.needs_survey || membershipStatus?.needs_survey,
        survey_completed: user.survey_completed || membershipStatus?.survey_completed,
        is_member: user.is_member,
        membership_stage: user.membership_stage
      });
      
      // ✅ CRITICAL FIX: Check survey completion status from API response
      const surveyCompleted = user.survey_completed || membershipStatus?.survey_completed;
      const needsSurvey = user.needs_survey || membershipStatus?.needs_survey;
      const approvalStatus = user.approval_status || membershipStatus?.approval_status;
      
      // ✅ If user has 'applied' status but hasn't completed survey
      if (user.is_member === 'applied') {
        // Check if they need to complete the survey
        if (needsSurvey === true || surveyCompleted === false) {
          console.log('🚨 SECURITY: User needs to complete application survey');
          return 'needs_application';
        }
        
        // If survey is completed and they're pending approval
        if (surveyCompleted === true || approvalStatus === 'pending') {
          console.log('🔍 SECURITY: Survey completed, awaiting admin approval');
          return 'pending_verification';
        }
      }
      
      // ✅ Handle approved users
      if (approvalStatus === 'approved') {
        if (user.membership_stage === 'pre_member') {
          return 'pre_member';
        }
        if (user.membership_stage === 'member') {
          return 'full_member';
        }
      }
      
      // ✅ Handle explicit member status
      if (user.is_member === 'member' || user.is_member === 'granted') {
        if (user.membership_stage === 'member') {
          return 'full_member';
        }
        if (user.membership_stage === 'pre_member') {
          return 'pre_member';
        }
        return 'full_member'; // Default for granted members
      }
      
      // ✅ Handle other statuses
      switch (approvalStatus) {
        case 'pending':
          return 'pending_verification';
        case 'rejected':
        case 'denied':
          return 'needs_application'; // They can reapply
        case 'not_submitted':
        case null:
        case undefined:
          // ✅ For users with 'applied' status but no clear survey status
          if (user.is_member === 'applied') {
            return 'pending_verification'; // Default to pending for applied users
          }
          return 'needs_application';
      }
      
      // ✅ DEFAULT: Fallback based on membership status
      if (user.is_member === 'applied') {
        return 'pending_verification'; // Default to pending for applied users
      }
      
      console.log('🚨 DEFAULT SECURITY: User status unclear - needs application');
      return 'needs_application';
      
    } catch (error) {
      console.error('Error determining user status:', error);
      return 'guest';
    }
  }, [user, membershipStatus]);

  // ✅ FIXED: Smart routing that respects landing page access
  const getDefaultRoute = useCallback(() => {
    try {
      const status = getUserStatus();
      
      console.log('🗺️ Determining route for status:', status);
      
      // ✅ IMPORTANT: Don't redirect guests away from landing page
      if (status === 'guest' || !user) {
        return '/'; // Keep guests on landing page
      }
      
      switch (status) {
        case 'admin':
          return '/admin';
        case 'full_member':
          return '/iko';
        case 'pre_member':
          return '/towncrier';
        case 'pending_verification':
          return '/application-status'; // ✅ FIXED: Use the correct route
        case 'needs_application':
          return '/applicationsurvey';
        default:
          return '/dashboard'; // Safe fallback for authenticated users
      }
    } catch (error) {
      console.error('Error determining default route:', error);
      return '/dashboard';
    }
  }, [getUserStatus, user]);

  // ✅ Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000); // Clear error after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ✅ FIXED: Initialize user only if we have a token (don't block landing page)
  useEffect(() => {
    console.log('🚀 Initializing UserProvider');
    
    // ✅ Only attempt to load user data if there's a token
    const token = localStorage.getItem("token");
    const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
    
    if (token || tokenCookie) {
      updateUser();
    } else {
      // No token found, set loading to false immediately
      setLoading(false);
      setUser(null);
      setMembershipStatus(null);
    }
  }, []);

  // ✅ Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === null) {
        console.log('🔄 Storage changed, updating user');
        updateUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateUser]);

  // ✅ Debug logging
  useEffect(() => {
    console.log('👤 User state updated:', {
      user: user ? { 
        id: user.user_id || user.id, 
        username: user.username, 
        role: user.role,
        is_member: user.is_member,
        membership_stage: user.membership_stage,
        survey_completed: user.survey_completed,
        approval_status: user.approval_status,
        isMember: user.isMember,
        isPending: user.isPending
      } : null,
      membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
      status: getUserStatus(),
      loading,
      error
    });
  }, [user, membershipStatus, loading, error, getUserStatus]);

  // ✅ COMPUTED VALUES: Enhanced to include pending verification state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isMember = getUserStatus() === 'full_member';
  const isPreMember = getUserStatus() === 'pre_member';
  const isPendingVerification = getUserStatus() === 'pending_verification';
  const needsApplication = getUserStatus() === 'needs_application';

  const value = React.useMemo(() => ({
    user,
    membershipStatus,
    loading,
    error,
    updateUser,
    logout,
    getUserStatus,
    getDefaultRoute,
    isAuthenticated,
    isAdmin,
    isMember,
    isPreMember,
    isPendingVerification,
    needsApplication,
    clearError: () => setError(null)
  }), [
    user, 
    membershipStatus, 
    loading, 
    error, 
    updateUser, 
    logout, 
    getUserStatus, 
    getDefaultRoute,
    isAuthenticated,
    isAdmin,
    isMember,
    isPreMember,
    isPendingVerification,
    needsApplication
  ]);

  return (
    <UserContext.Provider value={value}>
      {error && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          padding: '10px',
          maxWidth: '300px',
          zIndex: 1000,
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c33',
              cursor: 'pointer',
              float: 'right',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}
      {children}
    </UserContext.Provider>
  );
};




// // ikootaclient/src/components/auth/UserStatus.jsx
// // ==================================================
// // FIXED VERSION - PROPER PENDING USER HANDLING
// // ==================================================

// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // ✅ FIXED: Determine user status based on your actual routes
//   const determineUserStatus = useCallback((userData) => {
//     if (!userData) {
//       return {
//         isMember: false,
//         isPending: false,
//         isAuthenticated: false,
//         userType: 'guest'
//       };
//     }

//     const role = userData.role?.toLowerCase();
//     const memberStatus = userData.is_member?.toLowerCase();
//     const membershipStage = userData.membership_stage?.toLowerCase();

//     console.log('🔍 Status determination input:', {
//       role,
//       memberStatus,
//       membershipStage,
//       userId: userData.id || userData.user_id
//     });

//     // ✅ Admin and super_admin are always full members
//     if (role === 'admin' || role === 'super_admin') {
//       console.log('✅ Admin/Super-admin detected');
//       return {
//         isMember: true,
//         isPending: false,
//         isAuthenticated: true,
//         userType: 'admin'
//       };
//     }

//     // ✅ Regular users - check membership status
//     // Based on your database: 'member', 'granted', 'pending', 'applied'
//     const isFullMember = (
//       memberStatus === 'member' || 
//       memberStatus === 'granted' ||
//       membershipStage === 'member'
//     );

//     const isPendingMember = (
//       memberStatus === 'applied' || 
//       memberStatus === 'pending' ||
//       membershipStage === 'applicant' ||
//       membershipStage === 'pre_member'
//     );

//     console.log('✅ Status determined:', {
//       isFullMember,
//       isPendingMember,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     });

//     return {
//       isMember: isFullMember,
//       isPending: isPendingMember,
//       isAuthenticated: true,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     };
//   }, []);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         console.error('Error decoding cookie token:', error);
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   // ✅ ENHANCED: Fetch membership status with proper API endpoints
//   const fetchMembershipStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.log('No token found for membership status fetch');
//         return null;
//       }

//       console.log('🔍 Fetching membership status...');
      
//       // ✅ Try survey check first for more detailed status, then dashboard
//       let response;
//       try {
//         response = await api.get('/membership/survey/check-status', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log('✅ Survey check response:', response.data);
//       } catch (surveyError) {
//         console.warn('⚠️ Survey check failed, trying dashboard');
//         try {
//           response = await api.get('/membership/dashboard', {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           console.log('✅ Dashboard response:', response.data);
//         } catch (dashboardError) {
//           console.error('❌ Both endpoints failed');
//           throw surveyError;
//         }
//       }
      
//       setError(null);
//       return response.data;
      
//     } catch (error) {
//       console.error('❌ Failed to fetch membership status:', error);
      
//       if (error.response?.status === 401) {
//         console.log('🔐 Authentication failed, clearing tokens');
//         localStorage.removeItem("token");
//         document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//         setUser(null);
//         setError('Authentication expired. Please log in again.');
//         return null;
//       }
      
//       if (error.response?.status === 403) {
//         setError('Access denied. You may not have permission to access this resource.');
//         return null;
//       }
      
//       if (error.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//         return null;
//       }
      
//       setError(`Failed to load user data: ${error.message}`);
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // ✅ Get user from token first
//       const tokenUser = getUserFromToken();
//       console.log('🔍 Token user data:', tokenUser);
      
//       if (!tokenUser) {
//         setUser(null);
//         setMembershipStatus(null);
//         setLoading(false);
//         return;
//       }
      
//       // ✅ Fetch detailed membership data
//       const membershipData = await fetchMembershipStatus();
//       setMembershipStatus(membershipData);
      
//       // ✅ Combine token data with membership data
//       let combinedUserData = tokenUser;
      
//       if (membershipData) {
//         // Handle different response formats
//         if (membershipData.membershipStatus) {
//           combinedUserData = { ...tokenUser, ...membershipData.membershipStatus };
//         } else if (membershipData.user) {
//           combinedUserData = { ...tokenUser, ...membershipData.user };
//         } else if (membershipData.success && membershipData.data) {
//           combinedUserData = { ...tokenUser, ...membershipData.data };
//         } else {
//           // ✅ NEW: Handle direct survey response format
//           combinedUserData = { ...tokenUser, ...membershipData };
//         }
//       }
      
//       console.log('✅ Combined user data:', combinedUserData);
      
//       // ✅ Determine status and set user
//       const statusInfo = determineUserStatus(combinedUserData);
//       const enhancedUser = { ...combinedUserData, ...statusInfo };
      
//       setUser(enhancedUser);
      
//     } catch (error) {
//       console.error('❌ Error updating user:', error);
//       setError(`Failed to update user data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [getUserFromToken, fetchMembershipStatus, determineUserStatus]);

//   const logout = useCallback(() => {
//     console.log('🚪 Logging out user');
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     setMembershipStatus(null);
//     setError(null);
//   }, []);

//   // ✅ FIXED: User status detection with proper survey completion check
//   const getUserStatus = useCallback(() => {
//     try {
//       if (!user) return 'guest';
      
//       if (user.role === 'admin' || user.role === 'super_admin') {
//         return 'admin';
//       }
      
//       console.log('🔍 SECURITY CHECK - Status details:', { 
//         approval_status: user.approval_status || membershipStatus?.approval_status,
//         needs_survey: user.needs_survey || membershipStatus?.needs_survey,
//         survey_completed: user.survey_completed || membershipStatus?.survey_completed,
//         is_member: user.is_member,
//         membership_stage: user.membership_stage
//       });
      
//       // ✅ CRITICAL FIX: Check survey completion status from API response
//       const surveyCompleted = user.survey_completed || membershipStatus?.survey_completed;
//       const needsSurvey = user.needs_survey || membershipStatus?.needs_survey;
//       const approvalStatus = user.approval_status || membershipStatus?.approval_status;
      
//       // ✅ If user has 'applied' status but hasn't completed survey
//       if (user.is_member === 'applied') {
//         // Check if they need to complete the survey
//         if (needsSurvey === true || surveyCompleted === false) {
//           console.log('🚨 SECURITY: User needs to complete application survey');
//           return 'needs_application';
//         }
        
//         // If survey is completed and they're pending approval
//         if (surveyCompleted === true || approvalStatus === 'pending') {
//           console.log('🔍 SECURITY: Survey completed, awaiting admin approval');
//           return 'pending_verification';
//         }
//       }
      
//       // ✅ Handle approved users
//       if (approvalStatus === 'approved') {
//         if (user.membership_stage === 'pre_member') {
//           return 'pre_member';
//         }
//         if (user.membership_stage === 'member') {
//           return 'full_member';
//         }
//       }
      
//       // ✅ Handle explicit member status
//       if (user.is_member === 'member' || user.is_member === 'granted') {
//         if (user.membership_stage === 'member') {
//           return 'full_member';
//         }
//         if (user.membership_stage === 'pre_member') {
//           return 'pre_member';
//         }
//         return 'full_member'; // Default for granted members
//       }
      
//       // ✅ Handle other statuses
//       switch (approvalStatus) {
//         case 'pending':
//           return 'pending_verification';
//         case 'rejected':
//         case 'denied':
//           return 'needs_application'; // They can reapply
//         case 'not_submitted':
//         case null:
//         case undefined:
//           // ✅ For users with 'applied' status but no clear survey status
//           if (user.is_member === 'applied') {
//             return 'pending_verification'; // Default to pending for applied users
//           }
//           return 'needs_application';
//       }
      
//       // ✅ DEFAULT: Fallback based on membership status
//       if (user.is_member === 'applied') {
//         return 'pending_verification'; // Default to pending for applied users
//       }
      
//       console.log('🚨 DEFAULT SECURITY: User status unclear - needs application');
//       return 'needs_application';
      
//     } catch (error) {
//       console.error('Error determining user status:', error);
//       return 'guest';
//     }
//   }, [user, membershipStatus]);

//   // ✅ FIXED: Smart routing that respects landing page access
//   const getDefaultRoute = useCallback(() => {
//     try {
//       const status = getUserStatus();
      
//       console.log('🗺️ Determining route for status:', status);
      
//       // ✅ IMPORTANT: Don't redirect guests away from landing page
//       if (status === 'guest') {
//         return '/'; // Keep guests on landing page
//       }
      
//       switch (status) {
//         case 'admin':
//           return '/admin';
//         case 'full_member':
//           return '/iko';
//         case 'pre_member':
//           return '/towncrier';
//         case 'pending_verification':
//           return '/application-status'; // ✅ FIXED: Use the correct route
//         case 'needs_application':
//           return '/applicationsurvey';
//         default:
//           return '/dashboard'; // Safe fallback for authenticated users
//       }
//     } catch (error) {
//       console.error('Error determining default route:', error);
//       return '/dashboard';
//     }
//   }, [getUserStatus]);

//   // ✅ Clear error after some time
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         setError(null);
//       }, 10000); // Clear error after 10 seconds
      
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // ✅ FIXED: Initialize user only if we have a token (don't block landing page)
//   useEffect(() => {
//     console.log('🚀 Initializing UserProvider');
    
//     // ✅ Only attempt to load user data if there's a token
//     const token = localStorage.getItem("token");
//     const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
    
//     if (token || tokenCookie) {
//       updateUser();
//     } else {
//       // No token found, set loading to false immediately
//       setLoading(false);
//       setUser(null);
//       setMembershipStatus(null);
//     }
//   }, []);

//   // ✅ Listen for storage changes
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === 'token' || e.key === null) {
//         console.log('🔄 Storage changed, updating user');
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   // ✅ Debug logging
//   useEffect(() => {
//     console.log('👤 User state updated:', {
//       user: user ? { 
//         id: user.user_id || user.id, 
//         username: user.username, 
//         role: user.role,
//         is_member: user.is_member,
//         membership_stage: user.membership_stage,
//         survey_completed: user.survey_completed,
//         approval_status: user.approval_status,
//         isMember: user.isMember,
//         isPending: user.isPending
//       } : null,
//       membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
//       status: getUserStatus(),
//       loading,
//       error
//     });
//   }, [user, membershipStatus, loading, error, getUserStatus]);

//   // ✅ COMPUTED VALUES: Enhanced to include pending verification state
//   const isAuthenticated = !!user;
//   const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
//   const isMember = getUserStatus() === 'full_member';
//   const isPreMember = getUserStatus() === 'pre_member';
//   const isPendingVerification = getUserStatus() === 'pending_verification';
//   const needsApplication = getUserStatus() === 'needs_application';

//   const value = React.useMemo(() => ({
//     user,
//     membershipStatus,
//     loading,
//     error,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification,
//     needsApplication,
//     clearError: () => setError(null)
//   }), [
//     user, 
//     membershipStatus, 
//     loading, 
//     error, 
//     updateUser, 
//     logout, 
//     getUserStatus, 
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification,
//     needsApplication
//   ]);

//   return (
//     <UserContext.Provider value={value}>
//       {error && (
//         <div style={{
//           position: 'fixed',
//           top: '10px',
//           right: '10px',
//           background: '#fee',
//           border: '1px solid #fcc',
//           borderRadius: '4px',
//           padding: '10px',
//           maxWidth: '300px',
//           zIndex: 1000,
//           color: '#c33'
//         }}>
//           <strong>Error:</strong> {error}
//           <button 
//             onClick={() => setError(null)}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#c33',
//               cursor: 'pointer',
//               float: 'right',
//               fontSize: '16px'
//             }}
//           >
//             ×
//           </button>
//         </div>
//       )}
//       {children}
//     </UserContext.Provider>
//   );
// };




// // ikootaclient/src/components/auth/UserStatus.jsx
// // ==================================================
// // FIXED VERSION - SAFER ROUTING FOR LANDING PAGE
// // ==================================================

// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // ✅ FIXED: Determine user status based on your actual routes
//   const determineUserStatus = useCallback((userData) => {
//     if (!userData) {
//       return {
//         isMember: false,
//         isPending: false,
//         isAuthenticated: false,
//         userType: 'guest'
//       };
//     }

//     const role = userData.role?.toLowerCase();
//     const memberStatus = userData.is_member?.toLowerCase();
//     const membershipStage = userData.membership_stage?.toLowerCase();

//     console.log('🔍 Status determination input:', {
//       role,
//       memberStatus,
//       membershipStage,
//       userId: userData.id || userData.user_id
//     });

//     // ✅ Admin and super_admin are always full members
//     if (role === 'admin' || role === 'super_admin') {
//       console.log('✅ Admin/Super-admin detected');
//       return {
//         isMember: true,
//         isPending: false,
//         isAuthenticated: true,
//         userType: 'admin'
//       };
//     }

//     // ✅ Regular users - check membership status
//     // Based on your database: 'member', 'granted', 'pending', 'applied'
//     const isFullMember = (
//       memberStatus === 'member' || 
//       memberStatus === 'granted' ||
//       membershipStage === 'member'
//     );

//     const isPendingMember = (
//       memberStatus === 'applied' || 
//       memberStatus === 'pending' ||
//       membershipStage === 'applicant' ||
//       membershipStage === 'pre_member'
//     );

//     console.log('✅ Status determined:', {
//       isFullMember,
//       isPendingMember,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     });

//     return {
//       isMember: isFullMember,
//       isPending: isPendingMember,
//       isAuthenticated: true,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     };
//   }, []);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         console.error('Error decoding cookie token:', error);
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   // ✅ ENHANCED: Fetch membership status with proper API endpoints
//   const fetchMembershipStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.log('No token found for membership status fetch');
//         return null;
//       }

//       console.log('🔍 Fetching membership status...');
      
//       // ✅ Try dashboard first, then survey check
//       let response;
//       try {
//         response = await api.get('/membership/dashboard', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log('✅ Dashboard response:', response.data);
//       } catch (dashboardError) {
//         console.warn('⚠️ Dashboard failed, trying survey check');
//         try {
//           response = await api.get('/membership/survey/check-status', {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           console.log('✅ Survey check response:', response.data);
//         } catch (surveyError) {
//           console.error('❌ Both endpoints failed');
//           throw dashboardError;
//         }
//       }
      
//       setError(null);
//       return response.data;
      
//     } catch (error) {
//       console.error('❌ Failed to fetch membership status:', error);
      
//       if (error.response?.status === 401) {
//         console.log('🔐 Authentication failed, clearing tokens');
//         localStorage.removeItem("token");
//         document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//         setUser(null);
//         setError('Authentication expired. Please log in again.');
//         return null;
//       }
      
//       if (error.response?.status === 403) {
//         setError('Access denied. You may not have permission to access this resource.');
//         return null;
//       }
      
//       if (error.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//         return null;
//       }
      
//       setError(`Failed to load user data: ${error.message}`);
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // ✅ Get user from token first
//       const tokenUser = getUserFromToken();
//       console.log('🔍 Token user data:', tokenUser);
      
//       if (!tokenUser) {
//         setUser(null);
//         setMembershipStatus(null);
//         setLoading(false);
//         return;
//       }
      
//       // ✅ Fetch detailed membership data
//       const membershipData = await fetchMembershipStatus();
//       setMembershipStatus(membershipData);
      
//       // ✅ Combine token data with membership data
//       let combinedUserData = tokenUser;
      
//       if (membershipData) {
//         // Handle different response formats
//         if (membershipData.membershipStatus) {
//           combinedUserData = { ...tokenUser, ...membershipData.membershipStatus };
//         } else if (membershipData.user) {
//           combinedUserData = { ...tokenUser, ...membershipData.user };
//         } else if (membershipData.success && membershipData.data) {
//           combinedUserData = { ...tokenUser, ...membershipData.data };
//         }
//       }
      
//       console.log('✅ Combined user data:', combinedUserData);
      
//       // ✅ Determine status and set user
//       const statusInfo = determineUserStatus(combinedUserData);
//       const enhancedUser = { ...combinedUserData, ...statusInfo };
      
//       setUser(enhancedUser);
      
//     } catch (error) {
//       console.error('❌ Error updating user:', error);
//       setError(`Failed to update user data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [getUserFromToken, fetchMembershipStatus, determineUserStatus]);

//   const logout = useCallback(() => {
//     console.log('🚪 Logging out user');
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     setMembershipStatus(null);
//     setError(null);
//   }, []);

//   // ✅ CRITICAL SECURITY FIX: User status detection with strict application workflow
//   const getUserStatus = useCallback(() => {
//     try {
//       if (!user) return 'guest';
      
//       if (user.role === 'admin' || user.role === 'super_admin') {
//         return 'admin';
//       }
      
//       // ✅ SECURITY: Check survey/application status FIRST - this is critical
//       if (membershipStatus) {
//         const approvalStatus = membershipStatus.approval_status?.toLowerCase();
//         const needsSurvey = membershipStatus.needs_survey;
//         const surveyCompleted = membershipStatus.survey_completed;
//         const membershipStage = membershipStatus.membershipStatus?.membership_stage?.toLowerCase();
        
//         console.log('🔍 SECURITY CHECK - Status details:', { 
//           approvalStatus, 
//           needsSurvey, 
//           surveyCompleted,
//           membershipStage,
//           is_member: user.is_member,
//           user_membership_stage: user.membership_stage
//         });
        
//         // ✅ CRITICAL SECURITY: If user is just 'applied' and hasn't completed survey
//         if (user.is_member === 'applied' && user.membership_stage === 'none') {
//           // Check if they need to complete the survey
//           if (needsSurvey === true || surveyCompleted === false || !surveyCompleted) {
//             console.log('🚨 SECURITY: User needs to complete application survey');
//             return 'needs_application';
//           }
          
//           // If survey is completed but approval is pending
//           if (surveyCompleted === true && approvalStatus === 'pending') {
//             console.log('🔍 SECURITY: Survey completed, awaiting admin approval');
//             return 'pending_verification';
//           }
//         }
        
//         // ✅ STRICT: Only allow towncrier/pre-member access after explicit approval
//         if (approvalStatus === 'approved' && membershipStage === 'pre_member') {
//           return 'pre_member';
//         }
        
//         // ✅ STRICT: Full member access
//         if (approvalStatus === 'approved' && membershipStage === 'member') {
//           return 'full_member';
//         }
        
//         // ✅ Handle other approval statuses
//         switch (approvalStatus) {
//           case 'pending':
//             return 'pending_verification';
//           case 'rejected':
//           case 'denied':
//             return 'needs_application'; // They can reapply
//           case 'not_submitted':
//           case null:
//           case undefined:
//             return 'needs_application';
//         }
//       }
      
//       // ✅ FALLBACK: For users without membershipStatus data
//       // Still enforce strict security rules
//       if (user.is_member === 'applied' && user.membership_stage === 'none') {
//         console.log('🚨 FALLBACK SECURITY: Applied user without survey data - needs application');
//         return 'needs_application';
//       }
      
//       // ✅ Only allow access if explicitly granted by system
//       if (user.membership_stage === 'member' && user.is_member === 'member') {
//         return 'full_member';
//       }
      
//       if (user.membership_stage === 'pre_member' && user.is_member === 'member') {
//         return 'pre_member';
//       }
      
//       // ✅ DEFAULT: All other cases need to complete application
//       console.log('🚨 DEFAULT SECURITY: User status unclear - needs application');
//       return 'needs_application';
      
//     } catch (error) {
//       console.error('Error determining user status:', error);
//       return 'guest';
//     }
//   }, [user, membershipStatus]);

//   // ✅ FIXED: Smart routing that respects landing page access
//   const getDefaultRoute = useCallback(() => {
//     try {
//       const status = getUserStatus();
      
//       console.log('🗺️ Determining route for status:', status);
      
//       // ✅ IMPORTANT: Don't redirect guests away from landing page
//       if (status === 'guest') {
//         return '/'; // Keep guests on landing page
//       }
      
//       switch (status) {
//         case 'admin':
//           return '/admin';
//         case 'full_member':
//           return '/iko';
//         case 'pre_member':
//           return '/towncrier';
//         case 'pending_verification':
//           return '/pending-verification';
//         case 'needs_application':
//           return '/applicationsurvey';
//         default:
//           return '/dashboard'; // Safe fallback for authenticated users
//       }
//     } catch (error) {
//       console.error('Error determining default route:', error);
//       return '/dashboard';
//     }
//   }, [getUserStatus]);

//   // ✅ Clear error after some time
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         setError(null);
//       }, 10000); // Clear error after 10 seconds
      
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // ✅ FIXED: Initialize user only if we have a token (don't block landing page)
//   useEffect(() => {
//     console.log('🚀 Initializing UserProvider');
    
//     // ✅ Only attempt to load user data if there's a token
//     const token = localStorage.getItem("token");
//     const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
    
//     if (token || tokenCookie) {
//       updateUser();
//     } else {
//       // No token found, set loading to false immediately
//       setLoading(false);
//       setUser(null);
//       setMembershipStatus(null);
//     }
//   }, []);

//   // ✅ Listen for storage changes
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === 'token' || e.key === null) {
//         console.log('🔄 Storage changed, updating user');
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   // ✅ Debug logging
//   useEffect(() => {
//     console.log('👤 User state updated:', {
//       user: user ? { 
//         id: user.user_id || user.id, 
//         username: user.username, 
//         role: user.role,
//         is_member: user.is_member,
//         membership_stage: user.membership_stage,
//         isMember: user.isMember,
//         isPending: user.isPending
//       } : null,
//       membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
//       status: getUserStatus(),
//       loading,
//       error
//     });
//   }, [user, membershipStatus, loading, error, getUserStatus]);

//   // ✅ COMPUTED VALUES: Enhanced to include pending verification state
//   const isAuthenticated = !!user;
//   const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
//   const isMember = getUserStatus() === 'full_member';
//   const isPreMember = getUserStatus() === 'pre_member';
//   const isPendingVerification = getUserStatus() === 'pending_verification';
//   const needsApplication = getUserStatus() === 'needs_application';

//   const value = React.useMemo(() => ({
//     user,
//     membershipStatus,
//     loading,
//     error,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification,
//     needsApplication,
//     clearError: () => setError(null)
//   }), [
//     user, 
//     membershipStatus, 
//     loading, 
//     error, 
//     updateUser, 
//     logout, 
//     getUserStatus, 
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification,
//     needsApplication
//   ]);

//   return (
//     <UserContext.Provider value={value}>
//       {error && (
//         <div style={{
//           position: 'fixed',
//           top: '10px',
//           right: '10px',
//           background: '#fee',
//           border: '1px solid #fcc',
//           borderRadius: '4px',
//           padding: '10px',
//           maxWidth: '300px',
//           zIndex: 1000,
//           color: '#c33'
//         }}>
//           <strong>Error:</strong> {error}
//           <button 
//             onClick={() => setError(null)}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#c33',
//               cursor: 'pointer',
//               float: 'right',
//               fontSize: '16px'
//             }}
//           >
//             ×
//           </button>
//         </div>
//       )}
//       {children}
//     </UserContext.Provider>
//   );
// };



// // ikootaclient/src/components/auth/UserStatus.jsx
// // ==================================================
// // FIXED VERSION - CORRECT ROUTING
// // ==================================================

// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // ✅ FIXED: Determine user status based on your actual routes
//   const determineUserStatus = useCallback((userData) => {
//     if (!userData) {
//       return {
//         isMember: false,
//         isPending: false,
//         isAuthenticated: false,
//         userType: 'guest'
//       };
//     }

//     const role = userData.role?.toLowerCase();
//     const memberStatus = userData.is_member?.toLowerCase();
//     const membershipStage = userData.membership_stage?.toLowerCase();

//     console.log('🔍 Status determination input:', {
//       role,
//       memberStatus,
//       membershipStage,
//       userId: userData.id || userData.user_id
//     });

//     // ✅ Admin and super_admin are always full members
//     if (role === 'admin' || role === 'super_admin') {
//       console.log('✅ Admin/Super-admin detected');
//       return {
//         isMember: true,
//         isPending: false,
//         isAuthenticated: true,
//         userType: 'admin'
//       };
//     }

//     // ✅ Regular users - check membership status
//     // Based on your database: 'member', 'granted', 'pending', 'applied'
//     const isFullMember = (
//       memberStatus === 'member' || 
//       memberStatus === 'granted' ||
//       membershipStage === 'member'
//     );

//     const isPendingMember = (
//       memberStatus === 'applied' || 
//       memberStatus === 'pending' ||
//       membershipStage === 'applicant' ||
//       membershipStage === 'pre_member'
//     );

//     console.log('✅ Status determined:', {
//       isFullMember,
//       isPendingMember,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     });

//     return {
//       isMember: isFullMember,
//       isPending: isPendingMember,
//       isAuthenticated: true,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     };
//   }, []);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         console.error('Error decoding cookie token:', error);
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   // ✅ ENHANCED: Fetch membership status with proper API endpoints
//   const fetchMembershipStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.log('No token found for membership status fetch');
//         return null;
//       }

//       console.log('🔍 Fetching membership status...');
      
//       // ✅ Try dashboard first, then survey check
//       let response;
//       try {
//         response = await api.get('/membership/dashboard', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log('✅ Dashboard response:', response.data);
//       } catch (dashboardError) {
//         console.warn('⚠️ Dashboard failed, trying survey check');
//         try {
//           response = await api.get('/membership/survey/check-status', {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           console.log('✅ Survey check response:', response.data);
//         } catch (surveyError) {
//           console.error('❌ Both endpoints failed');
//           throw dashboardError;
//         }
//       }
      
//       setError(null);
//       return response.data;
      
//     } catch (error) {
//       console.error('❌ Failed to fetch membership status:', error);
      
//       if (error.response?.status === 401) {
//         console.log('🔐 Authentication failed, clearing tokens');
//         localStorage.removeItem("token");
//         document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//         setUser(null);
//         setError('Authentication expired. Please log in again.');
//         return null;
//       }
      
//       if (error.response?.status === 403) {
//         setError('Access denied. You may not have permission to access this resource.');
//         return null;
//       }
      
//       if (error.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//         return null;
//       }
      
//       setError(`Failed to load user data: ${error.message}`);
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // ✅ Get user from token first
//       const tokenUser = getUserFromToken();
//       console.log('🔍 Token user data:', tokenUser);
      
//       if (!tokenUser) {
//         setUser(null);
//         setMembershipStatus(null);
//         setLoading(false);
//         return;
//       }
      
//       // ✅ Fetch detailed membership data
//       const membershipData = await fetchMembershipStatus();
//       setMembershipStatus(membershipData);
      
//       // ✅ Combine token data with membership data
//       let combinedUserData = tokenUser;
      
//       if (membershipData) {
//         // Handle different response formats
//         if (membershipData.membershipStatus) {
//           combinedUserData = { ...tokenUser, ...membershipData.membershipStatus };
//         } else if (membershipData.user) {
//           combinedUserData = { ...tokenUser, ...membershipData.user };
//         } else if (membershipData.success && membershipData.data) {
//           combinedUserData = { ...tokenUser, ...membershipData.data };
//         }
//       }
      
//       console.log('✅ Combined user data:', combinedUserData);
      
//       // ✅ Determine status and set user
//       const statusInfo = determineUserStatus(combinedUserData);
//       const enhancedUser = { ...combinedUserData, ...statusInfo };
      
//       setUser(enhancedUser);
      
//     } catch (error) {
//       console.error('❌ Error updating user:', error);
//       setError(`Failed to update user data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [getUserFromToken, fetchMembershipStatus, determineUserStatus]);

//   const logout = useCallback(() => {
//     console.log('🚪 Logging out user');
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     setMembershipStatus(null);
//     setError(null);
//   }, []);

//   // ✅ CRITICAL SECURITY FIX: User status detection with strict application workflow
//   const getUserStatus = useCallback(() => {
//     try {
//       if (!user) return 'guest';
      
//       if (user.role === 'admin' || user.role === 'super_admin') {
//         return 'admin';
//       }
      
//       // ✅ SECURITY: Check survey/application status FIRST - this is critical
//       if (membershipStatus) {
//         const approvalStatus = membershipStatus.approval_status?.toLowerCase();
//         const needsSurvey = membershipStatus.needs_survey;
//         const surveyCompleted = membershipStatus.survey_completed;
//         const membershipStage = membershipStatus.membershipStatus?.membership_stage?.toLowerCase();
        
//         console.log('🔍 SECURITY CHECK - Status details:', { 
//           approvalStatus, 
//           needsSurvey, 
//           surveyCompleted,
//           membershipStage,
//           is_member: user.is_member,
//           user_membership_stage: user.membership_stage
//         });
        
//         // ✅ CRITICAL SECURITY: If user is just 'applied' and hasn't completed survey
//         if (user.is_member === 'applied' && user.membership_stage === 'none') {
//           // Check if they need to complete the survey
//           if (needsSurvey === true || surveyCompleted === false || !surveyCompleted) {
//             console.log('🚨 SECURITY: User needs to complete application survey');
//             return 'needs_application';
//           }
          
//           // If survey is completed but approval is pending
//           if (surveyCompleted === true && approvalStatus === 'pending') {
//             console.log('🔍 SECURITY: Survey completed, awaiting admin approval');
//             return 'pending_verification';
//           }
//         }
        
//         // ✅ STRICT: Only allow towncrier/pre-member access after explicit approval
//         if (approvalStatus === 'approved' && membershipStage === 'pre_member') {
//           return 'pre_member';
//         }
        
//         // ✅ STRICT: Full member access
//         if (approvalStatus === 'approved' && membershipStage === 'member') {
//           return 'full_member';
//         }
        
//         // ✅ Handle other approval statuses
//         switch (approvalStatus) {
//           case 'pending':
//             return 'pending_verification';
//           case 'rejected':
//           case 'denied':
//             return 'needs_application'; // They can reapply
//           case 'not_submitted':
//           case null:
//           case undefined:
//             return 'needs_application';
//         }
//       }
      
//       // ✅ FALLBACK: For users without membershipStatus data
//       // Still enforce strict security rules
//       if (user.is_member === 'applied' && user.membership_stage === 'none') {
//         console.log('🚨 FALLBACK SECURITY: Applied user without survey data - needs application');
//         return 'needs_application';
//       }
      
//       // ✅ Only allow access if explicitly granted by system
//       if (user.membership_stage === 'member' && user.is_member === 'member') {
//         return 'full_member';
//       }
      
//       if (user.membership_stage === 'pre_member' && user.is_member === 'member') {
//         return 'pre_member';
//       }
      
//       // ✅ DEFAULT: All other cases need to complete application
//       console.log('🚨 DEFAULT SECURITY: User status unclear - needs application');
//       return 'needs_application';
      
//     } catch (error) {
//       console.error('Error determining user status:', error);
//       return 'guest';
//     }
//   }, [user, membershipStatus]);

//   // ✅ FIXED: Smart routing based on actual routes in your app including pending verification
//   const getDefaultRoute = useCallback(() => {
//     try {
//       const status = getUserStatus();
      
//       console.log('🗺️ Determining route for status:', status);
      
//       switch (status) {
//         case 'admin':
//           return '/admin';
//         case 'full_member':
//           return '/iko';
//         case 'pre_member':
//           return '/towncrier';
//         case 'pending_verification':
//           return '/pending-verification'; // ✅ NEW: Route for users awaiting approval
//         case 'needs_application':
//           return '/applicationsurvey'; // ✅ For users who haven't submitted yet
//         case 'guest':
//           return '/'; // ✅ FIXED: Send guests to landing page
//         default:
//           return '/dashboard'; // ✅ FIXED: Safe fallback to dashboard
//       }
//     } catch (error) {
//       console.error('Error determining default route:', error);
//       return '/dashboard';
//     }
//   }, [getUserStatus]);

//   // ✅ Clear error after some time
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         setError(null);
//       }, 10000); // Clear error after 10 seconds
      
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // ✅ Initialize user on mount
//   useEffect(() => {
//     console.log('🚀 Initializing UserProvider');
//     updateUser();
//   }, []);

//   // ✅ Listen for storage changes
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === 'token' || e.key === null) {
//         console.log('🔄 Storage changed, updating user');
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   // ✅ Debug logging
//   useEffect(() => {
//     console.log('👤 User state updated:', {
//       user: user ? { 
//         id: user.user_id || user.id, 
//         username: user.username, 
//         role: user.role,
//         is_member: user.is_member,
//         membership_stage: user.membership_stage,
//         isMember: user.isMember,
//         isPending: user.isPending
//       } : null,
//       membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
//       status: getUserStatus(),
//       loading,
//       error
//     });
//   }, [user, membershipStatus, loading, error, getUserStatus]);

//   // ✅ COMPUTED VALUES: Enhanced to include pending verification state
//   const isAuthenticated = !!user;
//   const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
//   const isMember = getUserStatus() === 'full_member';
//   const isPreMember = getUserStatus() === 'pre_member';
//   const isPendingVerification = getUserStatus() === 'pending_verification'; // ✅ NEW: For users awaiting approval
//   const needsApplication = getUserStatus() === 'needs_application';

//   const value = React.useMemo(() => ({
//     user,
//     membershipStatus,
//     loading,
//     error,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification, // ✅ NEW: Exposed for components to use
//     needsApplication,
//     clearError: () => setError(null)
//   }), [
//     user, 
//     membershipStatus, 
//     loading, 
//     error, 
//     updateUser, 
//     logout, 
//     getUserStatus, 
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPendingVerification, // ✅ NEW: Added to dependencies
//     needsApplication
//   ]);

//   return (
//     <UserContext.Provider value={value}>
//       {error && (
//         <div style={{
//           position: 'fixed',
//           top: '10px',
//           right: '10px',
//           background: '#fee',
//           border: '1px solid #fcc',
//           borderRadius: '4px',
//           padding: '10px',
//           maxWidth: '300px',
//           zIndex: 1000,
//           color: '#c33'
//         }}>
//           <strong>Error:</strong> {error}
//           <button 
//             onClick={() => setError(null)}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#c33',
//               cursor: 'pointer',
//               float: 'right',
//               fontSize: '16px'
//             }}
//           >
//             ×
//           </button>
//         </div>
//       )}
//       {children}
//     </UserContext.Provider>
//   );
// };

// ikootaclient/src/components/auth/UserStatus.jsx
// ==================================================
// COMPLETE VERSION - ALL FUNCTIONALITY PRESERVED
// ==================================================

// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // ✅ ENHANCED: Determine user status based on your database schema
//   const determineUserStatus = useCallback((userData) => {
//     if (!userData) {
//       return {
//         isMember: false,
//         isPending: false,
//         isAuthenticated: false,
//         userType: 'guest'
//       };
//     }

//     const role = userData.role?.toLowerCase();
//     const memberStatus = userData.is_member?.toLowerCase();
//     const membershipStage = userData.membership_stage?.toLowerCase();

//     console.log('🔍 Status determination input:', {
//       role,
//       memberStatus,
//       membershipStage,
//       userId: userData.id || userData.user_id
//     });

//     // ✅ Admin and super_admin are always full members
//     if (role === 'admin' || role === 'super_admin') {
//       console.log('✅ Admin/Super-admin detected');
//       return {
//         isMember: true,
//         isPending: false,
//         isAuthenticated: true,
//         userType: 'admin'
//       };
//     }

//     // ✅ Regular users - check membership status
//     // Based on your database: 'member', 'granted', 'pending', 'applied'
//     const isFullMember = (
//       memberStatus === 'member' || 
//       memberStatus === 'granted' ||
//       membershipStage === 'member'
//     );

//     const isPendingMember = (
//       memberStatus === 'applied' || 
//       memberStatus === 'pending' ||
//       membershipStage === 'applicant' ||
//       membershipStage === 'pre_member'
//     );

//     console.log('✅ Status determined:', {
//       isFullMember,
//       isPendingMember,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     });

//     return {
//       isMember: isFullMember,
//       isPending: isPendingMember,
//       isAuthenticated: true,
//       userType: isFullMember ? 'member' : isPendingMember ? 'applicant' : 'user'
//     };
//   }, []);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         console.error('Error decoding cookie token:', error);
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   // ✅ ENHANCED: Fetch membership status with proper API endpoints
//   const fetchMembershipStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.log('No token found for membership status fetch');
//         return null;
//       }

//       console.log('🔍 Fetching membership status...');
      
//       // ✅ Try dashboard first, then survey check
//       let response;
//       try {
//         response = await api.get('/membership/dashboard', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log('✅ Dashboard response:', response.data);
//       } catch (dashboardError) {
//         console.warn('⚠️ Dashboard failed, trying survey check');
//         try {
//           response = await api.get('/membership/survey/check-status', {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           console.log('✅ Survey check response:', response.data);
//         } catch (surveyError) {
//           console.error('❌ Both endpoints failed');
//           throw dashboardError;
//         }
//       }
      
//       setError(null);
//       return response.data;
      
//     } catch (error) {
//       console.error('❌ Failed to fetch membership status:', error);
      
//       if (error.response?.status === 401) {
//         console.log('🔐 Authentication failed, clearing tokens');
//         localStorage.removeItem("token");
//         document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//         setUser(null);
//         setError('Authentication expired. Please log in again.');
//         return null;
//       }
      
//       if (error.response?.status === 403) {
//         setError('Access denied. You may not have permission to access this resource.');
//         return null;
//       }
      
//       if (error.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//         return null;
//       }
      
//       setError(`Failed to load user data: ${error.message}`);
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // ✅ Get user from token first
//       const tokenUser = getUserFromToken();
//       console.log('🔍 Token user data:', tokenUser);
      
//       if (!tokenUser) {
//         setUser(null);
//         setMembershipStatus(null);
//         setLoading(false);
//         return;
//       }
      
//       // ✅ Fetch detailed membership data
//       const membershipData = await fetchMembershipStatus();
//       setMembershipStatus(membershipData);
      
//       // ✅ Combine token data with membership data
//       let combinedUserData = tokenUser;
      
//       if (membershipData) {
//         // Handle different response formats
//         if (membershipData.membershipStatus) {
//           combinedUserData = { ...tokenUser, ...membershipData.membershipStatus };
//         } else if (membershipData.user) {
//           combinedUserData = { ...tokenUser, ...membershipData.user };
//         } else if (membershipData.success && membershipData.data) {
//           combinedUserData = { ...tokenUser, ...membershipData.data };
//         }
//       }
      
//       console.log('✅ Combined user data:', combinedUserData);
      
//       // ✅ Determine status and set user
//       const statusInfo = determineUserStatus(combinedUserData);
//       const enhancedUser = { ...combinedUserData, ...statusInfo };
      
//       setUser(enhancedUser);
      
//     } catch (error) {
//       console.error('❌ Error updating user:', error);
//       setError(`Failed to update user data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [getUserFromToken, fetchMembershipStatus, determineUserStatus]);

//   const logout = useCallback(() => {
//     console.log('🚪 Logging out user');
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     setMembershipStatus(null);
//     setError(null);
//   }, []);

//   // ✅ ENHANCED: Better user status detection with error handling
//   const getUserStatus = useCallback(() => {
//     try {
//       if (!user) return 'guest';
      
//       if (user.role === 'admin' || user.role === 'super_admin') {
//         return 'admin';
//       }
      
//       // Use the detailed membership status if available
//       if (membershipStatus?.membershipStatus) {
//         const stage = membershipStatus.membershipStatus.membership_stage;
//         const initialStatus = membershipStatus.membershipStatus.initial_application_status;
        
//         switch (stage) {
//           case 'member':
//             return 'full_member';
//           case 'pre_member':
//             return 'pre_member';
//           case 'applicant':
//             return initialStatus === 'pending' ? 'pending_review' : 'needs_application';
//           case 'none':
//           case null:
//           case undefined:
//             return 'needs_application';
//           default:
//             return 'needs_application';
//         }
//       }
      
//       // ✅ ENHANCED: Fallback to user object data
//       if (user.isMember) return 'full_member';
//       if (user.isPending) return 'pending_review';
      
//       // Additional fallback to JWT token data
//       if (user.membership_stage === 'member') return 'full_member';
//       if (user.membership_stage === 'pre_member') return 'pre_member';
//       if (user.membership_stage === 'applicant') return 'pending_review';
      
//       return 'needs_application';
//     } catch (error) {
//       console.error('Error determining user status:', error);
//       return 'guest';
//     }
//   }, [user, membershipStatus]);

//   // ✅ ENHANCED: Smart routing based on membership status
//   const getDefaultRoute = useCallback(() => {
//     try {
//       const status = getUserStatus();
      
//       console.log('🗺️ Determining route for status:', status);
      
//       switch (status) {
//         case 'admin':
//           return '/admin';
//         case 'full_member':
//           return '/iko';
//         case 'pre_member':
//           return '/towncrier';
//         case 'pending_review':
//           return '/pending-verification';
//         case 'needs_application':
//           return '/applicationsurvey';
//         default:
//           return '/';
//       }
//     } catch (error) {
//       console.error('Error determining default route:', error);
//       return '/';
//     }
//   }, [getUserStatus]);

//   // ✅ Clear error after some time
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         setError(null);
//       }, 10000); // Clear error after 10 seconds
      
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // ✅ Initialize user on mount
//   useEffect(() => {
//     console.log('🚀 Initializing UserProvider');
//     updateUser();
//   }, []);

//   // ✅ Listen for storage changes
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === 'token' || e.key === null) {
//         console.log('🔄 Storage changed, updating user');
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   // ✅ Debug logging
//   useEffect(() => {
//     console.log('👤 User state updated:', {
//       user: user ? { 
//         id: user.user_id || user.id, 
//         username: user.username, 
//         role: user.role,
//         is_member: user.is_member,
//         membership_stage: user.membership_stage,
//         isMember: user.isMember,
//         isPending: user.isPending
//       } : null,
//       membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
//       status: getUserStatus(),
//       loading,
//       error
//     });
//   }, [user, membershipStatus, loading, error, getUserStatus]);

//   // ✅ COMPUTED VALUES: Maintain all original functionality
//   const isAuthenticated = !!user;
//   const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
//   const isMember = getUserStatus() === 'full_member';
//   const isPreMember = getUserStatus() === 'pre_member';
//   const isPending = getUserStatus() === 'pending_review';
//   const needsApplication = getUserStatus() === 'needs_application';

//   const value = React.useMemo(() => ({
//     user,
//     membershipStatus,
//     loading,
//     error,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPending,
//     needsApplication,
//     clearError: () => setError(null)
//   }), [
//     user, 
//     membershipStatus, 
//     loading, 
//     error, 
//     updateUser, 
//     logout, 
//     getUserStatus, 
//     getDefaultRoute,
//     isAuthenticated,
//     isAdmin,
//     isMember,
//     isPreMember,
//     isPending,
//     needsApplication
//   ]);

//   return (
//     <UserContext.Provider value={value}>
//       {error && (
//         <div style={{
//           position: 'fixed',
//           top: '10px',
//           right: '10px',
//           background: '#fee',
//           border: '1px solid #fcc',
//           borderRadius: '4px',
//           padding: '10px',
//           maxWidth: '300px',
//           zIndex: 1000,
//           color: '#c33'
//         }}>
//           <strong>Error:</strong> {error}
//           <button 
//             onClick={() => setError(null)}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#c33',
//               cursor: 'pointer',
//               float: 'right',
//               fontSize: '16px'
//             }}
//           >
//             ×
//           </button>
//         </div>
//       )}
//       {children}
//     </UserContext.Provider>
//   );
// };


// // ikootaclient/src/components/auth/UserStatus.jsx
// // ==================================================

// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [membershipStatus, setMembershipStatus] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   // NEW: Fetch complete membership status
//   const fetchMembershipStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return null;

//       const response = await api.get('/membership/dashboard', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Failed to fetch membership status:', error);
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(async () => {
//     const userData = getUserFromToken();
//     setUser(userData);
    
//     if (userData) {
//       // Fetch detailed membership status
//       const membershipData = await fetchMembershipStatus();
//       setMembershipStatus(membershipData);
//     } else {
//       setMembershipStatus(null);
//     }
    
//     setLoading(false);
//   }, [getUserFromToken, fetchMembershipStatus]);

//   const logout = useCallback(() => {
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     setMembershipStatus(null);
//   }, []);

//   // ENHANCED: Better user status detection
//   const getUserStatus = useCallback(() => {
//     if (!user) return 'guest';
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       return 'admin';
//     }
    
//     // Use the detailed membership status
//     if (membershipStatus?.membershipStatus) {
//       const stage = membershipStatus.membershipStatus.membership_stage;
//       const status = membershipStatus.membershipStatus.current_status;
      
//       switch (stage) {
//         case 'member':
//           return 'full_member';
//         case 'pre_member':
//           return 'pre_member';
//         case 'applicant':
//           return status === 'initial_application_pending' ? 'pending_review' : 'needs_application';
//         default:
//           return 'needs_application';
//       }
//     }
    
//     // Fallback to JWT token data
//     if (user.membership_stage === 'member') return 'full_member';
//     if (user.membership_stage === 'pre_member') return 'pre_member';
//     if (user.membership_stage === 'applicant') return 'pending_review';
    
//     return 'needs_application';
//   }, [user, membershipStatus]);

//   // ENHANCED: Smart routing based on membership status
//   const getDefaultRoute = useCallback(() => {
//     const status = getUserStatus();
    
//     switch (status) {
//       case 'admin':
//         return '/admin';
//       case 'full_member':
//         return '/iko';
//       case 'pre_member':
//         return '/towncrier';
//       case 'pending_review':
//         return '/pending-verification';
//       case 'needs_application':
//         return '/applicationsurvey';
//       default:
//         return '/';
//     }
//   }, [getUserStatus]);

//   // Initialize user on mount
//   useEffect(() => {
//     updateUser();
//   }, []);

//   // Listen for storage changes
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === 'token' || e.key === null) {
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   const value = React.useMemo(() => ({
//     user,
//     membershipStatus,
//     loading,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
//     isMember: getUserStatus() === 'full_member',
//     isPreMember: getUserStatus() === 'pre_member',
//     isPending: getUserStatus() === 'pending_review',
//     needsApplication: getUserStatus() === 'needs_application'
//   }), [user, membershipStatus, loading, updateUser, logout, getUserStatus, getDefaultRoute]);

//   return (
//     <UserContext.Provider value={value}>
//       {children}
//     </UserContext.Provider>
//   );
// };




// // ikootaclient/src/components/auth/UserStatus.jsx
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { jwtDecode } from 'jwt-decode';

// const UserContext = createContext();

// export const useUser = () => {
//   const context = useContext(UserContext);
//   if (!context) {
//     throw new Error('useUser must be used within a UserProvider');
//   }
//   return context;
// };

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const getUserFromToken = useCallback(() => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       // Check for token in cookies as fallback
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return null;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return null;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         if (decoded.exp * 1000 < Date.now()) {
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return null;
//         }
//         return decoded;
//       } catch (error) {
//         return null;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       if (decoded.exp * 1000 < Date.now()) {
//         localStorage.removeItem("token");
//         return null;
//       }
//       return decoded;
//     } catch (error) {
//       localStorage.removeItem("token");
//       return null;
//     }
//   }, []);

//   const updateUser = useCallback(() => {
//     const userData = getUserFromToken();
//     setUser(userData);
//     setLoading(false);
//   }, [getUserFromToken]);

//   const logout = useCallback(() => {
//     localStorage.removeItem("token");
//     document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//   }, []);

//   const getUserStatus = useCallback(() => {
//     if (!user) return 'guest';
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       return 'admin';
//     }
    
//     if (user.is_member) {
//       return 'member';
//     }
    
//     return 'pending'; // Authenticated but not a member yet
//   }, [user]);

//   const getDefaultRoute = useCallback(() => {
//     const status = getUserStatus();
    
//     switch (status) {
//       case 'admin':
//         return '/admin';
//       case 'member':
//         return '/iko';
//       case 'pending':
//         return '/towncrier';
//       default:
//         return '/';
//     }
//   }, [getUserStatus]);

//   // Initialize user on mount
//   useEffect(() => {
//     updateUser();
//   }, []); // Empty dependency array - only run on mount

//   // Listen for storage changes (useful for logout in other tabs)
//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       // Only update if the token key changed
//       if (e.key === 'token' || e.key === null) {
//         updateUser();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [updateUser]);

//   // Memoize the context value to prevent unnecessary re-renders
//   const value = React.useMemo(() => ({
//     user,
//     loading,
//     updateUser,
//     logout,
//     getUserStatus,
//     getDefaultRoute,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
//     isMember: user?.is_member || false,
//     isPending: !!user && !user.is_member && user.role !== 'admin' && user.role !== 'super_admin'
//   }), [user, loading, updateUser, logout, getUserStatus, getDefaultRoute]);

//   return (
//     <UserContext.Provider value={value}>
//       {children}
//     </UserContext.Provider>
//   );
// };