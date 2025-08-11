// ikootaclient/src/components/auth/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => {
  const isAdmin = () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Check for token in cookies
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (!tokenCookie) return false;
      
      const cookieToken = tokenCookie.split("=")[1];
      if (!cookieToken) return false;
      
      try {
        const decoded = jwtDecode(cookieToken);
        return decoded.role === 'admin' || decoded.isAdmin === true;
      } catch (error) {
        console.error('❌ Error decoding cookie token:', error);
        return false;
      }
    }
    
    try {
      const decoded = jwtDecode(token);
      return decoded.role === 'admin' || decoded.isAdmin === true;
    } catch (error) {
      console.error('❌ Error decoding localStorage token:', error);
      return false;
    }
  };

  // ✅ FIXED: Complete JSX structure with proper ProtectedRoute wrapping


//   return (
//     <ProtectedRoute>
//       {isAdmin() ? children : <Navigate to="/iko" replace />}
//     </ProtectedRoute>
//   );
// };



  return (
    <ProtectedRoute requireAdmin={true}>
      {isAdmin() ? children : <Navigate to="/iko" replace alert="You must be an admin to view this page." />}
    </ProtectedRoute>
  );
};

export default AdminRoute;


// // ikootaclient/src/components/auth/AdminRoute.jsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { jwtDecode } from 'jwt-decode';
// import ProtectedRoute from './ProtectedRoute';

// const AdminRoute = ({ children }) => {
//   const isAdmin = () => {
//     const token = localStorage.getItem("token");
    
//     if (!token) {
//       // Check for token in cookies
//       const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//       if (!tokenCookie) return false;
      
//       const cookieToken = tokenCookie.split("=")[1];
//       if (!cookieToken) return false;
      
//       try {
//         const decoded = jwtDecode(cookieToken);
//         return decoded.role === 'admin' || decoded.isAdmin === true;
//       } catch (error) {
//         return false;
//       }
//     }
    
//     try {
//       const decoded = jwtDecode(token);
//       return decoded.role === 'admin' || decoded.isAdmin === true;
//     } catch (error) {
//       return false;
//     }
//   };

//   return (
//     <ProtectedRoute>
//       {isAdmin() ? children : <Navigate to="/iko" replace />}
//     </ProtectedRoute>
//   );
// };

// export default AdminRoute;