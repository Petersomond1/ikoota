import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import './listchats.css';
import api from '../service/api';
import { useFetchAllComments } from '../service/useFetchComments';

const ListChats = ({ setActiveItem, deactivateListComments }) => {
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });
  const [chats, setChats] = useState([]);
  const [teachings, setTeachings] = useState([]);
  const [comments, setComments] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chatsResponse, teachingsResponse, commentsResponse] = await Promise.all([
          api.get('/chats'),
          api.get('/teachings'),
          api.get('/comments/all') // Use the new endpoint
        ]);
        const chats = chatsResponse.data.map(chat => ({ ...chat, type: 'chat' }));
        const teachings = teachingsResponse.data.map(teaching => ({ ...teaching, type: 'teaching' }));
        const comments = commentsResponse.data;

        setChats(chats);
        setTeachings(teachings);
        setComments(comments);
        setFilteredItems([...chats, ...teachings]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Group comments by chat_id and teaching_id for easier rendering
  const groupCommentsByParent = () => {
    const groupedComments = {};
    comments.forEach(comment => {
      if (comment.chat_id) {
        if (!groupedComments[comment.chat_id]) {
          groupedComments[comment.chat_id] = [];
        }
        groupedComments[comment.chat_id].push(comment);
      } else if (comment.teaching_id) {
        if (!groupedComments[comment.teaching_id]) {
          groupedComments[comment.teaching_id] = [];
        }
        groupedComments[comment.teaching_id].push(comment);
      }
    });
    return groupedComments;
  };

  const groupedComments = groupCommentsByParent();

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
    deactivateListComments(); // Deactivate any active item in ListComments
    setActiveItemState({ id: item.id, type: item.type });
    setActiveItem(item);
  };

  return (
    <div className='listchats_container' style={{border:"3px solid brown"}}>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>

      {filteredItems.length === 0 && <p>No chats or teachings available</p>}
      
      {filteredItems.map((item) => {
        const commentsForItem = groupedComments[item.id] || [];
        
        return (
          <div key={item.updatedAt} className={`item ${activeItem?.id === item.id ? 'active' : ''}`} onClick={() => handleItemClick(item)}>
            <div className="texts">
              <span>Topic: {item.title || item.topic}</span>
              {/* <p>Description: {item.summary || item.description}</p> */}
              <p>Lesson#: {item.id}</p>
              <p>Audience: {item.audience}</p>
              <p>By: {item.created_by || 'Admin'}</p>
              <p>Date: {new Date(item.createdAt).toLocaleString()}</p>
            </div>

            {/* Render the comments for this item */}
            {commentsForItem.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForItem.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    {/* <p>{comment.comment}</p> */}
                    <p>CreatedBy: {comment.user_id}</p>
                    <p>Date created: {new Date(comment.created_at).toLocaleString()}</p>
                    <p>Date updated: {new Date(comment.updatedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for id# {item.id} {item.type}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListChats;