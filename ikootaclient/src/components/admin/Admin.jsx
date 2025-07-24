// ==================================================
// RESPONSIVE ADMIN COMPONENT (CLEAN VERSION)
// ikootaclient/src/components/admin/Admin.jsx
// ==================================================

import React, { useState, useEffect } from 'react';
import './admin.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from "react-router-dom";

const Admin = () => {
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      // Close mobile menu when switching to desktop
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update selected item based on current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/admin' || path === '/admin/') {
      setSelectedItem('Dashboard');
    } else if (path.includes('towncrier')) {
      setSelectedItem(path.includes('controls') ? 'Towncrier Controls' : 'Towncrier');
    } else if (path.includes('iko')) {
      setSelectedItem(path.includes('controls') ? 'Iko Controls' : 'Iko');
    } else if (path.includes('authcontrols')) {
      setSelectedItem('AuthControls');
    } else if (path.includes('searchcontrols')) {
      setSelectedItem('SearchControls');
    } else if (path.includes('reports')) {
      setSelectedItem('Reports');
    } else if (path.includes('usermanagement')) {
      setSelectedItem('UserManagement');
    } else if (path.includes('audienceclassmgr')) {
      setSelectedItem('AudienceClassMgr');
    }
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle overlay click (close menu)
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className='adminContainer'>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div className={`adminSidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Sidebar Header */}
        {isMobile && (
          <div className="mobile-sidebar-header">
            <span className="mobile-sidebar-title">Admin Menu</span>
            <button 
              className="mobile-close-btn"
              onClick={toggleMobileMenu}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
        )}

        <Sidebar 
          selectedItem={selectedItem} 
          setSelectedItem={setSelectedItem}
          isMobile={isMobile}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className='headerContent'>
        <div className='adminNav'>
          {/* Mobile Menu Toggle Button */}
          {isMobile && (
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
          
          {/* ✅ Navbar component now contains all action buttons */}
          <Navbar />
        </div>
        
        <div className="mainContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Admin;


// // ==================================================
// // RESPONSIVE ADMIN COMPONENT WITH ACTION BUTTONS
// // ikootaclient/src/components/admin/Admin.jsx
// // ==================================================

// import React, { useState, useEffect } from 'react';
// import './admin.css';
// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import { Outlet, useLocation, useNavigate } from "react-router-dom";

// const Admin = () => {
//   const [selectedItem, setSelectedItem] = useState('Dashboard');
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [notificationCount, setNotificationCount] = useState(3); // Example notification count
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Check if device is mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth <= 768);
//       // Close mobile menu when switching to desktop
//       if (window.innerWidth > 768) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   // Update selected item based on current route
//   useEffect(() => {
//     const path = location.pathname;
    
//     if (path === '/admin' || path === '/admin/') {
//       setSelectedItem('Dashboard');
//     } else if (path.includes('towncrier')) {
//       setSelectedItem(path.includes('controls') ? 'Towncrier Controls' : 'Towncrier');
//     } else if (path.includes('iko')) {
//       setSelectedItem(path.includes('controls') ? 'Iko Controls' : 'Iko');
//     } else if (path.includes('authcontrols')) {
//       setSelectedItem('AuthControls');
//     } else if (path.includes('searchcontrols')) {
//       setSelectedItem('SearchControls');
//     } else if (path.includes('reports')) {
//       setSelectedItem('Reports');
//     } else if (path.includes('usermanagement')) {
//       setSelectedItem('UserManagement');
//     } else if (path.includes('audienceclassmgr')) {
//       setSelectedItem('AudienceClassMgr');
//     }
//   }, [location.pathname]);

//   // Close mobile menu when route changes
//   useEffect(() => {
//     if (isMobile) {
//       setIsMobileMenuOpen(false);
//     }
//   }, [location.pathname, isMobile]);

//   // Handle mobile menu toggle
//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   // Handle overlay click (close menu)
//   const handleOverlayClick = () => {
//     setIsMobileMenuOpen(false);
//   };

//   // Handle escape key press
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === 'Escape' && isMobileMenuOpen) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     document.addEventListener('keydown', handleEscape);
//     return () => document.removeEventListener('keydown', handleEscape);
//   }, [isMobileMenuOpen]);

//   // Prevent body scroll when mobile menu is open
//   useEffect(() => {
//     if (isMobileMenuOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }

//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isMobileMenuOpen]);

//   // ✅ Action button handlers
//   const handleNotifications = () => {
//     console.log('Notifications clicked');
//     // Reset notification count when clicked
//     setNotificationCount(0);
//     // Navigate to notifications page or show notifications dropdown
//     // navigate('/admin/notifications'); // Uncomment if you have a notifications route
//     alert('Notifications clicked! (Implement your notifications logic here)');
//   };

//   const handleSettings = () => {
//     console.log('Settings clicked');
//     // Navigate to settings page
//     navigate('/admin/settings');
//     // Or show settings modal/dropdown
//     // alert('Settings clicked! (Implement your settings logic here)');
//   };

//   const handleLogout = () => {
//     console.log('Logout clicked');
//     const confirmLogout = window.confirm('Are you sure you want to logout?');
//     if (confirmLogout) {
//       // Clear user session/tokens
//       localStorage.removeItem('authToken'); // Example
//       localStorage.removeItem('userRole'); // Example
//       sessionStorage.clear(); // Clear session storage
      
//       // Redirect to login page
//       navigate('/login');
      
//       // Or you might want to call an API to logout
//       // api.post('/auth/logout').then(() => navigate('/login'));
//     }
//   };

//   return (
//     <div className='adminContainer'>
//       {/* Mobile Overlay */}
//       {isMobile && (
//         <div 
//           className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
//           onClick={handleOverlayClick}
//         />
//       )}

//       {/* Sidebar */}
//       <div className={`adminSidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
//         {/* Mobile Sidebar Header */}
//         {isMobile && (
//           <div className="mobile-sidebar-header">
//             <span className="mobile-sidebar-title">Admin Menu</span>
//             <button 
//               className="mobile-close-btn"
//               onClick={toggleMobileMenu}
//               aria-label="Close menu"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <Sidebar 
//           selectedItem={selectedItem} 
//           setSelectedItem={setSelectedItem}
//           isMobile={isMobile}
//           closeMobileMenu={() => setIsMobileMenuOpen(false)}
//         />
//       </div>

//       <div className='headerContent'>
//         <div className='adminNav'>
//           {/* Mobile Menu Toggle Button */}
//           {isMobile && (
//             <button 
//               className="mobile-menu-toggle"
//               onClick={toggleMobileMenu}
//               aria-label="Toggle menu"
//             >
//               ☰
//             </button>
//           )}
          
//           {/* ✅ Navbar with Action Buttons Container */}
//           <div className="navbar-container">
//             <Navbar />
            
//             {/* ✅ Action Buttons */}
//             <div className="admin-action-buttons">
//               <button 
//                 className="action-btn notifications-btn" 
//                 onClick={handleNotifications}
//                 aria-label="Notifications"
//                 title="Notifications"
//               >
//                 🔔
//                 {notificationCount > 0 && (
//                   <span className="notification-badge">{notificationCount}</span>
//                 )}
//               </button>
              
//               <button 
//                 className="action-btn settings-btn" 
//                 onClick={handleSettings}
//                 aria-label="Settings"
//                 title="Settings"
//               >
//                 ⚙️
//               </button>
              
//               <button 
//                 className="action-btn logout-btn" 
//                 onClick={handleLogout}
//                 aria-label="Logout"
//                 title="Logout"
//               >
//                 🚪
//               </button>
//             </div>
//           </div>
//         </div>
        
//         <div className="mainContent">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Admin;



// // ==================================================
// // RESPONSIVE ADMIN COMPONENT
// // ikootaclient/src/components/admin/Admin.jsx
// // ==================================================

// import React, { useState, useEffect } from 'react';
// import './admin.css';
// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import { Outlet, useLocation } from "react-router-dom";

// const Admin = () => {
//   const [selectedItem, setSelectedItem] = useState('Dashboard');
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const location = useLocation();

//   // Check if device is mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth <= 768);
//       // Close mobile menu when switching to desktop
//       if (window.innerWidth > 768) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   // Update selected item based on current route
//   useEffect(() => {
//     const path = location.pathname;
    
//     if (path === '/admin' || path === '/admin/') {
//       setSelectedItem('Dashboard');
//     } else if (path.includes('towncrier')) {
//       setSelectedItem(path.includes('controls') ? 'Towncrier Controls' : 'Towncrier');
//     } else if (path.includes('iko')) {
//       setSelectedItem(path.includes('controls') ? 'Iko Controls' : 'Iko');
//     } else if (path.includes('authcontrols')) {
//       setSelectedItem('AuthControls');
//     } else if (path.includes('searchcontrols')) {
//       setSelectedItem('SearchControls');
//     } else if (path.includes('reports')) {
//       setSelectedItem('Reports');
//     } else if (path.includes('usermanagement')) {
//       setSelectedItem('UserManagement');
//     } else if (path.includes('audienceclassmgr')) {
//       setSelectedItem('AudienceClassMgr');
//     }
//   }, [location.pathname]);

//   // Close mobile menu when route changes
//   useEffect(() => {
//     if (isMobile) {
//       setIsMobileMenuOpen(false);
//     }
//   }, [location.pathname, isMobile]);

//   // Handle mobile menu toggle
//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   // Handle overlay click (close menu)
//   const handleOverlayClick = () => {
//     setIsMobileMenuOpen(false);
//   };

//   // Handle escape key press
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === 'Escape' && isMobileMenuOpen) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     document.addEventListener('keydown', handleEscape);
//     return () => document.removeEventListener('keydown', handleEscape);
//   }, [isMobileMenuOpen]);

