// ikootaclient/src/components/auth/Signup.jsx - COMPLETE FIXED WITH ENHANCED DEBUGGING
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../service/api";
import './signup.css';

const Signup = () => {
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  
  const [verificationStep, setVerificationStep] = useState('form'); // 'form', 'verification', 'success'
  const [verificationMethod, setVerificationMethod] = useState(''); // 'email' or 'phone'
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState(''); // For development
  
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();

  // Step 1: Submit initial signup form and send verification code
  const handleInitialSubmit = async (event) => {
    event.preventDefault();
    
    // Validation
    if (values.password !== values.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    if (!values.username || !values.email || !values.password || !values.phone) {
      alert("Please fill in all required fields!");
      return;
    }
    
    if (!verificationMethod) {
      alert("Please select a verification method!");
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Sending verification request:', {
        email: values.email,
        phone: values.phone,
        method: verificationMethod
      });
      
      // ✅ UPDATED: Use auth endpoint instead of membership endpoint
      const verificationResponse = await api.post("/auth/send-verification", {
        email: values.email,
        phone: values.phone,
        method: verificationMethod, // ✅ Use 'method' to match database
        username: values.username
      });
      
      console.log('✅ Verification response:', verificationResponse.data);
      
      if (verificationResponse.status === 200) {
        // ✅ Store dev code if provided (development mode)
        if (verificationResponse.data.devCode) {
          setDevCode(verificationResponse.data.devCode);
          console.log('🛠️ Dev code received:', verificationResponse.data.devCode);
        }
        
        setVerificationStep('verification');
        alert(`Verification code sent to your ${verificationMethod}!`);
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      
      let errorMessage = 'Failed to send verification code.';
      
      if (err.response?.status === 404) {
        errorMessage = 'The verification endpoint is not available. Please check the server.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(`${errorMessage} Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED: Step 2 - Verify code and complete registration with extensive debugging
  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    
    if (!verificationCode) {
      alert("Please enter the verification code!");
      return;
    }

    try {
      setLoading(true);
      
      // ✅ ENHANCED: Clean and validate the verification code
      const cleanedCode = verificationCode.trim();
      
      const requestData = {
        username: values.username,
        email: values.email,
        password: values.password,
        phone: values.phone,
        verificationCode: cleanedCode,
        verificationMethod
      };
      
      console.log('🔍 Submitting registration with data:', {
        ...requestData,
        password: '***HIDDEN***' // Don't log the actual password
      });
      
      // ✅ ENHANCED: Log verification code details for debugging
      console.log('🔍 Verification code details:', {
        original: verificationCode,
        trimmed: cleanedCode,
        length: cleanedCode.length,
        type: typeof cleanedCode,
        charCodes: [...cleanedCode].map(char => char.charCodeAt(0)),
        isNumeric: /^\d+$/.test(cleanedCode),
        devCodeMatch: devCode ? (cleanedCode === devCode) : 'No dev code available'
      });
      
      // ✅ ENHANCED: Additional validation
      if (cleanedCode.length !== 6) {
        alert("Verification code must be exactly 6 digits!");
        return;
      }
      
      if (!/^\d+$/.test(cleanedCode)) {
        alert("Verification code must contain only numbers!");
        return;
      }
      
      // ✅ UPDATED: Use auth endpoint instead of membership endpoint
      const registerResponse = await api.post("/auth/register", requestData);
      
      console.log('✅ Registration response:', registerResponse.data);
      
      if (registerResponse.status === 201) {
        setVerificationStep('success');
        
        // Use server-provided application ticket or generate fallback
        const applicationTicket = registerResponse.data.user?.application_ticket || 
                                generateApplicationTicket(values.username, values.email);
        
        setTimeout(() => {
          navigate('/application-thankyou', { 
            state: { 
              applicationTicket,
              username: values.username,
              userId: registerResponse.data.user?.id
            }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('❌ Full error response:', err.response);
      
      // ✅ ENHANCED: Enhanced error logging and debugging
      if (err.response?.data?.debug) {
        console.error('🔍 Server debug info:', err.response.data.debug);
      }
      
      let errorMessage = 'Registration failed.';
      
      if (err.response?.status === 400) {
        if (err.response.data?.error?.includes('verification')) {
          errorMessage = "Invalid verification code. Please try again.";
          
          // ✅ ENHANCED: Show debug info in development
          if (process.env.NODE_ENV === 'development' && err.response.data?.debug) {
            console.log('🔍 Debug info from server:', err.response.data.debug);
            const debugInfo = err.response.data.debug;
            errorMessage += `\n\nDEBUG INFO (Development Mode):\nStored: ${debugInfo.storedCode}\nSubmitted: ${debugInfo.submittedCode}\nTypes: ${debugInfo.storedType} vs ${debugInfo.submittedType}`;
          }
          
          // ✅ ENHANCED: Additional debugging for development
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Local verification analysis:', {
              enteredCode: verificationCode.trim(),
              devCode: devCode,
              match: verificationCode.trim() === devCode,
              expectedLength: 6,
              actualLength: verificationCode.trim().length
            });
          }
        } else {
          errorMessage = err.response.data?.error || 'Invalid input data.';
        }
      } else if (err.response?.status === 409) {
        errorMessage = "User already exists with this email or username. Please try logging in.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(`${errorMessage} Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Generate application ticket number (fallback)
  const generateApplicationTicket = (username, email) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `APP-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
  };

  // Resend verification code
  const handleResendCode = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Resending verification code...');
      
      // ✅ UPDATED: Use auth endpoint instead of membership endpoint
      const response = await api.post("/auth/send-verification", {
        email: values.email,
        phone: values.phone,
        method: verificationMethod, // ✅ Use 'method' field
        username: values.username
      });
      
      console.log('✅ Resend response:', response.data);
      
      // ✅ Update dev code if provided
      if (response.data.devCode) {
        setDevCode(response.data.devCode);
        console.log('🛠️ New dev code received:', response.data.devCode);
      }
      
      alert(`Verification code resent to your ${verificationMethod}!`);
    } catch (err) {
      console.error('❌ Resend error:', err);
      alert("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED: Auto-fill verification code with validation
  const handleDevCodeFill = () => {
    if (devCode) {
      setVerificationCode(devCode);
      console.log('🛠️ Auto-filled verification code:', devCode);
    } else {
      console.warn('⚠️ No dev code available to auto-fill');
    }
  };

  // ✅ ENHANCED: Input handler for verification code with real-time validation
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input and limit to 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
    }
  };

  // Render based on current step
  if (verificationStep === 'success') {
    return (
      <div className="signup-form success-message">
        <h2>🎉 Registration Successful!</h2>
        <div className="success-content">
          <p>Welcome to Ikoota, {values.username}!</p>
          <p>Your account has been created successfully.</p>
          <div className="loading-spinner">
            <p>Redirecting you to complete your application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStep === 'verification') {
    return (
      <div className="signup-form verification-form">
        <h2>Verify Your Account</h2>
        <p>We've sent a verification code to your {verificationMethod}.</p>
        
        {/* ✅ ENHANCED: Development debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-code-info" style={{
            background: '#f0f8ff', 
            padding: '15px', 
            margin: '15px 0', 
            borderRadius: '8px',
            border: '1px solid #b0d4ff'
          }}>
            <p><strong>🛠️ Development Mode Debug Info:</strong></p>
            {devCode ? (
              <>
                <p>Latest verification code: <code style={{
                  background: '#ffe6e6', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>{devCode}</code></p>
                <button 
                  type="button" 
                  onClick={handleDevCodeFill} 
                  className="dev-fill-btn"
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '5px'
                  }}
                >
                  Auto-fill Code
                </button>
                <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                  Current input: "{verificationCode}" | Match: {verificationCode.trim() === devCode ? '✅' : '❌'}
                </p>
              </>
            ) : (
              <p style={{color: '#ff6600'}}>No dev code available. Check server logs.</p>
            )}
          </div>
        )}
        
        <form onSubmit={handleVerificationSubmit}>
          <div className="verification-input">
            <label htmlFor="verificationCode">
              <strong>Enter Verification Code:</strong>
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={handleVerificationCodeChange} // ✅ ENHANCED: Use new handler
              maxLength="6"
              className="form-control verification-code-input"
              autoComplete="off"
              style={{
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '3px',
                fontFamily: 'monospace'
              }}
            />
            {/* ✅ ENHANCED: Real-time validation feedback */}
            {verificationCode && (
              <div style={{fontSize: '12px', marginTop: '5px'}}>
                {verificationCode.length === 6 ? (
                  <span style={{color: 'green'}}>✅ Code length correct</span>
                ) : (
                  <span style={{color: 'orange'}}>⚠️ Code must be 6 digits ({verificationCode.length}/6)</span>
                )}
              </div>
            )}
          </div>
          
          <div className="verification-actions">
            <button 
              type="submit" 
              disabled={loading || !verificationCode || verificationCode.length !== 6}
              style={{
                opacity: (loading || !verificationCode || verificationCode.length !== 6) ? 0.6 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>
            
            <button type="button" onClick={handleResendCode} disabled={loading} className="resend-btn">
              {loading ? 'Resending...' : 'Resend Code'}
            </button>
            
            <button type="button" onClick={() => setVerificationStep('form')} className="back-btn">
              ← Back to Form
            </button>
          </div>
        </form>
        
        <div className="verification-help">
          <p>Didn't receive the code? Check your spam folder or try resending.</p>
          <p>Code sent to: {verificationMethod === 'email' ? values.email : values.phone}</p>
          
          {/* ✅ ENHANCED: Additional help in development */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px'}}>
              <p><strong>🔧 Development Tips:</strong></p>
              <ul style={{fontSize: '14px', marginBottom: '0'}}>
                <li>Check browser console for detailed debugging information</li>
                <li>Server logs show the generated verification code</li>
                <li>Use the auto-fill button above for quick testing</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Initial signup form
  return (
    <div className="signup-form">
      <h2>Join Ikoota Platform</h2>
      <p>Create your account to apply for membership</p>
      
      <form onSubmit={handleInitialSubmit}>
        <div className="form-group">
          <label htmlFor="username"><strong>Username:</strong></label>
          <input
            type="text"
            placeholder="Enter Username"
            name="username"
            value={values.username}
            onChange={e => setValues({ ...values, username: e.target.value })}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email"><strong>Email:</strong></label>
          <input
            type="email"
            autoComplete="off"
            placeholder="Enter Email"
            name="email"
            value={values.email}
            onChange={e => setValues({ ...values, email: e.target.value })}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone"><strong>Phone:</strong></label>
          <input
            type="tel"
            autoComplete="off"
            placeholder="Enter WhatsApp Phone Number"
            name="phone"
            value={values.phone}
            onChange={e => setValues({ ...values, phone: e.target.value })}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password"><strong>Password:</strong></label>
          <input
            type="password"
            placeholder="Enter Password"
            name="password"
            value={values.password}
            onChange={e => setValues({ ...values, password: e.target.value })}
            className="form-control"
            autoComplete="off"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword"><strong>Confirm Password:</strong></label>
          <input
            type="password"
            placeholder="Confirm Password"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={e => setValues({ ...values, confirmPassword: e.target.value })}
            className="form-control"
            autoComplete="off"
            required
          />
        </div>
        
        {/* ✅ FIXED: Verification Method Selection */}
        <div className="form-group verification-method">
          <label><strong>Verify account via:</strong></label>
          <div className="method-options">
            <label className="radio-option">
              <input
                type="radio"
                name="verificationMethod"
                value="email"
                checked={verificationMethod === 'email'}
                onChange={e => setVerificationMethod(e.target.value)}
                required
              />
              <span>Email</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="verificationMethod"
                value="phone"
                checked={verificationMethod === 'phone'}
                onChange={e => setVerificationMethod(e.target.value)}
                required
              />
              <span>Phone/SMS</span>
            </label>
          </div>
        </div>
        
        <button type="submit" disabled={loading || !verificationMethod}>
          {loading ? 'Sending Code...' : 'Send Verification Code'}
        </button>
        
        <div className="next-step-info">
          <p>📋 Next: Complete application survey for membership consideration</p>
        </div>
      </form>
      
      <div className="form-footer">
        <Link to="/login">Already have an account? <strong>Sign In</strong></Link>
        <br />
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
};

export default Signup;
