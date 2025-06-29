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
  const [content, setContent] = useState([]); // Combined content from chats and teachings
  const [comments, setComments] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [chatsResponse, teachingsResponse, commentsResponse] = await Promise.all([
  //         api.get('/chats'),
  //         api.get('/teachings'),
  //         api.get('/comments/all') // Use the new endpoint
  //       ]);
  //       const chats = chatsResponse.data.map(chat => ({ ...chat, type: 'chat' }));
  //       const teachings = teachingsResponse.data.map(teaching => ({ ...teaching, type: 'teaching' }));
  //       const comments = commentsResponse.data;

  //       setChats(chats);
  //       setTeachings(teachings);
  //       setComments(comments);
  //       setFilteredItems([...chats, ...teachings]);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   fetchData();
  // }, []);


 useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
         console.log('Attempting to fetch combined content...');
        // Use the new combined endpoint
        const [contentResponse, commentsResponse] = await Promise.all([
          api.get('/chats/combinedcontent'),
          api.get('/comments/all')
        ]);
        
         console.log('Combined content response:', contentResponse);

        // Handle different response structures
        const contentData = contentResponse.data?.data || contentResponse.data || [];
        const commentsData = commentsResponse.data || [];

 console.log('Processed content data:', contentData);
        console.log('Comments data:', commentsData);



        setContent(contentData);
        setComments(commentsData);
        setFilteredItems(contentData);
      } catch (error) {
       console.error('Error fetching combined content:', error);
        setError('Failed to fetch combined content. Please try again later.');
       
        // Fallback to original method if new endpoint fails
        try {
          const [chatsResponse, teachingsResponse, commentsResponse] = await Promise.all([
            api.get('/chats'),
            api.get('/teachings'),
            api.get('/comments/all')
          ]);
          
          // const chats = chatsResponse.data.map(chat => ({ 
          //   ...chat, 
          //   content_type: 'chat',
          //   content_title: chat.title,
          //   prefixed_id: chat.prefixed_id || `c${chat.id}` // Fallback for old data
          // }));
          
          // const teachings = teachingsResponse.data.map(teaching => ({ 
          //   ...teaching, 
          //   content_type: 'teaching',
          //   content_title: teaching.topic,
          //   prefixed_id: teaching.prefixed_id || `t${teaching.id}` // Fallback for old data
          // }));
          
          // const combined = [...chats, ...teachings];

// Process and combine the data
          const chats = (chatsResponse.data || []).map(chat => ({ 
            ...chat, 
            content_type: 'chat',
            content_title: chat.title || 'Untitled Chat',
            prefixed_id: chat.prefixed_id || `c${chat.id}`,
            content_createdAt: chat.createdAt,
            content_updatedAt: chat.updatedAt
          }));
          
          const teachings = (teachingsResponse.data || []).map(teaching => ({ 
            ...teaching, 
            content_type: 'teaching',
            content_title: teaching.topic || 'Untitled Teaching',
            prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
            content_createdAt: teaching.createdAt,
            content_updatedAt: teaching.updatedAt
          }));
          
          const combined = [...chats, ...teachings];

  // Sort by update date
          combined.sort((a, b) => {
            const aDate = new Date(a.content_updatedAt || a.content_createdAt);
            const bDate = new Date(b.content_updatedAt || b.content_createdAt);
            return bDate - aDate;
          });
          


          setContent(combined);
          setComments(commentsResponse.data);
          setFilteredItems(combined);
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    };

    fetchData();
  }, []);


  // Group comments by chat_id and teaching_id for easier rendering
  // const groupCommentsByParent = () => {
  //   const groupedComments = {};
  //   comments.forEach(comment => {
  //     if (comment.chat_id) {
  //       if (!groupedComments[comment.chat_id]) {
  //         groupedComments[comment.chat_id] = [];
  //       }
  //       groupedComments[comment.chat_id].push(comment);
  //     } else if (comment.teaching_id) {
  //       if (!groupedComments[comment.teaching_id]) {
  //         groupedComments[comment.teaching_id] = [];
  //       }
  //       groupedComments[comment.teaching_id].push(comment);
  //     }
  //   });
  //   return groupedComments;
  // };

  // const groupedComments = groupCommentsByParent();

