// ikootaclient/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../components/service/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to fetch converse_id for display purposes ONLY
// NOTE: converse_id is NOT part of authentication (removed from JWT per commit 7140ebc)
const fetchDisplayConverseId = async (userData) => {
  if (!userData) return userData;

  // If user already has converse_id for display, return as-is
  if (userData.converse_id && userData.converse_id.startsWith('OTO#')) {
    return userData;
  }

  try {
    // Fetch converse_id from API for privacy-masked display only
    const userId = userData.user_id || userData.id;
    if (userId) {
      const response = await api.get(`/auth/users/${userId}/converse-id`);
      if (response.data?.converse_id) {
        // Add converse_id for display purposes only - not for authentication
        userData.converse_id = response.data.converse_id;
      }
    }
  } catch (error) {
    console.warn('Could not fetch converse_id for display:', error);
    // This is OK - converse_id is optional for display, authentication still works
  }

  return userData;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const userWithConverseId = await fetchDisplayConverseId(parsedUser);
          setUser(userWithConverseId);
          setIsAuthenticated(true);

          // Update localStorage with converse_id if it was added
          if (userWithConverseId.converse_id && !parsedUser.converse_id) {
            localStorage.setItem('user', JSON.stringify(userWithConverseId));
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data) {
        localStorage.setItem('token', response.data.token);

        // Ensure user has converse_id before storing
        const userWithConverseId = await fetchDisplayConverseId(response.data.user);
        localStorage.setItem('user', JSON.stringify(userWithConverseId));
        setUser(userWithConverseId);
        setIsAuthenticated(true);
        return { success: true, user: userWithConverseId };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (userData) => {
    const userWithConverseId = await fetchDisplayConverseId(userData);
    setUser(userWithConverseId);
    localStorage.setItem('user', JSON.stringify(userWithConverseId));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;