// ikootaclient/src/components/auth/UserStatus.jsx
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

  // Enhanced: Fetch complete membership status with better error handling
  const fetchMembershipStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No token found for membership status fetch');
        return null;
      }

      console.log('🔍 Fetching membership status...');
      const response = await api.get('/membership/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Membership status fetched:', response.data);
      setError(null); // Clear any previous errors
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch membership status:', error);
      
      // Handle specific error cases
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
      
      const userData = getUserFromToken();
      console.log('🔍 User data from token:', userData);
      
      setUser(userData);
      
      if (userData) {
        // Fetch detailed membership status
        const membershipData = await fetchMembershipStatus();
        setMembershipStatus(membershipData);
      } else {
        setMembershipStatus(null);
        console.log('📝 No user data, clearing membership status');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError(`Failed to update user data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserFromToken, fetchMembershipStatus]);

  const logout = useCallback(() => {
    console.log('🚪 Logging out user');
    localStorage.removeItem("token");
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setMembershipStatus(null);
    setError(null);
  }, []);

  // ENHANCED: Better user status detection with error handling
  const getUserStatus = useCallback(() => {
    try {
      if (!user) return 'guest';
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        return 'admin';
      }
      
      // Use the detailed membership status if available
      if (membershipStatus?.membershipStatus) {
        const stage = membershipStatus.membershipStatus.membership_stage;
        const initialStatus = membershipStatus.membershipStatus.initial_application_status;
        
        switch (stage) {
          case 'member':
            return 'full_member';
          case 'pre_member':
            return 'pre_member';
          case 'applicant':
            return initialStatus === 'pending' ? 'pending_review' : 'needs_application';
          case 'none':
          case null:
          case undefined:
            return 'needs_application';
          default:
            return 'needs_application';
        }
      }
      
      // Fallback to JWT token data
      if (user.membership_stage === 'member') return 'full_member';
      if (user.membership_stage === 'pre_member') return 'pre_member';
      if (user.membership_stage === 'applicant') return 'pending_review';
      
      return 'needs_application';
    } catch (error) {
      console.error('Error determining user status:', error);
      return 'guest';
    }
  }, [user, membershipStatus]);

  // ENHANCED: Smart routing based on membership status
  const getDefaultRoute = useCallback(() => {
    try {
      const status = getUserStatus();
      
      console.log('🗺️ Determining route for status:', status);
      
      switch (status) {
        case 'admin':
          return '/admin';
        case 'full_member':
          return '/iko';
        case 'pre_member':
          return '/towncrier';
        case 'pending_review':
          return '/pending-verification';
        case 'needs_application':
          return '/applicationsurvey';
        default:
          return '/';
      }
    } catch (error) {
      console.error('Error determining default route:', error);
      return '/';
    }
  }, [getUserStatus]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000); // Clear error after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize user on mount
  useEffect(() => {
    console.log('🚀 Initializing UserProvider');
    updateUser();
  }, []);

  // Listen for storage changes
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

  // Debug logging
  useEffect(() => {
    console.log('👤 User state updated:', {
      user: user ? { id: user.user_id, username: user.username, role: user.role } : null,
      membershipStatus: membershipStatus ? 'loaded' : 'not loaded',
      loading,
      error,
      status: getUserStatus()
    });
  }, [user, membershipStatus, loading, error, getUserStatus]);

  const value = React.useMemo(() => ({
    user,
    membershipStatus,
    loading,
    error,
    updateUser,
    logout,
    getUserStatus,
    getDefaultRoute,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isMember: getUserStatus() === 'full_member',
    isPreMember: getUserStatus() === 'pre_member',
    isPending: getUserStatus() === 'pending_review',
    needsApplication: getUserStatus() === 'needs_application',
    clearError: () => setError(null)
  }), [user, membershipStatus, loading, error, updateUser, logout, getUserStatus, getDefaultRoute]);

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