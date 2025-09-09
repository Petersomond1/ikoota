// ikootaclient/src/components/admin/Sidebar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../service/api';
import './sidebar.css';

//NEEDS REPAIR after add of pendingFullMembershipCount 

const Sidebar = ({ selectedItem, setSelectedItem, isMobile, closeMobileMenu }) => {

  // ✅ Fetch pending membership applications count
  const { data: pendingMembershipCount } = useQuery({
    queryKey: ['pendingMembershipCount'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/membership/admin/stats', { 
          withCredentials: true 
        });
        return data?.data?.pending_initial + data?.data?.pending_full || 0;
      } catch (error) {
        console.error('Failed to fetch pending membership count:', error);
        return 0;
      }
    },
    refetchInterval: 120000, // Refresh every 2 minutes (was 30 seconds)
    refetchOnWindowFocus: false,
    staleTime: 60000, // Data stays fresh for 1 minute
    retry: 1
  });

 // ✅ FIXED: Use correct endpoint based on your backend routes
  const { data: pendingFullMembershipCount } = useQuery({
    queryKey: ['pendingFullMembershipCount'],
    queryFn: async () => {
      try {
        // Option 1: Use the full membership stats endpoint
        const { data } = await api.get('/membership/admin/full-membership-stats', { 
          withCredentials: true 
        });
        return data?.data?.pending_full_applications || data?.pending_full_applications || 0;
      } catch (error) {
        console.error('Failed to fetch pending full membership count:', error);
        
        // Option 2: Fallback to applications endpoint with filtering
        try {
          const { data: fallbackData } = await api.get('/membership/admin/applications?status=pending&type=full_membership', { 
            withCredentials: true 
          });
          return fallbackData?.data?.pagination?.total_items || 0;
        } catch (fallbackError) {
          console.error('Fallback API call also failed:', fallbackError);
          
          // Option 3: Final fallback - return 0 but log for debugging
          console.log('📊 Using fallback count of 0 for pending full memberships');
          return 0;
        }
      }
    },
    refetchInterval: 150000, // Refresh every 2.5 minutes (was 30 seconds)
    refetchOnWindowFocus: false,
    staleTime: 90000, // Data stays fresh for 1.5 minutes
    retry: 1
  });

  // ✅ Fetch pending surveys count
  const { data: pendingSurveysCount } = useQuery({
    queryKey: ['pendingSurveysCount'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/survey/admin/stats', { 
          withCredentials: true 
        });
        return data?.data?.pending || 0;
      } catch (error) {
        console.error('Failed to fetch pending surveys count:', error);
        return 0;
      }
    },
    refetchInterval: 180000, // Refresh every 3 minutes (was 30 seconds)
    refetchOnWindowFocus: false,
    staleTime: 120000, // Data stays fresh for 2 minutes
    retry: 1
  });

  // ✅ UPDATED: Add new components to sidebar items
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
    // ✅ ADD: Membership Review item
    {
      name: 'Membership Review',
      to: 'membership-review',
      label: 'Membership Review',
      icon: '🎓',
      badge: pendingMembershipCount // Add badge count
    },
    // ✅ ADD: Survey Controls item
    {
      name: 'Survey Controls',
      to: 'survey-controls',
      label: 'Survey Controls',
      icon: '📋',
      badge: pendingSurveysCount // Add badge count
    },
    // ✅ ADD: Converse ID Controls item
    {
      name: 'ConverseIdControls',
      to: 'converseidcontrols',
      label: 'Converse ID Controls',
      icon: '🔐',
    },
    // ✅ ADD: Mentorship Controls item
    {
      name: 'MentorshipControls',
      to: 'mentorshipcontrols',
      label: 'Mentorship Controls',
      icon: '🏛️',
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

Sidebar.propTypes = {
  selectedItem: PropTypes.string.isRequired,
  setSelectedItem: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  closeMobileMenu: PropTypes.func.isRequired
};

export default Sidebar;





