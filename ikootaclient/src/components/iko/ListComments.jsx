import React, { useEffect, useState } from 'react';
import SearchControls from '../search/SearchControls';
import { jwtDecode } from 'jwt-decode';
import './listcomments.css';
import { useFetchParentChatsAndTeachingsWithComments } from '../service/useFetchComments';

const ListComments = ({ setActiveItem, activeItem = {}, deactivateListChats }) => {
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
      (item.chat_title && item.chat_title.toLowerCase().includes(query.toLowerCase())) ||
      (item.teaching_title && item.teaching_title.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const handleItemClick = (item) => {
    deactivateListChats(); // Deactivate any active item in ListChats
    setActiveItem(item);
  };

  // Group comments by chat_id and teaching_id for easier rendering
  const groupCommentsByParent = () => {
    const groupedComments = {};
    fetchedData?.comments.forEach(comment => {
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

  return (
    <div className='listcomments_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>

      {fetchedData?.chats.length === 0 && fetchedData?.teachings.length === 0 && <p>No chats or teachings available</p>}
      
      {fetchedData?.chats.map((chat) => {
        const commentsForChat = groupedComments[chat.id] || [];
        
        return (
          <div key={chat.updatedAt} className={`chat-item ${activeItem?.updatedAt === chat.updatedAt ? 'active' : ''}`} onClick={() => handleItemClick(chat)}>
            <div className="texts">
              <span>Topic: {chat.title || 'No title'}</span>
              <p>Description: {chat.summary || 'No description'}</p>
              <p>Lesson#: {chat.id}</p>
              <p>Audience: {chat.audience || 'No audience'}</p>
              <p>Post By: {chat.created_by || 'Admin'}</p>
              <p>Date Posted: {new Date(chat.createdAt).toLocaleString()}</p>
              <p>Date Updated: {new Date(chat.updatedAt).toLocaleString()}</p>
            </div>

            {/* Render the comments for this chat */}
            {commentsForChat.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForChat.map((comment) => (
                  <div key={comment.updatedAt} className="comment-item">
                    <p>{comment.comment}</p>
                    <p>CreatedBy: {comment.user_id}</p>
                    <p>Date created: {new Date(comment.createdAt).toLocaleString()}</p>
                    <p>Date updated: {new Date(comment.updatedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this chat</p>
            )}
          </div>
        );
      })}

      {fetchedData?.teachings.map((teaching) => {
        const commentsForTeaching = groupedComments[teaching.id] || [];
        
        return (
          <div key={teaching.updatedAt} className={`teaching-item ${activeItem?.id === teaching.id ? 'active' : ''}`} onClick={() => handleItemClick(teaching)}>
            <div className="texts">
              <span>Topic: {teaching.topic || 'No topic'}</span>
              <p>Description: {teaching.description || 'No description'}</p>
              <p>Lesson#: {teaching.id}</p>
              <p>Audience: {teaching.audience || 'No audience'}</p>
              <p>Post By: {teaching.created_by || 'Admin'}</p>
              <p>Date Posted: {new Date(teaching.createdAt).toLocaleString()}</p>
              <p>Date Updated: {new Date(teaching.updatedAt).toLocaleString()}</p>
            </div>

            {/* Render the comments for this teaching */}
            {commentsForTeaching?.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForTeaching.map((comment) => (
                  <div key={comment?.updatedAt} className="comment-item">
                    <p>{comment?.comment}</p>
                    <p>CreatedBy: {comment.user_id}</p>
                    <p>Date created: {new Date(comment.createdAt).toLocaleString()}</p>
                    <p>Date updated: {new Date(comment.updatedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this teaching</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListComments;