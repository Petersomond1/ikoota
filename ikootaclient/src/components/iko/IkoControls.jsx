import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ikocontrols.css';
// import Chat from "./Chat";

const IkoControls = () => {
  const [messages, setMessages] = useState([]);
  const [comments, setComments] = useState([]);
  const [chats, setChats] = useState([]);
  const [filter, setFilter] = useState('pending'); // Default filter for messages

  // Fetch data based on filter
  const fetchData = async (type) => {
    try {
      let response;
      switch (type) {
        case 'messages':
          response = await axios.get(`/api/messages?status=${filter}`);
          setMessages(response.data);
          break;
        case 'comments':
          response = await axios.get(`/api/comments?status=${filter}`);
          setComments(response.data);
          break;
        case 'chats':
          response = await axios.get(`/api/chats`);
          setChats(response.data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approve, Reject, or Delete items
  const handleAction = async (type, id, action) => {
    try {
      await axios.put(`/api/${type}/${id}`, { status: action });
      fetchData(type);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData('messages');
    fetchData('comments');
    fetchData('chats');
  }, [filter]);

  return (
    <div className="iko-controls">
       <h2>Admin Chat Controls</h2>
       {/* <Chat /> */}
      <h1>Iko Controls</h1>
      <div className="controls-container">
        <div className="messages-section">
          <h2>Manage Messages</h2>
          <div className="filters">
            <button onClick={() => setFilter('pending')}>Pending</button>
            <button onClick={() => setFilter('approved')}>Approved</button>
            <button onClick={() => setFilter('rejected')}>Rejected</button>
            <button onClick={() => setFilter('deleted')}>Deleted</button>
          </div>
          <ul>
            { Array.isArray(messages) && messages?.map((msg) => (
              <li key={msg.id}>
                <p><strong>{msg.topic}</strong>: {msg.description}</p>
                <div>
                  <button onClick={() => handleAction('messages', msg.id, 'approved')}>Approve</button>
                  <button onClick={() => handleAction('messages', msg.id, 'rejected')}>Reject</button>
                  <button onClick={() => handleAction('messages', msg.id, 'deleted')}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="comments-section">
          <h2>Manage Comments</h2>
          <ul>
            { Array.isArray(comments) && comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.content}</p>
                <div>
                  <button onClick={() => handleAction('comments', comment.id, 'approved')}>Approve</button>
                  <button onClick={() => handleAction('comments', comment.id, 'rejected')}>Reject</button>
                  <button onClick={() => handleAction('comments', comment.id, 'deleted')}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="chats-section">
          <h2>Manage Chats</h2>
          <ul>
            { Array.isArray(chats) && chats.map((chat) => (
              <li key={chat.id}>
                <p><strong>{chat.topic}</strong>: {chat.description}</p>
                <div>
                  <button onClick={() => handleAction('chats', chat.id, 'deleted')}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IkoControls;
