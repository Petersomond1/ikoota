// ikootaclient/src/components/admin/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';
import './sidbar.css';

const Sidebar = ({ selectedItem, setSelectedItem, isMobile, closeMobileMenu }) => {
  const location = useLocation();

  // ✅ ADD: Fetch pending full membership applications count
  const { data: pendingFullMembershipCount } = useQuery({
    queryKey: ['pendingFullMembershipCount'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/admin/membership/pending-count', { withCredentials: true });
        return data?.count || 0;
      } catch (error) {
        console.error('Failed to fetch pending full membership count:', error);
        return 0;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1
  });

  // ✅ UPDATED: Add Full Membership Review to sidebar items
  const sidebarItems = [
    { name: 'Dashboard', to: '', label: 'Dashboard', icon: '📊' },
    { name: 'Towncrier', to: 'towncrier', label: 'Towncrier', icon: '📢' },
    { name: 'Towncrier Controls', to: 'towncriercontrols', label: 'Towncrier Controls', icon: '🎛️' },
    { name: 'Iko', to: 'iko', label: 'Iko', icon: '🤖' },
    { name: 'Iko Controls', to: 'ikocontrols', label: 'Iko Controls', icon: '⚙️' },
    { name: 'AuthControls', to: 'authcontrols', label: 'AuthControls', icon: '🔐' },
    { name: 'SearchControls', to: 'searchcontrols', label: 'SearchControls', icon: '🔍' },
    { name: 'Reports', to: 'reports', label: 'Reports', icon: '📈' },
    { name: 'UserManagement', to: 'usermanagement', label: 'UserManagement', icon: '👥' },
    { name: 'AudienceClassMgr', to: 'audienceclassmgr', label: 'AudienceClassMgr', icon: '🎯' },
    // ✅ ADD: Full Membership Review item
    { 
      name: 'Full Membership Review', 
      to: 'full-membership-review', 
      label: 'Full Membership Review', 
      icon: '🎓',
      badge: pendingFullMembershipCount // Add badge count
    }
  ];

  const handleItemClick = (itemName) => {
    setSelectedItem(itemName);
    
    // Close mobile menu when item is clicked on mobile
    if (isMobile && closeMobileMenu) {
      setTimeout(() => {
        closeMobileMenu();
      }, 150); // Small delay for better UX
    }
  };

  return (
    <div className="admin_sidebar">
      {sidebarItems.map((item) => (
        <Link
          key={item.name}
          to={item.to}
          className={`admin_sidebar_item ${selectedItem === item.name ? 'active' : ''}`}
          onClick={() => handleItemClick(item.name)}
          data-discover="true"
        >
          {/* Icon */}
          <span className="sidebar-icon" style={{ marginRight: '8px' }}>
            {item.icon}
          </span>
          
          {/* Label */}
          <span className="sidebar-label">
            {item.label}
          </span>
          
          {/* ✅ ADD: Badge for pending count */}
          {item.badge && item.badge > 0 && (
            <span className="sidebar-badge">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;




// // ==================================================
// // RESPONSIVE SIDEBAR COMPONENT
// // ikootaclient/src/components/admin/Sidebar.jsx
// // ==================================================

// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import './sidbar.css';

// const Sidebar = ({ selectedItem, setSelectedItem, isMobile, closeMobileMenu }) => {
//   const location = useLocation();

//   const sidebarItems = [
//     { name: 'Dashboard', to: '', label: 'Dashboard', icon: '📊' },
//     { name: 'Towncrier', to: 'towncrier', label: 'Towncrier', icon: '📢' },
//     { name: 'Towncrier Controls', to: 'towncriercontrols', label: 'Towncrier Controls', icon: '🎛️' },
//     { name: 'Iko', to: 'iko', label: 'Iko', icon: '🤖' },
//     { name: 'Iko Controls', to: 'ikocontrols', label: 'Iko Controls', icon: '⚙️' },
//     { name: 'AuthControls', to: 'authcontrols', label: 'AuthControls', icon: '🔐' },
//     { name: 'SearchControls', to: 'searchcontrols', label: 'SearchControls', icon: '🔍' },
//     { name: 'Reports', to: 'reports', label: 'Reports', icon: '📈' },
//     { name: 'UserManagement', to: 'usermanagement', label: 'UserManagement', icon: '👥' },
//     { name: 'AudienceClassMgr', to: 'audienceclassmgr', label: 'AudienceClassMgr', icon: '🎯' }
//   ];

//   const handleItemClick = (itemName) => {
//     setSelectedItem(itemName);
    
//     // Close mobile menu when item is clicked on mobile
//     if (isMobile && closeMobileMenu) {
//       setTimeout(() => {
//         closeMobileMenu();
//       }, 150); // Small delay for better UX
//     }
//   };

//   return (
//     <div className="admin_sidebar">
//       {sidebarItems.map((item) => (
//         <Link
//           key={item.name}
//           to={item.to}
//           className={`admin_sidebar_item ${selectedItem === item.name ? 'active' : ''}`}
//           onClick={() => handleItemClick(item.name)}
//           data-discover="true"
//         >
//           {/* Optional: Add icons for better mobile experience */}
//           <span className="sidebar-icon" style={{ marginRight: '8px' }}>
//             {item.icon}
//           </span>
//           <span className="sidebar-label">
//             {item.label}
//           </span>
//         </Link>
//       ))}
//     </div>
//   );
// };

// export default Sidebar;


// // ==================================================
// // UPDATED: ikootaclient/src/components/admin/Sidebar.jsx
// // Keeping your original style, just adding active state functionality
// // ==================================================

// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import './sidbar.css';

// const Sidebar = ({ selectedItem, setSelectedItem }) => {
//   const location = useLocation();

//   const sidebarItems = [
//     { name: 'Dashboard', to: '', label: 'Dashboard' },
//     { name: 'Towncrier', to: 'towncrier', label: 'Towncrier' },
//     { name: 'Towncrier Controls', to: 'towncriercontrols', label: 'Towncrier Controls' },
//     { name: 'Iko', to: 'iko', label: 'Iko' },
//     { name: 'Iko Controls', to: 'ikocontrols', label: 'Iko Controls' },
//     { name: 'AuthControls', to: 'authcontrols', label: 'AuthControls' },
//     { name: 'SearchControls', to: 'searchcontrols', label: 'SearchControls' },
//     { name: 'Reports', to: 'reports', label: 'Reports' },
//     { name: 'UserManagement', to: 'usermanagement', label: 'UserManagement' },
//     { name: 'AudienceClassMgr', to: 'audienceclassmgr', label: 'AudienceClassMgr' }
//   ];

//   const handleItemClick = (itemName) => {
//     setSelectedItem(itemName);
//   };

//   return (
//     <div className="admin_sidebar">
//       {sidebarItems.map((item) => (
//         <Link
//           key={item.name}
//           to={item.to}
//           className={`admin_sidebar_item ${selectedItem === item.name ? 'active' : ''}`}
//           onClick={() => handleItemClick(item.name)}
//           data-discover="true"
//         >
//           {item.label}
//         </Link>
//       ))}
//     </div>
//   );
// };

// export default Sidebar;