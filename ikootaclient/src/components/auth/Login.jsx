import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './login.css';

const Login = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post("http://localhost:3000/api/auth/login", values)
      .then(res => {
        if (res.data.Status === "Success") {
          localStorage.setItem('token', res.data.token); // Store the token
          navigate("/iko"); // Redirect to iko Chatpage
        } else {
          alert("Register/Signup for the Chat Page or check your login credentials or network.");
        }
      })
      .catch(err => {
        alert("Register/Signup for the Chat Page or check your login credentials or network.");
      });
  };

  return (
    <div className="login_form">
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="email">Email:
            <input
              type="email"
              autoComplete="off"
              placeholder="Enter Email"
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              id="email"
              name="email"
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: "3px" }}>
          <label htmlFor="password">Password:
            <input
              type="password"
              placeholder="Enter Password"
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              id="password"
              name="password"
              className="form-control"
              autoComplete="off"
            />
          </label>
        </div>
        <button type="submit">Log In</button>
        <p>You agree to the terms & conditions of the use of this site</p>
      </form>
      <Link to="/signup">SignUp</Link>
      <div>
  <Link to="/passwordreset">Forgot Password?</Link>
</div>

    </div>
  );
};

export default Login;
