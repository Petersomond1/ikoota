import React, { useEffect, useState } from 'react';
import SearchControls from '../search/SearchControls';
import { jwtDecode } from 'jwt-decode';
import './listcomments.css';
import { useFetchParentChatsAndTeachingsWithComments } from '../service/useFetchComments';

const ListComments = ({ setActiveItem, activeItem = {} }) => {
  const [addMode, setAddMode] = useState(false);
  const [user_id, setUserId] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

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

  const { data: fetchedData, isLoading: isLoadingComments } = useFetchParentChatsAndTeachingsWithComments(user_id);
  console.log("this is the data from list comment component ", fetchedData);

  const handleSearch = (query) => {
    const filtered = fetchedData?.comments.filter(item =>
      (item.comment && item.comment.toLowerCase().includes(query.toLowerCase())) || 
      (item.chat_title && item.chat_title.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const handleItemClick = (id, type) => {
    setActiveItem({ id, type });
  };

  // Group comments by chat_id for easier rendering
  const groupCommentsByChat = () => {
    const groupedComments = {};
    fetchedData?.comments.forEach(comment => {
      if (!groupedComments[comment.chat_id]) {
        groupedComments[comment.chat_id] = [];
      }
      groupedComments[comment.chat_id].push(comment);
    });
    return groupedComments;
  };

  const groupedComments = groupCommentsByChat();

  return (
    <div className='listcomments_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>

      {fetchedData?.chats.length === 0 && <p>No chats available</p>}
      {fetchedData?.chats.map((chat) => {
        const commentsForChat = groupedComments[chat.id] || [];
        
        return (
          <div key={chat.id} className={`chat-item ${activeItem?.id === chat.id ? 'active' : ''}`} onClick={() => handleItemClick(chat.id, 'chat')}>
            <div className="texts">
              <span>Topic: {chat.title || 'No title'}</span>
              <p>Description: {chat.summary || 'No description'}</p>
              <p>Lesson#: {chat.id}</p>
              <p>Audience: {chat.audience || 'No audience'}</p>
              <p>By: {chat.created_by || 'Admin'}</p>
              <p>Date: {new Date(chat.updatedAt).toLocaleString()}</p>
            </div>

            {/* Render the comments for this chat */}
            {commentsForChat.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForChat.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <p>{comment.comment}</p>
                    <p>By: {comment.user_id}</p>
                    <p>Date: {new Date(comment.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this chat</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListComments;
