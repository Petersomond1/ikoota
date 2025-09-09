// ikootaclient/src/components/auth/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => {
  const isAdmin = () => {
    // First check localStorage token
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Fallback: Check for token in cookies
      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="));
      
      if (!tokenCookie) {
        console.warn('🔐 AdminRoute: No token found in localStorage or cookies');
        return false;
      }
      
      const cookieToken = tokenCookie.split("=")[1];
      if (!cookieToken) {
        console.warn('🔐 AdminRoute: Empty cookie token');
        return false;
      }
      
      try {
        const decoded = jwtDecode(cookieToken);
        
        // Check token expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          console.warn('🔐 AdminRoute: Cookie token expired');
          return false;
        }
        
        // Check admin privileges
        const isAdminUser = decoded.role === 'admin' || 
                           decoded.isAdmin === true || 
                           decoded.roles?.includes('admin') ||
                           decoded.user_role === 'admin';
        
        console.log('🔐 AdminRoute: Cookie token admin check:', {
          role: decoded.role,
          isAdmin: decoded.isAdmin,
          roles: decoded.roles,
          user_role: decoded.user_role,
          result: isAdminUser
        });
        
        return isAdminUser;
      } catch (error) {
        console.error('❌ AdminRoute: Error decoding cookie token:', error);
        return false;
      }
    }
    
    // Check localStorage token
    try {
      const decoded = jwtDecode(token);
      
      // Check token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.warn('🔐 AdminRoute: localStorage token expired');
        // Clean up expired token
        localStorage.removeItem("token");
        return false;
      }
      
      // Check admin privileges with multiple possible field names
      const isAdminUser = decoded.role === 'admin' || 
                         decoded.isAdmin === true || 
                         decoded.roles?.includes('admin') ||
                         decoded.user_role === 'admin';
      
      console.log('🔐 AdminRoute: localStorage token admin check:', {
        role: decoded.role,
        isAdmin: decoded.isAdmin,
        roles: decoded.roles,
        user_role: decoded.user_role,
        result: isAdminUser
      });
      
      return isAdminUser;
    } catch (error) {
      console.error('❌ AdminRoute: Error decoding localStorage token:', error);
      // Clean up invalid token
      localStorage.removeItem("token");
      return false;
    }
  };

  // ✅ Enhanced admin route protection with better error handling
  return (
    <ProtectedRoute requireAdmin={true}>
      {isAdmin() ? (
        children
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 15px 0' }}>Access Denied</h1>
            <p style={{ 
              fontSize: '1.1rem', 
              margin: '0 0 30px 0', 
              opacity: 0.9,
              lineHeight: 1.6 
            }}>
              You need administrator privileges to access this area.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <a 
                href="/iko" 
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Go to Iko
              </a>
              <a 
                href="/dashboard" 
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#667eea',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default AdminRoute;



