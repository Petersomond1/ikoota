// ikootaclient/src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireMember = false,
  requireAdmin = false,
  allowPending = false,
  redirectTo = '/login' 
}) => {
  const location = useLocation();

  const getUserData = () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Check for token in cookies as fallback
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (!tokenCookie) return null;
      
      const cookieToken = tokenCookie.split("=")[1];
      if (!cookieToken) return null;
      
      try {
        const decoded = jwtDecode(cookieToken);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          return null;
        }
        return decoded;
      } catch (error) {
        return null;
      }
    }
    
    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return decoded;
    } catch (error) {
      localStorage.removeItem("token");
      return null;
    }
  };

  const user = getUserData();
  const isAuthenticated = !!user;

  // Layer 1: Public routes (Landing page)
  if (!requireAuth) {
    if (isAuthenticated) {
      // Redirect authenticated users based on their status
      if (user.role === 'admin' || user.role === 'super_admin') {
        return <Navigate to="/admin" replace />;
      } else if (user.is_member) {
        return <Navigate to="/iko" replace />;
      } else {
        return <Navigate to="/towncrier" replace />;
      }
    }
    return children;
  }

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Layer 4: Admin routes
  if (requireAdmin) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return <Navigate to="/iko" replace />;
    }
    return children;
  }

  // Layer 3: Member routes (Iko access)
  if (requireMember) {
    if (!user.is_member) {
      return <Navigate to="/towncrier" replace />;
    }
    return children;
  }

  // Layer 2: Pending/Towncrier routes
  if (allowPending) {
    // Allow access for users who are authenticated but not necessarily members
    return children;
  }

  // Default: require authentication only
  return children;
};

export default ProtectedRoute;


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