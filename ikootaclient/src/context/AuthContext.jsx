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

// Helper function to ensure user has converse_id
const ensureConverseId = async (userData) => {
  if (!userData) return userData;

  // If user already has converse_id, return as-is
  if (userData.converse_id) {
    return userData;
  }

  try {
    // Try to get converse_id from token
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.converse_id) {
        userData.converse_id = decoded.converse_id;
        return userData;
      }
    }

    // Try to fetch from API
    if (userData.user_id || userData.id) {
      const userId = userData.user_id || userData.id;
      const response = await api.get(`/auth/users/${userId}/converse-id`);
      if (response.data?.converse_id) {
        userData.converse_id = response.data.converse_id;
      }
    }
  } catch (error) {
    console.warn('Could not fetch converse_id for user:', error);
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
          const userWithConverseId = await ensureConverseId(parsedUser);
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
        const userWithConverseId = await ensureConverseId(response.data.user);
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
    const userWithConverseId = await ensureConverseId(userData);
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