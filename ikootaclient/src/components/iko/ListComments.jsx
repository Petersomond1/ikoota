//ikootaclient\src\components\iko\ListComments.jsx - FIXED for active content comments only, oldest first
import React, { useEffect, useState } from 'react';
import SearchControls from '../search/SearchControls';
import { jwtDecode } from 'jwt-decode';
import './listcomments.css';
import api from '../service/api';

const ListComments = ({ activeItem, setActiveComment, activeComment, deactivateListChats }) => {
  const [addMode, setAddMode] = useState(false);
  const [user_id, setUserId] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ FIXED: Use same state approach as ListChats.jsx
  const [allComments, setAllComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

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

  // ✅ FIXED: Fetch comments using same approach as ListChats.jsx
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoadingComments(true);
      setCommentsError(null);
      
      try {
        console.log('🔄 Fetching comments...');
        const commentsResponse = await api.get('/content/comments/all');
        const commentsData = commentsResponse.data?.data || commentsResponse.data || [];
        console.log('✅ Comments loaded successfully:', commentsData.length);
        setAllComments(commentsData);
      } catch (error) {
        console.warn('⚠️ Comments failed to load:', error.message);
        setCommentsError(error);
        setAllComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };
    
    fetchComments();
  }, []);

  // ✅ NEW: Get comments for active content only, ordered oldest first
  const getCommentsForActiveContent = () => {
    if (!activeItem || !Array.isArray(allComments)) {
      return [];
    }

    const contentId = activeItem.id;
    const contentType = activeItem.content_type || activeItem.type;

    console.log('🔍 Filtering comments for:', { contentId, contentType });

    const filteredComments = allComments.filter(comment => {
      if (contentType === "chat") {
        return comment.chat_id == contentId;
      } else if (contentType === "teaching") {
        return comment.teaching_id == contentId;
      }
      return false;
    });

    // ✅ CRITICAL: Sort by timestamp - OLDEST FIRST (ascending order)
    const sortedComments = filteredComments.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      return dateA - dateB; // Ascending order (oldest first)
    });

    console.log('✅ Comments for active content (oldest first):', sortedComments.length);
    return sortedComments;
  };

  const commentsForActiveContent = getCommentsForActiveContent();

  // ✅ NEW: Set default active comment (oldest comment) when content changes
  useEffect(() => {
    if (commentsForActiveContent.length > 0 && !activeComment) {
      const oldestComment = commentsForActiveContent[0]; // First comment is oldest due to sorting
      console.log('✅ Setting default active comment (oldest):', oldestComment);
      setActiveComment(oldestComment);
    } else if (commentsForActiveContent.length === 0) {
      // Clear active comment if no comments for this content
      setActiveComment(null);
    }
  }, [activeItem, commentsForActiveContent, activeComment, setActiveComment]);

  console.log("🔍 ListComments - Active Item:", activeItem);
  console.log("🔍 ListComments - Comments for active content:", commentsForActiveContent.length);
  console.log("🔍 ListComments - Active Comment:", activeComment);

  // ✅ FIXED: Enhanced search function - search within active content comments only
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!Array.isArray(commentsForActiveContent)) {
      setFilteredData([]);
      return;
    }

    if (!query || query.trim() === '') {
      setFilteredData([]);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = commentsForActiveContent.filter(comment => {
      // Search across all possible comment fields
      const searchFields = [
        comment.comment,
        comment.content,
        comment.text,
        comment.user_id,
        comment.username,
        comment.author,
        `${comment.id}`, // Convert to string for search
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(lowercaseQuery)
      );
    });
    
    console.log(`🔍 Search for "${query}" found ${filtered.length} comments`);
    setFilteredData(filtered);
  };

  // ✅ FIXED: Enhanced item click handler
  const handleItemClick = (comment) => {
    try {
      console.log('✅ Comment selected in ListComments:', comment);
      setActiveComment(comment);
    } catch (error) {
      console.error('❌ Error handling comment click:', error);
    }
  };

  // ✅ Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getCommentText = (comment) => {
    const text = comment.comment || comment.content || comment.text || 'No content';
    return text.length > 100 ? `${text.substring(0, 100)}...` : text;
  };

  const getCommentAuthor = (comment) => {
    return comment.author || comment.user_id || comment.username || 'Unknown User';
  };

  // Loading state
  if (isLoadingComments) {
    return (
      <div className='listcomments_container' style={{border:"3px solid purple"}}>
        <div className="loading-message" style={{padding: '20px', textAlign: 'center'}}>
          <p>🔄 Loading comments...</p>
          <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
            Fetching comments...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (commentsError) {
    return (
      <div className='listcomments_container' style={{border:"3px solid purple"}}>
        <div className="error-message" style={{padding: '20px', textAlign: 'center'}}>
          <h4 style={{color: 'red', marginBottom: '10px'}}>Error Loading Comments</h4>
          <p style={{color: 'red', marginBottom: '15px'}}>Error: {commentsError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // No active content state
  if (!activeItem) {
    return (
      <div className='listcomments_container' style={{border:"3px solid purple"}}>
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
        <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
          <p>📄 Select content from the left to view comments</p>
          <p style={{fontSize: '0.8em', marginTop: '5px'}}>
            Comments for the selected content will appear here
          </p>
        </div>
      </div>
    );
  }

  const displayComments = searchQuery && filteredData.length > 0 ? filteredData : commentsForActiveContent;

  return (
    <div className='listcomments_container' style={{border:"3px solid purple"}}>
      {/* Search Header */}
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

      {/* Stats Bar */}
      <div style={{
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>
          📄 {activeItem.title || activeItem.topic || 'Selected Content'}
        </div>
        <div>
          Comments: {commentsForActiveContent.length} | 
          {searchQuery && ` Search Results: ${filteredData.length} |`} 
          Order: Oldest First
        </div>
      </div>

      {/* Comments List */}
      {displayComments.length === 0 ? (
        <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
          <p>💬 {searchQuery ? `No comments found for "${searchQuery}"` : 'No comments for this content yet'}</p>
          <p style={{fontSize: '0.8em', marginTop: '5px'}}>
            {!searchQuery && 'Be the first to comment on this content!'}
          </p>
        </div>
      ) : (
        <div className="comments-list">
          {/* Header showing content context */}
          <div className="content-context" style={{
            padding: '8px 12px',
            backgroundColor: activeItem.content_type === 'chat' ? '#e3f2fd' : '#e8f5e8',
            borderBottom: '2px solid #ddd',
            fontSize: '12px'
          }}>
            <span className="content-type-badge" style={{
              backgroundColor: activeItem.content_type === 'chat' ? '#007bff' : '#28a745',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              marginRight: '8px'
            }}>
              {(activeItem.content_type || activeItem.type || 'content').toUpperCase()}
            </span>
            <span style={{fontWeight: 'bold'}}>
              {activeItem.title || activeItem.topic || 'Content'}
            </span>
            <div style={{marginTop: '4px', color: '#666'}}>
              {displayComments.length} comment{displayComments.length !== 1 ? 's' : ''} 
              {searchQuery ? ' (filtered)' : ' (oldest first)'}
            </div>
          </div>

          {/* Comments List - Oldest First */}
          {displayComments.map((comment, index) => (
            <div 
              key={comment.id || `comment-${index}`} 
              className={`comment-item ${activeComment?.id === comment.id ? 'active' : ''}`} 
              onClick={() => handleItemClick(comment)}
              style={{
                cursor: 'pointer',
                padding: '12px',
                borderBottom: '1px solid #eee',
                backgroundColor: activeComment?.id === comment.id ? '#fff3e0' : 'white',
                borderLeft: activeComment?.id === comment.id ? '4px solid #ff9800' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="comment-header" style={{marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div className="comment-author" style={{fontWeight: 'bold', fontSize: '13px', color: '#2c3e50'}}>
                  👤 {getCommentAuthor(comment)}
                </div>
                <div className="comment-position" style={{fontSize: '10px', color: '#9e9e9e', textAlign: 'right'}}>
                  #{index + 1}
                  {activeComment?.id === comment.id && (
                    <div style={{color: '#ff9800', fontWeight: 'bold'}}>SELECTED</div>
                  )}
                </div>
              </div>
              
              <div className="comment-content" style={{marginBottom: '8px'}}>
                <p style={{margin: 0, fontSize: '13px', lineHeight: '1.4', color: '#333'}}>
                  💬 "{getCommentText(comment)}"
                </p>
              </div>
              
              <div className="comment-meta" style={{fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>📅 {formatDate(comment.createdAt || comment.created_at)}</span>
                <div>
                  {comment.id && <span>🆔 {comment.id}</span>}
                  {/* Show media indicators */}
                  {(comment.media_url1 || comment.media_url2 || comment.media_url3) && (
                    <span style={{marginLeft: '8px', color: '#4caf50'}}>📎</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search results info */}
      {searchQuery && filteredData.length === 0 && commentsForActiveContent.length > 0 && (
        <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
          <p>🔍 No comments found for "{searchQuery}"</p>
          <p style={{fontSize: '0.8em', marginTop: '5px'}}>
            Try different search terms. Showing {commentsForActiveContent.length} total comments for this content.
          </p>
        </div>
      )}
    </div>
  );
};

export default ListComments;














// //ikootaclient\src\components\iko\ListComments.jsx - FIXED VERSION using ListChats.jsx approach
// import React, { useEffect, useState } from 'react';
// import SearchControls from '../search/SearchControls';
// import { jwtDecode } from 'jwt-decode';
// import './listcomments.css';
// import api from '../service/api'; // ✅ FIXED: Use direct API call like ListChats.jsx

// const ListComments = ({ setActiveItem, activeItem = {}, deactivateListChats }) => {
//   const [addMode, setAddMode] = useState(false);
//   const [user_id, setUserId] = useState(null);
//   const [filteredData, setFilteredData] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // ✅ FIXED: Use same state approach as ListChats.jsx
//   const [allComments, setAllComments] = useState([]);
//   const [isLoadingComments, setIsLoadingComments] = useState(false);
//   const [commentsError, setCommentsError] = useState(null);

//   useEffect(() => {
//     try {
//       const token = localStorage.getItem("token");
//       if (token) {
//         setUserId(jwtDecode(token).user_id);
//       } else {
//         const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//         if (tokenCookie) {
//           setUserId(jwtDecode(tokenCookie.split("=")[1]).user_id);
//         } else {
//           console.error("Access token not found");
//         }
//       }
//     } catch (error) {
//       console.error("Error decoding token:", error);
//     }
//   }, []);

//   // ✅ FIXED: Use same comment fetching approach as ListChats.jsx
//   useEffect(() => {
//     const fetchComments = async () => {
//       setIsLoadingComments(true);
//       setCommentsError(null);
      
//       try {
//         console.log('🔄 Fetching comments...');
//         const commentsResponse = await api.get('/content/comments/all');
//         const commentsData = commentsResponse.data?.data || commentsResponse.data || [];
//         console.log('✅ Comments loaded successfully:', commentsData.length);
//         setAllComments(commentsData);
//       } catch (error) {
//         console.warn('⚠️ Comments failed to load:', error.message);
//         setCommentsError(error);
//         setAllComments([]);
//       } finally {
//         setIsLoadingComments(false);
//       }
//     };
    
//     fetchComments();
//   }, []);

//   console.log("🔍 ListComments - All comments:", allComments.length);

//   // ✅ FIXED: Use same comment grouping approach as ListChats.jsx
//   const groupCommentsByParent = () => {
//     const groupedComments = {};

//     if (!Array.isArray(allComments)) {
//       console.warn('Comments is not an array:', allComments);
//       return groupedComments;
//     }
    
//     allComments.forEach(comment => {
//       try {
//         // Create multiple keys for each comment to handle different ID formats
//         const keys = [];
        
//         if (comment.chat_id) {
//           keys.push(comment.chat_id);
//           keys.push(`c${comment.chat_id}`);
//           keys.push(`chat-${comment.chat_id}`);
//         }
        
//         if (comment.teaching_id) {
//           keys.push(comment.teaching_id);
//           keys.push(`t${comment.teaching_id}`);
//           keys.push(`teaching-${comment.teaching_id}`);
//         }

//         // Add comment to all relevant keys
//         keys.forEach(key => {
//           if (!groupedComments[key]) groupedComments[key] = [];
//           groupedComments[key].push(comment);
//         });
//       } catch (err) {
//         console.warn('Error grouping comment:', comment, err);
//       }
//     });
    
//     console.log('✅ Grouped comments keys:', Object.keys(groupedComments));
//     return groupedComments;
//   };

//   // ✅ FIXED: Enhanced search function with same approach as ListChats.jsx
//   const handleSearch = (query) => {
//     setSearchQuery(query);
    
//     if (!Array.isArray(allComments)) {
//       setFilteredData([]);
//       return;
//     }

//     if (!query || query.trim() === '') {
//       setFilteredData([]);
//       return;
//     }

//     const lowercaseQuery = query.toLowerCase();
//     const filtered = allComments.filter(comment => {
//       // Search across all possible comment fields
//       const searchFields = [
//         comment.comment,
//         comment.content,
//         comment.text,
//         comment.chat_title,
//         comment.teaching_title,
//         comment.user_id,
//         comment.username,
//         comment.author,
//         `${comment.chat_id}`, // Convert to string for search
//         `${comment.teaching_id}`, // Convert to string for search
//       ];
      
//       return searchFields.some(field => 
//         field && field.toString().toLowerCase().includes(lowercaseQuery)
//       );
//     });
    
//     console.log(`🔍 Search for "${query}" found ${filtered.length} comments`);
//     setFilteredData(filtered);
//   };

//   // ✅ FIXED: Enhanced item click handler - same approach as ListChats.jsx
//   const handleItemClick = (comment) => {
//     try {
//       if (deactivateListChats) deactivateListChats();
      
//       // Create an activeItem object that represents the comment's parent content
//       const parentItem = {
//         id: comment.chat_id || comment.teaching_id,
//         type: comment.chat_id ? 'chat' : 'teaching',
//         prefixed_id: comment.chat_id ? `c${comment.chat_id}` : `t${comment.teaching_id}`,
//         title: comment.chat_title || comment.teaching_title || 'Unknown Title',
//         content_type: comment.chat_id ? 'chat' : 'teaching',
//         user_id: comment.user_id,
//         comment_selected: comment, // Add the selected comment for reference
//       };
      
//       console.log('✅ Comment clicked, setting parent as active:', parentItem);
//       setActiveItem(parentItem);
//     } catch (error) {
//       console.error('❌ Error handling comment click:', error);
//     }
//   };

//   // ✅ FIXED: Helper functions - same approach as ListChats.jsx
//   const formatDate = (dateString) => {
//     if (!dateString) return 'Unknown date';
//     try {
//       return new Date(dateString).toLocaleString();
//     } catch (error) {
//       return 'Invalid date';
//     }
//   };

//   const getCommentText = (comment) => {
//     return comment.comment || comment.content || comment.text || 'No content';
//   };

//   const getCommentAuthor = (comment) => {
//     return comment.author || comment.user_id || comment.username || 'Unknown User';
//   };

//   const getParentTitle = (comment) => {
//     return comment.chat_title || comment.teaching_title || `${comment.chat_id ? 'Chat' : 'Teaching'} ${comment.chat_id || comment.teaching_id}`;
//   };

//   const getParentType = (comment) => {
//     return comment.chat_id ? 'Chat' : 'Teaching';
//   };

//   // ✅ FIXED: Group comments by parent for better organization - same approach as ListChats.jsx
//   const getGroupedComments = () => {
//     const grouped = {};
//     allComments.forEach(comment => {
//       const parentKey = comment.chat_id ? `chat_${comment.chat_id}` : `teaching_${comment.teaching_id}`;
//       if (!grouped[parentKey]) {
//         grouped[parentKey] = {
//           type: comment.chat_id ? 'chat' : 'teaching',
//           id: comment.chat_id || comment.teaching_id,
//           title: getParentTitle(comment),
//           comments: []
//         };
//       }
//       grouped[parentKey].comments.push(comment);
//     });
//     return grouped;
//   };

//   // Loading state - same as ListChats.jsx
//   if (isLoadingComments) {
//     return (
//       <div className='listcomments_container' style={{border:"3px solid purple"}}>
//         <div className="loading-message" style={{padding: '20px', textAlign: 'center'}}>
//           <p>🔄 Loading comments...</p>
//           <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
//             Fetching all comments...
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Error state - same as ListChats.jsx
//   if (commentsError) {
//     return (
//       <div className='listcomments_container' style={{border:"3px solid purple"}}>
//         <div className="error-message" style={{padding: '20px', textAlign: 'center'}}>
//           <h4 style={{color: 'red', marginBottom: '10px'}}>Error Loading Comments</h4>
//           <p style={{color: 'red', marginBottom: '15px'}}>Error: {commentsError.message}</p>
//           <button 
//             onClick={() => window.location.reload()}
//             style={{
//               padding: '8px 16px',
//               backgroundColor: '#e74c3c',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer'
//             }}
//           >
//             🔄 Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // No data state - same approach as ListChats.jsx
//   if (!Array.isArray(allComments) || allComments.length === 0) {
//     return (
//       <div className='listcomments_container' style={{border:"3px solid purple"}}>
//         <div className="search">
//           <div className="searchbar">
//             <img src="./search.png" alt="Search" />
//             <SearchControls onSearch={handleSearch} />
//           </div>
//           <img 
//             src={addMode ? "./minus.png" : "./plus.png"} 
//             alt="Toggle" 
//             className='add' 
//             onClick={() => setAddMode(!addMode)} 
//           />
//         </div>
//         <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
//           <p>📭 No comments available</p>
//           <p style={{fontSize: '0.8em', marginTop: '5px'}}>
//             Comments will appear here when they're posted
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const groupedComments = getGroupedComments();
//   const displayComments = searchQuery && filteredData.length > 0 ? filteredData : allComments;

//   return (
//     <div className='listcomments_container' style={{border:"3px solid purple"}}>
//       {/* Search Header */}
//       <div className="search">
//         <div className="searchbar">
//           <img src="./search.png" alt="Search" />
//           <SearchControls onSearch={handleSearch} />
//         </div>
//         <img 
//           src={addMode ? "./minus.png" : "./plus.png"} 
//           alt="Toggle" 
//           className='add' 
//           onClick={() => setAddMode(!addMode)} 
//         />
//       </div>

//       {/* Stats Bar - same approach as ListChats.jsx */}
//       <div style={{
//         padding: '8px',
//         backgroundColor: '#f8f9fa',
//         borderBottom: '1px solid #ddd',
//         fontSize: '12px',
//         color: '#666'
//       }}>
//         Total Comments: {allComments.length} | 
//         {searchQuery && ` Search Results: ${filteredData.length} |`} 
//         Parents: {Object.keys(groupedComments).length}
//       </div>

//       {/* Comments List - same approach as ListChats.jsx */}
//       {displayComments.length === 0 ? (
//         <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
//           <p>📭 No comments to display</p>
//           <p style={{fontSize: '0.8em', marginTop: '5px'}}>
//             {searchQuery ? `No results for "${searchQuery}"` : 'Comments will appear here when they\'re posted'}
//           </p>
//         </div>
//       ) : (
//         <div className="comments-list">
//           {searchQuery && filteredData.length > 0 ? (
//             // Show search results - same approach as ListChats.jsx
//             <div className="search-results">
//               <h3 style={{padding: '10px', margin: 0, backgroundColor: '#e3f2fd', borderBottom: '1px solid #90caf9'}}>
//                 🔍 Search Results ({filteredData.length})
//               </h3>
//               {filteredData.map((comment, index) => (
//                 <div 
//                   key={comment.id || `search-${index}`} 
//                   className={`comment-item ${activeItem?.comment_selected?.id === comment.id ? 'active' : ''}`} 
//                   onClick={() => handleItemClick(comment)}
//                   style={{
//                     cursor: 'pointer',
//                     padding: '12px',
//                     borderBottom: '1px solid #eee',
//                     backgroundColor: activeItem?.comment_selected?.id === comment.id ? '#e8f5e8' : 'white'
//                   }}
//                 >
//                   <div className="comment-header" style={{marginBottom: '8px'}}>
//                     <span className="parent-type-badge"
//                       style={{
//                         backgroundColor: comment.chat_id ? '#007bff' : '#28a745',
//                         color: 'white',
//                         padding: '2px 6px',
//                         borderRadius: '3px',
//                         fontSize: '10px',
//                         marginRight: '8px'
//                       }}
//                     >
//                       {getParentType(comment)}
//                     </span>
//                     <span className="parent-title" style={{fontWeight: 'bold', fontSize: '14px'}}>
//                       {getParentTitle(comment)}
//                     </span>
//                   </div>
                  
//                   <div className="comment-content" style={{marginBottom: '8px'}}>
//                     <p style={{margin: 0, fontSize: '13px', lineHeight: '1.4'}}>
//                       💬 "{getCommentText(comment)}"
//                     </p>
//                   </div>
                  
//                   <div className="comment-meta" style={{fontSize: '11px', color: '#666'}}>
//                     <span>👤 {getCommentAuthor(comment)}</span>
//                     <span style={{marginLeft: '15px'}}>📅 {formatDate(comment.created_at || comment.createdAt)}</span>
//                     {comment.id && <span style={{marginLeft: '15px'}}>🆔 {comment.id}</span>}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             // Show all comments grouped by parent - same approach as ListChats.jsx
//             <div className="all-comments">
//               <h3 style={{padding: '10px', margin: 0, backgroundColor: '#f3e5f5', borderBottom: '1px solid #ce93d8'}}>
//                 💬 All Comments ({allComments.length})
//               </h3>
              
//               {Object.entries(groupedComments).map(([parentKey, parentData]) => (
//                 <div key={parentKey} className="parent-group" style={{marginBottom: '15px'}}>
//                   <div className="parent-header" style={{
//                     padding: '8px 12px',
//                     backgroundColor: parentData.type === 'chat' ? '#e3f2fd' : '#e8f5e8',
//                     borderLeft: `4px solid ${parentData.type === 'chat' ? '#2196f3' : '#4caf50'}`,
//                     marginBottom: '5px'
//                   }}>
//                     <span className="parent-type-badge"
//                       style={{
//                         backgroundColor: parentData.type === 'chat' ? '#007bff' : '#28a745',
//                         color: 'white',
//                         padding: '2px 6px',
//                         borderRadius: '3px',
//                         fontSize: '10px',
//                         marginRight: '8px'
//                       }}
//                     >
//                       {parentData.type.toUpperCase()}
//                     </span>
//                     <span style={{fontWeight: 'bold'}}>{parentData.title}</span>
//                     <span style={{fontSize: '12px', color: '#666', marginLeft: '10px'}}>
//                       ({parentData.comments.length} comment{parentData.comments.length !== 1 ? 's' : ''})
//                     </span>
//                   </div>
                  
//                   {parentData.comments.map((comment, commentIndex) => (
//                     <div 
//                       key={comment.id || `comment-${parentKey}-${commentIndex}`} 
//                       className={`comment-item ${activeItem?.comment_selected?.id === comment.id ? 'active' : ''}`} 
//                       onClick={() => handleItemClick(comment)}
//                       style={{
//                         cursor: 'pointer',
//                         padding: '10px',
//                         marginLeft: '20px',
//                         marginBottom: '5px',
//                         backgroundColor: activeItem?.comment_selected?.id === comment.id ? '#fff3e0' : '#fafafa',
//                         borderLeft: '2px solid #ddd',
//                         borderRadius: '4px'
//                       }}
//                     >
//                       <div className="comment-content" style={{marginBottom: '6px'}}>
//                         <p style={{margin: 0, fontSize: '13px', lineHeight: '1.4'}}>
//                           💬 "{getCommentText(comment)}"
//                         </p>
//                       </div>
                      
//                       <div className="comment-meta" style={{fontSize: '11px', color: '#666'}}>
//                         <span>👤 {getCommentAuthor(comment)}</span>
//                         <span style={{marginLeft: '12px'}}>📅 {formatDate(comment.created_at || comment.createdAt)}</span>
//                         {comment.id && <span style={{marginLeft: '12px'}}>🆔 {comment.id}</span>}
//                       </div>
                      
//                       {/* Show media indicators if present - same approach as ListChats.jsx */}
//                       {(comment.media_url1 || comment.media_url2 || comment.media_url3) && (
//                         <div className="media-indicators" style={{marginTop: '4px'}}>
//                           {comment.media_url1 && <span style={{fontSize: '10px', marginRight: '5px'}}>📎 Media1</span>}
//                           {comment.media_url2 && <span style={{fontSize: '10px', marginRight: '5px'}}>📎 Media2</span>}
//                           {comment.media_url3 && <span style={{fontSize: '10px', marginRight: '5px'}}>📎 Media3</span>}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* No search results message - same approach as ListChats.jsx */}
//       {searchQuery && filteredData.length === 0 && (
//         <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
//           <p>🔍 No comments found for "{searchQuery}"</p>
//           <p style={{fontSize: '0.8em', marginTop: '5px'}}>
//             Try different search terms
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ListComments;










