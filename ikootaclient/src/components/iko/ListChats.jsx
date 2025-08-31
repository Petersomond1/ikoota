//ikootaclient\src\components\iko\ListChats.jsx - ENHANCED WITH BACKEND SEARCH
import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import { useSmartSearch } from '../../hooks/useSearchContent';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching combined content...');
        
        // ✅ FIX 1: Handle the comments error gracefully by fetching separately
        const contentResponse = await api.get('/content/chats/combinedcontent');
        console.log('✅ Content response received');
        console.log('Content data structure:', Object.keys(contentResponse.data || {}));

        let commentsData = [];
        try {
          console.log('🔄 Fetching comments...');
          const commentsResponse = await api.get('/content/comments/all');
          commentsData = commentsResponse.data?.data || commentsResponse.data || [];
          console.log('✅ Comments loaded successfully:', commentsData.length);
        } catch (commentsError) {
          console.warn('⚠️ Comments failed to load (continuing without):', commentsError.message);
          // Continue without comments rather than failing completely
        }

        // ✅ FIX 2: Robust data extraction with fallbacks
        const responseData = contentResponse.data;
        console.log('Response structure:', Object.keys(responseData));

        // Handle multiple possible response structures
        let combinedItems = [];
        
        if (responseData.data) {
          // Structure: { data: { combined: [], chats: [], teachings: [] } }
          if (responseData.data.combined) {
            combinedItems = responseData.data.combined;
          } else if (responseData.data.chats) {
            // Combine chats and teachings manually
            const chats = responseData.data.chats || [];
            const teachings = responseData.data.teachings || [];
            combinedItems = [...chats, ...teachings];
          }
        } else if (Array.isArray(responseData)) {
          // Direct array response
          combinedItems = responseData;
        } else if (responseData.chats || responseData.teachings) {
          // Structure: { chats: [], teachings: [] }
          const chats = responseData.chats || [];
          const teachings = responseData.teachings || [];
          combinedItems = [...chats, ...teachings];
        }

        console.log('✅ Extracted combined items:', combinedItems.length);

        // ✅ FIX 3: Normalize all items with comprehensive fallbacks
        const processedItems = combinedItems.map((item, index) => {
          const normalizedItem = {
            ...item,
            // Ensure essential fields exist
            id: item.id || `item-${index}`,
            prefixed_id: item.prefixed_id || item.id || `item-${index}`,
            content_type: item.content_type || (item.topic ? 'teaching' : 'chat'),
            content_title: item.content_title || item.title || item.topic || 'Untitled',
            
            // Handle title field variations
            title: item.title || item.topic || item.content_title || 'Untitled',
            topic: item.topic || item.title || item.content_title,
            
            // Handle description/content variations
            text: item.text || item.content || item.description || '',
            content: item.content || item.text || item.description || '',
            description: item.description || item.content || item.text || '',
            summary: item.summary || '',
            
            // Handle user identification
            user_id: item.user_id || item.created_by || 'Unknown',
            created_by: item.created_by || item.user_id || 'Unknown',
            
            // Handle dates
            createdAt: item.createdAt || item.created_at || item.content_createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || item.updated_at || item.content_updatedAt || item.createdAt || new Date().toISOString(),
            display_date: item.display_date || item.updatedAt || item.createdAt || new Date().toISOString(),
            
            // Handle other fields with fallbacks
            audience: item.audience === 'undefined' ? 'General' : (item.audience || 'General'),
            lessonNumber: item.lessonNumber || item.lesson_number || item.id,
            approval_status: item.approval_status || 'pending',
            
            // Ensure subjectMatter doesn't start with 'undefined'
            subjectMatter: item.subjectMatter?.startsWith('undefined') ? 
              item.subjectMatter.replace('undefined', '').trim() || 'General' :
              item.subjectMatter || item.subject_matter || '',
            
            // Clean up any 'undefined' strings in summary
            cleanSummary: item.summary?.startsWith('undefined') ?
              item.summary.replace('undefined', '').trim() :
              item.summary
          };

          return normalizedItem;
        });

        console.log('✅ Processed items:', processedItems.length);
        console.log('✅ Sample item:', processedItems[0]);

        // ✅ FIX 4: Set state with processed data
        setContent(processedItems);
        setComments(commentsData);
        setFilteredItems(processedItems);

      } catch (error) {
        console.error('❌ Error fetching content:', error);
        setError(`Failed to fetch content: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ FIX 5: Enhanced comment grouping with better error handling
  const groupCommentsByParent = () => {
    const groupedComments = {};

    if (!Array.isArray(comments)) {
      console.warn('Comments is not an array:', comments);
      return groupedComments;
    }
    
    comments.forEach(comment => {
      try {
        // Create multiple keys for each comment to handle different ID formats
        const keys = [];
        
        if (comment.chat_id) {
          keys.push(comment.chat_id);
          keys.push(`c${comment.chat_id}`);
          keys.push(`chat-${comment.chat_id}`);
        }
        
        if (comment.teaching_id) {
          keys.push(comment.teaching_id);
          keys.push(`t${comment.teaching_id}`);
          keys.push(`teaching-${comment.teaching_id}`);
        }

        // Add comment to all relevant keys
        keys.forEach(key => {
          if (!groupedComments[key]) groupedComments[key] = [];
          groupedComments[key].push(comment);
        });
      } catch (err) {
        console.warn('Error grouping comment:', comment, err);
      }
    });
    
    console.log('✅ Grouped comments keys:', Object.keys(groupedComments));
    return groupedComments;
  };

  const groupedComments = groupCommentsByParent();

  // ✅ ENHANCED: Use smart search hook for backend integration
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    searchMethod 
  } = useSmartSearch({
    query: searchQuery,
    contentType: 'all', // Search both chats and teachings
    localData: content,
    useServerSearch: searchQuery.length >= 2, // Use server search for queries >= 2 chars
    enabled: searchQuery.length >= 2
  });

  // Update filtered results when search changes
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredItems(content);
    } else if (searchQuery.length >= 2) {
      // For global search, combine all results
      const combinedResults = searchResults?.chats || searchResults?.teachings || searchResults || [];
      setFilteredItems(Array.isArray(combinedResults) ? combinedResults : []);
    } else {
      // For 1 character searches, use client-side filtering
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = content.filter(item => {
        const searchFields = [
          item.content_title, item.title, item.topic, item.summary,
          item.cleanSummary, item.description, item.text, item.content,
          item.prefixed_id, item.subjectMatter, item.audience, item.user_id
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(lowercaseQuery)
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchQuery, searchResults, content]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // ✅ FIX 7: Enhanced item click handler
  const handleItemClick = (item) => {
    try {
      if (deactivateListComments) deactivateListComments();
      
      const itemData = {
        id: item.prefixed_id || item.id,
        type: item.content_type || 'chat',
        prefixed_id: item.prefixed_id || item.id,
        title: item.content_title || item.title || item.topic,
        ...item
      };
      
      console.log('✅ Item clicked:', itemData);
      setActiveItemState(itemData);
      if (setActiveItem) setActiveItem(itemData);
    } catch (error) {
      console.error('❌ Error handling item click:', error);
    }
  };

  // ✅ FIX 8: Enhanced helper functions with null safety
  const getContentTitle = (item) => {
    return item?.content_title || item?.title || item?.topic || 'Untitled';
  };

  const getCreationDate = (item) => {
    const dateStr = item?.display_date || item?.updatedAt || item?.createdAt || item?.created_at;
    if (!dateStr) return 'Unknown date';
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getContentIdentifier = (item) => {
    return item?.prefixed_id || `${item?.content_type || 'item'}-${item?.id}`;
  };

  const getUserDisplay = (item) => {
    return item?.user_id || item?.created_by || 'Admin';
  };

  const getAudienceDisplay = (item) => {
    const audience = item?.audience;
    if (!audience || audience === 'undefined') return 'General';
    return audience;
  };

  const getSubjectDisplay = (item) => {
    const subject = item?.subjectMatter;
    if (!subject || subject === 'undefined' || subject.startsWith('undefined')) {
      return 'General';
    }
    return subject;
  };

  // ✅ FIX 9: Get comments for an item with multiple fallback strategies
  const getCommentsForItem = (item) => {
    const possibleKeys = [
      item.id,
      item.prefixed_id,
      `c${item.id}`,
      `t${item.id}`,
      `chat-${item.id}`,
      `teaching-${item.id}`,
      item.content_type === 'chat' ? `c${item.id}` : `t${item.id}`
    ].filter(Boolean);

    let comments = [];
    possibleKeys.forEach(key => {
      const keyComments = groupedComments[key] || [];
      comments = [...comments, ...keyComments];
    });

    // Remove duplicates based on comment id
    const uniqueComments = comments.filter((comment, index, self) => 
      index === self.findIndex(c => c.id === comment.id)
    );

    return uniqueComments;
  };

  // Loading state
  if (loading) {
    return (
      <div className='listchats_container' style={{border:"3px solid brown"}}>
        <div className="loading-message">
          <p>Loading content...</p>
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            Fetching chats, teachings, and comments...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='listchats_container' style={{border:"3px solid brown"}}>
        <div className="error-message">
          <h4 style={{color: 'red', marginBottom: '10px'}}>Error Loading Content</h4>
          <p style={{color: 'red', marginBottom: '15px'}}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            If this persists, check the browser console for details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='listchats_container' style={{border:"3px solid brown"}}>
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

      {/* Content Stats with Search Status */}
      <div style={{
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Total: {content.length} | Showing: {filteredItems.length} | Comments: {comments.length}
        </div>
        
        {/* Search Status Indicator */}
        {searchQuery && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px'
          }}>
            {isSearching && (
              <span style={{color: '#ff9800', animation: 'pulse 1.5s infinite'}}>
                🔍 Searching...
              </span>
            )}
            {searchQuery.length >= 2 && searchMethod && (
              <span style={{
                background: searchMethod === 'server' ? '#4CAF50' : '#2196F3',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px'
              }}>
                {searchMethod === 'server' ? '🤖 AI Search' : '⚡ Quick Filter'}
              </span>
            )}
            {searchQuery && (
              <span style={{color: '#666'}}>
                Query: "{searchQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content List */}
      {!Array.isArray(filteredItems) || filteredItems.length === 0 ? (
        <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
          {!Array.isArray(filteredItems) ? 
            'Error: Invalid content data' : 
            'No content available'
          }
        </div>
      ) : (
        filteredItems.map((item, index) => {
          const commentsForItem = getCommentsForItem(item);
          const uniqueKey = `${item.content_type || 'item'}-${item.prefixed_id || item.id}-${index}`;
          
          return (
            <div 
              key={uniqueKey}
              className={`item ${activeItem?.prefixed_id === item.prefixed_id ? 'active' : ''}`} 
              onClick={() => handleItemClick(item)}
              style={{cursor: 'pointer'}}
            >
              <div className="texts">
                {/* Header with type and ID */}
                <div className="item-header" style={{marginBottom: '8px'}}>
                  <span 
                    className="content-type-badge"
                    style={{
                      backgroundColor: item.content_type === 'chat' ? '#007bff' : '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      marginRight: '8px'
                    }}
                  >
                    {item.content_type || 'content'}
                  </span>
                  <span className="content-id" style={{fontSize: '12px', color: '#666'}}>
                    {getContentIdentifier(item)}
                  </span>
                </div>
                
                {/* Main content info */}
                <div style={{marginBottom: '5px'}}>
                  <strong>Title:</strong> {getContentTitle(item)}
                </div>
                
                <div style={{fontSize: '13px', color: '#555', marginBottom: '3px'}}>
                  <strong>Lesson#:</strong> {item.lessonNumber || item.id}
                </div>
                
                <div style={{fontSize: '13px', color: '#555', marginBottom: '3px'}}>
                  <strong>Audience:</strong> {getAudienceDisplay(item)}
                </div>
                
                <div style={{fontSize: '13px', color: '#555', marginBottom: '3px'}}>
                  <strong>By:</strong> {getUserDisplay(item)}
                </div>
                
                <div style={{fontSize: '13px', color: '#555', marginBottom: '3px'}}>
                  <strong>Date:</strong> {getCreationDate(item)}
                </div>
                
                {item.content_type === 'teaching' && getSubjectDisplay(item) !== 'General' && (
                  <div style={{fontSize: '13px', color: '#555', marginBottom: '3px'}}>
                    <strong>Subject:</strong> {getSubjectDisplay(item)}
                  </div>
                )}

                {/* Summary if available */}
                {(item.summary || item.cleanSummary) && (
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px', fontStyle: 'italic'}}>
                    {item.cleanSummary || item.summary}
                  </div>
                )}
              </div>

              {/* Comments Preview */}
              <div className="comments-preview" style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '8px'}}>
                {commentsForItem && commentsForItem.length > 0 ? (
                  <div className="comments">
                    <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#333'}}>
                      Comments ({commentsForItem.length}):
                    </h4>
                    {commentsForItem.slice(0, 2).map((comment, commentIndex) => (
                      <div 
                        key={comment.id || `comment-${item.id}-${commentIndex}`} 
                        className="comment-item"
                        style={{
                          marginBottom: '6px',
                          padding: '6px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{marginBottom: '2px'}}>
                          <strong>By:</strong> {comment.user_id || comment.username || 'Unknown'}
                          <span style={{marginLeft: '10px', color: '#666'}}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        {(comment.comment || comment.content || comment.text) && (
                          <div style={{color: '#555'}}>
                            {(() => {
                              const commentText = comment.comment || comment.content || comment.text;
                              return commentText.length > 50 ? 
                                `"${commentText.substring(0, 50)}..."` : 
                                `"${commentText}"`;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                    {commentsForItem.length > 2 && (
                      <p className="more-comments" style={{fontSize: '11px', color: '#666', margin: '5px 0 0 0'}}>
                        +{commentsForItem.length - 2} more comments
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="no-comments" style={{fontSize: '12px', color: '#999'}}>
                    No comments for {getContentIdentifier(item)}
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