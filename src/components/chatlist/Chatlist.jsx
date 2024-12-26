import React, { useEffect, useState } from 'react';
import './chatlist.css';
import AddUser from '../adduser/AddUser';
import { useUserStore } from '../lib/userStore';
import { useChatStore } from '../lib/chatStore';
import { rds } from '../lib/aws-config';

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      try {
        const query = `SELECT * FROM userchats WHERE userId = '${currentUser.id}'`;
        const result = await rds.query(query).promise();
        const items = result.Items || [];

        const promises = items.map(async item => {
          const userQuery = `SELECT * FROM users WHERE id = '${item.receiverId}'`;
          const userResult = await rds.query(userQuery).promise();
          const user = userResult.Items[0];

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (err) {
        console.error(err);
      }
    };

    fetchChats();
  }, [currentUser]);

  const handleSelect = async (chat) => {
    const userChats = chats.map(item => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    userChats[chatIndex].isSeen = true;

    const updateQuery = `UPDATE userchats SET chats = '${JSON.stringify(userChats)}' WHERE userId = '${currentUser.id}'`;

    try {
      await rds.query(updateQuery).promise();
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = chats.filter(chat => chat.user.username.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="chatlist_container">
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" onChange={(e) => setInput(e.target.value)} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>

      {filteredChats?.map(chat => (
        <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)} style={{
          backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
        }}>
          <img src={chat.user.blocked.includes(currentUser.id) ? "./avatar.png" : chat.user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user?.username}</span>
            <p>{chat.lastMessage}</p>
            <p>{new Date(chat.updatedAt).toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
      {addMode && <AddUser />}
    </div>
  );
};

export default Chatlist;