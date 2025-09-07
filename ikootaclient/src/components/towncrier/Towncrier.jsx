// ikootaclient/src/components/towncrier/Towncrier.jsx
// FIXED: Enhanced debug and correct status detection
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./towncrier.css";
import RevTopics from "./RevTopics";
import RevTeaching from "./RevTeaching";
import { useFetchTeachings } from "../service/useFetchTeachings";
import { useUser } from "../auth/UserStatus";
// ✅ NEW: AI Features Panel
import AIFeaturesPanel from '../shared/AIFeaturesPanel';

const Towncrier = () => {
  const { data: rawTeachings = [], isLoading, error, refetch } = useFetchTeachings();
  const [selectedTeaching, setSelectedTeaching] = useState(null);
  const { user, logout, isMember, isAuthenticated, isPending, getUserStatus, canAccessIko, canApplyForMembership } = useUser();
  const navigate = useNavigate();

  // ✅ ENHANCED DEBUG: Log all user status values
  useEffect(() => {
    console.log('🔍 Towncrier Debug - Full User State:', {
      user: user,
      isMember: isMember,
      isPending: isPending,
      isAuthenticated: isAuthenticated,
      getUserStatus: getUserStatus(),
      canAccessIko: canAccessIko(),
      canApplyForMembership: canApplyForMembership(),
      userMembershipStage: user?.membership_stage,
      userIsMember: user?.is_member,
      userRole: user?.role,
      userStatus: user?.status,
      userFinalStatus: user?.finalStatus
    });
  }, [user, isMember, isPending, isAuthenticated]);

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

  // ✅ FIXED: Navigation handlers with proper membership logic
  const handleNavigateToIko = () => {
    if (!isAuthenticated) {
      alert("Please sign in first to access member features.");
      navigate('/login');
      return;
    }

    // ✅ FIXED: Check actual member status
    const status = getUserStatus();
    
    console.log('🔍 Iko click - User status:', {
      status,
      canAccessIko: canAccessIko(),
      user: {
        membership_stage: user?.membership_stage,
        is_member: user?.is_member
      }
    });

    if (status === 'member' || canAccessIko()) {
      navigate('/iko');
      return;
    }

    // ✅ FIXED: For pre-members, suggest they apply for full membership
    if (status.startsWith('pre_member') || isPending()) {
      alert("Iko Chat is available to full members only. Apply for full membership to gain access to Iko Chat features.");
      return;
    }

    // For users who need initial application
    const shouldApply = window.confirm(
      "You are not yet a member! \n\nTo access the Iko Chat system, you need to become an approved member.\n\nWould you like to go to the application page now?"
    );
    if (shouldApply) {
      navigate('/applicationsurvey');
    }
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

  // ✅ FIXED: Handle Full Membership Application Logic
  const handleApplyForFullMembership = () => {
    if (!isAuthenticated) {
      alert("Please sign in first to apply for full membership.");
      navigate('/login');
      return;
    }

    // ✅ FIXED: Get current user status
    const status = getUserStatus();
    
    console.log('🔍 Full membership click - User status:', {
      status,
      isMember: isMember(),
      isPending: isPending(),
      canAccessIko: canAccessIko(),
      canApplyForMembership: canApplyForMembership(),
      user: {
        membership_stage: user?.membership_stage,
        is_member: user?.is_member,
        membershipApplicationStatus: user?.membershipApplicationStatus
      }
    });

    // ✅ FIXED: If user is already a full member, direct them to Iko
    if (status === 'member' || canAccessIko()) {
      navigate('/iko');
      return;
    }

    // ✅ FIXED: Handle pre-member states correctly
    if (status === 'pre_member_pending_upgrade') {
      alert('Your membership application is currently under review. You will be notified via email once a decision is made.');
      return;
    }

    if (status === 'pre_member_can_reapply') {
      navigate('/full-membership-info');
      return;
    }

    // ✅ FIXED: For regular pre-members who can apply
    if (status === 'pre_member' && canApplyForMembership()) {
      navigate('/full-membership-info');
      return;
    }

    // ✅ FIXED: For pre-members who cannot apply (shouldn't happen, but safety check)
    if (status === 'pre_member') {
      alert('Membership application is not available at this time. Please contact support if you believe this is an error.');
      return;
    }

    // ✅ FIXED: For users who need initial application first
    if (status === 'needs_application' || (!isPending() && !isMember())) {
      alert("You must complete the initial membership application first.");
      navigate('/applicationsurvey');
      return;
    }

    // Fallback
    alert('Unable to process membership application. Please contact support.');
  };

  // ✅ COMPLETELY REWRITTEN: User status determination based on backend values
  const getUserStatusInfo = () => {
    if (!isAuthenticated) {
      return { status: 'guest', label: 'Guest', color: 'gray' };
    }

    // ✅ ENHANCED DEBUG: Log exactly what we're working with
    const debugInfo = {
      userStatus: getUserStatus(),
      isMember: isMember(),
      isPending: isPending(),
      userRole: user?.role,
      userMembershipStage: user?.membership_stage,
      userIsMemberField: user?.is_member,
      userStatusField: user?.status,
      userFinalStatus: user?.finalStatus
    };
    console.log('🔍 getUserStatusInfo Debug:', debugInfo);

    // Get the canonical status from getUserStatus()
    const status = getUserStatus();

    // Admin users
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return { 
        status: 'admin', 
        label: `👑 ${user.role === 'super_admin' ? 'Super Admin' : 'Admin'}`, 
        color: 'purple' 
      };
    }

    // ✅ FIXED: Status determination based on the actual status string
    switch (status) {
      case 'member':
        return { status: 'full_member', label: '💎 Full Member', color: 'gold' };
      
      case 'pre_member':
      case 'pre_member_pending_upgrade':
      case 'pre_member_can_reapply':
        return { status: 'pre_member', label: '🌟 Pre-Member', color: 'blue' };
      
      case 'pending_verification':
        return { status: 'applicant', label: '⏳ Applicant', color: 'orange' };
      
      case 'denied':
        return { status: 'denied', label: '❌ Denied', color: 'red' };
      
      case 'needs_application':
        return { status: 'needs_application', label: '📝 Needs Application', color: 'orange' };
      
      default:
        return { status: 'authenticated', label: '👤 User', color: 'green' };
    }
  };

  const userStatus = getUserStatusInfo();

  // ✅ ENHANCED DEBUG: Log the final status decision
  console.log('🎯 Final Status Decision:', {
    userStatus,
    shouldShowBanner: isAuthenticated && isPending() && !isMember(),
    bannerConditions: {
      isAuthenticated,
      isPending: isPending(),
      isMember: isMember()
    }
  });

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
        <div className="nav-left" >
           <span   style={{
            fontWeight: 'bold',
            fontFamily: 'Poppins, Segoe UI, Arial, sans-serif',
            fontSize: '2.5rem',
            background: 'linear-gradient(90deg, #ff9800 0%, #2196f3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px'
          }}>The Towncrier </span>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontFamily: 'Arial, sans-serif', color: 'black', marginLeft: '20px', lineHeight: '1.2' }}>
          <span>-A Clarion Call-out to Real Men;</span>
          <span>-{user?.username || user?.email || 'User'}! Join us for it's time to Rebuild & Re-institute the world's Altar & Temples of the Land of the Gods, </span>
          <span>-Together, we'll again reconnect to the Spirits of the Gods & restart the almost lost, awaited civilization for eternity.</span>
          </div>
          
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

      {/* ✅ FIXED: Show banner only for pre-members (isPending=true, isMember=false) */}
      {isAuthenticated && isPending() && !isMember() && (
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
            {/* ✅ FIXED: Show full membership button only for pre-members who can apply */}
            {isAuthenticated && isPending() && !isMember() && canApplyForMembership() && (
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
              title={isMember() ? "Access Iko Chat" : "Apply for membership to access Iko Chat"}
            >
              💬 {isMember() ? "Iko" : "Join"}
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
                {!isPending() && !isMember() && (
                  <button 
                    onClick={handleApplyForMembership} 
                    className="footer-btn apply-btn"
                  >
                    📋 Apply
                  </button>
                )}
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="footer-btn membership-btn"
                >
                  📊 Dashboard
                </button>
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
// // FIXED: Enhanced debug and correct status detection
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
//   const { user, logout, isMember, isAuthenticated, isPending, getUserStatus } = useUser();
//   const navigate = useNavigate();

//   // ✅ ENHANCED DEBUG: Log all user status values
//   useEffect(() => {
//     console.log('🔍 Towncrier Debug - Full User State:', {
//       user: user,
//       isMember: isMember,
//       isPending: isPending,
//       isAuthenticated: isAuthenticated,
//       getUserStatus: getUserStatus(),
//       userMembershipStage: user?.membership_stage,
//       userIsMember: user?.is_member,
//       userRole: user?.role,
//       userStatus: user?.status,
//       userFinalStatus: user?.finalStatus
//     });
//   }, [user, isMember, isPending, isAuthenticated]);

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

//   // ✅ NEW: Banner detection logic
//   const hasBanners = useMemo(() => {
//     return isAuthenticated && (isPending || !isMember);
//   }, [isAuthenticated, isPending, isMember]);

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

//   // Handle Full Membership Application
//   const handleApplyForFullMembership = () => {
//     if (!isAuthenticated) {
//       alert("Please sign in first to apply for full membership.");
//       navigate('/login');
//       return;
//     }

//     // Check if user is pre-member (approved but not full member)
//     if (!isPending && !isMember) {
//       alert("You must complete the initial membership application first.");
//       navigate('/applicationsurvey');
//       return;
//     }

//     if (isMember) {
//       alert("You already have full membership access!");
//       navigate('/iko');
//       return;
//     }

//     // User is pre-member, can apply for full membership
//     navigate('/full-membership-info');
//   };

//   // ✅ COMPLETELY REWRITTEN: User status determination based on backend values
//   const getUserStatusInfo = () => {
//     if (!isAuthenticated) {
//       return { status: 'guest', label: 'Guest', color: 'gray' };
//     }

//     // ✅ ENHANCED DEBUG: Log exactly what we're working with
//     const debugInfo = {
//       userStatus: getUserStatus(),
//       isMember: isMember(),
//       isPending: isPending(),
//       userRole: user?.role,
//       userMembershipStage: user?.membership_stage,
//       userIsMemberField: user?.is_member,
//       userStatusField: user?.status,
//       userFinalStatus: user?.finalStatus
//     };
//     console.log('🔍 getUserStatusInfo Debug:', debugInfo);

//     // Get the canonical status from getUserStatus()
//     const status = getUserStatus();

//     // Admin users
//     if (user?.role === 'admin' || user?.role === 'super_admin') {
//       return { 
//         status: 'admin', 
//         label: `👑 ${user.role === 'super_admin' ? 'Super Admin' : 'Admin'}`, 
//         color: 'purple' 
//       };
//     }

//     // ✅ FIXED: Status determination based on the actual status string
//     switch (status) {
//       case 'member':
//         return { status: 'full_member', label: '💎 Full Member', color: 'gold' };
      
//       case 'pre_member':
//       case 'pre_member_pending_upgrade':
//       case 'pre_member_can_reapply':
//         return { status: 'pre_member', label: '🌟 Pre-Member', color: 'blue' };
      
//       case 'pending_verification':
//         return { status: 'applicant', label: '⏳ Applicant', color: 'orange' };
      
//       case 'denied':
//         return { status: 'denied', label: '❌ Denied', color: 'red' };
      
//       case 'needs_application':
//         return { status: 'needs_application', label: '📝 Needs Application', color: 'orange' };
      
//       default:
//         return { status: 'authenticated', label: '👤 User', color: 'green' };
//     }
//   };

//   const userStatus = getUserStatusInfo();

//   // ✅ ENHANCED DEBUG: Log the final status decision
//   console.log('🎯 Final Status Decision:', {
//     userStatus,
//     shouldShowBanner: isAuthenticated && isPending() && !isMember(),
//     bannerConditions: {
//       isAuthenticated,
//       isPending: isPending(),
//       isMember: isMember()
//     }
//   });

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
//       {/* Enhanced Navigation Bar */}
//       <div className="nav">
//         <div className="nav-left">
//           <span>Towncrier - Public Educational Content</span>
//           {isAuthenticated && (
//             <div className="user-status">
//               <span className="user-info">
//                 👤 {user?.username || user?.email || 'User'} 
//                 <span className={`status-badge ${userStatus.status}`} style={{color: userStatus.color}}>
//                   {userStatus.label}
//                 </span>
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

//       {/* ✅ FIXED: Show banner only for pre-members (isPending=true, isMember=false) */}
//       {isAuthenticated && isPending() && !isMember() && (
//         <div className="membership-banner">
//           <div className="banner-content">
//             <div className="banner-text">
//               <h3>🎓 Ready for Full Membership?</h3>
//               <p>
//                 As a pre-member, you can now apply for full membership to unlock the complete Ikoota experience 
//                 including chat access, commenting, and content creation!
//               </p>
//             </div>
//             <button 
//               onClick={handleApplyForFullMembership}
//               className="membership-application-btn"
//             >
//               📝 Apply for Full Membership
//             </button>
//           </div>
//         </div>
//       )}
      
//       {/* ✅ UPDATED: Viewport with banner detection */}
//       <div className={`towncrier_viewport ${hasBanners ? 'with-banners' : ''}`}>
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
      
//       {/* Enhanced Footer with Status-Aware Controls */}
//       <div className="footnote">
//         <div className="footer-left">
//           <span>Ikoota Educational Platform</span>
//           {selectedTeaching && (
//             <span> | {selectedTeaching.prefixed_id}</span>
//           )}
//         </div>
        
//         <div className="footer-center">
//           <span>{new Date().toLocaleString()}</span>
//           {isAuthenticated && (
//             <span className={`user-status-badge ${userStatus.status}`}>
//               {userStatus.label}
//             </span>
//           )}
//         </div>
        
//         <div className="footer-right">
//           <div className="footer-controls">
//             {/* ✅ FIXED: Show full membership button only for pre-members */}
//             {isAuthenticated && isPending() && !isMember() && (
//               <button 
//                 onClick={handleApplyForFullMembership} 
//                 className="footer-btn membership-btn"
//                 title="Apply for full membership to unlock all features"
//               >
//                 🎓 Full Member
//               </button>
//             )}

//             <button 
//               onClick={handleNavigateToIko} 
//               className="footer-btn iko-btn"
//               title={isMember() ? "Access Iko Chat" : "Apply for membership to access Iko Chat"}
//             >
//               💬 {isMember() ? "Iko" : "Join"}
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
//                 {!isPending() && !isMember() && (
//                   <button 
//                     onClick={handleApplyForMembership} 
//                     className="footer-btn apply-btn"
//                   >
//                     📋 Apply
//                   </button>
//                 )}
//                 <button 
//                   onClick={() => navigate('/dashboard')} 
//                   className="footer-btn membership-btn"
//                 >
//                   📊 Dashboard
//                 </button>
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