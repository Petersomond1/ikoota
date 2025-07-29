// ikootaclient/src/components/admin/Admin.jsx
import React, { useState, useEffect } from 'react';
import './admin.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from "react-router-dom";
import FullMembershipReviewControls from './FullMembershipReviewControls';

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
    } else if (path.includes('full-membership-review')) {
      // ✅ ADD: Handle full membership review route
      setSelectedItem('Full Membership Review');
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
// // RESPONSIVE ADMIN COMPONENT (CLEAN VERSION)
// // ikootaclient/src/components/admin/Admin.jsx
// // ==================================================

// import React, { useState, useEffect } from 'react';
// import './admin.css';
// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import { Outlet, useLocation } from "react-router-dom";
// import FullMembershipReviewControls from './FullMembershipReviewControls';


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
          
//           {/* ✅ Navbar component now contains all action buttons */}
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

