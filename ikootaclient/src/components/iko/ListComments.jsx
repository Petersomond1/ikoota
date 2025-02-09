import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import './listcomments.css';
import api from '../service/api';

const ListComments = ({ setActiveItem, activeItem = {} }) => {
  const [addMode, setAddMode] = useState(false);
  const [data, setData] = useState([]);
  const [user_id, setUserId] = useState(null);

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

    const fetchData = async () => {
      try {
        const [teachingsResponse, chatsResponse, commentsResponse] = await Promise.all([
          api.get(`/teachings/user?user_id=${user_id}`),
          api.get(`/chats/user?user_id=${user_id}`),
          api.get(`/comments/user?user_id=${user_id}`)
        ]);

        console.log("teachingRes @ fetch data", teachingsResponse.data);
        console.log("chatRes @ fetch data", chatsResponse.data);
        console.log("commentRes @ fetch data", commentsResponse.data);

        const comments = commentsResponse.data;

        
        // Extract chat_ids and teaching_ids from comments
        const chatIds = Array.isArray(comments) ? comments.filter(comment => comment.chat_id).map(comment => comment.chat_id) : [];
        const teachingIds = Array.isArray(comments) ? comments.filter(comment => comment.teaching_id).map(comment => comment.teaching_id) : [];

        // Fetch chats and teachings by their IDs
        const [commentedChatsResponse, commentedTeachingsResponse] = await Promise.all([
          chatIds.length > 0 ? api.get(`/chats?ids=${chatIds.join(',')}`) : { data: [] },
          teachingIds.length > 0 ? api.get(`/teachings?ids=${teachingIds.join(',')}`) : { data: [] }
        ]);

        const commentedChats = commentedChatsResponse.data;
        const commentedTeachings = commentedTeachingsResponse.data;

        // Fetch all comments associated with the fetched chats and teachings
        const [chatCommentsResponse, teachingCommentsResponse] = await Promise.all([
          chatIds.length > 0 ? api.get(`/comments?chat_ids=${chatIds.join(',')}`) : { data: [] },
          teachingIds.length > 0 ? api.get(`/comments?teaching_ids=${teachingIds.join(',')}`) : { data: [] }
        ]);

        const chatComments = chatCommentsResponse.data;
        const teachingComments = teachingCommentsResponse.data;

        setData([
          ...teachingsResponse.data,
          ...chatsResponse.data,
          ...commentedTeachings,
          ...commentedChats,
          ...chatComments,
          ...teachingComments
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user_id]);

  const sortedItems = data.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.updatedAt);
    const dateB = new Date(b.updated_at || b.updatedAt);
    return dateB - dateA;
  });

  const handleItemClick = (id, type) => {
    setActiveItem({ id, type });
  };

  return (
    <div className='listcomments_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>
      {sortedItems.length === 0 && <p>No teachings nor chats</p>}
      {sortedItems.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className={`item ${activeItem?.id === item.id && activeItem?.type === item.type ? 'active' : ''}`}
          onClick={() => handleItemClick(item.id, item.type)}
        >
          <div className="texts">
            <span>Topic: {item.title || item.topic}</span>
            <p>Description: {item.summary || item.description}</p>
            <p>Lesson#: {item.id}</p>
            <p>Audience: {item.audience}</p>
            <p>By: {item.created_by || 'Admin'}</p>
            <p>Date: {new Date(item.updated_at || item.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListComments;