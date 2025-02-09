import React, { useEffect, useState } from 'react';
import api from '../service/api';
import {jwtDecode} from 'jwt-decode';
import './userinfo.css';

const Userinfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [activeTime, setActiveTime] = useState('0m ago');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUserId(jwtDecode(token).user_id);
    } else {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (tokenCookie) {
        setUserId(jwtDecode(tokenCookie.split("=")[1]).user_id);
      } else {
        throw new Error("Access token not found");
      }
    }
  }, []);

  useEffect(() => {
    if (!user_id) return;

    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserInfo(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user_id]);

  useEffect(() => {
    const startTime = Date.now();

    const updateActiveTime = () => {
      const elapsedTime = Date.now() - startTime;
      const minutes = Math.floor(elapsedTime / 60000);
      const hours = Math.floor(minutes / 60);
      const displayTime = hours > 0 ? `${hours}h ${minutes % 60}m ago` : `${minutes}m ago`;
      setActiveTime(displayTime);
    };

    const intervalId = setInterval(updateActiveTime, 60000); // Update every minute

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  if (loading) return <p>Loading user info...</p>;
  if (error) return <p>Error fetching user info: {error}</p>;

  return (
    <>
      <div className='userinfo'>
        <div className="user">
          <img src={userInfo.avatar || "./avatar.png"} alt="User Avatar" />
          <h4>{userInfo.username}</h4>
        </div>
        <div className="icons">
          <img src="./more.png" alt="More" />
          <img src="./video.png" alt="Video" />
          <img src="./edit.png" alt="Edit" />
        </div>
      </div>
      <p>Email: {userInfo.email}</p>
      <p>Class ID: {userInfo.class_id}</p>
      <p>User ID: {userInfo.id}</p>
      <p>Active {activeTime}</p>
    </>
  );
};

export default Userinfo;