//   // Prevent body scroll when mobile menu is open
//   useEffect(() => {
//     if (isMobileMenuOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }

//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isMobileMenuOpen]);

//   return (
//     <div className='adminContainer'>
//       {/* Mobile Overlay */}
//       {isMobile && (
//         <div 
//           className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
//           onClick={handleOverlayClick}
//         />
//       )}

//       {/* Sidebar */}
//       <div className={`adminSidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
//         {/* Mobile Sidebar Header */}
//         {isMobile && (
//           <div className="mobile-sidebar-header">
//             <span className="mobile-sidebar-title">Admin Menu</span>
//             <button 
//               className="mobile-close-btn"
//               onClick={toggleMobileMenu}
//               aria-label="Close menu"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <Sidebar 
//           selectedItem={selectedItem} 
//           setSelectedItem={setSelectedItem}
//           isMobile={isMobile}
//           closeMobileMenu={() => setIsMobileMenuOpen(false)}
//         />
//       </div>

//       <div className='headerContent'>
//         <div className='adminNav'>
//           {/* Mobile Menu Toggle Button */}
//           {isMobile && (
//             <button 
//               className="mobile-menu-toggle"
//               onClick={toggleMobileMenu}
//               aria-label="Toggle menu"
//             >
//               ☰
//             </button>
//           )}
          
