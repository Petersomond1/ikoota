// ikootaclient/src/components/auth/Login.jsx
// ✅ MINIMAL FIX - Only fix token handling, keep existing routing logic

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "./UserStatus";
import './login.css';

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
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // ========================================================================
  // ✅ ENHANCED TOKEN EXTRACTION AND CLEANING
  // ========================================================================

  const extractTokenAndUser = (responseData) => {
    let token, user;
    
    console.log('🔍 Extracting token from response:', responseData);
    
    // Try different response formats
    if (responseData.token && responseData.user) {
      token = responseData.token;
      user = responseData.user;
    } else if (responseData.data?.token && responseData.data?.user) {
      token = responseData.data.token;
      user = responseData.data.user;
    } else if (responseData.access_token || responseData.accessToken) {
      token = responseData.access_token || responseData.accessToken;
      user = responseData.user || responseData.data?.user;
    } else if (responseData.success && responseData.data) {
      token = responseData.data.token || responseData.data.access_token;
      user = responseData.data.user;
    } else {
      user = responseData.user || responseData.data || responseData;
      token = responseData.token || responseData.access_token || responseData.accessToken;
    }
    
    console.log('🔍 Raw token extracted:', token);
    console.log('🔍 Token type:', typeof token);
    
    // Clean and validate token
    if (token) {
      if (typeof token !== 'string') {
        console.error('❌ Token is not a string:', typeof token, token);
        return { token: null, user: null, error: 'Invalid token type received' };
      }
      
      // ✅ ENHANCED CLEANING: Remove quotes, whitespace, newlines
      const cleanToken = token
        .replace(/^["']|["']$/g, '')  // Remove quotes
        .replace(/^\s+|\s+$/g, '')    // Remove whitespace
        .replace(/\r?\n|\r/g, '');    // Remove newlines
      
      console.log('🔍 Cleaned token:', cleanToken.substring(0, 20) + '...');
      
      // Basic JWT format validation (must have 3 parts separated by dots)
      if (cleanToken.split('.').length !== 3) {
        console.error('❌ Token does not have JWT format:', {
          parts: cleanToken.split('.').length,
          tokenStart: cleanToken.substring(0, 20),
          originalToken: token.substring(0, 20)
        });
        return { token: null, user: null, error: 'Invalid token format received' };
      }
      
      token = cleanToken;
    }
    
    return { token, user, error: null };
  };

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
      }, { 
        withCredentials: true,
        timeout: 15000
      });

      console.log('🔍 Login response:', response.data);

      if (response.status === 200) {
        const responseData = response.data;
        
        // ✅ ENHANCED: Use the improved token extraction
        const { token, user, error: extractionError } = extractTokenAndUser(responseData);

        if (extractionError) {
          console.error('❌ Token extraction error:', extractionError);
          setError('Login failed: ' + extractionError);
          return;
        }

        if (!user) {
          console.error('❌ No user data received from login response');
          setError('Login failed: Invalid response from server');
          return;
        }

        // ✅ ENHANCED: Store token with validation
        if (token && typeof token === 'string' && token.trim() !== '') {
          console.log('🔍 Storing token:', token.substring(0, 20) + '...');
          
          // Store the clean token
          localStorage.setItem("token", token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // ✅ ADD: Debug token storage
          console.log('🔍 Token stored successfully');
          console.log('🔍 Token parts count:', token.split('.').length);
          
        } else {
          console.error('❌ Invalid token received:', token);
          setError('Login failed: Invalid token received from server');
          return;
        }
        
        // Update user context first
        try {
          console.log('🔄 Updating user context...');
          await updateUser();
          
          // Small delay to ensure context is updated
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (updateError) {
          console.warn('⚠️ Failed to update user context:', updateError);
        }
        
        // ✅ KEEP EXISTING: Your original routing logic (unchanged)
        await handleUserRouting(user, token);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 403) {
        const message = err.response.data?.message || '';
        if (message.includes('banned')) {
          setError("Your account has been banned. Contact support for assistance.");
        } else if (message.includes('pending')) {
          handlePendingUser(err.response.data);
        } else {
          setError("Access denied. Please contact support.");
        }
      } else if (err.response?.status === 404) {
        setError("No account found with this email. Please sign up first.");
      } else if (err.code === 'ECONNABORTED') {
        setError("Login request timed out. Please check your connection and try again.");
      } else {
        setError("Login failed. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ KEEP EXISTING: Your original routing logic (unchanged from paste-3.txt)
  const handleUserRouting = async (userData, token) => {
    if (!userData) {
      console.error('❌ No user data provided to handleUserRouting');
      setError('Login failed: Invalid user data received');
      return;
    }
    
    console.log('🔍 Routing user based on data:', userData);
    
    try {
      const role = userData.role?.toLowerCase();
      const memberStatus = userData.is_member?.toLowerCase();
      const membershipStage = userData.membership_stage?.toLowerCase();
      
      console.log('🔍 User routing analysis:', {
        role,
        memberStatus, 
        membershipStage,
        userId: userData.id
      });

      // ✅ PRIORITY 1: Admin users - Go straight to admin panel
      if (role === 'admin' || role === 'super_admin') {
        console.log('👑 Admin user detected - routing to admin panel');
        navigate('/admin', { replace: true });
        return;
      }

      // ✅ PRIORITY 2: Full Members - Go to Iko Chat
      if ((memberStatus === 'member' && membershipStage === 'member') || 
          (memberStatus === 'active' && membershipStage === 'member')) {
        console.log('💎 Full member detected - routing to Iko Chat');
        navigate('/iko', { replace: true });
        return;
      }

      // ✅ PRIORITY 3: Pre-Members - Go to Towncrier  
      if (memberStatus === 'pre_member' || membershipStage === 'pre_member') {
        console.log('👤 Pre-member detected - routing to Towncrier');
        navigate('/towncrier', { replace: true });
        return;
      }

      // ✅ PRIORITY 4: Check if user needs to complete application survey
      if (token) {
        const needsSurvey = await checkIfUserNeedsApplication(token, userData);
        
        if (needsSurvey) {
          console.log('📝 User needs to complete application - routing to survey');
          navigate('/applicationsurvey', { replace: true });
          return;
        }
      }

      // ✅ PRIORITY 5: Other authenticated users - Go to dashboard
      console.log('🏠 Default routing - going to dashboard');
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('❌ Error in user routing:', error);
      setError('Login successful but routing failed. Redirecting to dashboard...');
      
      // Last resort fallback
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    }
  };

  // ✅ KEEP EXISTING: Your original survey check logic (unchanged from paste-3.txt)
  const checkIfUserNeedsApplication = async (token, userData) => {
    try {
      console.log('🔍 Checking if user needs application survey...');
      
      // Skip survey check for known member statuses
      const memberStatus = userData.is_member?.toLowerCase();
      const membershipStage = userData.membership_stage?.toLowerCase();
      
      // Users who definitely don't need survey
      if (memberStatus === 'pre_member' || 
          memberStatus === 'member' || 
          memberStatus === 'active' ||
          membershipStage === 'pre_member' || 
          membershipStage === 'member') {
        console.log('✅ User has confirmed membership status - no survey needed');
        return false;
      }

      // ✅ FIXED: Use the endpoint we just added to server.js
      const response = await axios.get('http://localhost:3000/api/user/userstatus/survey/check-status', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      });
      
      const statusData = response.data;
      console.log('📋 Survey status check:', statusData);
      
      // Only require survey if explicitly needed and not completed
      const needsSurvey = statusData.needs_survey === true && 
                         statusData.survey_completed === false &&
                         memberStatus === 'applied' &&
                         membershipStage === 'none';
      
      console.log('🎯 Survey requirement decision:', {
        needsSurvey,
        reason: needsSurvey ? 'New user needs to complete application' : 'User has existing status'
      });
      
      return needsSurvey;
      
    } catch (error) {
      console.warn('⚠️ Survey status check failed:', error);
      
      // Conservative fallback: only require survey for clearly new users
      const memberStatus = userData.is_member?.toLowerCase();
      const membershipStage = userData.membership_stage?.toLowerCase();
      
      const isNewUser = memberStatus === 'applied' && 
                       membershipStage === 'none' &&
                       !userData.application_submittedAt;
      
      console.log('🔄 Fallback survey check:', {
        isNewUser,
        memberStatus,
        membershipStage
      });
      
      return isNewUser;
    }
  };

  // ✅ KEEP EXISTING: All other functions unchanged
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
    
    navigate('/forgot-password', { state: { email } });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  // ✅ KEEP EXISTING: All JSX unchanged from your original
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