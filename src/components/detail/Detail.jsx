import React from 'react';
import './detail.css';
import { useUserStore } from '../lib/userStore';
import { useChatStore } from '../lib/chatStore';
import { rds } from '../lib/aws-config';

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
  const { currentUser } = useUserStore();

  const handleBlock = async () => {
    if (!user) return;

    const query = `
      UPDATE users
      SET blocked = JSON_ARRAY_APPEND(blocked, '$', '${user.id}')
      WHERE id = '${currentUser.id}'
    `;
    await rds.query(query).promise();

    changeBlock();
  };

  return (
    <div className="detail_container">
      <div className="user">
        <img src={user?.avatar || './avatar.png'} alt="" />
        <h2>{user?.username}</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing!</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
        </div>
        <button onClick={handleBlock}>
          {isCurrentUserBlocked ? 'You are Blocked!' : isReceiverBlocked ? 'User blocked' : 'Block User'}
        </button>
        <button className="logout" onClick={() => userPool.getCurrentUser().signOut()}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;