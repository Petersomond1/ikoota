import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './userinfo.css';

const Userinfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
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
      <p>Active 1h ago</p>
    </>
  );
};

export default Userinfo;