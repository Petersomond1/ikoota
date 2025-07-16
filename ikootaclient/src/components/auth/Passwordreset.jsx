//ikootaclient\src\components\auth\Passwordreset.jsx
import React, { useState } from "react";
import axios from "axios";
import "./passwordreset.css";

const Passwordreset = () => {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    emailOrPhone: "",
    newPassword: "",
    confirmNewPassword: "",
    verificationCode: "",
  });

  const handleResetRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/auth/passwordreset/request", {
        emailOrPhone: values.emailOrPhone,
      });
      setStep(2); // Move to password reset step
    } catch (err) {
      console.error(err.response.data.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/auth/passwordreset/reset", {
        ...values,
      });
      setStep(3); // Move to verification step
    } catch (err) {
      console.error(err.response.data.message);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/auth/passwordreset/verify", {
        emailOrPhone: values.emailOrPhone,
        verificationCode: values.verificationCode,
      });
      alert("Password reset successful!");
    } catch (err) {
      console.error(err.response.data.message);
    }
  };

  return (
    <div className="password-reset-container">
      {step === 1 && (
        <form onSubmit={handleResetRequest}>
          <h2>Request Password Reset</h2>
          <input
            type="text"
            placeholder="Enter Email or Phone"
            onChange={(e) => setValues({ ...values, emailOrPhone: e.target.value })}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handlePasswordReset}>
          <h2>Reset Password</h2>
          <input
            type="password"
            placeholder="New Password"
            onChange={(e) => setValues({ ...values, newPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            onChange={(e) => setValues({ ...values, confirmNewPassword: e.target.value })}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={handleVerification}>
          <h2>Verify Reset</h2>
          <input
            type="text"
            placeholder="Enter Verification Code"
            onChange={(e) => setValues({ ...values, verificationCode: e.target.value })}
            required
          />
          <button type="submit">Verify</button>
        </form>
      )}
    </div>
  );
};

export default Passwordreset;
