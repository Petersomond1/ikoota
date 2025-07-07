// ikootaclient/src/components/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "./UserStatus";
import './login.css';
import { getUserAccess } from '../config/accessMatrix';

const Login = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { updateUser, isAuthenticated } = useUser();
  
  axios.defaults.withCredentials = true;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Will be handled by the navigation logic in App.jsx
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    if (!values.email || !values.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post("http://localhost:3000/api/auth/login", {
        email: values.email,
        password: values.password
      }, { withCredentials: true });

      if (response.status === 200) {
        const { token, user } = response.data;
        
        // Store token
        localStorage.setItem("token", token);
        
        // Update user context
        updateUser();
        
        // Handle routing based on user status
        await handleUserRouting(user);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 403) {
        // Handle specific forbidden cases
        const message = err.response.data?.message || '';
        if (message.includes('banned')) {
          setError("Your account has been banned. Contact support for assistance.");
        } else if (message.includes('pending')) {
          // User exists but application is pending
          handlePendingUser(err.response.data);
        } else {
          setError("Access denied. Please contact support.");
        }
      } else if (err.response?.status === 404) {
        setError("No account found with this email. Please sign up first.");
      } else {
        setError("Login failed. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // const handleUserRouting = async (user) => {
  //   // Check user status and route accordingly
  //   if (user.role === 'admin' || user.role === 'super_admin') {
  //     navigate('/admin');
  //   } else if (user.is_member === 'granted' || user.is_member === true) {
  //     navigate('/iko');
  //   } else if (user.is_member === 'applied' || user.is_member === 'pending') {
  //     // Show pending status
  //     navigate('/pending-verification');
  //   } else if (user.is_member === 'declined') {
  //     setError("Your membership application was declined. Please contact support for more information.");
  //   } else {
  //     // New user or no application yet
  //     navigate('/towncrier');
  //   }
  // };


const handleUserRouting = (userData) => {
  if (!userData) {
    console.error('❌ No user data provided to handleUserRouting');
    return;
  }
  
  console.log('🔍 Routing user based on data:', userData);
  
  // Use the access matrix to determine routing
  const access = getUserAccess(userData);
  
  console.log('📍 User access determined:', access);
  console.log('➡️ Redirecting to:', access.defaultRoute);
  
  // Navigate to the default route for this user type
  navigate(access.defaultRoute);
};

  const handlePendingUser = (data) => {
    const { applicationStatus, applicationTicket } = data;
    
    switch (applicationStatus) {
      case 'pending':
        alert(`Your application is still under review.\n\nApplication Ticket: ${applicationTicket || 'N/A'}\n\nYou'll receive an email notification once the review is complete.`);
        navigate('/pending-verification');
        break;
      case 'suspended':
        alert(`Your application review is suspended and requires additional information.\n\nPlease check your email for details on what's needed.\n\nApplication Ticket: ${applicationTicket || 'N/A'}`);
        navigate('/suspended-verification');
        break;
      default:
        setError("Your application is being processed. Please check your email for updates.");
    }
  };

  const handleForgotPassword = () => {
    const email = values.email;
    if (!email) {
      alert("Please enter your email address first, then click 'Forgot Password'.");
      return;
    }
    
    // Navigate to password reset with email pre-filled
    navigate('/forgot-password', { state: { email } });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h2>Sign In to Ikoota</h2>
          <p>Access your educational community account</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <strong>Email Address:</strong>
            </label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="form-control"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <strong>Password:</strong>
            </label>
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="form-control"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-login"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="btn-forgot"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="login-divider">
          <span>New to Ikoota?</span>
        </div>

        <div className="signup-section">
          <p>Join our educational community</p>
          <Link to="/signup" className="btn-signup">
            Create Account
          </Link>
        </div>

        <div className="login-help">
          <h3>Having trouble signing in?</h3>
          <div className="help-options">
            <div className="help-item">
              <span className="help-icon">📧</span>
              <div>
                <h4>Check Your Application Status</h4>
                <p>If you've applied for membership, check your email for status updates</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">⏳</span>
              <div>
                <h4>Application Under Review</h4>
                <p>Pending applications typically take 3-5 business days to review</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">❓</span>
              <div>
                <h4>Need Help?</h4>
                <p>Contact support@ikoota.com with your application ticket number</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <div className="footer-links">
            <Link to="/">← Back to Home</Link>
            <Link to="/towncrier">Browse Public Content</Link>
          </div>
          <p className="footer-note">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;