// Group comments by both numeric and prefixed IDs
  const groupCommentsByParent = () => {
    const groupedComments = {};

     if (!Array.isArray(comments)) {
      console.warn('Comments is not an array:', comments);
      return groupedComments;
    }
    
    comments.forEach(comment => {
      if (comment.chat_id) {
        // Support both numeric and prefixed grouping
        const chatKey = comment.chat_id;
        const prefixedKey = `c${comment.chat_id}`;
        
        if (!groupedComments[chatKey]) groupedComments[chatKey] = [];
        if (!groupedComments[prefixedKey]) groupedComments[prefixedKey] = [];
        
        groupedComments[chatKey].push(comment);
        groupedComments[prefixedKey].push(comment);
      }
      
      if (comment.teaching_id) {
        const teachingKey = comment.teaching_id;
        const prefixedKey = `t${comment.teaching_id}`;
        
        if (!groupedComments[teachingKey]) groupedComments[teachingKey] = [];
        if (!groupedComments[prefixedKey]) groupedComments[prefixedKey] = [];
        
        groupedComments[teachingKey].push(comment);
        groupedComments[prefixedKey].push(comment);
      }
    });
    
    return groupedComments;
  };

  const groupedComments = groupCommentsByParent();


  // const handleSearch = (query) => {
  //   const filtered = [...chats, ...teachings].filter(item =>
  //     (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
  //     (item.topic && item.topic.toLowerCase().includes(query.toLowerCase())) ||
  //     (item.summary && item.summary.toLowerCase().includes(query.toLowerCase())) ||
  //     (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
  //   );
  //   setFilteredItems(filtered);
  // };

  // const handleItemClick = (item) => {
  //   deactivateListComments(); // Deactivate any active item in ListComments
  //   setActiveItemState({ id: item.id, type: item.type });
  //   setActiveItem(item);
  // };

 
  const handleSearch = (query) => {
    if (!Array.isArray(content)) {
      console.warn('Content is not an array for search:', content);
      return;
    }
    
    const filtered = content.filter(item =>
      (item.content_title && item.content_title.toLowerCase().includes(query.toLowerCase())) ||
      (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
      (item.topic && item.topic.toLowerCase().includes(query.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(query.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
      (item.prefixed_id && item.prefixed_id.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredItems(filtered);
  };

  const handleItemClick = (item) => {
    if (deactivateListComments) deactivateListComments();
    
    setActiveItemState({ 
      id: item.prefixed_id || item.id, 
      type: item.content_type || item.type
    });
    
    if (setActiveItem) setActiveItem(item);
  };



  // Helper function to safely get content title
  const getContentTitle = (item) => {
    return item?.content_title || item?.title || item?.topic || 'Untitled';
  };

  // Helper function to safely get creation date
  const getCreationDate = (item) => {
    const dateStr = item?.content_createdAt || item?.createdAt || item?.createdAt;
    if (!dateStr) return 'Unknown date';
    
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };


  
  // if (loading) {
  //   return (
  //     <div className='listchats_container' style={{border:"3px solid brown"}}>
  //       <div className="loading-message">
  //         <p>Loading content...</p>
  //       </div>
  //     </div>
  //   );
  // }


  //  if (error) {
  //   return (
  //     <div className='listchats_container' style={{border:"3px solid brown"}}>
  //       <div className="error-message">
  //         <p style={{color: 'red'}}>{error}</p>
  //         <button onClick={() => window.location.reload()}>Retry</button>
  //       </div>
  //     </div>
  //   );
  // }

//   return (
//     <div className='listchats_container' style={{border:"3px solid brown"}}>
//       <div className="search">
//         <div className="searchbar">
//           <img src="./search.png" alt="" />
//           <SearchControls onSearch={handleSearch} />
//         </div>
//         <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//       </div>

//       {filteredItems.length === 0 && <p>No chats or teachings available</p>}
      
//       {filteredItems.map((item) => {
//         const commentsForItem = groupedComments[item.id] || [];
        
//         return (
//           <div key={item.updatedAt} className={`item ${activeItem?.id === item.id ? 'active' : ''}`} onClick={() => handleItemClick(item)}>
//             <div className="texts">
//               <span>Topic: {item.title || item.topic}</span>
//               {/* <p>Description: {item.summary || item.description}</p> */}
//               <p>Lesson#: {item.id}</p>
//               <p>Audience: {item.audience}</p>
//               <p>By: {item.created_by || 'Admin'}</p>
//               <p>Date: {new Date(item.createdAt).toLocaleString()}</p>
//             </div>

//             {/* Render the comments for this item */}
//             {commentsForItem.length > 0 ? (
//               <div className="comments">
//                 <h4>Comments:</h4>
//                 {commentsForItem.map((comment) => (
//                   <div key={comment.id} className="comment-item">
//                     {/* <p>{comment.comment}</p> */}
//                     <p>CreatedBy: {comment.user_id}</p>
//                     <p>Date created: {new Date(comment.createdAt).toLocaleString()}</p>
//                     <p>Date updated: {new Date(comment.updatedAt).toLocaleString()}</p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p>No comments for id# {item.id} {item.type}</p>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default ListChats;



  return (
    <div className='listchats_container' style={{border:"3px solid brown"}}>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img 
          src={addMode ? "./minus.png" : "./plus.png"} 
          alt="" 
          className='add' 
          onClick={() => setAddMode(!addMode)} 
        />
      </div>

      {!Array.isArray(filteredItems) || filteredItems.length === 0 && <p>No content available</p>}
      
      {filteredItems.map((item) => {
        // Use prefixed_id for comment lookup, fallback to numeric id
        const itemKey = item.prefixed_id || item.id;
        const commentsForItem = groupedComments[itemKey] || groupedComments[item.id] || [];
        
          // Create a unique key for the item
          const uniqueKey = item.prefixed_id || `${item.content_type || 'item'}-${item.id}` || `item-${index}`;
          
        return (
          <div 
            key={item.prefixed_id || `${item.content_type}-${item.id}`} 
            className={`item ${activeItem?.prefixed_id === item.prefixed_id ? 'active' : ''}`} 
            onClick={() => handleItemClick(item)}
          >
            <div className="texts">
              
              <span className="content-type-badge">{item.content_type}</span>
              <span className="content-id">{item.prefixed_id || `${item.content_type[0]}${item.id}`}</span>
              <span>Topic: {item.content_title}</span>
              <p>Lesson#: {item.prefixed_id || item.id}</p>
              <p>Audience: {item.audience}</p>
              <p>By: {item.user_id || item.created_by || 'Admin'}</p>
              <p>Date: {new Date(item.createdAt || item.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Render the comments for this item */}
            {commentsForItem && commentsForItem.length > 0 ? (
              <div className="comments">
                <h4>Comments ({commentsForItem.length}):</h4>
                {commentsForItem.slice(0, 2).map((comment, commentIndex) => (
                  <div key={comment.id || `comment-${commentIndex}`} className="comment-item">
                    <p>By: {comment.user_id || 'Unknown'}</p>
                    <p>Created: {new Date(comment.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                     {commentsForItem.length > 2 && (
                    <p className="more-comments">+{commentsForItem.length - 2} more comments</p>
                  )}

              </div>
            ) : (

              <div>
                <p>No comments for {item.prefixed_id || `${item.content_type} #${item.id}`}</p>
                {/* <p className="no-comments">
                  No comments for {getContentIdentifier(item)}
                </p> */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListChats;