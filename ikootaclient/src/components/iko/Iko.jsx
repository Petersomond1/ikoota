// ikootaclient\src\components\iko\Iko.jsx
// FIXED VERSION - Array Safety Issue Resolved
// ==================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './iko.css';
import ListChats from './ListChats';
import Chat from './Chat';
import ListComments from './ListComments';
import UserInfo from './Userinfo';
import { useFetchChats } from '../service/useFetchChats';
import { useFetchComments } from '../service/useFetchComments';
import { useFetchTeachings } from '../service/useFetchTeachings';
import { useUser } from '../auth/UserStatus';

const Iko = ({ isNested = false }) => {
  const { data: chats = [], isLoading: isLoadingChats, error: errorChats } = useFetchChats();
  const { data: teachings = [], isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
  const { data: comments = [], isLoading: isLoadingComments, error: errorComments } = useFetchComments();
  
  // ✅ FIXED: Separate state for active content and active comment
  const [activeItem, setActiveItem] = useState(null);
  const [activeComment, setActiveComment] = useState(null);
  
  const { user, logout, isAdmin } = useUser();
  const navigate = useNavigate();

  // Detect if we're inside admin layout
  const [isInAdmin, setIsInAdmin] = useState(false);

  // States for resizable panels - default ratio 1:7:1
  const [leftPanelWidth, setLeftPanelWidth] = useState(11.11); // 1/9 = 11.11% (1 part of 9 total)
  const [rightPanelWidth, setRightPanelWidth] = useState(11.11); // 1/9 = 11.11% (1 part of 9 total)
  // Center panel will be 77.78% (7 parts of 9 total)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Disable resizing on tablets and mobile
      if (window.innerWidth <= 1024) {
        return;
      }
      
      e.preventDefault(); // Prevent text selection
      
      if (isDraggingLeft) {
        const viewport = document.querySelector('.iko_viewport');
        if (viewport) {
          const rect = viewport.getBoundingClientRect();
          const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
          // Limit between 10% and 35% for side panels
          if (newWidth >= 10 && newWidth <= 35) {
            setLeftPanelWidth(newWidth);
          }
        }
      } else if (isDraggingRight) {
        const viewport = document.querySelector('.iko_viewport');
        if (viewport) {
          const rect = viewport.getBoundingClientRect();
          const rightEdgePercent = ((rect.right - e.clientX) / rect.width) * 100;
          // Limit between 10% and 35% for side panels
          if (rightEdgePercent >= 10 && rightEdgePercent <= 35) {
            setRightPanelWidth(rightEdgePercent);
          }
        }
      }
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('no-select');
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('no-select');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('no-select');
    };
  }, [isDraggingLeft, isDraggingRight]);

  useEffect(() => {
    // Check if we're rendered inside admin layout
    const checkAdminContext = () => {
      const adminContainer = document.querySelector('.adminContainer, .mainContent, .mainCOntent');
      setIsInAdmin(!!adminContainer);
    };

    checkAdminContext();
    
    // Also check on window resize
    window.addEventListener('resize', checkAdminContext);
    return () => window.removeEventListener('resize', checkAdminContext);
  }, []);

  // ✅ FIXED: Set default active item with proper array safety
  useEffect(() => {
    // ✅ CRITICAL FIX: Ensure arrays are properly initialized before processing
    const safeChats = Array.isArray(chats) ? chats : [];
    const safeTeachings = Array.isArray(teachings) ? teachings : [];
    
    console.log('🔍 Checking for active item setup:', {
      activeItem,
      chatsLength: safeChats.length,
      teachingsLength: safeTeachings.length,
      chatsType: typeof chats,
      teachingsType: typeof teachings,
      chatsIsArray: Array.isArray(chats),
      teachingsIsArray: Array.isArray(teachings)
    });

    if (!activeItem && (safeChats.length > 0 || safeTeachings.length > 0)) {
      try {
        // Combine chats and teachings with safe array handling
        const allContent = [...safeChats, ...safeTeachings].filter(item => item && item.id);
        
        if (allContent.length > 0) {
          // Sort by timestamp (most recent first)
          const sortedContent = allContent.sort((a, b) => {
            const aDate = new Date(a.updatedAt || a.createdAt || 0);
            const bDate = new Date(b.updatedAt || b.createdAt || 0);
            return bDate - aDate;
          });
          
          const topContent = sortedContent[0];
          const newActiveItem = {
            type: topContent.topic ? "teaching" : "chat",
            id: topContent.id,
            prefixed_id: topContent.prefixed_id,
            title: topContent.title || topContent.topic,
            content_type: topContent.topic ? "teaching" : "chat",
            ...topContent
          };
          
          setActiveItem(newActiveItem);
          console.log('✅ Set default active item:', newActiveItem);
        }
      } catch (error) {
        console.error('❌ Error setting default active item:', error);
        console.log('Debug info:', { chats, teachings, safeChats, safeTeachings });
      }
    }
  }, [chats, teachings, activeItem]); // Keep the original dependencies

  const deactivateListComments = () => {
    setActiveComment(null);
  };

  const deactivateListChats = () => {
    setActiveItem(null);
    setActiveComment(null);
  };

  // ✅ NEW: Handle comment selection
  const handleCommentSelect = (comment) => {
    console.log('✅ Comment selected in Iko:', comment);
    setActiveComment(comment);
  };

  // ✅ NEW: Handle content selection and reset comment selection
  const handleContentSelect = (item) => {
    console.log('✅ Content selected in Iko:', item);
    setActiveItem(item);
    setActiveComment(null); // Reset comment selection when content changes
  };

  // Navigation handlers
  const handleNavigateToTowncrier = () => {
    const confirmNavigation = window.confirm(
      "Leave Iko Chat and go to public content?"
    );
    if (confirmNavigation) {
      navigate('/towncrier');
    }
  };

  const handleSignOut = () => {
    const confirmSignOut = window.confirm("Sign out of your account?");
    if (confirmSignOut) {
      logout();
      navigate('/');
    }
  };

  const handleNavigateToAdmin = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      alert("You don't have admin privileges.");
    }
  };

  // Determine container style based on context
  const getContainerStyle = () => {
    if (isNested || isInAdmin) {
      return {
        '--iko-width': '100%',
        '--iko-height': '100%',
      };
    }
    return {
      '--iko-width': '90vw',
      '--iko-height': '90vh',
    };
  };

  // ✅ ENHANCED: Better array safety in render calculations
  const safeChats = Array.isArray(chats) ? chats : [];
  const safeTeachings = Array.isArray(teachings) ? teachings : [];
  const safeComments = Array.isArray(comments) ? comments : [];

  // Loading state
  if (isLoadingChats || isLoadingComments || isLoadingTeachings) {
    return (
      <div 
        className="iko_container" 
        style={getContainerStyle()}
      >
        <div className="nav">
          <div className="nav-left">
            <span>Iko Chat - Loading...</span>
          </div>
          <div className="nav-right">
            <span className="status-badge loading">⏳ Loading...</span>
          </div>
        </div>
        <div className="iko_viewport">
          <div className="status loading">
            <div>
              <p>🔄 Loading member chat system...</p>
              <p style={{ fontSize: '0.8em', marginTop: '10px' }}>
                Fetching chats, comments, and teachings...
              </p>
            </div>
          </div>
        </div>
        <div className="footnote">
          <span>Iko - Member Chat System</span>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (errorChats || errorComments || errorTeachings) {
    const errors = [
      errorChats && 'Chats',
      errorComments && 'Comments', 
      errorTeachings && 'Teachings'
    ].filter(Boolean);

    return (
      <div 
        className="iko_container" 
        style={getContainerStyle()}
      >
        <div className="nav">
          <div className="nav-left">
            <span>Iko Chat - Error</span>
          </div>
          <div className="nav-right">
            <span className="status-badge error">❌ Error</span>
          </div>
        </div>
        <div className="iko_viewport">
          <div className="status error">
            <div>
              <p>⚠️ Error loading member chat data!</p>
              <p style={{ fontSize: '0.8em', marginTop: '10px' }}>
                Failed to load: {errors.join(', ')}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  marginTop: '15px',
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
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
        </div>
        <div className="footnote">
          <span>Iko - Member Chat System</span>
          <span>Error State</span>
        </div>
      </div>
    );
  }

  console.log('🔍 Iko State - Active Item:', activeItem);
  console.log('🔍 Iko State - Active Comment:', activeComment);

  // Main render
  return (
    <div
      className="iko_container"
      style={getContainerStyle()}
    >
      {/* Navigation Bar */}
      <div className="nav">
        <div className="nav-left">
          <div className='nav-title'> 
            <p className='title'> Iko oo'Ta </p>
            <p className='title_def'> The Chat & Discussion Board for the Re-Institution of the Altar of the Land of the Gods</p> 
          </div>
        
          </div>

        <div className="nav-centre">
             <button 
              onClick={() => navigate('/dashboard')}
              className="footer-btn dashboard-btn"
              title="Go to User Dashboard"
            >
              📊 Dashboard
            </button>
            {!isInAdmin && (
              <button 
                onClick={handleNavigateToTowncrier} 
                className="footer-btn towncrier-btn"
                title="View public content"
              >
                📖 Public
              </button>
            )}
            
            {isAdmin && !isInAdmin && (
              <button 
                onClick={handleNavigateToAdmin} 
                className="footer-btn admin-btn"
                title="Admin Panel"
              >
                ⚙️ Admin
              </button>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="footer-btn refresh-btn"
              title="Refresh chat system"
            >
              🔄 Refresh
            </button>
            
            <button 
              onClick={handleSignOut} 
              className="footer-btn signout-btn"
              title="Sign out"
            >
              👋 Out
            </button>
        </div>
        <div className="nav-right">
          <span className="chat-count">💬 {safeChats.length}</span>
          <span className="teaching-count">📚 {safeTeachings.length}</span>
          {isInAdmin && (
            <span className="status-badge" style={{ background: '#9c27b0', color: 'white' }}>
              📱 Admin View
            </span>
          )}
        </div>

      </div>
  
      
      {/* ✅ FIXED: Main Chat Viewport with safe array props and resizable panels */}
      <div className="iko_viewport">
        {/* Left Panel with dynamic width - use flex-basis for proper resizing */}
        <div 
          className="listchats_container" 
          style={{ 
            flexBasis: `${leftPanelWidth}%`,
            flexGrow: 0,
            flexShrink: 0
          }}
        >
          <ListChats 
            setActiveItem={handleContentSelect}
            deactivateListComments={deactivateListComments}
            isInAdmin={isInAdmin}
          />
        </div>
        
        {/* Left Resizable Divider */}
        <div 
          className={`resize-divider resize-divider-left ${isDraggingLeft ? 'dragging' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            if (window.innerWidth > 1024) {
              setIsDraggingLeft(true);
              document.body.style.cursor = 'col-resize';
            }
          }}
          title="Drag to resize panels"
        >
          <div className="divider-handle">
            <span className="divider-dots">⋮⋮⋮</span>
          </div>
        </div>
        
        {/* Center Panel with dynamic width - use flex-basis for proper resizing */}
        <div 
          className='chat_container'
          style={{ 
            flexBasis: `${100 - leftPanelWidth - rightPanelWidth}%`,
            flexGrow: 0,
            flexShrink: 0
          }}
        > 
          <UserInfo />
          <Chat 
            activeItem={activeItem} 
            activeComment={activeComment}
            chats={safeChats} 
            teachings={safeTeachings}
            isInAdmin={isInAdmin}
          />
        </div>
        
        {/* Right Resizable Divider */}
        <div 
          className={`resize-divider resize-divider-right ${isDraggingRight ? 'dragging' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            if (window.innerWidth > 1024) {
              setIsDraggingRight(true);
              document.body.style.cursor = 'col-resize';
            }
          }}
          title="Drag to resize panels"
        >
          <div className="divider-handle">
            <span className="divider-dots">⋮⋮⋮</span>
          </div>
        </div>
        
        {/* Right Panel with dynamic width - use flex-basis for proper resizing */}
        <div 
          className='listcomments_container'
          style={{ 
            flexBasis: `${rightPanelWidth}%`,
            flexGrow: 0,
            flexShrink: 0
          }}
        >
          <ListComments 
            activeItem={activeItem}
            setActiveComment={handleCommentSelect}
            activeComment={activeComment}
            deactivateListChats={deactivateListChats}
            isInAdmin={isInAdmin}
          />
        </div>
        
      </div>
      
      {/* Footer */}
      <div className="footnote">
        <div className="footer-left">
          <span>Iko - Member Chat</span>
          {activeItem && (
            <span> | {activeItem.type} #{activeItem.id}</span>
          )}
          {activeComment && (
            <span> | Comment #{activeComment.id}</span>
          )}
        </div>
        
        <div className="footer-center">
          <div className="activity-indicator">
            <span className="online-status">🟢 Online</span>
            {isInAdmin && (
              <span style={{ fontSize: '0.7em', marginLeft: '8px', color: '#ccc' }}>
                Admin Layout
              </span>
            )}
          </div>
        </div>
        
        <div className="footer-right">
          <div className="footer-controls">
             <button 
              onClick={() => navigate('/dashboard')}
              className="footer-btn dashboard-btn"
              title="Go to User Dashboard"
            >
              📊 Dashboard
            </button>
            {!isInAdmin && (
              <button 
                onClick={handleNavigateToTowncrier} 
                className="footer-btn towncrier-btn"
                title="View public content"
              >
                📖 Public
              </button>
            )}
            
            {isAdmin && !isInAdmin && (
              <button 
                onClick={handleNavigateToAdmin} 
                className="footer-btn admin-btn"
                title="Admin Panel"
              >
                ⚙️ Admin
              </button>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="footer-btn refresh-btn"
              title="Refresh chat system"
            >
              🔄 Refresh
            </button>
            
            <button 
              onClick={handleSignOut} 
              className="footer-btn signout-btn"
              title="Sign out"
            >
              👋 Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Iko;





