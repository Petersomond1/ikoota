// ikootaclient/src/components/auth/ProtectedRoute.jsx
// ✅ FIXED PROTECTED ROUTE - Preserves all functionality + fixes state sync

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserStatus';
import { getUserAccess, getUserStatusString } from '../config/accessMatrix';

const ProtectedRoute = ({ 
  children, 
  requireAuth = false,
  requireMember = false,
  requirePreMember = false,
  requireAdmin = false,
  allowedUserTypes = [],
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, loading, membershipStatus } = useUser();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // ✅ CRITICAL FIX: Wait for membership data to be fully loaded
  useEffect(() => {
    // Only consider ready when:
    // 1. Not loading AND 
    // 2. Either membershipStatus is 'loaded' OR user is null (logged out)
    if (!loading && (membershipStatus === 'loaded' || !user)) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [loading, membershipStatus, user]);

  // ✅ Show loading while user data is being fetched (preserving your styling approach)
  if (!isReady) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Loading user status...</p>
        <style>
          {`
            .route-loading {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              flex-direction: column;
            }
            .loading-spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 2s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // ✅ PRESERVED: Your original getUserStatusString function
  const userStatus = getUserStatusString(user);
  
  console.log('🔐 ProtectedRoute Check:', {
    path: location.pathname,
    userStatus,
    requireAuth,
    requireMember,
    requirePreMember,
    requireAdmin,
    allowedUserTypes,
    isAuthenticated,
    membershipStatus,
    isReady
  });

  // ✅ PRESERVED: Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/towncrier'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // ✅ PRESERVED: If route doesn't require auth and is public, allow access
  if (!requireAuth && !requireMember && !requirePreMember && !requireAdmin && allowedUserTypes.length === 0) {
    console.log('✅ Public route access granted');
    return children;
  }

  // ✅ PRESERVED: If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log('🚨 SECURITY: Authentication required but user not authenticated');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ✅ PRESERVED: If user is authenticated, check specific requirements
  if (isAuthenticated && user) {
    const access = getUserAccess(user);
    
    // ✅ PRESERVED: Admin requirement check
    if (requireAdmin) {
      if (userStatus === 'admin') {
        console.log('✅ Admin access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Admin access required but user is not admin');
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ PRESERVED: Member requirement check
    if (requireMember) {
      if (userStatus === 'full_member' || userStatus === 'admin') {
        console.log('✅ Member access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Member access required but user is not member');
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ PRESERVED + ENHANCED: Pre-member requirement check with better logging
    if (requirePreMember) {
      if (userStatus === 'pre_member' || userStatus === 'full_member' || userStatus === 'admin') {
        console.log('✅ Pre-member access granted for userStatus:', userStatus);
        return children;
      } else {
        console.log('🚨 SECURITY: Pre-member access required but user status insufficient:', {
          currentStatus: userStatus,
          expectedStatuses: ['pre_member', 'full_member', 'admin'],
          userObject: {
            role: user.role,
            is_member: user.is_member,
            membership_stage: user.membership_stage,
            approval_status: user.approval_status
          }
        });
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ PRESERVED: Specific user types check
    if (allowedUserTypes.length > 0) {
      if (allowedUserTypes.includes(userStatus)) {
        console.log('✅ User type access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: User type not in allowed list');
        return <Navigate to={access.defaultRoute} replace />;
      }
    }

    // ✅ PRESERVED: If only auth is required and user is authenticated
    if (requireAuth && isAuthenticated) {
      console.log('✅ Authenticated access granted');
      return children;
    }
  }

  // ✅ PRESERVED: Default case - check if route should be accessible
  if (isAuthenticated && user) {
    const access = getUserAccess(user);
    
    // ✅ PRESERVED: Special handling for dashboard route
    if (location.pathname === '/dashboard') {
      if (userStatus === 'admin' || userStatus === 'full_member' || userStatus === 'pre_member') {
        console.log('✅ Dashboard access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Dashboard access denied for user status:', userStatus);
        return <Navigate to={access.defaultRoute} replace />;
      }
    }

    // ✅ PRESERVED: For other authenticated routes, allow access
    console.log('✅ Default authenticated access granted');
    return children;
  }

  // ✅ PRESERVED: Final fallback - redirect to login
  console.log('🚨 SECURITY: Access denied, redirecting to login');
  return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default ProtectedRoute;




// // ikootaclient/src/components/auth/ProtectedRoute.jsx
// // ✅ FIXED PROTECTED ROUTE - Resolves access issues

// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useUser } from './UserStatus';
// import { getUserAccess, getUserStatusString } from '../config/accessMatrix';

// const ProtectedRoute = ({ 
//   children, 
//   requireAuth = false,
//   requireMember = false,
//   requirePreMember = false,
//   requireAdmin = false,
//   allowedUserTypes = [],
//   redirectTo = '/login'
// }) => {
//   const { user, isAuthenticated, loading } = useUser();
//   const location = useLocation();

//   // ✅ Show loading while user data is being fetched
//   if (loading) {
//     return (
//       <div className="route-loading">
//         <div className="loading-spinner"></div>
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   const userStatus = getUserStatusString(user);
//   console.log('🔐 ProtectedRoute Check:', {
//     path: location.pathname,
//     userStatus,
//     requireAuth,
//     requireMember,
//     requirePreMember,
//     requireAdmin,
//     allowedUserTypes,
//     isAuthenticated
//   });

//   // ✅ Public routes that don't require authentication
//   const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/towncrier'];
//   const isPublicRoute = publicRoutes.includes(location.pathname);

//   // ✅ If route doesn't require auth and is public, allow access
//   if (!requireAuth && !requireMember && !requirePreMember && !requireAdmin && allowedUserTypes.length === 0) {
//     console.log('✅ Public route access granted');
//     return children;
//   }

//   // ✅ If authentication is required but user is not authenticated
//   if (requireAuth && !isAuthenticated) {
//     console.log('🚨 SECURITY: Authentication required but user not authenticated');
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   // ✅ If user is authenticated, check specific requirements
//   if (isAuthenticated && user) {
//     const access = getUserAccess(user);
    
//     // ✅ Admin requirement check
//     if (requireAdmin) {
//       if (userStatus === 'admin') {
//         console.log('✅ Admin access granted');
//         return children;
//       } else {
//         console.log('🚨 SECURITY: Admin access required but user is not admin');
//         return <Navigate to="/towncrier" replace />;
//       }
//     }

//     // ✅ Member requirement check
//     if (requireMember) {
//       if (userStatus === 'full_member' || userStatus === 'admin') {
//         console.log('✅ Member access granted');
//         return children;
//       } else {
//         console.log('🚨 SECURITY: Member access required but user is not member');
//         return <Navigate to="/towncrier" replace />;
//       }
//     }

//     // ✅ Pre-member requirement check
//     if (requirePreMember) {
//       if (userStatus === 'pre_member' || userStatus === 'full_member' || userStatus === 'admin') {
//         console.log('✅ Pre-member access granted');
//         return children;
//       } else {
//         console.log('🚨 SECURITY: Pre-member access required but user status insufficient');
//         return <Navigate to="/towncrier" replace />;
//       }
//     }

//     // ✅ Specific user types check
//     if (allowedUserTypes.length > 0) {
//       if (allowedUserTypes.includes(userStatus)) {
//         console.log('✅ User type access granted');
//         return children;
//       } else {
//         console.log('🚨 SECURITY: User type not in allowed list');
//         return <Navigate to={access.defaultRoute} replace />;
//       }
//     }

//     // ✅ If only auth is required and user is authenticated
//     if (requireAuth && isAuthenticated) {
//       console.log('✅ Authenticated access granted');
//       return children;
//     }
//   }

//   // ✅ Default case - check if route should be accessible
//   if (isAuthenticated && user) {
//     const access = getUserAccess(user);
    
//     // ✅ Special handling for dashboard route
//     if (location.pathname === '/dashboard') {
//       if (userStatus === 'admin' || userStatus === 'full_member' || userStatus === 'pre_member') {
//         console.log('✅ Dashboard access granted');
//         return children;
//       } else {
//         console.log('🚨 SECURITY: Dashboard access denied for user status:', userStatus);
//         return <Navigate to={access.defaultRoute} replace />;
//       }
//     }

//     // ✅ For other authenticated routes, allow access
//     console.log('✅ Default authenticated access granted');
//     return children;
//   }

//   // ✅ Final fallback - redirect to login
//   console.log('🚨 SECURITY: Access denied, redirecting to login');
//   return <Navigate to={redirectTo} state={{ from: location }} replace />;
// };

// export default ProtectedRoute;




// // ikootaclient/src/components/auth/ProtectedRoute.jsx - FINAL FIX - NO REDIRECT LOOPS
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useUser } from './UserStatus';

// const ProtectedRoute = ({ 
//   children, 
//   requireAuth = true,
//   requireMember = false,
//   requirePreMember = false,
//   requireAdmin = false,
//   allowPending = false,
//   redirectTo = '/login'
// }) => {
//   const { user, loading, isAuthenticated, getUserStatus } = useUser();
//   const location = useLocation();

//   // Show loading while user data is being fetched
//   if (loading) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column'
//       }}>
//         <div style={{
//           width: '40px',
//           height: '40px',
//           border: '4px solid #f3f3f3',
//           borderTop: '4px solid #667eea',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   const userStatus = getUserStatus();

//   // ✅ SIMPLIFIED LOGGING - Reduce console spam
//   if (process.env.NODE_ENV === 'development') {
//     console.log('🔐 ProtectedRoute Check:', {
//       path: location.pathname,
//       userStatus,
//       requireAuth,
//       requireMember,
//       requirePreMember,
//       requireAdmin,
//       allowPending,
//       authenticated: isAuthenticated
//     });
//   }

//   // ✅ SECURITY: Public routes (no auth required)
//   if (!requireAuth) {
//     // If user is authenticated and trying to access public routes like login/signup
//     if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
//       // Redirect to appropriate dashboard based on status
//       switch (userStatus) {
//         case 'admin':
//           return <Navigate to="/admin" replace />;
//         case 'full_member':
//           return <Navigate to="/iko" replace />;
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Authentication required beyond this point
//   if (!isAuthenticated) {
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   // ✅ SECURITY: Admin routes
//   if (requireAdmin) {
//     if (userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Admin access denied for user status:', userStatus);
//       return <Navigate to="/dashboard" replace />;
//     }
//     return children;
//   }

//   // ✅ SECURITY: Full member routes (Iko access)
//   if (requireMember) {
//     if (userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Full member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Pre-member routes (Towncrier access) - STRICT ENFORCEMENT
//   if (requirePreMember) {
//     if (userStatus !== 'pre_member' && userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Pre-member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Routes that allow pending users (like dashboard, application survey)
//   if (allowPending) {
//     // These routes are accessible to users in various states
//     const allowedStatuses = [
//       'full_member',
//       'pre_member', 
//       'pending_verification',
//       'needs_application',
//       'admin'
//     ];
    
//     if (!allowedStatuses.includes(userStatus)) {
//       console.log('🚨 SECURITY: Access denied for user status:', userStatus);
//       return <Navigate to={redirectTo} state={{ from: location }} replace />;
//     }

//     // ✅ COMPLETELY REMOVED AUTOMATIC REDIRECTS FOR allowPending ROUTES
//     // Let each component handle its own logic instead of forcing redirects
//     // This prevents the infinite redirect loops
    
//     return children;
//   }

//   // ✅ SECURITY: For specific routes, only redirect if user is trying to access wrong areas
//   // ✅ MUCH MORE RESTRICTIVE - Only redirect if they're clearly in the wrong place
//   const currentPath = location.pathname;
  
//   switch (userStatus) {
//     case 'needs_application':
//       // Only redirect if they're trying to access member-only areas
//       if (currentPath.startsWith('/iko') || 
//           currentPath.startsWith('/towncrier') || 
//           currentPath.startsWith('/admin')) {
//         console.log('🚨 SECURITY: Redirecting incomplete application to survey');
//         return <Navigate to="/applicationsurvey" replace />;
//       }
//       break;
      
//     case 'pending_verification':
//       // Only redirect if they're trying to access member-only areas
//       if (currentPath.startsWith('/iko') || 
//           currentPath.startsWith('/towncrier') || 
//           currentPath.startsWith('/admin')) {
//         console.log('🚨 SECURITY: Redirecting pending user to status page');
//         return <Navigate to="/application-status" replace />;
//       }
//       break;
//   }

//   // ✅ SECURITY: Default behavior - only allow authenticated users
//   return children;
// };

// export default ProtectedRoute;






// // ikootaclient/src/components/auth/ProtectedRoute.jsx
// // ✅ ENHANCED SECURITY VERSION - NO REDIRECT LOOPS
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useUser } from './UserStatus';

// const ProtectedRoute = ({ 
//   children, 
//   requireAuth = true,
//   requireMember = false,
//   requirePreMember = false,
//   requireAdmin = false,
//   allowPending = false,
//   redirectTo = '/login'
// }) => {
//   const { user, loading, isAuthenticated, getUserStatus } = useUser();
//   const location = useLocation();

//   // Show loading while user data is being fetched
//   if (loading) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column'
//       }}>
//         <div style={{
//           width: '40px',
//           height: '40px',
//           border: '4px solid #f3f3f3',
//           borderTop: '4px solid #667eea',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   const userStatus = getUserStatus();

//   console.log('🔐 ProtectedRoute Security Check:', {
//     userStatus,
//     requireAuth,
//     requireMember,
//     requirePreMember,
//     requireAdmin,
//     allowPending,
//     userAuthenticated: isAuthenticated,
//     userId: user?.id,
//     userRole: user?.role,
//     userMembershipStage: user?.membership_stage,
//     userIsMember: user?.is_member,
//     currentPath: location.pathname
//   });

//   // ✅ SECURITY: Public routes (no auth required)
//   if (!requireAuth) {
//     // If user is authenticated and trying to access public routes like login/signup
//     if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
//       // Redirect to appropriate dashboard based on status
//       switch (userStatus) {
//         case 'admin':
//           return <Navigate to="/admin" replace />;
//         case 'full_member':
//           return <Navigate to="/iko" replace />;
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Authentication required beyond this point
//   if (!isAuthenticated) {
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   // ✅ SECURITY: Admin routes
//   if (requireAdmin) {
//     if (userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Admin access denied for user status:', userStatus);
//       return <Navigate to="/dashboard" replace />;
//     }
//     return children;
//   }

//   // ✅ SECURITY: Full member routes (Iko access)
//   if (requireMember) {
//     if (userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Full member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Pre-member routes (Towncrier access) - STRICT ENFORCEMENT
//   if (requirePreMember) {
//     if (userStatus !== 'pre_member' && userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Pre-member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pending_verification':
//           return <Navigate to="/application-status" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Routes that allow pending users (like dashboard, application survey)
//   if (allowPending) {
//     // These routes are accessible to users in various states
//     const allowedStatuses = [
//       'full_member',
//       'pre_member', 
//       'pending_verification',
//       'needs_application',
//       'admin'
//     ];
    
//     if (!allowedStatuses.includes(userStatus)) {
//       console.log('🚨 SECURITY: Access denied for user status:', userStatus);
//       return <Navigate to={redirectTo} state={{ from: location }} replace />;
//     }

//     // ✅ REMOVED: The problematic redirect logic that caused the loop
//     // Let components handle their own logic instead of forcing redirects here
    
//     return children;
//   }

//   // ✅ SECURITY: Authenticated but check if they need to complete workflow
//   // ✅ SIMPLIFIED: Only redirect if user is trying to access wrong areas
//   switch (userStatus) {
//     case 'needs_application':
//       // Only redirect if they're trying to access areas they shouldn't
//       if (location.pathname !== '/applicationsurvey' && 
//           location.pathname !== '/dashboard' && 
//           location.pathname !== '/application-status') {
//         console.log('🚨 SECURITY: Redirecting to application survey');
//         return <Navigate to="/applicationsurvey" replace />;
//       }
//       break;
//     case 'pending_verification':
//       // Only redirect if they're trying to access areas they shouldn't
//       if (location.pathname !== '/application-status' && 
//           location.pathname !== '/pending-verification' && 
//           location.pathname !== '/dashboard') {
//         console.log('🚨 SECURITY: Redirecting to pending verification');
//         return <Navigate to="/application-status" replace />;
//       }
//       break;
//   }

//   // ✅ SECURITY: Default behavior - only allow authenticated users
//   return children;
// };

// export default ProtectedRoute;





// // ikootaclient/src/components/auth/ProtectedRoute.jsx
// // ✅ ENHANCED SECURITY VERSION - COMPLETE & CORRECT
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useUser } from './UserStatus';

// const ProtectedRoute = ({ 
//   children, 
//   requireAuth = true,
//   requireMember = false,
//   requirePreMember = false,
//   requireAdmin = false,
//   allowPending = false,
//   redirectTo = '/login'
// }) => {
//   const { user, loading, isAuthenticated, getUserStatus } = useUser();
//   const location = useLocation();

//   // Show loading while user data is being fetched
//   if (loading) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column'
//       }}>
//         <div style={{
//           width: '40px',
//           height: '40px',
//           border: '4px solid #f3f3f3',
//           borderTop: '4px solid #667eea',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   const userStatus = getUserStatus();

//   console.log('🔐 ProtectedRoute Security Check:', {
//     userStatus,
//     requireAuth,
//     requireMember,
//     requirePreMember,
//     requireAdmin,
//     allowPending,
//     userAuthenticated: isAuthenticated,
//     userId: user?.id,
//     userRole: user?.role,
//     userMembershipStage: user?.membership_stage,
//     userIsMember: user?.is_member,
//     currentPath: location.pathname
//   });

//   // ✅ SECURITY: Public routes (no auth required)
//   if (!requireAuth) {
//     // If user is authenticated and trying to access public routes like login/signup
//     if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
//       // Redirect to appropriate dashboard based on status
//       switch (userStatus) {
//         case 'admin':
//           return <Navigate to="/admin" replace />;
//         case 'full_member':
//           return <Navigate to="/iko" replace />;
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/pending-verification" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Authentication required beyond this point
//   if (!isAuthenticated) {
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   // ✅ SECURITY: Admin routes
//   if (requireAdmin) {
//     if (userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Admin access denied for user status:', userStatus);
//       return <Navigate to="/dashboard" replace />;
//     }
//     return children;
//   }

//   // ✅ SECURITY: Full member routes (Iko access)
//   if (requireMember) {
//     if (userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Full member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pre_member':
//           return <Navigate to="/towncrier" replace />;
//         case 'pending_verification':
//           return <Navigate to="/pending-verification" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Pre-member routes (Towncrier access) - STRICT ENFORCEMENT
//   if (requirePreMember) {
//     if (userStatus !== 'pre_member' && userStatus !== 'full_member' && userStatus !== 'admin') {
//       console.log('🚨 SECURITY: Pre-member access denied for user status:', userStatus);
      
//       // Redirect based on current status
//       switch (userStatus) {
//         case 'pending_verification':
//           return <Navigate to="/pending-verification" replace />;
//         case 'needs_application':
//           return <Navigate to="/applicationsurvey" replace />;
//         default:
//           return <Navigate to="/dashboard" replace />;
//       }
//     }
//     return children;
//   }

//   // ✅ SECURITY: Routes that allow pending users (like dashboard, application survey)
//   if (allowPending) {
//     // These routes are accessible to users in various states
//     const allowedStatuses = [
//       'full_member',
//       'pre_member', 
//       'pending_verification',
//       'needs_application',
//       'admin'
//     ];
    
//     if (!allowedStatuses.includes(userStatus)) {
//       console.log('🚨 SECURITY: Access denied for user status:', userStatus);
//       return <Navigate to={redirectTo} state={{ from: location }} replace />;
//     }
    
//     return children;
//   }

//   // ✅ SECURITY: Authenticated but check if they need to complete workflow
//   switch (userStatus) {
//     case 'needs_application':
//       if (location.pathname !== '/applicationsurvey') {
//         console.log('🚨 SECURITY: Redirecting to application survey');
//         return <Navigate to="/applicationsurvey" replace />;
//       }
//       break;
//     case 'pending_verification':
//       if (location.pathname !== '/pending-verification' && location.pathname !== '/application-status') {
//         console.log('🚨 SECURITY: Redirecting to pending verification');
//         return <Navigate to="/pending-verification" replace />;
//       }
//       break;
//   }

//   // ✅ SECURITY: Default behavior - only allow authenticated users
//   return children;
// };

// export default ProtectedRoute;


// // ikootaclient/src/components/auth/ProtectedRoute.jsx
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { jwtDecode } from 'jwt-decode';

// const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
//   const location = useLocation();

//   const isAuthenticated = () => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       // Check for token in cookies as fallback
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return false;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return false;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         // Check if token is expired
//         if (decoded.exp * 1000 < Date.now()) {
//           // Remove expired token
//           document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//           return false;
//         }
//         return true;
//       } catch (error) {
//         return false;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       // Check if token is expired
//       if (decoded.exp * 1000 < Date.now()) {
//         // Remove expired token
//         localStorage.removeItem("token");
//         return false;
//       }
//       return true;
//     } catch (error) {
//       // Token is invalid
//       localStorage.removeItem("token");
//       return false;
//     }
//   };

//   if (requireAuth && !isAuthenticated()) {
//     // Redirect to login page with return url
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   if (!requireAuth && isAuthenticated()) {
//     // User is already logged in, redirect to main app
//     return <Navigate to="/iko" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;