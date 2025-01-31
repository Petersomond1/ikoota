import React, { useState } from 'react';
import './listchats.css';

const ListChats = ({ chats, teachings, setActiveItem }) => {
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });

  const handleItemClick = (id, type) => {
    setActiveItemState({ id, type });
    setActiveItem({ id, type });
  };

  const sortedItems = [...(chats || []), ...(teachings || [])].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt);
    const dateB = new Date(b.created_at || b.createdAt);
    return dateB - dateA;
  });

  return (
    <div className='teaching_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>
      {sortedItems.map((item) => (
        <div
          key={`${item.created_at ? 'chat' : 'teaching'}-${item.id}`}
          className={`item ${activeItem.id === item.id && activeItem.type === (item.created_at ? 'chat' : 'teaching') ? 'active' : ''}`}
          onClick={() => handleItemClick(item.id, item.created_at ? 'chat' : 'teaching')}
        >
          <div className="texts">
            <span>Topic: {item.title || item.topic}</span>
            <p>Description: {item.summary || item.description}</p>
            <p>Lesson#: {item.id}</p>
            <p>Audience: {item.audience}</p>
            <p>By: {item.created_by || 'Admin'}</p>
            <p>Date: {new Date(item.created_at || item.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListChats;