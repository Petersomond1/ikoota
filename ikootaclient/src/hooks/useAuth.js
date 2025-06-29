// ikootaclient/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        // Check for token in cookies
        const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
        if (tokenCookie) {
          const cookieToken = tokenCookie.split("=")[1];
          try {
            const decoded = jwtDecode(cookieToken);
            if (decoded.exp * 1000 > Date.now()) {
              setUser(decoded);
            }
          } catch (error) {
            console.error('Invalid token in cookie');
          }
        }
        setLoading(false);
        return;
      }
      
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (error) {
      console.error('Invalid token provided to login');
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.isAdmin === true,
    login,
    logout
  };
};