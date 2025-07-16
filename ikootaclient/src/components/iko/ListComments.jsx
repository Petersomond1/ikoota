//ikootaclient\src\components\iko\ListComments.jsx
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
    try {
      const token = localStorage.getItem("token");
      if (token) {
        setUserId(jwtDecode(token).user_id);
      } else {
        const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
        if (tokenCookie) {
          setUserId(jwtDecode(tokenCookie.split("=")[1]).user_id);
        } else {
          console.error("Access token not found");
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);

  const { data: fetchedData, isLoading: isLoadingComments, error } = useFetchParentChatsAndTeachingsWithComments(user_id);
  console.log("this is the data from list comment component ", fetchedData);

  const handleSearch = (query) => {
    if (!fetchedData?.comments || !Array.isArray(fetchedData.comments)) {
      setFilteredData([]);
      return;
    }

    const filtered = fetchedData.comments.filter(item =>
      (item.comment && item.comment.toLowerCase().includes(query.toLowerCase())) || 
      (item.chat_title && item.chat_title.toLowerCase().includes(query.toLowerCase())) ||
      (item.teaching_title && item.teaching_title.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const handleItemClick = (item) => {
    if (deactivateListChats) deactivateListChats();
    setActiveItem(item);
  };

  // Group comments by chat_id and teaching_id for easier rendering
  const groupCommentsByParent = () => {
    const groupedComments = {};
    
    // Check if fetchedData and comments exist and is an array
    if (!fetchedData?.comments || !Array.isArray(fetchedData.comments)) {
      console.warn('No comments available or comments is not an array:', fetchedData?.comments);
      return groupedComments;
    }

    fetchedData.comments.forEach(comment => {
      try {
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
      } catch (err) {
        console.warn('Error processing comment:', comment, err);
      }
    });
    
    return groupedComments;
  };

  // Loading state
  if (isLoadingComments) {
    return (
      <div className='listcomments_container'>
        <div className="loading-message">
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='listcomments_container'>
        <div className="error-message">
          <p style={{color: 'red'}}>Error loading comments: {error.message}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!fetchedData) {
    return (
      <div className='listcomments_container'>
        <div className="search">
          <div className="searchbar">
            <img src="./search.png" alt="" />
            <SearchControls onSearch={handleSearch} />
          </div>
          <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
        </div>
        <p>No data available</p>
      </div>
    );
  }

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

      {(!fetchedData?.chats || fetchedData.chats.length === 0) && 
       (!fetchedData?.teachings || fetchedData.teachings.length === 0) && 
       <p>No chats or teachings available</p>}
      
      {/* Render Chats */}
      {fetchedData?.chats && Array.isArray(fetchedData.chats) && fetchedData.chats.map((chat) => {
        const commentsForChat = groupedComments[chat.id] || [];
        
        return (
          <div key={chat.updatedAt || chat.id} className={`chat-item ${activeItem?.updatedAt === chat.updatedAt ? 'active' : ''}`} onClick={() => handleItemClick(chat)}>
            <div className="texts">
              <span>Topic: {chat.title || 'No title'}</span>
              <p>Description: {chat.summary || 'No description'}</p>
              <p>Lesson#: {chat.id}</p>
              <p>Audience: {chat.audience || 'No audience'}</p>
              <p>Post By: {chat.created_by || 'Admin'}</p>
              <p>Date Posted: {chat.createdAt ? new Date(chat.createdAt).toLocaleString() : 'Unknown date'}</p>
              <p>Date Updated: {chat.updatedAt ? new Date(chat.updatedAt).toLocaleString() : 'Unknown date'}</p>
            </div>

            {/* Render the comments for this chat */}
            {commentsForChat.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForChat.map((comment) => (
                  <div key={comment.updatedAt || comment.id} className="comment-item">
                    <p>{comment.comment}</p>
                    <p>CreatedBy: {comment.user_id}</p>
                    <p>Date created: {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}</p>
                    <p>Date updated: {comment.updatedAt ? new Date(comment.updatedAt).toLocaleString() : 'Unknown date'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this chat</p>
            )}
          </div>
        );
      })}

      {/* Render Teachings */}
      {fetchedData?.teachings && Array.isArray(fetchedData.teachings) && fetchedData.teachings.map((teaching) => {
        const commentsForTeaching = groupedComments[teaching.id] || [];
        
        return (
          <div key={teaching.updatedAt || teaching.id} className={`teaching-item ${activeItem?.id === teaching.id ? 'active' : ''}`} onClick={() => handleItemClick(teaching)}>
            <div className="texts">
              <span>Topic: {teaching.topic || 'No topic'}</span>
              <p>Description: {teaching.description || 'No description'}</p>
              <p>Lesson#: {teaching.id}</p>
              <p>Audience: {teaching.audience || 'No audience'}</p>
              <p>Post By: {teaching.created_by || 'Admin'}</p>
              <p>Date Posted: {teaching.createdAt ? new Date(teaching.createdAt).toLocaleString() : 'Unknown date'}</p>
              <p>Date Updated: {teaching.updatedAt ? new Date(teaching.updatedAt).toLocaleString() : 'Unknown date'}</p>
            </div>

            {/* Render the comments for this teaching */}
            {commentsForTeaching && commentsForTeaching.length > 0 ? (
              <div className="comments">
                <h4>Comments:</h4>
                {commentsForTeaching.map((comment) => (
                  <div key={comment?.updatedAt || comment?.id} className="comment-item">
                    <p>{comment?.comment}</p>
                    <p>CreatedBy: {comment.user_id}</p>
                    <p>Date created: {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}</p>
                    <p>Date updated: {comment.updatedAt ? new Date(comment.updatedAt).toLocaleString() : 'Unknown date'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this teaching</p>
            )}
          </div>
        );
      })}

      {/* Show filtered comments if search is active */}
      {filteredData.length > 0 && (
        <div className="filtered-comments">
          <h3>Search Results ({filteredData.length} comments)</h3>
          {filteredData.map((comment, index) => (
            <div key={comment.id || index} className="comment-search-result">
              <div className="comment-content">
                <p>"{comment.comment}"</p>
                <div className="comment-details">
                  <span>By: {comment.user_id}</span>
                  <span>Created: {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}</span>
                  <span>
                    On: {comment.chat_title ? `Chat - ${comment.chat_title}` : 
                         comment.teaching_title ? `Teaching - ${comment.teaching_title}` : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListComments;