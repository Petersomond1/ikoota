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
        const chats = chatsResponse.data.map(chat => ({ ...chat, type: 'chat' }));
        const teachings = teachingsResponse.data.map(teaching => ({ ...teaching, type: 'teaching' }));
        
        console.log('chtas response', chats);
        console.log('teachings response', teachings);
        setChats(chats);
        setTeachings(teachings);
        setFilteredItems([...chats, ...teachings]);
        console.log("chat response", chats);
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

  const handleItemClick = (item) => {
    setActiveItemState({ id: item.id, type: item.updatedAt ? 'chat' : 'teaching' });
    setActiveItem(item);
  };

  
  return (
    <div className='teaching_container' style={{border:"3px solid blue"}}>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>
      {filteredItems.map((item ) => {
      if(item.type === "chat"){
        return (
          <div
          key={item.id}
          className={`item ${activeItem.id === item.id && activeItem.type === (item.updatedAt ? 'chat' : 'teaching') ? 'active' : ''}`}
          onClick={() => handleItemClick(item)}
        >
          <div className="texts">
            <span>Topic: {item.title || item.topic}</span>
            <p>Description: {item.summary || item.description}</p>
            <p>Lesson#: {item.id}</p>
            <p>Audience: {item.audience}</p>
            <p>By: {item.created_by || 'Admin'}</p>
            <p>Date: {new Date( item.createdAt).toLocaleString()}</p>
          </div>
        </div>
        )
      }
        
})}

{filteredItems.map((item ) => {
      if(item.type === "teaching"){
        return (
          <div
          key={item.id}
          className={`item ${activeItem.id === item.id && activeItem.type === (item.updatedAt ? 'chat' : 'teaching') ? 'active' : ''}`}
          onClick={() => handleItemClick(item)}
        >
          <div className="texts">
            <span>Topic: {item.title || item.topic}</span>
            <p>Description: {item.summary || item.description}</p>
            <p>Lesson#: {item.id}</p>
            <p>Audience: {item.audience}</p>
            <p>By: {item.created_by || 'Admin'}</p>
            <p>Date: {new Date( item.createdAt).toLocaleString()}</p>
          </div>
        </div>
        )
      }
        
})}
    </div>
  );
};

export default ListChats;