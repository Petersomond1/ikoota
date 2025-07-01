// ikootaclient/src/components/auth/UserStatus.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

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
  const [loading, setLoading] = useState(true);

  const getUserFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Check for token in cookies as fallback
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
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  const updateUser = useCallback(() => {
    const userData = getUserFromToken();
    setUser(userData);
    setLoading(false);
  }, [getUserFromToken]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
  }, []);

  const getUserStatus = useCallback(() => {
    if (!user) return 'guest';
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      return 'admin';
    }
    
    if (user.is_member) {
      return 'member';
    }
    
    return 'pending'; // Authenticated but not a member yet
  }, [user]);

  const getDefaultRoute = useCallback(() => {
    const status = getUserStatus();
    
    switch (status) {
      case 'admin':
        return '/admin';
      case 'member':
        return '/iko';
      case 'pending':
        return '/towncrier';
      default:
        return '/';
    }
  }, [getUserStatus]);

  // Initialize user on mount
  useEffect(() => {
    updateUser();
  }, []); // Empty dependency array - only run on mount

  // Listen for storage changes (useful for logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only update if the token key changed
      if (e.key === 'token' || e.key === null) {
        updateUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    user,
    loading,
    updateUser,
    logout,
    getUserStatus,
    getDefaultRoute,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isMember: user?.is_member || false,
    isPending: !!user && !user.is_member && user.role !== 'admin' && user.role !== 'super_admin'
  }), [user, loading, updateUser, logout, getUserStatus, getDefaultRoute]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};