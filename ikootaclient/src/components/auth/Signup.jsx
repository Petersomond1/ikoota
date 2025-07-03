// ikootaclient/src/components/auth/Signup.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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
  const [sentCode, setSentCode] = useState('');
  const [loading, setLoading] = useState(false);
  
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

    try {
      setLoading(true);
      
      // Send verification code
      const verificationResponse = await axios.post("http://localhost:3000/api/auth/send-verification", {
        email: values.email,
        phone: values.phone,
        method: verificationMethod,
        username: values.username
      });
      
      if (verificationResponse.status === 200) {
        setSentCode(verificationResponse.data.code); // In production, this wouldn't be sent to frontend
        setVerificationStep('verification');
        alert(`Verification code sent to your ${verificationMethod}!`);
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert(`Failed to send verification code. ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and complete registration
  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    
    if (!verificationCode) {
      alert("Please enter the verification code!");
      return;
    }

    try {
      setLoading(true);
      
      // Verify code and register user
      const registerResponse = await axios.post("http://localhost:3000/api/auth/register", {
        ...values,
        verificationCode,
        verificationMethod
      }, { withCredentials: true });
      
      if (registerResponse.status === 201) {
        setVerificationStep('success');
        
        // Generate application ticket number
        const ticket = generateApplicationTicket(values.username, values.email);
        
        setTimeout(() => {
          navigate('/application-thankyou', { 
            state: { 
              applicationTicket: ticket,
              username: values.username 
            }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.status === 400 && err.response?.data?.message?.includes('verification')) {
        alert("Invalid verification code. Please try again.");
      } else if (err.response?.status === 409) {
        alert("User already exists with this email or username. Please try logging in.");
      } else {
        alert(`Registration failed: ${err.response?.data?.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate application ticket number
  const generateApplicationTicket = (username, email) => {
    const usernamePrefix = username.substring(0, 4).toUpperCase();
    const emailPrefix = email.split('@')[0].substring(0, 4).toUpperCase();
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
    
    return `${usernamePrefix}${emailPrefix}${dateStr}${timeStr}`;
  };

  // Resend verification code
  const handleResendCode = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:3000/api/auth/send-verification", {
        email: values.email,
        phone: values.phone,
        method: verificationMethod,
        username: values.username
      });
      alert(`Verification code resent to your ${verificationMethod}!`);
    } catch (err) {
      alert("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
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
        
        <form onSubmit={handleVerificationSubmit}>
          <div className="verification-input">
            <label htmlFor="verificationCode">
              <strong>Enter Verification Code:</strong>
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength="6"
              className="form-control verification-code-input"
              autoComplete="off"
            />
          </div>
          
          <div className="verification-actions">
            <button type="submit" disabled={loading || !verificationCode}>
              {loading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>
            
            <button type="button" onClick={handleResendCode} disabled={loading} className="resend-btn">
              Resend Code
            </button>
            
            <button type="button" onClick={() => setVerificationStep('form')} className="back-btn">
              ← Back to Form
            </button>
          </div>
        </form>
        
        <div className="verification-help">
          <p>Didn't receive the code? Check your spam folder or try resending.</p>
          <p>Code sent to: {verificationMethod === 'email' ? values.email : values.phone}</p>
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
        
        {/* Verification Method Selection */}
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