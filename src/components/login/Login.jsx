import React, { useState } from 'react';
import './Login.css';
import { toast } from 'react-toastify';
import upload from '../lib/upload';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool, rds } from '../lib/aws-config';

const Login = () => {
  const [avatar, setAvatar] = useState({ file: null, url: '' });
  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    setAvatar({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      user.signUp(username, password, [], null, async (err, result) => {
        if (err) {
          toast.error(err.message);
          setLoading(false);
          return;
        }

        const imgUrl = await Upload(avatar.file);

        // Save user data to RDS
    //     const query = `
    //       INSERT INTO users (username, email, avatar, id, blocked)
    //       VALUES ('${username}', '${email}', '${imgUrl}', '${result.userSub}', '[]')
    //     `;
    //     await rds.query(query).promise();

    //     const userChatsQuery = `
    //       INSERT INTO userchats (id, chats)
    //       VALUES ('${result.userSub}', '[]')
    //     `;
    //     await rds.query(userChatsQuery).promise();

    //     toast.success("User registered successfully! You can now login.");
    //     setLoading(false);
    //   });

 // Save user data to RDS
 const query = `INSERT INTO users (id, username, email, avatar, blocked) VALUES ('${result.userSub}', '${username}', '${email}', '${imgUrl}', '[]')`;
 await rds.query(query).promise();

 const userChatsQuery = `INSERT INTO userchats (userId, chats) VALUES ('${result.userSub}', '[]')`;
 await rds.query(userChatsQuery).promise();

 toast.success("User registered successfully! You can now login.");
 setLoading(false);
});



    } catch (err) {
      console.log(err);
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log('Login successful:', result);
        // Fetch user info and update state
        setLoading(false);
      },
      onFailure: (err) => {
        console.error('Login failed:', err);
        toast.error(err.message);
        setLoading(false);
      },
    });
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome Back, Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading} type="submit">{loading ? "loading" : "Login"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url} alt="" />
            Upload an Image
          </label>
          <input type="file" id="file" style={{ display: 'none' }} onChange={handleAvatar} />
          <input type="text" placeholder="Username" name="username" />
          <input type="email" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading} type="submit">{loading ? "loading" : "Sign up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;