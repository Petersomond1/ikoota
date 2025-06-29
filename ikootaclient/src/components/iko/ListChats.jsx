import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import './listchats.css';
import api from '../service/api';

const ListChats = ({ setActiveItem, deactivateListComments }) => {
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });
  const [content, setContent] = useState([]);
  const [comments, setComments] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching combined content...');
        
        const [contentResponse, commentsResponse] = await Promise.all([
          api.get('/chats/combinedcontent'),
          api.get('/comments/all')
        ]);
        
        console.log('Combined content response:', contentResponse);

        const contentData = contentResponse.data?.data || contentResponse.data || [];
        const commentsData = commentsResponse.data || [];

        console.log('Processed content data:', contentData);
        console.log('Comments data:', commentsData);

        // Clean and normalize the data
        const cleanedContent = contentData.map(item => ({
          ...item,
          // Normalize content properties
          content_title: item.content_title || item.title || item.topic || 'Untitled',
          content_type: item.content_type || (item.title ? 'chat' : 'teaching'),
          audience: item.audience === 'undefined' ? '' : item.audience,
          summary: item.summary?.startsWith('undefined') ? 
            item.summary.replace('undefined', '').trim() : item.summary,
          // Ensure consistent date fields
          display_date: item.updatedAt || item.createdAt,
          // Create fallback prefixed_id if missing
          prefixed_id: item.prefixed_id || `${item.content_type?.[0] || 'c'}${item.id}`
        }));

        setContent(cleanedContent);
        setComments(commentsData);
        setFilteredItems(cleanedContent);
      } catch (error) {
        console.error('Error fetching combined content:', error);
        setError('Failed to fetch content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enhanced comment grouping with better error handling
  const groupCommentsByParent = () => {
    const groupedComments = {};

    if (!Array.isArray(comments)) {
      console.warn('Comments is not an array:', comments);
      return groupedComments;
    }
    
    comments.forEach(comment => {
      try {
        if (comment.chat_id) {
          const keys = [comment.chat_id, `c${comment.chat_id}`];
          keys.forEach(key => {
            if (!groupedComments[key]) groupedComments[key] = [];
            groupedComments[key].push(comment);
          });
        }
        
        if (comment.teaching_id) {
          const keys = [comment.teaching_id, `t${comment.teaching_id}`];
          keys.forEach(key => {
            if (!groupedComments[key]) groupedComments[key] = [];
            groupedComments[key].push(comment);
          });
        }
      } catch (err) {
        console.warn('Error grouping comment:', comment, err);
      }
    });
    
    return groupedComments;
  };

  const groupedComments = groupCommentsByParent();

  const handleSearch = (query) => {
    if (!Array.isArray(content)) {
      console.warn('Content is not an array for search:', content);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = content.filter(item => {
      const searchFields = [
        item.content_title,
        item.title,
        item.topic,
        item.summary,
        item.description,
        item.prefixed_id,
        item.subjectMatter,
        item.audience
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(lowercaseQuery)
      );
    });
    
    setFilteredItems(filtered);
  };

  const handleItemClick = (item) => {
    try {
      if (deactivateListComments) deactivateListComments();
      
      const itemData = {
        id: item.prefixed_id || item.id,
        type: item.content_type || (item.title ? 'chat' : 'teaching'),
        prefixed_id: item.prefixed_id,
        ...item
      };
      
      setActiveItemState(itemData);
      if (setActiveItem) setActiveItem(itemData);
    } catch (error) {
      console.error('Error handling item click:', error);
    }
  };

  // Helper functions
  const getContentTitle = (item) => {
    return item?.content_title || item?.title || item?.topic || 'Untitled';
  };

  const getCreationDate = (item) => {
    const dateStr = item?.display_date || item?.createdAt;
    if (!dateStr) return 'Unknown date';
    
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getContentIdentifier = (item) => {
    return item?.prefixed_id || `${item?.content_type?.[0] || 'c'}${item?.id}`;
  };

  if (loading) {
    return (
      <div className='listchats_container' style={{border:"3px solid brown"}}>
        <div className="loading-message">
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='listchats_container' style={{border:"3px solid brown"}}>
        <div className="error-message">
          <p style={{color: 'red'}}>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className='listchats_container' style={{border:"3px solid brown"}}>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="Search" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img 
          src={addMode ? "./minus.png" : "./plus.png"} 
          alt="Toggle" 
          className='add' 
          onClick={() => setAddMode(!addMode)} 
        />
      </div>

      {!Array.isArray(filteredItems) || filteredItems.length === 0 ? (
        <p>No content available</p>
      ) : (
        filteredItems.map((item, index) => {
          const itemKey = item.prefixed_id || item.id;
          const commentsForItem = groupedComments[itemKey] || groupedComments[item.id] || [];
          const uniqueKey = item.prefixed_id || `${item.content_type || 'item'}-${item.id}-${index}`;
          
          return (
            <div 
              key={uniqueKey}
              className={`item ${activeItem?.prefixed_id === item.prefixed_id ? 'active' : ''}`} 
              onClick={() => handleItemClick(item)}
            >
              <div className="texts">
                <div className="item-header">
                  <span className="content-type-badge">{item.content_type}</span>
                  <span className="content-id">{getContentIdentifier(item)}</span>
                </div>
                
                <span className="content-title">Title: {getContentTitle(item)}</span>
                <p>Lesson#: {item.lessonNumber || item.id}</p>
                <p>Audience: {item.audience || 'General'}</p>
                <p>By: {item.user_id || item.created_by || 'Admin'}</p>
                <p>Date: {getCreationDate(item)}</p>
                
                {item.subjectMatter && (
                  <p>Subject: {item.subjectMatter}</p>
                )}
              </div>

              {/* Comments Preview */}
              <div className="comments-preview">
                {commentsForItem && commentsForItem.length > 0 ? (
                  <div className="comments">
                    <h4>Comments ({commentsForItem.length}):</h4>
                    {commentsForItem.slice(0, 2).map((comment, commentIndex) => (
                      <div key={comment.id || `comment-${commentIndex}`} className="comment-item">
                        <p>By: {comment.user_id || 'Unknown'}</p>
                        <p>Created: {new Date(comment.createdAt).toLocaleDateString()}</p>
                        {comment.comment && comment.comment.length > 50 ? (
                          <p>"{comment.comment.substring(0, 50)}..."</p>
                        ) : (
                          <p>"{comment.comment}"</p>
                        )}
                      </div>
                    ))}
                    {commentsForItem.length > 2 && (
                      <p className="more-comments">+{commentsForItem.length - 2} more comments</p>
                    )}
                  </div>
                ) : (
                  <div className="no-comments">
                    <p>No comments for {getContentIdentifier(item)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListChats;