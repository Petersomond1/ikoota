import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import './listchats.css';
import api from '../service/api';

const ListChats = ({ setActiveItem }) => {
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });
  const [chats, setChats] = useState([]);
  const [teachings, setTeachings] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chatsResponse, teachingsResponse] = await Promise.all([
          api.get('/chats'),
          api.get('/teachings')
        ]);
        setChats(chatsResponse.data);
        setTeachings(teachingsResponse.data);
        setFilteredItems([...chatsResponse.data, ...teachingsResponse.data]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query) => {
    const filtered = [...chats, ...teachings].filter(item =>
      (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
      (item.topic && item.topic.toLowerCase().includes(query.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(query.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredItems(filtered);
  };


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
          {/* <input type="text" placeholder="Search" /> */}
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>
      {filteredItems.map((item) => (
        <div
          key={`${item.created_at ? 'chat' : 'teaching'}-${item.id}`}
          className={`item ${activeItem.id === item.id && activeItem.type === (item.created_at ? 'chat' : 'teaching') ? 'active' : ''}`}
          onClick={() => handleItemClick(item.id, item.created_at ? 'chat' : 'teaching')}
        >
        {/* {filteredItems.map((item) => (
  <div
    key={`${item.created_at ? 'chat' : 'teaching'}-${item.id || item.updatedAt || item.updatedAt}`}
    className={`item ${activeItem?.id === item.id && activeItem?.type === (item.created_at ? 'chat' : 'teaching') ? 'active' : ''}`}
    onClick={() => handleItemClick(item.id, item.created_at ? 'chat' : 'teaching')}
  > */}
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