//           <Navbar />
//         </div>
        
//         <div className="mainContent">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Admin;



// import React, { useState, useEffect } from 'react';
// import './admin.css';
// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import { Outlet, useLocation } from "react-router-dom";

// const Admin = () => {
//   const [selectedItem, setSelectedItem] = useState('Dashboard');
//   const location = useLocation();

//   // Update selected item based on current route
//   useEffect(() => {
//     const path = location.pathname;
    
//     // Simple route mapping - adjust these to match your exact routes
//     if (path === '/admin' || path === '/admin/') {
//       setSelectedItem('Dashboard');
//     } else if (path.includes('towncrier')) {
//       setSelectedItem(path.includes('controls') ? 'Towncrier Controls' : 'Towncrier');
//     } else if (path.includes('iko')) {
//       setSelectedItem(path.includes('controls') ? 'Iko Controls' : 'Iko');
//     } else if (path.includes('authcontrols')) {
//       setSelectedItem('AuthControls');
//     } else if (path.includes('searchcontrols')) {
//       setSelectedItem('SearchControls');
//     } else if (path.includes('reports')) {
//       setSelectedItem('Reports');
//     } else if (path.includes('usermanagement')) {
//       setSelectedItem('UserManagement');
//     } else if (path.includes('audienceclassmgr')) {
//       setSelectedItem('AudienceClassMgr');
//     }
//   }, [location.pathname]);

//   return (
//     <div className='adminContainer'>
//       <div className='adminSidebar'>
//         {/* ✅ ONLY CHANGE: Pass props to Sidebar */}
//         <Sidebar 
//           selectedItem={selectedItem} 
//           setSelectedItem={setSelectedItem} 
//         />
//       </div>

//       <div className='headerContent'>
//         <div className='adminNav'>
//           <Navbar />
//         </div>
        
//         <div className="mainContent">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Admin;


