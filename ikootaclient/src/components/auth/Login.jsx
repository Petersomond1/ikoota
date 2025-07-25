// ikootaclient/src/components/auth/Login.jsx
// ✅ FIXED VERSION - Proper routing based on user status and privileges

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
      }, { 
        withCredentials: true,
        timeout: 15000
      });

      console.log('🔍 Login response:', response.data);

      if (response.status === 200) {
        const responseData = response.data;
        let token, user;

        // Handle multiple response formats
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

        console.log('🔍 Extracted token:', token ? 'Present' : 'Missing');
        console.log('🔍 Extracted user:', user);

        if (!user) {
          console.error('❌ No user data received from login response');
          setError('Login failed: Invalid response from server');
          return;
        }

        // Store token properly
        if (token) {
          localStorage.setItem("token", token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
        
        // ✅ FIXED: Smart routing based on user status
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

  // ✅ COMPLETELY REWRITTEN: Smart user routing based on membership status
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

  // ✅ NEW: More precise check for application survey requirement
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

      // Check survey status via API for edge cases
      const response = await axios.get('http://localhost:3000/api/membership/survey/check-status', {
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
                       !userData.application_submitted_at;
      
      console.log('🔄 Fallback survey check:', {
        isNewUser,
        memberStatus,
        membershipStage
      });
      
      return isNewUser;
    }
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




// // ikootaclient/src/components/auth/Login.jsx
// // ✅ ENHANCED VERSION - Using existing access matrix + fixing routing issues

// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useUser } from "./UserStatus";
// import './login.css';
// import { getUserAccess } from '../config/accessMatrix';

// const Login = () => {
//   const [values, setValues] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const navigate = useNavigate();
//   const { updateUser, isAuthenticated } = useUser();
  
//   axios.defaults.withCredentials = true;

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   // ✅ ENHANCED: Better survey status checking with timeout
//   const checkUserStatus = async (token, userData) => {
//     try {
//       console.log('🔍 Checking user survey status...');
      
//       const response = await axios.get('http://localhost:3000/api/membership/survey/check-status', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         },
//         timeout: 10000 // 10 second timeout
//       });
      
//       const statusData = response.data;
//       console.log('📋 Survey status response:', statusData);
      
//       return {
//         ...statusData,
//         originalUserData: userData,
//         success: true
//       };
//     } catch (error) {
//       console.error('❌ Error checking survey status:', error);
      
//       // If survey status check fails, use fallback logic
//       console.warn('⚠️ Survey status check failed, using fallback routing');
//       return {
//         needs_survey: false,
//         survey_completed: true,
//         originalUserData: userData,
//         fallback: true,
//         success: false
//       };
//     }
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
    
//     if (!values.email || !values.password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     try {
//       setLoading(true);
      
//       // ✅ FIXED: Use correct API endpoint
//       const response = await axios.post("http://localhost:3000/api/auth/login", {
//         email: values.email,
//         password: values.password
//       }, { 
//         withCredentials: true,
//         timeout: 15000 // 15 second timeout
//       });

//       console.log('🔍 Login response:', response.data);

//       if (response.status === 200) {
//         const responseData = response.data;
//         let token, user;

//         // ✅ ENHANCED: Handle multiple response formats
//         if (responseData.token && responseData.user) {
//           token = responseData.token;
//           user = responseData.user;
//         } else if (responseData.data?.token && responseData.data?.user) {
//           token = responseData.data.token;
//           user = responseData.data.user;
//         } else if (responseData.access_token || responseData.accessToken) {
//           token = responseData.access_token || responseData.accessToken;
//           user = responseData.user || responseData.data?.user;
//         } else if (responseData.success && responseData.data) {
//           token = responseData.data.token || responseData.data.access_token;
//           user = responseData.data.user;
//         } else {
//           user = responseData.user || responseData.data || responseData;
//           token = responseData.token || responseData.access_token || responseData.accessToken;
//         }

//         console.log('🔍 Extracted token:', token ? 'Present' : 'Missing');
//         console.log('🔍 Extracted user:', user);

//         if (!user) {
//           console.error('❌ No user data received from login response');
//           setError('Login failed: Invalid response from server');
//           return;
//         }

//         // ✅ Store token properly
//         if (token) {
//           localStorage.setItem("token", token);
//           axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         } else {
//           console.warn('⚠️ No token received, but user data exists');
//         }
        
//         // ✅ CRITICAL: Update user context first
//         try {
//           console.log('🔄 Updating user context...');
//           await updateUser();
          
//           // Add a small delay to ensure context is updated
//           await new Promise(resolve => setTimeout(resolve, 500));
//         } catch (updateError) {
//           console.warn('⚠️ Failed to update user context:', updateError);
//         }
        
//         // ✅ ENHANCED: Smart routing logic using existing access matrix
//         await handleUserRouting(user, token);
//       }
//     } catch (err) {
//       console.error('❌ Login error:', err);
//       console.error('❌ Error response:', err.response?.data);
      
//       if (err.response?.status === 401) {
//         setError("Invalid email or password.");
//       } else if (err.response?.status === 403) {
//         const message = err.response.data?.message || '';
//         if (message.includes('banned')) {
//           setError("Your account has been banned. Contact support for assistance.");
//         } else if (message.includes('pending')) {
//           handlePendingUser(err.response.data);
//         } else {
//           setError("Access denied. Please contact support.");
//         }
//       } else if (err.response?.status === 404) {
//         setError("No account found with this email. Please sign up first.");
//       } else if (err.code === 'ECONNABORTED') {
//         setError("Login request timed out. Please check your connection and try again.");
//       } else {
//         setError("Login failed. Please check your network and try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ ENHANCED: Smart user routing using your existing access matrix
//   const handleUserRouting = async (userData, token) => {
//     if (!userData) {
//       console.error('❌ No user data provided to handleUserRouting');
//       setError('Login failed: Invalid user data received');
//       return;
//     }
    
//     console.log('🔍 Routing user based on data:', userData);
    
//     try {
//       // ✅ PRIORITY 1: Check survey status for non-admin users
//       let statusResult = null;
//       const role = userData.role?.toLowerCase();
      
//       if (token && role !== 'admin' && role !== 'super_admin') {
//         statusResult = await checkUserStatus(token, userData);
        
//         // ✅ Handle survey requirements
//         if (statusResult && statusResult.success && !statusResult.fallback) {
//           if (statusResult.needs_survey === true || statusResult.survey_completed === false) {
//             console.log('📝 User needs to complete survey, redirecting...');
//             navigate('/applicationsurvey');
//             return;
//           }
//         }
//       }
      
//       // ✅ PRIORITY 2: Use your existing access matrix for routing
//       try {
//         const access = getUserAccess(userData);
//         console.log('📍 User access determined using access matrix:', access);
//         console.log('🎯 Default route from access matrix:', access.defaultRoute);
        
//         // ✅ Navigate using the access matrix default route
//         navigate(access.defaultRoute, { replace: true });
//         return;
        
//       } catch (accessError) {
//         console.warn('⚠️ Access matrix failed, using fallback logic:', accessError);
//       }
      
//       // ✅ PRIORITY 3: Fallback routing logic (in case access matrix fails)
//       const memberStatus = userData.is_member?.toLowerCase();
//       const membershipStage = userData.membership_stage?.toLowerCase();
      
//       if (role === 'admin' || role === 'super_admin') {
//         console.log('👑 Admin user - fallback routing to admin panel');
//         navigate('/admin', { replace: true });
//       } else if (memberStatus === 'member' && membershipStage === 'member') {
//         console.log('💎 Full member - fallback routing to Iko');
//         navigate('/iko', { replace: true });
//       } else if (memberStatus === 'approved') {
//         if (membershipStage === 'full') {
//           console.log('💎 Full approved member - fallback routing to Iko');
//           navigate('/iko', { replace: true });
//         } else if (membershipStage === 'pre') {
//           console.log('👤 Pre-member - fallback routing to Towncrier');
//           navigate('/towncrier', { replace: true });
//         } else {
//           console.log('📚 Approved user - fallback routing to Towncrier');
//           navigate('/towncrier', { replace: true });
//         }
//       } else if (memberStatus === 'applied' || memberStatus === 'pending') {
//         console.log('⏳ Pending user - fallback routing to Towncrier');
//         navigate('/towncrier', { replace: true });
//       } else if (memberStatus === 'declined' || memberStatus === 'denied') {
//         console.log('❌ Declined user - fallback routing to Towncrier');
//         navigate('/towncrier', { replace: true });
//       } else {
//         console.log('🏠 Default fallback - routing to Towncrier');
//         navigate('/towncrier', { replace: true });
//       }
      
//     } catch (error) {
//       console.error('❌ Error in user routing:', error);
//       setError('Login successful but routing failed. Redirecting to default page...');
      
//       // ✅ Last resort fallback - just navigate to home
//       setTimeout(() => {
//         navigate('/', { replace: true });
//       }, 2000);
//     }
//   };

//   const handlePendingUser = (data) => {
//     const { applicationStatus, applicationTicket } = data;
    
//     switch (applicationStatus) {
//       case 'pending':
//         alert(`Your application is still under review.\n\nApplication Ticket: ${applicationTicket || 'N/A'}\n\nYou'll receive an email notification once the review is complete.`);
//         navigate('/pending-verification');
//         break;
//       case 'suspended':
//         alert(`Your application review is suspended and requires additional information.\n\nPlease check your email for details on what's needed.\n\nApplication Ticket: ${applicationTicket || 'N/A'}`);
//         navigate('/suspended-verification');
//         break;
//       default:
//         setError("Your application is being processed. Please check your email for updates.");
//     }
//   };

//   const handleForgotPassword = () => {
//     const email = values.email;
//     if (!email) {
//       alert("Please enter your email address first, then click 'Forgot Password'.");
//       return;
//     }
    
//     navigate('/forgot-password', { state: { email } });
//   };

//   const handleChange = (e) => {
//     setValues({ ...values, [e.target.name]: e.target.value });
//   };

//   // ✅ REST OF THE COMPONENT REMAINS THE SAME
//   return (
//     <div className="login-container">
//       <div className="login-form">
//         <div className="login-header">
//           <h2>Sign In to Ikoota</h2>
//           <p>Access your educational community account</p>
//         </div>

//         {error && (
//           <div className="error-message">
//             <span className="error-icon">⚠️</span>
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">
//               <strong>Email Address:</strong>
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={values.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               className="form-control"
//               autoComplete="email"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">
//               <strong>Password:</strong>
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={values.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               className="form-control"
//               autoComplete="current-password"
//               required
//             />
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="btn-login"
//             >
//               {loading ? 'Signing In...' : 'Sign In'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={handleForgotPassword}
//               className="btn-forgot"
//             >
//               Forgot Password?
//             </button>
//           </div>
//         </form>

//         <div className="login-divider">
//           <span>New to Ikoota?</span>
//         </div>

//         <div className="signup-section">
//           <p>Join our educational community</p>
//           <Link to="/signup" className="btn-signup">
//             Create Account
//           </Link>
//         </div>

//         <div className="login-help">
//           <h3>Having trouble signing in?</h3>
//           <div className="help-options">
//             <div className="help-item">
//               <span className="help-icon">📧</span>
//               <div>
//                 <h4>Check Your Application Status</h4>
//                 <p>If you've applied for membership, check your email for status updates</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">⏳</span>
//               <div>
//                 <h4>Application Under Review</h4>
//                 <p>Pending applications typically take 3-5 business days to review</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">❓</span>
//               <div>
//                 <h4>Need Help?</h4>
//                 <p>Contact support@ikoota.com with your application ticket number</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="login-footer">
//           <div className="footer-links">
//             <Link to="/">← Back to Home</Link>
//             <Link to="/towncrier">Browse Public Content</Link>
//           </div>
//           <p className="footer-note">
//             By signing in, you agree to our Terms of Service and Privacy Policy.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;





// // ikootaclient/src/components/auth/Login.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useUser } from "./UserStatus";
// import './login.css';
// import { getUserAccess } from '../config/accessMatrix';

// const Login = () => {
//   const [values, setValues] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const navigate = useNavigate();
//   const { updateUser, isAuthenticated } = useUser();
  
//   axios.defaults.withCredentials = true;

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       // Will be handled by the navigation logic in App.jsx
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   // ✅ NEW: Enhanced checkUserStatus function
//   const checkUserStatus = async (token, userData) => {
//     try {
//       console.log('🔍 Checking user survey status...');
      
//       const response = await axios.get('http://localhost:3000/api/membership/survey/check-status', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       const statusData = response.data;
//       console.log('📋 Survey status response:', statusData);
      
//       // Return the status data for routing decisions
//       return {
//         ...statusData,
//         originalUserData: userData
//       };
//     } catch (error) {
//       console.error('❌ Error checking survey status:', error);
      
//       // If survey status check fails, continue with original routing
//       console.warn('⚠️ Survey status check failed, using fallback routing');
//       return {
//         needs_survey: false,
//         survey_completed: true,
//         originalUserData: userData,
//         fallback: true
//       };
//     }
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
    
//     if (!values.email || !values.password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     try {
//       setLoading(true);
      
//       const response = await axios.post("http://localhost:3000/api/auth/login", {
//         email: values.email,
//         password: values.password
//       }, { withCredentials: true });

//       console.log('🔍 Login response:', response.data);

//       if (response.status === 200) {
//         // ✅ FIXED: Handle different response structures
//         const responseData = response.data;
//         let token, user;

//         // Try different response structures
//         if (responseData.token && responseData.user) {
//           token = responseData.token;
//           user = responseData.user;
//         } else if (responseData.data && responseData.data.token && responseData.data.user) {
//           token = responseData.data.token;
//           user = responseData.data.user;
//         } else if (responseData.access_token || responseData.accessToken) {
//           token = responseData.access_token || responseData.accessToken;
//           user = responseData.user || responseData.data?.user;
//         } else if (responseData.success && responseData.data) {
//           token = responseData.data.token || responseData.data.access_token;
//           user = responseData.data.user;
//         } else {
//           user = responseData.user || responseData.data || responseData;
//           token = responseData.token || responseData.access_token || responseData.accessToken;
//         }

//         console.log('🔍 Extracted token:', token ? 'Present' : 'Missing');
//         console.log('🔍 Extracted user:', user);

//         // ✅ FIXED: Ensure user data exists before proceeding
//         if (!user) {
//           console.error('❌ No user data received from login response');
//           console.error('❌ Full response structure:', responseData);
//           setError('Login failed: Invalid response from server');
//           return;
//         }

//         // ✅ FIXED: Store token properly
//         if (token) {
//           localStorage.setItem("token", token);
//           axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         } else {
//           console.warn('⚠️ No token received, but user data exists');
//         }
        
//         // Update user context
//         try {
//           await updateUser();
//         } catch (updateError) {
//           console.warn('⚠️ Failed to update user context:', updateError);
//         }
        
//         // ✅ ENHANCED: Check survey status before routing
//         const statusResult = await checkUserStatus(token, user);
        
//         // Handle routing based on survey status and user data
//         handleUserRouting(statusResult);
//       }
//     } catch (err) {
//       console.error('❌ Login error:', err);
//       console.error('❌ Error response:', err.response?.data);
      
//       if (err.response?.status === 401) {
//         setError("Invalid email or password.");
//       } else if (err.response?.status === 403) {
//         const message = err.response.data?.message || '';
//         if (message.includes('banned')) {
//           setError("Your account has been banned. Contact support for assistance.");
//         } else if (message.includes('pending')) {
//           handlePendingUser(err.response.data);
//         } else {
//           setError("Access denied. Please contact support.");
//         }
//       } else if (err.response?.status === 404) {
//         setError("No account found with this email. Please sign up first.");
//       } else {
//         setError("Login failed. Please check your network and try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ ENHANCED: Updated handleUserRouting with survey status integration
//   const handleUserRouting = (statusData) => {
//     if (!statusData || !statusData.originalUserData) {
//       console.error('❌ No status data provided to handleUserRouting');
//       setError('Login failed: Invalid user data received');
//       return;
//     }
    
//     const userData = statusData.originalUserData;
//     console.log('🔍 Routing user based on status:', statusData);
    
//     try {
//       // ✅ PRIORITY 1: Check if user needs to complete survey
//       if (statusData.needs_survey && !statusData.fallback) {
//         console.log('📝 User needs to complete survey, redirecting...');
//         navigate('/applicationsurvey');
//         return;
//       }
      
//       // ✅ PRIORITY 2: Check survey completion status for regular users
//       if (!statusData.survey_completed && userData.role === 'user' && !statusData.fallback) {
//         console.log('📝 User survey incomplete, redirecting to survey...');
//         navigate('/applicationsurvey');
//         return;
//       }
      
//       // ✅ PRIORITY 3: Use existing access matrix for routing
//       const access = getUserAccess(userData);
//       console.log('📍 User access determined:', access);
//       console.log('➡️ Redirecting to:', access.defaultRoute);
      
//       // Navigate to the default route for this user type
//       navigate(access.defaultRoute);
      
//     } catch (error) {
//       console.error('❌ Error in user routing:', error);
//       setError('Login successful but routing failed. Please try refreshing the page.');
      
//       // ✅ ENHANCED: Fallback routing with survey consideration
//       try {
//         // Still check survey for regular users even in fallback
//         if (!statusData.fallback && statusData.needs_survey && userData.role === 'user') {
//           navigate('/applicationsurvey');
//           return;
//         }
        
//         // Original fallback logic
//         if (userData.role === 'admin' || userData.role === 'super_admin') {
//           navigate('/admin');
//         } else if (userData.is_member === 'granted' || userData.is_member === true) {
//           navigate('/iko');
//         } else if (userData.is_member === 'applied' || userData.is_member === 'pending') {
//           navigate('/pending-verification');
//         } else if (userData.is_member === 'declined') {
//           setError("Your membership application was declined. Please contact support for more information.");
//         } else {
//           navigate('/towncrier');
//         }
//       } catch (fallbackError) {
//         console.error('❌ Fallback routing also failed:', fallbackError);
//         navigate('/');
//       }
//     }
//   };

//   const handlePendingUser = (data) => {
//     const { applicationStatus, applicationTicket } = data;
    
//     switch (applicationStatus) {
//       case 'pending':
//         alert(`Your application is still under review.\n\nApplication Ticket: ${applicationTicket || 'N/A'}\n\nYou'll receive an email notification once the review is complete.`);
//         navigate('/pending-verification');
//         break;
//       case 'suspended':
//         alert(`Your application review is suspended and requires additional information.\n\nPlease check your email for details on what's needed.\n\nApplication Ticket: ${applicationTicket || 'N/A'}`);
//         navigate('/suspended-verification');
//         break;
//       default:
//         setError("Your application is being processed. Please check your email for updates.");
//     }
//   };

//   const handleForgotPassword = () => {
//     const email = values.email;
//     if (!email) {
//       alert("Please enter your email address first, then click 'Forgot Password'.");
//       return;
//     }
    
//     navigate('/forgot-password', { state: { email } });
//   };

//   const handleChange = (e) => {
//     setValues({ ...values, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="login-container">
//       <div className="login-form">
//         <div className="login-header">
//           <h2>Sign In to Ikoota</h2>
//           <p>Access your educational community account</p>
//         </div>

//         {error && (
//           <div className="error-message">
//             <span className="error-icon">⚠️</span>
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">
//               <strong>Email Address:</strong>
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={values.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               className="form-control"
//               autoComplete="email"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">
//               <strong>Password:</strong>
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={values.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               className="form-control"
//               autoComplete="current-password"
//               required
//             />
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="btn-login"
//             >
//               {loading ? 'Signing In...' : 'Sign In'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={handleForgotPassword}
//               className="btn-forgot"
//             >
//               Forgot Password?
//             </button>
//           </div>
//         </form>

//         <div className="login-divider">
//           <span>New to Ikoota?</span>
//         </div>

//         <div className="signup-section">
//           <p>Join our educational community</p>
//           <Link to="/signup" className="btn-signup">
//             Create Account
//           </Link>
//         </div>

//         <div className="login-help">
//           <h3>Having trouble signing in?</h3>
//           <div className="help-options">
//             <div className="help-item">
//               <span className="help-icon">📧</span>
//               <div>
//                 <h4>Check Your Application Status</h4>
//                 <p>If you've applied for membership, check your email for status updates</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">⏳</span>
//               <div>
//                 <h4>Application Under Review</h4>
//                 <p>Pending applications typically take 3-5 business days to review</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">❓</span>
//               <div>
//                 <h4>Need Help?</h4>
//                 <p>Contact support@ikoota.com with your application ticket number</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="login-footer">
//           <div className="footer-links">
//             <Link to="/">← Back to Home</Link>
//             <Link to="/towncrier">Browse Public Content</Link>
//           </div>
//           <p className="footer-note">
//             By signing in, you agree to our Terms of Service and Privacy Policy.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;



// // ikootaclient/src/components/auth/Login.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useUser } from "./UserStatus";
// import './login.css';
// import { getUserAccess } from '../config/accessMatrix';
// //import api from '../service/api';

// const Login = () => {
//   const [values, setValues] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const navigate = useNavigate();
//   const { updateUser, isAuthenticated } = useUser();
  
//   axios.defaults.withCredentials = true;

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       // Will be handled by the navigation logic in App.jsx
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
    
//     if (!values.email || !values.password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     try {
//       setLoading(true);
      
//       const response = await axios.post("http://localhost:3000/api/auth/login", {
//         email: values.email,
//         password: values.password
//       }, { withCredentials: true });

//       console.log('🔍 Login response:', response.data); // Debug log

//       if (response.status === 200) {
//         // ✅ FIXED: Handle different response structures
//         const responseData = response.data;
//         let token, user;

//         // Try different response structures
//         if (responseData.token && responseData.user) {
//           // Structure: { token: "...", user: {...} }
//           token = responseData.token;
//           user = responseData.user;
//         } else if (responseData.data && responseData.data.token && responseData.data.user) {
//           // Structure: { data: { token: "...", user: {...} } }
//           token = responseData.data.token;
//           user = responseData.data.user;
//         } else if (responseData.access_token || responseData.accessToken) {
//           // Structure with different token field names
//           token = responseData.access_token || responseData.accessToken;
//           user = responseData.user || responseData.data?.user;
//         } else if (responseData.success && responseData.data) {
//           // Structure: { success: true, data: { token: "...", user: {...} } }
//           token = responseData.data.token || responseData.data.access_token;
//           user = responseData.data.user;
//         } else {
//           // Try to extract user from different possible locations
//           user = responseData.user || responseData.data || responseData;
//           token = responseData.token || responseData.access_token || responseData.accessToken;
//         }

//         console.log('🔍 Extracted token:', token ? 'Present' : 'Missing');
//         console.log('🔍 Extracted user:', user);

//         // ✅ FIXED: Ensure user data exists before proceeding
//         if (!user) {
//           console.error('❌ No user data received from login response');
//           console.error('❌ Full response structure:', responseData);
//           setError('Login failed: Invalid response from server');
//           return;
//         }

//         // ✅ FIXED: Store token properly
//         if (token) {
//           localStorage.setItem("token", token);
//           // Also set authorization header for future requests
//           axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         } else {
//           console.warn('⚠️ No token received, but user data exists');
//         }
        
//         // Update user context
//         try {
//           await updateUser();
//         } catch (updateError) {
//           console.warn('⚠️ Failed to update user context:', updateError);
//           // Continue with login even if context update fails
//         }
        
//         // Handle routing based on user status with validated user data
//         handleUserRouting(user);
//       }
//     } catch (err) {
//       console.error('❌ Login error:', err);
//       console.error('❌ Error response:', err.response?.data);
      
//       if (err.response?.status === 401) {
//         setError("Invalid email or password.");
//       } else if (err.response?.status === 403) {
//         // Handle specific forbidden cases
//         const message = err.response.data?.message || '';
//         if (message.includes('banned')) {
//           setError("Your account has been banned. Contact support for assistance.");
//         } else if (message.includes('pending')) {
//           // User exists but application is pending
//           handlePendingUser(err.response.data);
//         } else {
//           setError("Access denied. Please contact support.");
//         }
//       } else if (err.response?.status === 404) {
//         setError("No account found with this email. Please sign up first.");
//       } else {
//         setError("Login failed. Please check your network and try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ FIXED: Enhanced handleUserRouting with proper validation
//   const handleUserRouting = (userData) => {
//     // ✅ CRITICAL: Validate user data exists
//     if (!userData) {
//       console.error('❌ No user data provided to handleUserRouting');
//       setError('Login failed: Invalid user data received');
//       return;
//     }
    
//     console.log('🔍 Routing user based on data:', userData);
    
//     try {
//       // Use the access matrix to determine routing
//       const access = getUserAccess(userData);
      
//       console.log('📍 User access determined:', access);
//       console.log('➡️ Redirecting to:', access.defaultRoute);
      
//       // Navigate to the default route for this user type
//       navigate(access.defaultRoute);
//     } catch (error) {
//       console.error('❌ Error in user routing:', error);
//       setError('Login successful but routing failed. Please try refreshing the page.');
      
//       // Fallback routing based on basic user properties
//       try {
//         if (userData.role === 'admin' || userData.role === 'super_admin') {
//           navigate('/admin');
//         } else if (userData.is_member === 'granted' || userData.is_member === true) {
//           navigate('/iko');
//         } else if (userData.is_member === 'applied' || userData.is_member === 'pending') {
//           navigate('/pending-verification');
//         } else if (userData.is_member === 'declined') {
//           setError("Your membership application was declined. Please contact support for more information.");
//         } else {
//           navigate('/towncrier');
//         }
//       } catch (fallbackError) {
//         console.error('❌ Fallback routing also failed:', fallbackError);
//         // Last resort - navigate to home
//         navigate('/');
//       }
//     }
//   };

//   const handlePendingUser = (data) => {
//     const { applicationStatus, applicationTicket } = data;
    
//     switch (applicationStatus) {
//       case 'pending':
//         alert(`Your application is still under review.\n\nApplication Ticket: ${applicationTicket || 'N/A'}\n\nYou'll receive an email notification once the review is complete.`);
//         navigate('/pending-verification');
//         break;
//       case 'suspended':
//         alert(`Your application review is suspended and requires additional information.\n\nPlease check your email for details on what's needed.\n\nApplication Ticket: ${applicationTicket || 'N/A'}`);
//         navigate('/suspended-verification');
//         break;
//       default:
//         setError("Your application is being processed. Please check your email for updates.");
//     }
//   };

//   const handleForgotPassword = () => {
//     const email = values.email;
//     if (!email) {
//       alert("Please enter your email address first, then click 'Forgot Password'.");
//       return;
//     }
    
//     // Navigate to password reset with email pre-filled
//     navigate('/forgot-password', { state: { email } });
//   };

//   const handleChange = (e) => {
//     setValues({ ...values, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="login-container">
//       <div className="login-form">
//         <div className="login-header">
//           <h2>Sign In to Ikoota</h2>
//           <p>Access your educational community account</p>
//         </div>

//         {error && (
//           <div className="error-message">
//             <span className="error-icon">⚠️</span>
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">
//               <strong>Email Address:</strong>
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={values.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               className="form-control"
//               autoComplete="email"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">
//               <strong>Password:</strong>
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={values.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               className="form-control"
//               autoComplete="current-password"
//               required
//             />
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="btn-login"
//             >
//               {loading ? 'Signing In...' : 'Sign In'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={handleForgotPassword}
//               className="btn-forgot"
//             >
//               Forgot Password?
//             </button>
//           </div>
//         </form>

//         <div className="login-divider">
//           <span>New to Ikoota?</span>
//         </div>

//         <div className="signup-section">
//           <p>Join our educational community</p>
//           <Link to="/signup" className="btn-signup">
//             Create Account
//           </Link>
//         </div>

//         <div className="login-help">
//           <h3>Having trouble signing in?</h3>
//           <div className="help-options">
//             <div className="help-item">
//               <span className="help-icon">📧</span>
//               <div>
//                 <h4>Check Your Application Status</h4>
//                 <p>If you've applied for membership, check your email for status updates</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">⏳</span>
//               <div>
//                 <h4>Application Under Review</h4>
//                 <p>Pending applications typically take 3-5 business days to review</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">❓</span>
//               <div>
//                 <h4>Need Help?</h4>
//                 <p>Contact support@ikoota.com with your application ticket number</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="login-footer">
//           <div className="footer-links">
//             <Link to="/">← Back to Home</Link>
//             <Link to="/towncrier">Browse Public Content</Link>
//           </div>
//           <p className="footer-note">
//             By signing in, you agree to our Terms of Service and Privacy Policy.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// // ikootaclient/src/components/auth/Login.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useUser } from "./UserStatus";
// import './login.css';
// import { getUserAccess } from '../config/accessMatrix';
// //import api from '../service/api';

// const Login = () => {
//   const [values, setValues] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const navigate = useNavigate();
//   const { updateUser, isAuthenticated } = useUser();
  
//   axios.defaults.withCredentials = true;

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       // Will be handled by the navigation logic in App.jsx
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
    
//     if (!values.email || !values.password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     try {
//       setLoading(true);
      
//       const response = await axios.post("http://localhost:3000/api/auth/login", {
//         email: values.email,
//         password: values.password
//       }, { withCredentials: true });

//       if (response.status === 200) {
//         const { token, user } = response.data;
        
//         // Store token
//         localStorage.setItem("token", token);
        
//         // Update user context
//         updateUser();
        
//         // Handle routing based on user status
//         await handleUserRouting(user);
//       }
//     } catch (err) {
//       console.error('Login error:', err);
      
//       if (err.response?.status === 401) {
//         setError("Invalid email or password.");
//       } else if (err.response?.status === 403) {
//         // Handle specific forbidden cases
//         const message = err.response.data?.message || '';
//         if (message.includes('banned')) {
//           setError("Your account has been banned. Contact support for assistance.");
//         } else if (message.includes('pending')) {
//           // User exists but application is pending
//           handlePendingUser(err.response.data);
//         } else {
//           setError("Access denied. Please contact support.");
//         }
//       } else if (err.response?.status === 404) {
//         setError("No account found with this email. Please sign up first.");
//       } else {
//         setError("Login failed. Please check your network and try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleUserRouting = async (user) => {
//   //   // Check user status and route accordingly
//   //   if (user.role === 'admin' || user.role === 'super_admin') {
//   //     navigate('/admin');
//   //   } else if (user.is_member === 'granted' || user.is_member === true) {
//   //     navigate('/iko');
//   //   } else if (user.is_member === 'applied' || user.is_member === 'pending') {
//   //     // Show pending status
//   //     navigate('/pending-verification');
//   //   } else if (user.is_member === 'declined') {
//   //     setError("Your membership application was declined. Please contact support for more information.");
//   //   } else {
//   //     // New user or no application yet
//   //     navigate('/towncrier');
//   //   }
//   // };


// const handleUserRouting = (userData) => {
//   if (!userData) {
//     console.error('❌ No user data provided to handleUserRouting');
//     return;
//   }
  
//   console.log('🔍 Routing user based on data:', userData);
  
//   // Use the access matrix to determine routing
//   const access = getUserAccess(userData);
  
//   console.log('📍 User access determined:', access);
//   console.log('➡️ Redirecting to:', access.defaultRoute);
  
//   // Navigate to the default route for this user type
//   navigate(access.defaultRoute);
// };

//   const handlePendingUser = (data) => {
//     const { applicationStatus, applicationTicket } = data;
    
//     switch (applicationStatus) {
//       case 'pending':
//         alert(`Your application is still under review.\n\nApplication Ticket: ${applicationTicket || 'N/A'}\n\nYou'll receive an email notification once the review is complete.`);
//         navigate('/pending-verification');
//         break;
//       case 'suspended':
//         alert(`Your application review is suspended and requires additional information.\n\nPlease check your email for details on what's needed.\n\nApplication Ticket: ${applicationTicket || 'N/A'}`);
//         navigate('/suspended-verification');
//         break;
//       default:
//         setError("Your application is being processed. Please check your email for updates.");
//     }
//   };

//   const handleForgotPassword = () => {
//     const email = values.email;
//     if (!email) {
//       alert("Please enter your email address first, then click 'Forgot Password'.");
//       return;
//     }
    
//     // Navigate to password reset with email pre-filled
//     navigate('/forgot-password', { state: { email } });
//   };

//   const handleChange = (e) => {
//     setValues({ ...values, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="login-container">
//       <div className="login-form">
//         <div className="login-header">
//           <h2>Sign In to Ikoota</h2>
//           <p>Access your educational community account</p>
//         </div>

//         {error && (
//           <div className="error-message">
//             <span className="error-icon">⚠️</span>
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">
//               <strong>Email Address:</strong>
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={values.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               className="form-control"
//               autoComplete="email"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">
//               <strong>Password:</strong>
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={values.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               className="form-control"
//               autoComplete="current-password"
//               required
//             />
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="btn-login"
//             >
//               {loading ? 'Signing In...' : 'Sign In'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={handleForgotPassword}
//               className="btn-forgot"
//             >
//               Forgot Password?
//             </button>
//           </div>
//         </form>

//         <div className="login-divider">
//           <span>New to Ikoota?</span>
//         </div>

//         <div className="signup-section">
//           <p>Join our educational community</p>
//           <Link to="/signup" className="btn-signup">
//             Create Account
//           </Link>
//         </div>

//         <div className="login-help">
//           <h3>Having trouble signing in?</h3>
//           <div className="help-options">
//             <div className="help-item">
//               <span className="help-icon">📧</span>
//               <div>
//                 <h4>Check Your Application Status</h4>
//                 <p>If you've applied for membership, check your email for status updates</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">⏳</span>
//               <div>
//                 <h4>Application Under Review</h4>
//                 <p>Pending applications typically take 3-5 business days to review</p>
//               </div>
//             </div>
//             <div className="help-item">
//               <span className="help-icon">❓</span>
//               <div>
//                 <h4>Need Help?</h4>
//                 <p>Contact support@ikoota.com with your application ticket number</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="login-footer">
//           <div className="footer-links">
//             <Link to="/">← Back to Home</Link>
//             <Link to="/towncrier">Browse Public Content</Link>
//           </div>
//           <p className="footer-note">
//             By signing in, you agree to our Terms of Service and Privacy Policy.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;