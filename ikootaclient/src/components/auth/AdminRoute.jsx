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
        return false;
      }
    }
    
    try {
      const decoded = jwtDecode(token);
      return decoded.role === 'admin' || decoded.isAdmin === true;
    } catch (error) {
      return false;
    }
  };

  return (
    <ProtectedRoute>
      {isAdmin() ? children : <Navigate to="/iko" replace />}
    </ProtectedRoute>
  );
};

export default AdminRoute;