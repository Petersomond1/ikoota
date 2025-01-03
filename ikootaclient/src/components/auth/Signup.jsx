
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './signup.css'

const Signup = () => {
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  axios.defaults.withCredentials = true;
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (values.password !== values.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const res = await axios.post("http://localhost:3000/api/auth/register", values, { withCredentials: true });
      if (res.status === 201) {
        navigate(`${res.data.redirectTo}`);
        console.log('res data at signup', res.data);
      } else {
        alert("Error: " + res.data.error + " - " + "Signup Failed");
      }
    } catch (err) {
      alert("Signup failed, please check your network and try again.");
    }
  };

  return (
    <div className="signup-form">
      <h2>Sign Up Page</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="username"><strong>Username:</strong>
            <input
              type="text"
              placeholder="Enter Username"
              name="username"
              onChange={e => setValues({ ...values, username: e.target.value })}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="email"><strong>Email:</strong>
            <input
              type="email"
              autoComplete="off"
              placeholder="Enter Email"
              name="email"
              onChange={e => setValues({ ...values, email: e.target.value })}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="phone"><strong>Phone:</strong>
            <input
              type="phone"
              autoComplete="off"
              placeholder="Enter whatsapp Phone Number"
              name="phone"
              onChange={e => setValues({ ...values, phone: e.target.value })}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="password"><strong>Password:</strong>
            <input
              type="password"
              placeholder="Enter Password"
              name="password"
              onChange={e => setValues({ ...values, password: e.target.value })}
              className="form-control"
              autoComplete="off"
            />
          </label>
        </div>
        <div style={{ marginBottom: "3px" }}>
            <label htmlFor="confirmPassword"><strong>Confirm Password:</strong>
              <input
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                onChange={e => setValues({ ...values, confirmPassword: e.target.value })}
                className="form-control"
                autoComplete="off"
              />
            </label>
          </div>
        <button type="submit">Sign Up</button>
        <p>Next is to fill a simple ID form</p>
      </form>
      <Link to="/" type="submit"><strong>opt-out</strong></Link>
    </div>
  );
};

export default Signup;