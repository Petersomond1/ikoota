
// ==================================================
// COMPLETE IKO JSX FIX
// Updated Iko.jsx with proper admin layout support
// ==================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './iko.css';
import ListChats from './ListChats';
import Chat from './Chat';
import ListComments from './ListComments';
import { useFetchChats } from '../service/useFetchChats';
import { useFetchComments } from '../service/useFetchComments';
import { useFetchTeachings } from '../service/useFetchTeachings';
import { useUser } from '../auth/UserStatus';

const Iko = ({ isNested = false }) => {
  const { data: chats = [], isLoading: isLoadingChats, error: errorChats } = useFetchChats();
  const { data: teachings = [], isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
  const { data: comments = [], isLoading: isLoadingComments, error: errorComments } = useFetchComments();
  const [activeItem, setActiveItem] = useState(null);
  
  const { user, logout, isAdmin } = useUser();
  const navigate = useNavigate();

  // Detect if we're inside admin layout
  const [isInAdmin, setIsInAdmin] = useState(false);

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

  useEffect(() => {
    if (!activeItem && chats.length > 0) {
      setActiveItem({ type: "chat", id: chats[0]?.id });
    }
  }, [chats, activeItem]);

  const deactivateListComments = () => {
    setActiveItem(null);
  };

  const deactivateListChats = () => {
    setActiveItem(null);
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

  // Main render
  return (
    <div
      className="iko_container"
      style={getContainerStyle()}
    >
      {/* Navigation Bar */}
      <div className="nav">
        <div className="nav-left">
          <span>Iko Chat - Member System</span>
          <div className="member-status">
            <span className="status-badge member">✅ Member</span>
            <span className="user-info">
              👤 {user?.username || user?.email || 'Member'}
              {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            </span>
          </div>
        </div>
        
        <div className="nav-right">
          <span className="chat-count">💬 {chats.length}</span>
          <span className="teaching-count">📚 {teachings.length}</span>
          {isInAdmin && (
            <span className="status-badge" style={{ background: '#9c27b0', color: 'white' }}>
              📱 Admin View
            </span>
          )}
        </div>
      </div>
      
      {/* Main Chat Viewport */}
      <div className="iko_viewport">
        <ListChats 
          setActiveItem={setActiveItem} 
          deactivateListComments={deactivateListComments}
          isInAdmin={isInAdmin}
        />
        <Chat 
          activeItem={activeItem} 
          chats={chats} 
          teachings={teachings}
          isInAdmin={isInAdmin}
        />
        <ListComments 
          setActiveItem={setActiveItem} 
          deactivateListChats={deactivateListChats}
          isInAdmin={isInAdmin}
        />
      </div>
      
      {/* Footer */}
      <div className="footnote">
        <div className="footer-left">
          <span>Iko - Member Chat</span>
          {activeItem && (
            <span> | {activeItem.type} #{activeItem.id}</span>
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


// // ikootaclient/src/components/iko/Iko.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './iko.css';
// import ListChats from './ListChats';
// import Chat from './Chat';
// import ListComments from './ListComments';
// import { useFetchChats } from '../service/useFetchChats';
// import { useFetchComments } from '../service/useFetchComments';
// import { useFetchTeachings } from '../service/useFetchTeachings';
// import { useUser } from '../auth/UserStatus';

// const Iko = ({ isNested = false }) => {
//   const { data: chats = [], isLoading: isLoadingChats, error: errorChats } = useFetchChats();
//   const { data: teachings = [], isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
//   const { data: comments = [], isLoading: isLoadingComments, error: errorComments } = useFetchComments();
//   const [activeItem, setActiveItem] = useState(null);
  
//   const { user, logout, isAdmin } = useUser();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!activeItem && chats.length > 0) {
//       setActiveItem({ type: "chat", id: chats[0]?.id });
//     }
//   }, [chats, activeItem]);

//   const deactivateListComments = () => {
//     setActiveItem(null);
//   };

//   const deactivateListChats = () => {
//     setActiveItem(null);
//   };

//   // Navigation handlers
//   const handleNavigateToTowncrier = () => {
//     const confirmNavigation = window.confirm(
//       "Leave Iko Chat and go to public content?"
//     );
//     if (confirmNavigation) {
//       navigate('/towncrier');
//     }
//   };

//   const handleSignOut = () => {
//     const confirmSignOut = window.confirm("Sign out of your account?");
//     if (confirmSignOut) {
//       logout();
//       navigate('/');
//     }
//   };

//   const handleNavigateToAdmin = () => {
//     if (isAdmin) {
//       navigate('/admin');
//     } else {
//       alert("You don't have admin privileges.");
//     }
//   };

//   if (isLoadingChats || isLoadingComments || isLoadingTeachings) {
//     return (
//       <div className="iko_container" style={{
//         '--iko-width': isNested ? '100%' : '90vw',
//         '--iko-height': isNested ? '100%' : '90vh',
//       }}>
//         <div className="nav">
//           <div className="nav-left">
//             <span>Iko Chat - Loading...</span>
//           </div>
//         </div>
//         <div className="iko_viewport">
//           <p className="status loading">Loading member chat system...</p>
//         </div>
//         <div className="footnote">Iko - Member Chat System</div>
//       </div>
//     );
//   }

//   if (errorChats || errorComments || errorTeachings) {
//     return (
//       <div className="iko_container" style={{
//         '--iko-width': isNested ? '100%' : '90vw',
//         '--iko-height': isNested ? '100%' : '90vh',
//       }}>
//         <div className="nav">
//           <div className="nav-left">
//             <span>Iko Chat - Error</span>
//           </div>
//         </div>
//         <div className="iko_viewport">
//           <p className="status error">Error loading member chat data!</p>
//         </div>
//         <div className="footnote">Iko - Member Chat System</div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="iko_container"
//       style={{
//         '--iko-width': isNested ? '100%' : '90vw',
//         '--iko-height': isNested ? '100%' : '90vh',
//       }}
//     >
//       {/* Simplified Navigation Bar - No Buttons */}
//       <div className="nav">
//         <div className="nav-left">
//           <span>Iko Chat - Member System</span>
//           <div className="member-status">
//             <span className="status-badge member">✅ Member</span>
//             <span className="user-info">
//               👤 {user?.username || user?.email || 'Member'}
//               {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
//             </span>
//           </div>
//         </div>
        
//         <div className="nav-right">
//           <span className="chat-count">💬 {chats.length}</span>
//           <span className="teaching-count">📚 {teachings.length}</span>
//         </div>
//       </div>
      
//       {/* Main Chat Viewport */}
//       <div className="iko_viewport">
//         <ListChats 
//           setActiveItem={setActiveItem} 
//           deactivateListComments={deactivateListComments} 
//         />
//         <Chat 
//           activeItem={activeItem} 
//           chats={chats} 
//           teachings={teachings} 
//         />
//         <ListComments 
//           setActiveItem={setActiveItem} 
//           deactivateListChats={deactivateListChats} 
//         />
//       </div>
      
//       {/* Compact Footer with Minimal Buttons */}
//       <div className="footnote">
//         <div className="footer-left">
//           <span>Iko - Member Chat</span>
//           {activeItem && (
//             <span> | {activeItem.type} #{activeItem.id}</span>
//           )}
//         </div>
        
//         <div className="footer-center">
//           <div className="activity-indicator">
//             <span className="online-status">🟢 Online</span>
//           </div>
//         </div>
        
//         <div className="footer-right">
//           <div className="footer-controls">
//             <button 
//               onClick={handleNavigateToTowncrier} 
//               className="footer-btn towncrier-btn"
//               title="View public content"
//             >
//               📖 Public
//             </button>
            
//             {isAdmin && (
//               <button 
//                 onClick={handleNavigateToAdmin} 
//                 className="footer-btn admin-btn"
//                 title="Admin Panel"
//               >
//                 ⚙️ Admin
//               </button>
//             )}
            
//             <button 
//               onClick={() => window.location.reload()} 
//               className="footer-btn refresh-btn"
//               title="Refresh chat system"
//             >
//               🔄 Refresh
//             </button>
            
//             <button 
//               onClick={handleSignOut} 
//               className="footer-btn signout-btn"
//               title="Sign out"
//             >
//               👋 Out
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Iko;