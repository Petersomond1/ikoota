import React, { useState } from 'react';
import './adduser.css';
import { useUserStore } from '../lib/userStore';
import { rds } from '../lib/aws-config';

const AddUser = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');

    try {
      const query = `SELECT * FROM users WHERE username = '${username}'`;
      const result = await rds.query(query).promise();

      if (result.length > 0) {
        setUser(result[0]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    try {
      const newChatQuery = `
        INSERT INTO chats (createdAt, messages)
        VALUES (NOW(), '[]')
      `;
      const newChatResult = await rds.query(newChatQuery).promise();
      const newChatId = newChatResult.insertId;

      const updateUserChatsQuery = `
        UPDATE userchats
        SET chats = JSON_ARRAY_APPEND(chats, '$', JSON_OBJECT('chatId', '${newChatId}', 'lastMessage', '', 'receiverId', '${currentUser.id}', 'updatedAt', NOW()))
        WHERE id = '${user.id}'
      `;
      await rds.query(updateUserChatsQuery).promise();

      const updateCurrentUserChatsQuery = `
        UPDATE userchats
        SET chats = JSON_ARRAY_APPEND(chats, '$', JSON_OBJECT('chatId', '${newChatId}', 'lastMessage', '', 'receiverId', '${user.id}', 'updatedAt', NOW()))
        WHERE id = '${currentUser.id}'
      `;
      await rds.query(updateCurrentUserChatsQuery).promise();

      console.log('Chat created successfully!', newChatId);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || './avatar.png'} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;