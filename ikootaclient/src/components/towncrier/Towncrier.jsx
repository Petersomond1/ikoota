// ikootaclient/src/components/towncrier/Towncrier.jsx
// Enhanced with Full Membership Application Button and Banner Detection
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./towncrier.css";
import RevTopics from "./RevTopics";
import RevTeaching from "./RevTeaching";
import { useFetchTeachings } from "../service/useFetchTeachings";
import { useUser } from "../auth/UserStatus";

const Towncrier = () => {
  const { data: rawTeachings = [], isLoading, error, refetch } = useFetchTeachings();
  const [selectedTeaching, setSelectedTeaching] = useState(null);
  const { user, logout, isMember, isAuthenticated, isPending } = useUser();
  const navigate = useNavigate();

  // Memoize enhanced teachings to prevent unnecessary recalculations
  const enhancedTeachings = useMemo(() => {
    try {
      const teachingsArray = Array.isArray(rawTeachings) ? rawTeachings : 
                            (rawTeachings?.data && Array.isArray(rawTeachings.data)) ? rawTeachings.data : [];

      if (teachingsArray.length === 0) return [];

      const enhanced = teachingsArray.map(teaching => ({
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || teaching.title || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
        author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
      }));
      
      enhanced.sort((a, b) => {
        const aDate = new Date(a.display_date);
        const bDate = new Date(b.display_date);
        return bDate - aDate;
      });
      
      return enhanced;
    } catch (error) {
      console.error('Error processing teachings data:', error);
      return [];
    }
  }, [rawTeachings]);

  // ✅ NEW: Banner detection logic
  const hasBanners = useMemo(() => {
    return isAuthenticated && (isPending || !isMember);
  }, [isAuthenticated, isPending, isMember]);

  useEffect(() => {
    if (enhancedTeachings.length > 0 && !selectedTeaching) {
      setSelectedTeaching(enhancedTeachings[0]);
    }
  }, [enhancedTeachings.length]);

  useEffect(() => {
    if (enhancedTeachings.length === 0) {
      setSelectedTeaching(null);
    }
  }, [enhancedTeachings.length]);

  const handleSelectTeaching = (teaching) => {
    try {
      const enhancedTeaching = {
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || teaching.title || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
        author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
      };
      
      setSelectedTeaching(enhancedTeaching);
    } catch (error) {
      console.error('Error selecting teaching:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Navigation handlers
  const handleNavigateToIko = () => {
    if (!isAuthenticated) {
      alert("Please sign in first to access member features.");
      navigate('/login');
      return;
    }

    if (!isMember) {
      const shouldApply = window.confirm(
        "You are not yet a member! \n\nTo access the Iko Chat system, you need to become an approved member.\n\nWould you like to go to the application page now?"
      );
      if (shouldApply) {
        navigate('/applicationsurvey');
      }
      return;
    }

    navigate('/iko');
  };

  const handleSignOut = () => {
    const confirmSignOut = window.confirm("Are you sure you want to sign out?");
    if (confirmSignOut) {
      logout();
      navigate('/');
    }
  };

  const handleApplyForMembership = () => {
    if (!isAuthenticated) {
      alert("Please sign in first to apply for membership.");
      navigate('/login');
      return;
    }
    navigate('/applicationsurvey');
  };

  // Handle Full Membership Application
  const handleApplyForFullMembership = () => {
    if (!isAuthenticated) {
      alert("Please sign in first to apply for full membership.");
      navigate('/login');
      return;
    }

    // Check if user is pre-member (approved but not full member)
    if (!isPending && !isMember) {
      alert("You must complete the initial membership application first.");
      navigate('/applicationsurvey');
      return;
    }

    if (isMember) {
      alert("You already have full membership access!");
      navigate('/iko');
      return;
    }

    // User is pre-member, can apply for full membership
    navigate('/full-membership-info');
  };

  // Determine user status for display
  const getUserStatusInfo = () => {
    if (!isAuthenticated) return { status: 'guest', label: 'Guest', color: 'gray' };
    if (isMember) return { status: 'full_member', label: '💎 Full Member', color: 'gold' };
    if (isPending) return { status: 'pre_member', label: '🌟 Pre-Member', color: 'blue' };
    return { status: 'applicant', label: '⏳ Applicant', color: 'orange' };
  };

  const userStatus = getUserStatusInfo();

  if (isLoading) {
    return (
      <div className="towncrier_container">
        <div className="nav">
          <div className="nav-left">
            <span>Towncrier - Public Educational Content</span>
            <span className="status-badge loading">Loading...</span>
          </div>
        </div>
        <div className="towncrier_viewport">
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading educational content...</p>
          </div>
        </div>
        <div className="footnote">Ikoota Educational Platform</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="towncrier_container">
        <div className="nav">
          <div className="nav-left">
            <span>Towncrier - Public Educational Content</span>
            <span className="status-badge error">Error</span>
          </div>
        </div>
        <div className="towncrier_viewport">
          <div className="error-message">
            <h3>Unable to Load Content</h3>
            <p style={{color: 'red'}}>Error: {error.message || 'Failed to fetch teachings'}</p>
            <button onClick={handleRefresh} className="retry-btn">
              🔄 Try Again
            </button>
          </div>
        </div>
        <div className="footnote">Ikoota Educational Platform</div>
      </div>
    );
  }

  return (
    <div className="towncrier_container">
      {/* Enhanced Navigation Bar */}
      <div className="nav">
        <div className="nav-left">
          <span>Towncrier - Public Educational Content</span>
          {isAuthenticated && (
            <div className="user-status">
              <span className="user-info">
                👤 {user?.username || user?.email || 'User'} 
                <span className={`status-badge ${userStatus.status}`} style={{color: userStatus.color}}>
                  {userStatus.label}
                </span>
              </span>
            </div>
          )}
        </div>
        


        
        <div className="nav-right">
          <span className="content-count">
            📚 {enhancedTeachings.length} Resources
          </span>
          <button onClick={handleRefresh} className="refresh-btn">
            🔄
          </button>
        </div>
      </div>

      {/* Full Membership Application Banner for Pre-Members */}
      {isAuthenticated && isPending && (
        <div className="membership-banner">
          <div className="banner-content">
            <div className="banner-text">
              <h3>🎓 Ready for Full Membership?</h3>
              <p>
                As a pre-member, you can now apply for full membership to unlock the complete Ikoota experience 
                including chat access, commenting, and content creation!
              </p>
            </div>
            <button 
              onClick={handleApplyForFullMembership}
              className="membership-application-btn"
            >
              📝 Apply for Full Membership
            </button>
          </div>
        </div>
      )}

      {/* Access Level Information
      {isAuthenticated && (
        <div className="access-level-info">
          <div className="access-content">
            {isMember ? (
              <div className="full-member-info">
                <span className="access-icon">💎</span>
                <span>Full Member - Complete access to all features including Iko chat system</span>
                <button onClick={() => navigate('/iko')} className="access-btn">
                  💬 Access Iko Chat
                </button>
              </div>
            ) : isPending ? (
              <div className="pre-member-info">
                <span className="access-icon">🌟</span>
                <span>Pre-Member - Read-only access to educational content</span>
                <div className="access-restrictions">
                  <span className="restriction">❌ No commenting</span>
                  <span className="restriction">❌ No chat access</span>
                  <span className="restriction">❌ No content creation</span>
                </div>
              </div>
            ) : (
              <div className="applicant-info">
                <span className="access-icon">⏳</span>
                <span>Application under review - Limited access during evaluation</span>
              </div>
            )}
          </div>
        </div>
      )} */}
      
      {/* ✅ UPDATED: Viewport with banner detection */}
      <div className={`towncrier_viewport ${hasBanners ? 'with-banners' : ''}`}>
        <RevTopics 
          teachings={enhancedTeachings} 
          onSelect={handleSelectTeaching}
          selectedTeaching={selectedTeaching}
        />
                
        <RevTeaching 
          teaching={selectedTeaching} 
          allTeachings={enhancedTeachings}
          onSelectNext={handleSelectTeaching}
        />
      </div>
      
      {/* Enhanced Footer with Status-Aware Controls */}
      <div className="footnote">
        <div className="footer-left">
          <span>Ikoota Educational Platform</span>
          {selectedTeaching && (
            <span> | {selectedTeaching.prefixed_id}</span>
          )}
        </div>
        
        <div className="footer-center">
          <span>{new Date().toLocaleString()}</span>
          {isAuthenticated && (
            <span className={`user-status-badge ${userStatus.status}`}>
              {userStatus.label}
            </span>
          )}
        </div>
        
        <div className="footer-right">
          <div className="footer-controls">
            {/* Full Membership Application Button - Only for Pre-Members */}
            {isAuthenticated && isPending && (
              <button 
                onClick={handleApplyForFullMembership} 
                className="footer-btn membership-btn"
                title="Apply for full membership to unlock all features"
              >
                🎓 Full Member
              </button>
            )}

            <button 
              onClick={handleNavigateToIko} 
              className="footer-btn iko-btn"
              title={isMember ? "Access Iko Chat" : "Apply for membership to access Iko Chat"}
            >
              💬 {isMember ? "Iko" : "Join"}
            </button>
            
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="footer-btn login-btn"
                >
                  🔑 In
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="footer-btn signup-btn"
                >
                  📝 Up
                </button>
              </>
            ) : (
              <>
                {!isPending && !isMember && (
                  <button 
                    onClick={handleApplyForMembership} 
                    className="footer-btn apply-btn"
                  >
                    📋 Apply
                  </button>
                )}
                <button 
                  onClick={handleSignOut} 
                  className="footer-btn signout-btn"
                >
                  👋 Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Towncrier;




// // ikootaclient/src/components/towncrier/Towncrier.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import "./towncrier.css";
// import RevTopics from "./RevTopics";
// import RevTeaching from "./RevTeaching";
// import { useFetchTeachings } from "../service/useFetchTeachings";
// import { useUser } from "../auth/UserStatus";

// const Towncrier = () => {
//   const { data: rawTeachings = [], isLoading, error, refetch } = useFetchTeachings();
//   const [selectedTeaching, setSelectedTeaching] = useState(null);
//   const { user, logout, isMember, isAuthenticated } = useUser();
//   const navigate = useNavigate();

//   // Memoize enhanced teachings to prevent unnecessary recalculations
//   const enhancedTeachings = useMemo(() => {
//     try {
//       const teachingsArray = Array.isArray(rawTeachings) ? rawTeachings : 
//                             (rawTeachings?.data && Array.isArray(rawTeachings.data)) ? rawTeachings.data : [];

//       if (teachingsArray.length === 0) return [];

//       const enhanced = teachingsArray.map(teaching => ({
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//         author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//       }));
      
//       enhanced.sort((a, b) => {
//         const aDate = new Date(a.display_date);
//         const bDate = new Date(b.display_date);
//         return bDate - aDate;
//       });
      
//       return enhanced;
//     } catch (error) {
//       console.error('Error processing teachings data:', error);
//       return [];
//     }
//   }, [rawTeachings]);

//   useEffect(() => {
//     if (enhancedTeachings.length > 0 && !selectedTeaching) {
//       setSelectedTeaching(enhancedTeachings[0]);
//     }
//   }, [enhancedTeachings.length]);

//   useEffect(() => {
//     if (enhancedTeachings.length === 0) {
//       setSelectedTeaching(null);
//     }
//   }, [enhancedTeachings.length]);

//   const handleSelectTeaching = (teaching) => {
//     try {
//       const enhancedTeaching = {
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//         author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//       };
      
//       setSelectedTeaching(enhancedTeaching);
//     } catch (error) {
//       console.error('Error selecting teaching:', error);
//     }
//   };

//   const handleRefresh = () => {
//     refetch();
//   };

//   // Navigation handlers
//   const handleNavigateToIko = () => {
//     if (!isAuthenticated) {
//       alert("Please sign in first to access member features.");
//       navigate('/login');
//       return;
//     }

//     if (!isMember) {
//       const shouldApply = window.confirm(
//         "You are not yet a member! \n\nTo access the Iko Chat system, you need to become an approved member.\n\nWould you like to go to the application page now?"
//       );
//       if (shouldApply) {
//         navigate('/applicationsurvey');
//       }
//       return;
//     }

//     navigate('/iko');
//   };

//   const handleSignOut = () => {
//     const confirmSignOut = window.confirm("Are you sure you want to sign out?");
//     if (confirmSignOut) {
//       logout();
//       navigate('/');
//     }
//   };

//   const handleApplyForMembership = () => {
//     if (!isAuthenticated) {
//       alert("Please sign in first to apply for membership.");
//       navigate('/login');
//       return;
//     }
//     navigate('/applicationsurvey');
//   };

//   if (isLoading) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <div className="nav-left">
//             <span>Towncrier - Public Educational Content</span>
//             <span className="status-badge loading">Loading...</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="loading-message">
//             <div className="loading-spinner"></div>
//             <p>Loading educational content...</p>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <div className="nav-left">
//             <span>Towncrier - Public Educational Content</span>
//             <span className="status-badge error">Error</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="error-message">
//             <h3>Unable to Load Content</h3>
//             <p style={{color: 'red'}}>Error: {error.message || 'Failed to fetch teachings'}</p>
//             <button onClick={handleRefresh} className="retry-btn">
//               🔄 Try Again
//             </button>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   return (
//     <div className="towncrier_container">
//       {/* Simplified Navigation Bar - No Buttons */}
//       <div className="nav">
//         <div className="nav-left">
//           <span>Towncrier - Public Educational Content</span>
//           {isAuthenticated && (
//             <div className="user-status">
//               <span className="user-info">
//                 👤 {user?.username || user?.email || 'User'} 
//                 {isMember ? (
//                   <span className="status-badge member">✅ Member</span>
//                 ) : (
//                   <span className="status-badge pending">⏳ Pending</span>
//                 )}
//               </span>
//             </div>
//           )}
//         </div>
        
//         <div className="nav-right">
//           <span className="content-count">
//             📚 {enhancedTeachings.length} Resources
//           </span>
//           <button onClick={handleRefresh} className="refresh-btn">
//             🔄
//           </button>
//         </div>
//       </div>
      
//       <div className="towncrier_viewport">
//         <RevTopics 
//           teachings={enhancedTeachings} 
//           onSelect={handleSelectTeaching}
//           selectedTeaching={selectedTeaching}
//         />
                
//         <RevTeaching 
//           teaching={selectedTeaching} 
//           allTeachings={enhancedTeachings}
//           onSelectNext={handleSelectTeaching}
//         />
//       </div>
      
//       {/* Compact Footer with Minimal Buttons */}
//       <div className="footnote">
//         <div className="footer-left">
//           <span>Ikoota Educational Platform</span>
//           {selectedTeaching && (
//             <span> | {selectedTeaching.prefixed_id}</span>
//           )}
//         </div>
        
//         <div className="footer-center">
//           <span>{new Date().toLocaleString()}</span>
//         </div>
        
//         <div className="footer-right">
//           <div className="footer-controls">
//             <button 
//               onClick={handleNavigateToIko} 
//               className="footer-btn iko-btn"
//               title={isMember ? "Access Iko Chat" : "Apply for membership to access Iko Chat"}
//             >
//               💬 {isMember ? "Iko" : "Join"}
//             </button>
            
//             {!isAuthenticated ? (
//               <>
//                 <button 
//                   onClick={() => navigate('/login')} 
//                   className="footer-btn login-btn"
//                 >
//                   🔑 In
//                 </button>
//                 <button 
//                   onClick={() => navigate('/signup')} 
//                   className="footer-btn signup-btn"
//                 >
//                   📝 Up
//                 </button>
//               </>
//             ) : (
//               <>
//                 {!isMember && (
//                   <button 
//                     onClick={handleApplyForMembership} 
//                     className="footer-btn apply-btn"
//                   >
//                     📋 Apply
//                   </button>
//                 )}
//                 <button 
//                   onClick={handleSignOut} 
//                   className="footer-btn signout-btn"
//                 >
//                   👋 Out
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Towncrier;



// // ikootaclient/src/components/towncrier/Towncrier.jsx
// import React, { useState, useEffect, useRef } from "react";
// import "./towncrier.css";
// import RevTopics from "./RevTopics";
// import RevTeaching from "./RevTeaching";
// import { useFetchTeachings } from "../service/useFetchTeachings";

// const Towncrier = () => {
//   const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
//   const [selectedTeaching, setSelectedTeaching] = useState(null);
//   const [enhancedTeachings, setEnhancedTeachings] = useState([]);
  
//   // Use ref to track if we've set initial selection
//   const hasSetInitialSelection = useRef(false);

//   // Process teachings data when it changes
//   useEffect(() => {
//     try {
//       // Ensure teachings is an array
//       const teachingsArray = Array.isArray(teachings) ? teachings : 
//                             (teachings?.data && Array.isArray(teachings.data)) ? teachings.data : [];

//       if (teachingsArray.length > 0) {
//         const enhanced = teachingsArray.map(teaching => ({
//           ...teaching,
//           content_type: 'teaching',
//           content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//           prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//           display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//           // Ensure author field exists
//           author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//         }));
        
//         // Sort by most recent first
//         enhanced.sort((a, b) => {
//           const aDate = new Date(a.display_date);
//           const bDate = new Date(b.display_date);
//           return bDate - aDate;
//         });
        
//         setEnhancedTeachings(enhanced);
        
//         // Set initial selection only once when data first loads
//         if (!hasSetInitialSelection.current && enhanced.length > 0) {
//           setSelectedTeaching(enhanced[0]);
//           hasSetInitialSelection.current = true;
//         }
//       } else {
//         setEnhancedTeachings([]);
//         setSelectedTeaching(null);
//         hasSetInitialSelection.current = false;
//       }
//     } catch (error) {
//       console.error('Error processing teachings data:', error);
//       console.log('Raw teachings data:', teachings);
//       setEnhancedTeachings([]);
//       setSelectedTeaching(null);
//       hasSetInitialSelection.current = false;
//     }
//   }, [teachings]); // Only depend on teachings, not selectedTeaching

//   // Reset initial selection flag when teachings change
//   useEffect(() => {
//     hasSetInitialSelection.current = false;
//   }, [teachings]);

//   const handleSelectTeaching = (teaching) => {
//     try {
//       // Ensure the selected teaching has enhanced structure
//       const enhancedTeaching = {
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//         author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//       };
      
//       setSelectedTeaching(enhancedTeaching);
//     } catch (error) {
//       console.error('Error selecting teaching:', error);
//     }
//   };

//   const handleRefresh = () => {
//     hasSetInitialSelection.current = false;
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <span>Towncrier - Public Educational Content</span>
//           <div className="nav-status">
//             <span className="status-badge loading">Loading...</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="loading-message">
//             <div className="loading-spinner"></div>
//             <p>Loading educational content...</p>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <span>Towncrier - Public Educational Content</span>
//           <div className="nav-status">
//             <span className="status-badge error">Error</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="error-message">
//             <h3>Unable to Load Content</h3>
//             <p style={{color: 'red'}}>Error: {error.message || 'Failed to fetch teachings'}</p>
//             <button onClick={handleRefresh} className="retry-btn">
//               🔄 Try Again
//             </button>
//             <div className="error-details">
//               <details>
//                 <summary>Technical Details</summary>
//                 <pre>{JSON.stringify(error, null, 2)}</pre>
//               </details>
//             </div>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   return (
//     <div className="towncrier_container">
//       <div className="nav">
//         <span>Towncrier - Public Educational Content</span>
//         <div className="nav-stats">
//           <span className="content-count">
//             📚 {enhancedTeachings.length} Educational Resources
//           </span>
//           <button onClick={handleRefresh} className="refresh-btn" title="Refresh content">
//             🔄 Refresh
//           </button>
//         </div>
//       </div>
      
//       <div className="towncrier_viewport">
//         {/* Left side: Topics List */}
//         <RevTopics 
//           teachings={enhancedTeachings} 
//           onSelect={handleSelectTeaching}
//           selectedTeaching={selectedTeaching}
//         />
                
//         {/* Right side: Selected Teaching Details */}
//         <RevTeaching 
//           teaching={selectedTeaching} 
//           allTeachings={enhancedTeachings}
//           onSelectNext={(nextTeaching) => handleSelectTeaching(nextTeaching)}
//         />
//       </div>
      
//       <div className="footnote">
//         <span>Ikoota Educational Platform - Public Content</span>
//         {selectedTeaching && (
//           <span> | Viewing: {selectedTeaching.prefixed_id}</span>
//         )}
//         <span> | Last updated: {new Date().toLocaleString()}</span>
//       </div>
//     </div>
//   );
// };

// export default Towncrier;


// import React, { useState, useEffect } from "react";
// import "./towncrier.css";
// import RevTopics from "./RevTopics";
// import RevTeaching from "./RevTeaching";
// import { useFetchTeachings } from "../service/useFetchTeachings";

// const Towncrier = () => {
//   const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
//   const [selectedTeaching, setSelectedTeaching] = useState(null);
//   const [enhancedTeachings, setEnhancedTeachings] = useState([]);

//   // Enhance teachings data with consistent structure
//   useEffect(() => {
//     if (teachings.length > 0) {
//       const enhanced = teachings.map(teaching => ({
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt,
//         // Ensure author field exists
//         author: teaching.user_id || teaching.author || 'Admin'
//       }));
      
//       // Sort by most recent first
//       enhanced.sort((a, b) => {
//         const aDate = new Date(a.display_date);
//         const bDate = new Date(b.display_date);
//         return bDate - aDate;
//       });
      
//       setEnhancedTeachings(enhanced);
      
//       // Set the latest teaching as the default selection if none selected
//       if (!selectedTeaching && enhanced.length > 0) {
//         setSelectedTeaching(enhanced[0]);
//       }
//     }
//   }, [teachings, selectedTeaching]);

//   const handleSelectTeaching = (teaching) => {
//     try {
//       // Ensure the selected teaching has enhanced structure
//       const enhancedTeaching = {
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt,
//         author: teaching.user_id || teaching.author || 'Admin'
//       };
      
//       setSelectedTeaching(enhancedTeaching);
//     } catch (error) {
//       console.error('Error selecting teaching:', error);
//     }
//   };

//   const handleRefresh = () => {
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">Navbar: Towncrier</div>
//         <div className="towncrier_viewport">
//           <div className="loading-message">
//             <p>Loading teachings...</p>
//           </div>
//         </div>
//         <div className="footnote">Footnote</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">Navbar: Towncrier</div>
//         <div className="towncrier_viewport">
//           <div className="error-message">
//             <p style={{color: 'red'}}>Error fetching teachings: {error.message}</p>
//             <button onClick={handleRefresh}>Retry</button>
//           </div>
//         </div>
//         <div className="footnote">Footnote</div>
//       </div>
//     );
//   }

//   return (
//     <div className="towncrier_container">
//       <div className="nav">
//         <span>Navbar: Towncrier</span>
//         <div className="nav-stats">
//           <span>Total Teachings: {enhancedTeachings.length}</span>
//           <button onClick={handleRefresh} className="refresh-btn">
//             Refresh
//           </button>
//         </div>
//       </div>
      
//       <div className="towncrier_viewport">
//         {/* Left side: Topics List */}
//         <RevTopics 
//           teachings={enhancedTeachings} 
//           onSelect={handleSelectTeaching}
//           selectedTeaching={selectedTeaching}
//         />
                
//         {/* Right side: Selected Teaching Details */}
//         <RevTeaching 
//           teaching={selectedTeaching} 
//           allTeachings={enhancedTeachings}
//           onSelectNext={(nextTeaching) => handleSelectTeaching(nextTeaching)}
//         />
//       </div>
      
//       <div className="footnote">
//         <span>Footnote - Last updated: {new Date().toLocaleString()}</span>
//         {selectedTeaching && (
//           <span> | Selected: {selectedTeaching.prefixed_id}</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Towncrier;