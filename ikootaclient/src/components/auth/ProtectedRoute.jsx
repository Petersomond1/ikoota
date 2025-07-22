// ikootaclient/src/components/auth/ProtectedRoute.jsx - FINAL FIX - NO REDIRECT LOOPS
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserStatus';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireMember = false,
  requirePreMember = false,
  requireAdmin = false,
  allowPending = false,
  redirectTo = '/login'
}) => {
  const { user, loading, isAuthenticated, getUserStatus } = useUser();
  const location = useLocation();

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const userStatus = getUserStatus();

  // ✅ SIMPLIFIED LOGGING - Reduce console spam
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 ProtectedRoute Check:', {
      path: location.pathname,
      userStatus,
      requireAuth,
      requireMember,
      requirePreMember,
      requireAdmin,
      allowPending,
      authenticated: isAuthenticated
    });
  }

  // ✅ SECURITY: Public routes (no auth required)
  if (!requireAuth) {
    // If user is authenticated and trying to access public routes like login/signup
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
      // Redirect to appropriate dashboard based on status
      switch (userStatus) {
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'full_member':
          return <Navigate to="/iko" replace />;
        case 'pre_member':
          return <Navigate to="/towncrier" replace />;
        case 'pending_verification':
          return <Navigate to="/application-status" replace />;
        case 'needs_application':
          return <Navigate to="/applicationsurvey" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    return children;
  }

  // ✅ SECURITY: Authentication required beyond this point
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ✅ SECURITY: Admin routes
  if (requireAdmin) {
    if (userStatus !== 'admin') {
      console.log('🚨 SECURITY: Admin access denied for user status:', userStatus);
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // ✅ SECURITY: Full member routes (Iko access)
  if (requireMember) {
    if (userStatus !== 'full_member' && userStatus !== 'admin') {
      console.log('🚨 SECURITY: Full member access denied for user status:', userStatus);
      
      // Redirect based on current status
      switch (userStatus) {
        case 'pre_member':
          return <Navigate to="/towncrier" replace />;
        case 'pending_verification':
          return <Navigate to="/application-status" replace />;
        case 'needs_application':
          return <Navigate to="/applicationsurvey" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    return children;
  }

  // ✅ SECURITY: Pre-member routes (Towncrier access) - STRICT ENFORCEMENT
  if (requirePreMember) {
    if (userStatus !== 'pre_member' && userStatus !== 'full_member' && userStatus !== 'admin') {
      console.log('🚨 SECURITY: Pre-member access denied for user status:', userStatus);
      
      // Redirect based on current status
      switch (userStatus) {
        case 'pending_verification':
          return <Navigate to="/application-status" replace />;
        case 'needs_application':
          return <Navigate to="/applicationsurvey" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    return children;
  }

  // ✅ SECURITY: Routes that allow pending users (like dashboard, application survey)
  if (allowPending) {
    // These routes are accessible to users in various states
    const allowedStatuses = [
      'full_member',
      'pre_member', 
      'pending_verification',
      'needs_application',
      'admin'
    ];
    
    if (!allowedStatuses.includes(userStatus)) {
      console.log('🚨 SECURITY: Access denied for user status:', userStatus);
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // ✅ COMPLETELY REMOVED AUTOMATIC REDIRECTS FOR allowPending ROUTES
    // Let each component handle its own logic instead of forcing redirects
    // This prevents the infinite redirect loops
    
    return children;
  }

  // ✅ SECURITY: For specific routes, only redirect if user is trying to access wrong areas
  // ✅ MUCH MORE RESTRICTIVE - Only redirect if they're clearly in the wrong place
  const currentPath = location.pathname;
  
  switch (userStatus) {
    case 'needs_application':
      // Only redirect if they're trying to access member-only areas
      if (currentPath.startsWith('/iko') || 
          currentPath.startsWith('/towncrier') || 
          currentPath.startsWith('/admin')) {
        console.log('🚨 SECURITY: Redirecting incomplete application to survey');
        return <Navigate to="/applicationsurvey" replace />;
      }
      break;
      
    case 'pending_verification':
      // Only redirect if they're trying to access member-only areas
      if (currentPath.startsWith('/iko') || 
          currentPath.startsWith('/towncrier') || 
          currentPath.startsWith('/admin')) {
        console.log('🚨 SECURITY: Redirecting pending user to status page');
        return <Navigate to="/application-status" replace />;
      }
      break;
  }

  // ✅ SECURITY: Default behavior - only allow authenticated users
  return children;
};

export default ProtectedRoute;






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