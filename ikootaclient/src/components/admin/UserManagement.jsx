// ikootaclient/src/components/admin/UserManagement.jsx
// ==================================================
// This component merges ALL functionalities from both:
// - /auth/UserManagement.jsx (legacy user management)
// - /admin/UserManagement.jsx (converse ID & identity masking)
// - NEW: Two-stage membership system management

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './userManagement.css';
import { 
  generateUniqueConverseId, 
  generateRandomId, 
  validateIdFormat, 
  formatIdForDisplay 
} from '../service/idGenerationService';

// ==================================================
// API FUNCTIONS - ALL SYSTEMS
// ==================================================

// NEW: Two-Stage Membership System APIs
// const fetchMembershipOverview = async () => {
//   const { data } = await api.get('/membership/admin/membership-overview');
//   return data;
// };

const fetchMembershipOverview = async () => {
  try {
    const { data } = await api.get('/membership/admin/membership-overview');
    return data?.overview || {};
  } catch (error) {
    console.error('❌ Error fetching membership overview:', error);
    return {};
  }
};


// const fetchPendingApplications = async (filters = {}) => {
//   const params = new URLSearchParams(filters);
//   const { data } = await api.get(`/membership/admin/pending-applications?${params}`);
//   return data;
// };


const fetchPendingApplications = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/membership/admin/pending-applications?${params}`);
    return data || { applications: [], pagination: { total: 0, page: 1, totalPages: 1 } };
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    return { applications: [], pagination: { total: 0, page: 1, totalPages: 1 } };
  }
};


const bulkApproveApplications = async ({ userIds, action, adminNotes }) => {
  const { data } = await api.post('/membership/admin/bulk-approve', {
    userIds,
    action,
    adminNotes
  });
  return data;
};
// THis fxn also exist at membershipcontroller.js
const updateApplicationStatus = async ({ userId, status, adminNotes }) => {
  const { data } = await api.put(`/membership/admin/update-user-status/${userId}`, {
    status,
    adminNotes
  });
  return data;
};



// Legacy APIs (preserve existing functionality)
// const fetchUsers = async () => {
//   const { data } = await api.get('/admin/users');
//   return data;
// };



// const fetchUsers = async () => {
//   try {
//     const { data } = await api.get('/admin/users');
//     // Handle different response formats
//     if (data?.success && Array.isArray(data.users)) {
//       return data.users;
//     }
//     if (Array.isArray(data)) {
//       return data;
//     }
//     return [];
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return [];
//   }
// };


const fetchUsers = async () => {
  try {
    const { data } = await api.get('/admin/users');
    console.log('👤 Users API Response:', data);
    
    // Handle different response formats safely
    if (data?.success && Array.isArray(data.users)) {
      return data.users;
    }
    if (data?.users && Array.isArray(data.users)) {
      return data.users;
    }
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('⚠️ Unexpected users API response format:', data);
    return [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    // Return empty array instead of throwing to prevent crash
    return [];
  }
};

// const fetchClasses = async () => {
//   const { data } = await api.get('/classes');
//   return data;
// };

const fetchClasses = async () => {
  try {
    const { data } = await api.get('/classes');
    return Array.isArray(data?.classes) ? data.classes : [];
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    return [];
  }
};


// const fetchMentors = async () => {
//   const { data } = await api.get('/admin/mentors');
//   return data;
// };

const fetchMentors = async () => {
  try {
    const { data } = await api.get('/admin/mentors');
    return Array.isArray(data?.mentors) ? data.mentors : [];
  } catch (error) {
    console.error('❌ Error fetching mentors:', error);
    return [];
  }
};


// const fetchReports = async () => {
//   const { data } = await api.get('/admin/reports');
//   return data;
// };

const fetchReports = async () => {
  try {
    const { data } = await api.get('/admin/reports');
    console.log('📊 Reports API Response:', data);
    
    // Handle different response formats safely
    if (data?.success && Array.isArray(data.reports)) {
      return data.reports;
    }
    if (data?.reports && Array.isArray(data.reports)) {
      return data.reports;
    }
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('⚠️ Unexpected reports API response format:', data);
    return [];
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    // Return empty array instead of throwing to prevent crash
    return [];
  }
};

const updateUser = async ({ id, formData }) => {
  const { data } = await api.put(`/admin/update-user/${id}`, formData);
  return data;
};

const maskUserIdentity = async ({ userId, adminConverseId, mentorConverseId, classId }) => {
  const { data } = await api.post('/admin/mask-identity', {
    userId,
    adminConverseId,
    mentorConverseId,
    classId
  });
  return data;
};

const deleteUser = async (userId) => {
  const { data } = await api.delete(`/admin/delete-user/${userId}`);
  return data;
};

const createUser = async (userData) => {
  const { data } = await api.post('/admin/create-user', userData);
  return data;
};

const sendNotification = async ({ userId, message, type }) => {
  const { data } = await api.post('/admin/send-notification', {
    userId,
    message,
    type
  });
  return data;
};

const updateReportStatus = async ({ reportId, status, adminNotes }) => {
  const { data } = await api.put(`/admin/update-report/${reportId}`, {
    status,
    adminNotes
  });
  return data;
};

const exportUserData = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/admin/export-users?${params}`);
  return data;
};

// ==================================================

// ==================================================
// MAIN COMPONENT - STATE AND HOOKS
// ==================================================

const UserManagement = () => {
  const queryClient = useQueryClient();
  
  // Tab management - expanded to include all systems
  const [activeTab, setActiveTab] = useState('membership_pending');
  
  // NEW: Two-stage membership state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'submitted_at',
    sortOrder: 'ASC'
  });

  // Legacy state (preserve existing functionality)
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    converse_id: '',
    mentor_id: '',
    class_id: '',
    is_member: '',
    role: '',
    username: '',
    email: '',
    password: '',
    isblocked: false,
    isbanned: false
  });

  // Converse ID & Identity masking state
  const [membershipData, setMembershipData] = useState({
    mentorConverseId: '',
    classId: '',
  });

  // Notification state
  const [notificationData, setNotificationData] = useState({
    userId: '',
    message: '',
    type: 'info'
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    format: 'csv',
    includePersonalData: false,
    dateFrom: '',
    dateTo: ''
  });

  // ==================================================
  // REACT QUERY HOOKS - ALL SYSTEMS
  // ==================================================

  // NEW: Two-stage membership queries
  const { data: membershipOverview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['membershipOverview'],
    queryFn: fetchMembershipOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: pendingApplications, isLoading: applicationsLoading, error: applicationsError } = useQuery({
    queryKey: ['pendingApplications', activeTab, filters],
    queryFn: () => fetchPendingApplications({
      ...filters,
      stage: activeTab === 'membership_pending' ? 'initial' : 'full_membership'
    }),
    enabled: activeTab === 'membership_pending' || activeTab === 'membership_full',
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });

  // Legacy queries (preserve ALL existing functionality)
  const { data: users, isLoading: usersLoading, isError: usersError, error: usersErrorData } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    staleTime: 10 * 60 * 1000, // 10 minutes (classes don't change often)
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });

  const { data: mentors, isLoading: mentorsLoading, error: mentorsError } = useQuery({
    queryKey: ['mentors'],
    queryFn: fetchMentors,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000 // 15 minutes
  });

  const { data: reports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });

  // ==================================================
  // MUTATIONS - ALL SYSTEMS
  // ==================================================

  // NEW: Two-stage membership mutations
  const bulkMutation = useMutation({
    mutationFn: bulkApproveApplications,
    onSuccess: () => {
      alert('Bulk action completed successfully!');
      queryClient.invalidateQueries(['pendingApplications']);
      queryClient.invalidateQueries(['membershipOverview']);
      queryClient.invalidateQueries(['users']);
      setSelectedUsers([]);
      setBulkAction('');
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('Bulk action error:', error);
      alert(`Bulk action failed: ${error?.response?.data?.message || error.message}`);
    }
  });

  const membershipUpdateMutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      alert('Application updated successfully!');
      queryClient.invalidateQueries(['pendingApplications']);
      queryClient.invalidateQueries(['membershipOverview']);
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      console.error('Membership update error:', error);
      alert(`Update failed: ${error?.response?.data?.message || error.message}`);
    }
  });

  // Legacy mutations (preserve existing functionality)
  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      alert('User updated successfully!');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['reports']);
      queryClient.invalidateQueries(['membershipOverview']);
      setSelectedUser(null);
      resetFormData();
    },
    onError: (error) => {
      console.error('User update error:', error);
      alert(`Failed to update user: ${error?.response?.data?.message || error.message}`);
    }
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      alert('User created successfully!');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['membershipOverview']);
      setShowCreateForm(false);
      resetFormData();
    },
    onError: (error) => {
      console.error('User creation error:', error);
      alert(`Failed to create user: ${error?.response?.data?.message || error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      alert('User deleted successfully!');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['membershipOverview']);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('User deletion error:', error);
      alert(`Failed to delete user: ${error?.response?.data?.message || error.message}`);
    }
  });

  const maskIdentityMutation = useMutation({
    mutationFn: maskUserIdentity,
    onSuccess: (data) => {
      alert(`Identity masked successfully! Converse ID: ${data.converseId}`);
      queryClient.invalidateQueries(['users']);
      setSelectedUser(null);
      setMembershipData({ mentorConverseId: '', classId: '' });
    },
    onError: (error) => {
      console.error('Identity masking error:', error);
      alert(`Failed to mask identity: ${error?.response?.data?.message || error.message}`);
    }
  });

  const notificationMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: () => {
      alert('Notification sent successfully!');
      setShowNotificationModal(false);
      setNotificationData({ userId: '', message: '', type: 'info' });
    },
    onError: (error) => {
      console.error('Notification error:', error);
      alert(`Failed to send notification: ${error?.response?.data?.message || error.message}`);
    }
  });

  const reportUpdateMutation = useMutation({
    mutationFn: updateReportStatus,
    onSuccess: () => {
      alert('Report updated successfully!');
      queryClient.invalidateQueries(['reports']);
      setSelectedReport(null);
    },
    onError: (error) => {
      console.error('Report update error:', error);
      alert(`Failed to update report: ${error?.response?.data?.message || error.message}`);
    }
  });

  const exportMutation = useMutation({
    mutationFn: exportUserData,
    onSuccess: (data) => {
      // Handle file download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
      alert('Export completed successfully!');
    },
    onError: (error) => {
      console.error('Export error:', error);
      alert(`Export failed: ${error?.response?.data?.message || error.message}`);
    }
  });

  // ==================================================

  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  // Filter users by legacy membership status (preserve existing logic)
  // const filteredUsers = users?.filter(user => {
  //   switch (activeTab) {
  //     case 'legacy_pending':
  //       return user.is_member === 'applied';
  //     case 'legacy_granted':
  //       return user.is_member === 'granted';
  //     case 'legacy_declined':
  //       return user.is_member === 'declined';
  //     default:
  //       return true;
  //   }
  // });

  // Replace the existing filteredUsers with this safer version:
const filteredUsers = React.useMemo(() => {
  const userArray = Array.isArray(users) ? users : [];
  
  switch (activeTab) {
    case 'legacy_pending':
      return userArray.filter(user => user.is_member === 'applied');
    case 'legacy_granted':
      return userArray.filter(user => user.is_member === 'granted');
    case 'legacy_declined':
      return userArray.filter(user => user.is_member === 'declined');
    default:
      return userArray;
  }
}, [users, activeTab]);

  // Reset form data
  const resetFormData = () => {
    setFormData({
      converse_id: '',
      mentor_id: '',
      class_id: '',
      is_member: '',
      role: '',
      username: '',
      email: '',
      password: '',
      isblocked: false,
      isbanned: false
    });
  };

  // Populate form with user data for editing
  const populateFormData = (user) => {
    setFormData({
      converse_id: user.converse_id || '',
      mentor_id: user.mentor_id || '',
      class_id: user.class_id || '',
      is_member: user.is_member || '',
      role: user.role || '',
      username: user.username || '',
      email: user.email || '',
      password: '', // Never populate password
      isblocked: user.isblocked || false,
      isbanned: user.isbanned || false
    });
  };

  // Format user display name
  const formatUserDisplayName = (user) => {
    if (user.is_identity_masked && user.converse_id) {
      return formatIdForDisplay ? formatIdForDisplay(user.converse_id) : user.converse_id;
    }
    return user.username || 'Unknown User';
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'granted':
        return 'status-success';
      case 'rejected':
      case 'declined':
        return 'status-danger';
      case 'pending':
      case 'applied':
        return 'status-warning';
      default:
        return 'status-default';
    }
  };

  // Validate form data
  const validateFormData = (data, isCreating = false) => {
    const errors = [];
    
    if (isCreating) {
      if (!data.username?.trim()) errors.push('Username is required');
      if (!data.email?.trim()) errors.push('Email is required');
      if (!data.password?.trim()) errors.push('Password is required');
      if (data.email && !/\S+@\S+\.\S+/.test(data.email)) errors.push('Invalid email format');
    }
    
    if (data.converse_id && !validateIdFormat(data.converse_id, 'user')) {
      errors.push('Invalid Converse ID format (should be OTO#XXXXXX)');
    }
    
    if (data.class_id && !validateIdFormat(data.class_id, 'class')) {
      errors.push('Invalid Class ID format');
    }
    
    return errors;
  };

  // ==================================================
  // EVENT HANDLERS - ALL SYSTEMS
  // ==================================================

  // NEW: Two-stage membership handlers
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === pendingApplications?.applications?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingApplications?.applications?.map(app => app.user_id) || []);
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.length === 0) {
      alert('Please select users and an action');
      return;
    }

    const confirmMessage = `Are you sure you want to ${bulkAction} ${selectedUsers.length} users?`;
    if (window.confirm(confirmMessage)) {
      bulkMutation.mutate({
        userIds: selectedUsers,
        action: bulkAction,
        adminNotes
      });
    }
  };

  const handleMembershipUpdate = (userId, status) => {
    const confirmMessage = `Are you sure you want to ${status} this application?`;
    if (window.confirm(confirmMessage)) {
      membershipUpdateMutation.mutate({
        userId,
        status,
        adminNotes: prompt('Add admin notes (optional):') || ''
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Legacy handlers (preserve ALL existing functionality)
  const handleUserUpdate = (userId, updateData) => {
    const confirmMessage = `Are you sure you want to update this user?`;
    if (window.confirm(confirmMessage)) {
      updateMutation.mutate({ id: userId, formData: updateData });
    }
  };

  const handleUserDelete = (userId, username) => {
    const confirmMessage = `Are you sure you want to DELETE user "${username}"? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(userId);
    }
  };

  const handleGrantMembership = (user) => {
    if (!membershipData.classId) {
      alert('Please select a class for the user.');
      return;
    }

    const adminConverseId = 'OTO#ADMIN1'; // This should come from your auth context

    maskIdentityMutation.mutate({
      userId: user.id,
      adminConverseId,
      mentorConverseId: membershipData.mentorConverseId || null,
      classId: membershipData.classId
    });
  };

  const handleDeclineMembership = (userId) => {
    const confirmMessage = 'Are you sure you want to decline this membership application?';
    if (window.confirm(confirmMessage)) {
      handleUserUpdate(userId, { is_member: 'declined' });
    }
  };

  // Both ID generation methods (preserve both systems)
  const handleGenerateConverseId = async () => {
    try {
      const newId = await generateUniqueConverseId();
      setFormData((prev) => ({ ...prev, converse_id: newId }));
    } catch (error) {
      console.error('Failed to generate converse ID:', error);
      alert('Failed to generate unique converse ID. Please try again.');
    }
  };

  const handleGenerateRandomId = () => {
    const newId = generateRandomId();
    setFormData((prev) => ({ ...prev, converse_id: newId }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateFormData(formData, showCreateForm);
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    if (showCreateForm) {
      // Creating new user
      createMutation.mutate(formData);
    } else {
      // Updating existing user
      if (!selectedUser) {
        alert('Please select a user to update.');
        return;
      }
      updateMutation.mutate({ id: selectedUser.id, formData });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleMembershipDataChange = (e) => {
    setMembershipData({ ...membershipData, [e.target.name]: e.target.value });
  };

  const handleNotificationDataChange = (e) => {
    setNotificationData({ ...notificationData, [e.target.name]: e.target.value });
  };

  const handleExportDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExportFilters(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSendNotification = () => {
    if (!notificationData.userId || !notificationData.message) {
      alert('Please select a user and enter a message.');
      return;
    }
    notificationMutation.mutate(notificationData);
  };

  const handleExportUsers = () => {
    exportMutation.mutate(exportFilters);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    populateFormData(user);
    setShowCreateForm(false);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    resetFormData();
    setShowCreateForm(true);
  };

  const handleCancelForm = () => {
    setSelectedUser(null);
    setShowCreateForm(false);
    resetFormData();
  };

  const handleToggleUserStatus = (userId, field, currentValue) => {
    const newValue = !currentValue;
    const action = newValue ? 'enable' : 'disable';
    const fieldName = field === 'isblocked' ? 'blocking' : 'ban';
    
    const confirmMessage = `Are you sure you want to ${action} ${fieldName} for this user?`;
    if (window.confirm(confirmMessage)) {
      handleUserUpdate(userId, { [field]: newValue });
    }
  };

  const handleReportAction = (reportId, action, reportedUserId = null) => {
    let confirmMessage = '';
    let updateData = {};

    switch (action) {
      case 'resolve':
        confirmMessage = 'Mark this report as resolved?';
        updateData = { status: 'resolved' };
        break;
      case 'ban':
        confirmMessage = 'Ban the reported user?';
        handleUserUpdate(reportedUserId, { isbanned: true });
        updateData = { status: 'resolved' };
        break;
      case 'block':
        confirmMessage = 'Block the reported user?';
        handleUserUpdate(reportedUserId, { isblocked: true });
        updateData = { status: 'resolved' };
        break;
      default:
        return;
    }

    if (window.confirm(confirmMessage)) {
      reportUpdateMutation.mutate({
        reportId,
        ...updateData,
        adminNotes: prompt('Add admin notes (optional):') || ''
      });
    }
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries();
    alert('Data refreshed successfully!');
  };

  // ==================================================

  // ==================================================
  // RENDER COMPONENT
  // ==================================================

  return (
    <div className="user-management-container">
      <div className="header-section">
        <h2>Complete User Management System</h2>
        <div className="header-actions">
          <button onClick={handleCreateUser} className="btn-primary">
            Create New User
          </button>
          <button onClick={() => setShowNotificationModal(true)} className="btn-secondary">
            Send Notification
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn-info">
            Export Data
          </button>
          <button onClick={handleRefreshData} className="btn-refresh">
            Refresh All
          </button>
        </div>
      </div>

      {/* Enhanced Tab Navigation - ALL SYSTEMS */}
      <div className="tab-navigation">
        {/* NEW: Two-Stage Membership Tabs */}
        <button 
          className={`tab-btn ${activeTab === 'membership_overview' ? 'active' : ''}`} 
          onClick={() => setActiveTab('membership_overview')}
        >
          <span>Membership Overview</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'membership_pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('membership_pending')}
        >
          <span>Initial Applications</span>
          <span className="tab-count">({pendingApplications?.pagination?.total || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'membership_full' ? 'active' : ''}`} 
          onClick={() => setActiveTab('membership_full')}
        >
          <span>Full Membership</span>
        </button>

        {/* Legacy System Tabs (preserve existing) */}
        <button 
          className={`tab-btn ${activeTab === 'legacy_pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('legacy_pending')}
        >
          <span>Legacy Pending</span>
          <span className="tab-count">({users?.filter(u => u.is_member === 'applied').length || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'legacy_granted' ? 'active' : ''}`} 
          onClick={() => setActiveTab('legacy_granted')}
        >
          <span>Active Members</span>
          <span className="tab-count">({users?.filter(u => u.is_member === 'granted').length || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'legacy_declined' ? 'active' : ''}`} 
          onClick={() => setActiveTab('legacy_declined')}
        >
          <span>Declined</span>
          <span className="tab-count">({users?.filter(u => u.is_member === 'declined').length || 0})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          <span>Reports</span>
          <span className="tab-count">({reports?.length || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'all_users' ? 'active' : ''}`} 
          onClick={() => setActiveTab('all_users')}
        >
          <span>All Users</span>
          <span className="tab-count">({users?.length || 0})</span>
        </button>
      </div>

      {/* ==================================================
          NEW: MEMBERSHIP OVERVIEW TAB
      ================================================== */}
      {activeTab === 'membership_overview' && (
        <div className="overview-section">
          <h3>Two-Stage Membership Overview</h3>
          {overviewLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading overview...</p>
            </div>
          ) : overviewError ? (
            <div className="error-state">
              <p>Error loading overview: {overviewError.message}</p>
              <button onClick={() => queryClient.invalidateQueries(['membershipOverview'])}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card pending">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h4>Pending Initial Applications</h4>
                    <span className="stat-number">{membershipOverview?.overview?.pending_initial || 0}</span>
                  </div>
                </div>
                <div className="stat-card pre-member">
                  <div className="stat-icon">👤</div>
                  <div className="stat-content">
                    <h4>Pre-Members</h4>
                    <span className="stat-number">{membershipOverview?.overview?.pre_members || 0}</span>
                  </div>
                </div>
                <div className="stat-card full-member">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h4>Full Members</h4>
                    <span className="stat-number">{membershipOverview?.overview?.full_members || 0}</span>
                  </div>
                </div>
                <div className="stat-card pending-full">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <h4>Pending Full Membership</h4>
                    <span className="stat-number">{membershipOverview?.overview?.pending_full_membership || 0}</span>
                  </div>
                </div>
                <div className="stat-card declined">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <h4>Total Declined</h4>
                    <span className="stat-number">{membershipOverview?.overview?.declined || 0}</span>
                  </div>
                </div>
                <div className="stat-card total">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h4>Total Users</h4>
                    <span className="stat-number">{users?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Dashboard */}
              <div className="quick-actions-dashboard">
                <h4>Quick Actions</h4>
                <div className="action-grid">
                  <div className="action-card" onClick={() => setActiveTab('membership_pending')}>
                    <div className="action-icon">📋</div>
                    <h5>Review Applications</h5>
                    <p>{membershipOverview?.overview?.pending_initial || 0} pending</p>
                  </div>
                  <div className="action-card" onClick={() => setActiveTab('reports')}>
                    <div className="action-icon">🚨</div>
                    <h5>Handle Reports</h5>
                    <p>{reports?.filter(r => r.status === 'pending').length || 0} pending</p>
                  </div>
                  <div className="action-card" onClick={handleCreateUser}>
                    <div className="action-icon">➕</div>
                    <h5>Create User</h5>
                    <p>Add new user</p>
                  </div>
                  <div className="action-card" onClick={() => setShowExportModal(true)}>
                    <div className="action-icon">📊</div>
                    <h5>Export Data</h5>
                    <p>Download reports</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Summary */}
              <div className="recent-activity">
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-time">Today</span>
                    <span className="activity-desc">
                      {pendingApplications?.applications?.filter(app => 
                        new Date(app.submitted_at).toDateString() === new Date().toDateString()
                      ).length || 0} new applications submitted
                    </span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">This Week</span>
                    <span className="activity-desc">
                      {users?.filter(u => u.is_member === 'granted' && 
                        new Date(u.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length || 0} memberships granted
                    </span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">Pending</span>
                    <span className="activity-desc">
                      {reports?.filter(r => r.status === 'pending').length || 0} reports awaiting review
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
//============================================


    {/* ==================================================
          NEW: TWO-STAGE MEMBERSHIP APPLICATION MANAGEMENT
      ================================================== */}
      {(activeTab === 'membership_pending' || activeTab === 'membership_full') && (
        <div className="membership-applications-section">
          {/* Section Header */}
          <div className="section-header">
            <h3>
              {activeTab === 'membership_pending' ? 'Initial Applications' : 'Full Membership Applications'}
            </h3>
            <div className="section-stats">
              <span className="total-count">
                Total: {pendingApplications?.pagination?.total || 0}
              </span>
              <span className="selected-count">
                Selected: {selectedUsers.length}
              </span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="filters-section">
            <div className="filter-row">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by username, email, or ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="filter-controls">
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="sort-select"
                >
                  <option value="submitted_at">Sort by Date</option>
                  <option value="username">Sort by Username</option>
                  <option value="days_pending">Sort by Days Pending</option>
                  <option value="status">Sort by Status</option>
                </select>
                
                <select 
                  value={filters.sortOrder} 
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="order-select"
                >
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
                
                <select 
                  value={filters.limit} 
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="limit-select"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bulk-actions">
            <div className="bulk-controls">
              <div className="bulk-selection">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedUsers.length === pendingApplications?.applications?.length && pendingApplications?.applications?.length > 0}
                  onChange={handleSelectAll}
                />
                <label htmlFor="select-all">
                  Select All ({selectedUsers.length} of {pendingApplications?.applications?.length || 0} selected)
                </label>
              </div>
              
              <div className="bulk-action-controls">
                <select 
                  value={bulkAction} 
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bulk-action-select"
                >
                  <option value="">Select Bulk Action</option>
                  <option value="approve">✅ Approve Selected</option>
                  <option value="reject">❌ Reject Selected</option>
                  <option value="pending">⏳ Mark as Pending</option>
                </select>
                
                <textarea
                  placeholder="Admin notes (optional but recommended for bulk actions)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="admin-notes"
                />
                
                <button 
                  onClick={handleBulkAction}
                  disabled={bulkMutation.isLoading || selectedUsers.length === 0 || !bulkAction}
                  className={`bulk-action-btn ${bulkAction ? `btn-${bulkAction}` : ''}`}
                >
                  {bulkMutation.isLoading ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Processing...
                    </>
                  ) : (
                    `${bulkAction ? bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1) : 'Apply'} to ${selectedUsers.length} users`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {applicationsLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading applications...</p>
            </div>
          ) : applicationsError ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading applications: {applicationsError.message}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['pendingApplications'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          ) : !pendingApplications?.applications?.length ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h4>No Applications Found</h4>
              <p>
                {filters.search 
                  ? `No applications match your search for "${filters.search}"`
                  : `No ${activeTab === 'membership_pending' ? 'initial' : 'full membership'} applications at this time.`
                }
              </p>
              {filters.search && (
                <button 
                  onClick={() => handleFilterChange('search', '')}
                  className="clear-search-btn"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="applications-list">
              {pendingApplications.applications.map((application) => (
                <div key={application.application_id} className="application-card">
                  <div className="application-header">
                    <div className="selection-area">
                      <input
                        type="checkbox"
                        id={`user-${application.user_id}`}
                        checked={selectedUsers.includes(application.user_id)}
                        onChange={() => handleUserSelect(application.user_id)}
                      />
                    </div>
                    
                    <div className="user-info">
                      <h4 className="username">{application.username}</h4>
                      <p className="email">{application.email}</p>
                      <span className="user-id">ID: {application.user_id}</span>
                    </div>
                    
                    <div className="application-meta">
                      <div className="timing-info">
                        <span className="days-pending">
                          {application.days_pending} day{application.days_pending !== 1 ? 's' : ''} pending
                        </span>
                        <span className="submitted-date">
                          Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="application-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Stage:</strong> 
                        <span>{application.membership_stage || 'Initial Application'}</span>
                      </div>
                      {application.ticket && (
                        <div className="detail-item">
                          <strong>Ticket:</strong> 
                          <span className="ticket-number">{application.ticket}</span>
                        </div>
                      )}
                      {application.previous_rejections && (
                        <div className="detail-item warning">
                          <strong>Previous Rejections:</strong> 
                          <span>{application.previous_rejections}</span>
                        </div>
                      )}
                      {application.admin_notes && (
                        <div className="detail-item">
                          <strong>Admin Notes:</strong> 
                          <span className="admin-note">{application.admin_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="application-answers">
                    <details className="answers-details">
                      <summary className="answers-summary">
                        View Application Answers
                        <span className="expand-icon">▼</span>
                      </summary>
                      <div className="answers-content">
                        {typeof application.answers === 'string' ? (
                          <pre className="answers-text">{application.answers}</pre>
                        ) : (
                          <pre className="answers-json">
                            {JSON.stringify(application.answers, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  </div>

                  <div className="application-actions">
                    <button 
                      onClick={() => handleMembershipUpdate(application.user_id, 'approve')}
                      className="btn-approve"
                      disabled={membershipUpdateMutation.isLoading}
                      title="Approve this application"
                    >
                      <span className="btn-icon">✅</span>
                      Approve
                    </button>
                    <button 
                      onClick={() => handleMembershipUpdate(application.user_id, 'reject')}
                      className="btn-reject"
                      disabled={membershipUpdateMutation.isLoading}
                      title="Reject this application"
                    >
                      <span className="btn-icon">❌</span>
                      Reject
                    </button>
                    <button 
                      onClick={() => handleMembershipUpdate(application.user_id, 'pending')}
                      className="btn-pending"
                      disabled={membershipUpdateMutation.isLoading}
                      title="Mark as pending for further review"
                    >
                      <span className="btn-icon">⏳</span>
                      Pending
                    </button>
                    <button 
                      onClick={() => {
                        setNotificationData(prev => ({ ...prev, userId: application.user_id }));
                        setShowNotificationModal(true);
                      }}
                      className="btn-notify"
                      title="Send notification to user"
                    >
                      <span className="btn-icon">📧</span>
                      Notify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pendingApplications?.pagination && pendingApplications.pagination.totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-controls">
                <button 
                  onClick={() => handleFilterChange('page', 1)}
                  disabled={filters.page <= 1}
                  className="pagination-btn first"
                  title="First page"
                >
                  ⏮️
                </button>
                <button 
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="pagination-btn prev"
                  title="Previous page"
                >
                  ◀️
                </button>
                
                <div className="pagination-info">
                  <span className="current-page">
                    Page {pendingApplications.pagination.page} of {pendingApplications.pagination.totalPages}
                  </span>
                  <span className="total-items">
                    ({pendingApplications.pagination.total} total items)
                  </span>
                </div>
                
                <button 
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= pendingApplications.pagination.totalPages}
                  className="pagination-btn next"
                  title="Next page"
                >
                  ▶️
                </button>
                <button 
                  onClick={() => handleFilterChange('page', pendingApplications.pagination.totalPages)}
                  disabled={filters.page >= pendingApplications.pagination.totalPages}
                  className="pagination-btn last"
                  title="Last page"
                >
                  ⏭️
                </button>
              </div>
              
              <div className="page-size-selector">
                <label htmlFor="page-size">Items per page:</label>
                <select 
                  id="page-size"
                  value={filters.limit} 
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      //=========================================

       {/* ==================================================
          LEGACY: CONVERSE ID & IDENTITY MASKING SYSTEM
      ================================================== */}
      {(activeTab === 'legacy_pending' || activeTab === 'legacy_granted' || activeTab === 'legacy_declined') && (
        <div className="legacy-users-section">
          <div className="section-header">
            <h3>
              {activeTab.replace('legacy_', '').charAt(0).toUpperCase() + activeTab.replace('legacy_', '').slice(1)} Users
            </h3>
            <div className="section-actions">
              <button onClick={handleCreateUser} className="btn-create">
                <span className="btn-icon">➕</span>
                Create New User
              </button>
              <button 
                onClick={() => setShowExportModal(true)} 
                className="btn-export"
              >
                <span className="btn-icon">📊</span>
                Export Users
              </button>
            </div>
          </div>
          
          {usersLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          )}
          
          {usersError && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading users: {usersErrorData?.message || 'Unknown error'}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['users'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          )}
          
          {!usersLoading && !usersError && (
            <>
              {filteredUsers?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👤</div>
                  <h4>No Users Found</h4>
                  <p>No users found in this category.</p>
                </div>
              ) : (
                <div className="user-list">
                  {filteredUsers?.map((user) => (
                    <div key={user.id} className="user-card">
                      <div className="user-header">
                        <div className="user-avatar">
                          {(user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="user-basic-info">
                          <h4 className="user-display-name">
                            {formatUserDisplayName(user)}
                          </h4>
                          <p className="user-email">{user.email}</p>
                          <span className="user-id">ID: {user.id}</span>
                        </div>
                        <div className="user-status-badges">
                          <span className={`status-badge ${getStatusBadgeClass(user.is_member)}`}>
                            {user.is_member}
                          </span>
                          {user.isblocked && <span className="status-badge blocked">Blocked</span>}
                          {user.isbanned && <span className="status-badge banned">Banned</span>}
                          {user.is_identity_masked && <span className="status-badge masked">Identity Masked</span>}
                        </div>
                      </div>

                      <div className="user-details">
                        <div className="details-grid">
                          {user.converse_id && (
                            <div className="detail-item">
                              <strong>Converse ID:</strong> 
                              <span className="converse-id">
                                {user.converse_id}
                                <span className={`validation-icon ${validateIdFormat(user.converse_id, 'user') ? 'valid' : 'invalid'}`}>
                                  {validateIdFormat(user.converse_id, 'user') ? '✓' : '✗'}
                                </span>
                              </span>
                            </div>
                          )}
                          {user.class_id && (
                            <div className="detail-item">
                              <strong>Class:</strong> 
                              <span className="class-id">
                                {user.class_id}
                                <span className={`validation-icon ${validateIdFormat(user.class_id, 'class') ? 'valid' : 'invalid'}`}>
                                  {validateIdFormat(user.class_id, 'class') ? '✓' : '✗'}
                                </span>
                              </span>
                            </div>
                          )}
                          {user.mentor_id && (
                            <div className="detail-item">
                              <strong>Mentor:</strong> 
                              <span className="mentor-id">{user.mentor_id}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <strong>Role:</strong> 
                            <span className={`role-badge role-${user.role}`}>{user.role}</span>
                          </div>
                          <div className="detail-item">
                            <strong>Membership Stage:</strong> 
                            <span className="membership-stage">{user.membership_stage || 'N/A'}</span>
                          </div>
                          {user.created_at && (
                            <div className="detail-item">
                              <strong>Joined:</strong> 
                              <span className="join-date">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          )}
                          {user.last_login && (
                            <div className="detail-item">
                              <strong>Last Login:</strong> 
                              <span className="last-login">{new Date(user.last_login).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {user.is_identity_masked && (
                          <div className="privacy-notice">
                            <span className="privacy-icon">🔒</span>
                            <em>Identity is masked for privacy protection</em>
                          </div>
                        )}
                      </div>

                      <div className="user-actions">
                        {activeTab === 'legacy_pending' && (
                          <>
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="btn-setup"
                              title="Setup membership for this user"
                            >
                              <span className="btn-icon">⚙️</span>
                              Setup Membership
                            </button>
                            <button 
                              onClick={() => handleDeclineMembership(user.id)}
                              className="btn-decline"
                              title="Decline membership application"
                            >
                              <span className="btn-icon">❌</span>
                              Decline
                            </button>
                          </>
                        )}

                        {(activeTab === 'legacy_granted' || activeTab === 'legacy_declined' || activeTab === 'all_users') && (
                          <>
                            <button 
                              onClick={() => handleToggleUserStatus(user.id, 'isblocked', user.isblocked)}
                              className={user.isblocked ? "btn-unblock" : "btn-block"}
                              title={user.isblocked ? "Unblock this user" : "Block this user"}
                            >
                              <span className="btn-icon">{user.isblocked ? '🔓' : '🔒'}</span>
                              {user.isblocked ? 'Unblock' : 'Block'}
                            </button>
                            <button 
                              onClick={() => handleToggleUserStatus(user.id, 'isbanned', user.isbanned)}
                              className={user.isbanned ? "btn-unban" : "btn-ban"}
                              title={user.isbanned ? "Unban this user" : "Ban this user"}
                            >
                              <span className="btn-icon">{user.isbanned ? '✅' : '🚫'}</span>
                              {user.isbanned ? 'Unban' : 'Ban'}
                            </button>
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="btn-edit"
                              title="Edit user details"
                            >
                              <span className="btn-icon">✏️</span>
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                setNotificationData(prev => ({ ...prev, userId: user.id }));
                                setShowNotificationModal(true);
                              }}
                              className="btn-notify"
                              title="Send notification to user"
                            >
                              <span className="btn-icon">📧</span>
                              Notify
                            </button>
                            <button 
                              onClick={() => handleUserDelete(user.id, user.username)}
                              className="btn-delete"
                              title="Delete this user (irreversible)"
                            >
                              <span className="btn-icon">🗑️</span>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================================================
          ALL USERS TAB (SIMPLE LIST WITH ACTIONS)
      ================================================== */}
      {activeTab === 'all_users' && (
        <div className="all-users-section">
          <div className="section-header">
            <h3>All Users</h3>
            <div className="section-actions">
              <button onClick={handleCreateUser} className="btn-create">
                <span className="btn-icon">➕</span>
                Create New User
              </button>
              <button 
                onClick={() => setShowExportModal(true)} 
                className="btn-export"
              >
                <span className="btn-icon">📊</span>
                Export All Users
              </button>
            </div>
          </div>
          
          {usersLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          )}
          
          {usersError && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading users: {usersErrorData?.message || 'Unknown error'}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['users'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          )}
          
          {!usersLoading && !usersError && (
            <>
              {!users?.length ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h4>No Users Found</h4>
                  <p>No users are registered in the system yet.</p>
                  <button onClick={handleCreateUser} className="btn-primary">
                    Create First User
                  </button>
                </div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="user-row">
                          <td className="user-cell">
                            <div className="user-info">
                              <div className="user-avatar small">
                                {(user.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="user-details">
                                <span className="username">{formatUserDisplayName(user)}</span>
                                <span className="user-id">ID: {user.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="email-cell">{user.email}</td>
                          <td className="role-cell">
                            <span className={`role-badge role-${user.role}`}>{user.role}</span>
                          </td>
                          <td className="stage-cell">{user.membership_stage || 'N/A'}</td>
                          <td className="status-cell">
                            <div className="status-indicators">
                              <span className={`status-badge ${getStatusBadgeClass(user.is_member)}`}>
                                {user.is_member}
                              </span>
                              {user.isblocked && <span className="status-badge blocked">Blocked</span>}
                              {user.isbanned && <span className="status-badge banned">Banned</span>}
                            </div>
                          </td>
                          <td className="joined-cell">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="actions-cell">
                            <div className="inline-actions">
                              <button 
                                onClick={() => handleToggleUserStatus(user.id, 'isblocked', user.isblocked)}
                                className={`btn-icon-only ${user.isblocked ? 'btn-unblock' : 'btn-block'}`}
                                title={user.isblocked ? 'Unblock user' : 'Block user'}
                              >
                                {user.isblocked ? '🔓' : '🔒'}
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(user.id, 'isbanned', user.isbanned)}
                                className={`btn-icon-only ${user.isbanned ? 'btn-unban' : 'btn-ban'}`}
                                title={user.isbanned ? 'Unban user' : 'Ban user'}
                              >
                                {user.isbanned ? '✅' : '🚫'}
                              </button>
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="btn-icon-only btn-edit"
                                title="Edit user"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => {
                                  setNotificationData(prev => ({ ...prev, userId: user.id }));
                                  setShowNotificationModal(true);
                                }}
                                className="btn-icon-only btn-notify"
                                title="Send notification"
                              >
                                📧
                              </button>
                              <button 
                                onClick={() => handleUserDelete(user.id, user.username)}
                                className="btn-icon-only btn-delete"
                                title="Delete user"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================================================
          REPORTS TAB
      ================================================== */}
      {activeTab === 'reports' && (
        <div className="reports-section">
          <div className="section-header">
            <h3>User Reports</h3>
            <div className="section-stats">
              <span className="total-reports">Total: {reports?.length || 0}</span>
              <span className="pending-reports">
                Pending: {reports?.filter(r => r.status === 'pending').length || 0}
              </span>
            </div>
          </div>
          
          {reportsLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading reports...</p>
            </div>
          )}
          
          {reportsError && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>Error loading reports: {reportsError.message}</p>
              <button 
                onClick={() => queryClient.invalidateQueries(['reports'])}
                className="retry-btn"
              >
                Retry Loading
              </button>
            </div>
          )}
          
          {!reportsLoading && !reportsError && (
            <>
              {!reports?.length ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h4>No Reports Found</h4>
                  <p>No user reports have been submitted yet.</p>
                </div>
              ) : (
                <div className="reports-list">
                  {reports.map(report => (
                    <div key={report.id} className="report-card">
                      <div className="report-header">
                        <div className="report-meta">
                          <span className="report-id">Report #{report.id}</span>
                          <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status}
                          </span>
                          <span className="report-date">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {report.status === 'pending' && (
                          <div className="urgency-indicator">
                            <span className="urgent-badge">Needs Review</span>
                          </div>
                        )}
                      </div>

                      <div className="report-content">
                        <div className="report-participants">
                          <div className="participant">
                            <strong>Reporter:</strong> 
                            <span className="participant-id">
                              {formatIdForDisplay ? formatIdForDisplay(report.reporter_id) : report.reporter_id}
                            </span>
                          </div>
                          <div className="participant">
                            <strong>Reported User:</strong> 
                            <span className="participant-id reported">
                              {formatIdForDisplay ? formatIdForDisplay(report.reported_id) : report.reported_id}
                            </span>
                          </div>
                        </div>

                        <div className="report-details">
                          <div className="report-reason">
                            <strong>Reason:</strong> 
                            <span className="reason-text">{report.reason}</span>
                          </div>
                          {report.description && (
                            <div className="report-description">
                              <strong>Description:</strong>
                              <p className="description-text">{report.description}</p>
                            </div>
                          )}
                          {report.admin_notes && (
                            <div className="admin-notes">
                              <strong>Admin Notes:</strong>
                              <p className="notes-text">{report.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="report-actions">
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleReportAction(report.id, 'ban', report.reported_id)}
                              className="btn-ban"
                              title="Ban the reported user"
                            >
                              <span className="btn-icon">🚫</span>
                              Ban User
                            </button>
                            <button 
                              onClick={() => handleReportAction(report.id, 'block', report.reported_id)}
                              className="btn-block"
                              title="Block the reported user"
                            >
                              <span className="btn-icon">🔒</span>
                              Block User
                            </button>
                            <button 
                              onClick={() => handleReportAction(report.id, 'resolve')}
                              className="btn-resolve"
                              title="Mark report as resolved without action"
                            >
                              <span className="btn-icon">✅</span>
                              Resolve
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="btn-view"
                          title="View detailed report information"
                        >
                          <span className="btn-icon">👁️</span>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}  

      //=========================================================

      {/* ==================================================
          MODALS AND FORMS
      ================================================== */}

      {/* Legacy Membership Setup Modal */}
      {selectedUser && activeTab === 'legacy_pending' && (
        <div className="modal-overlay">
          <div className="modal-container membership-setup-modal">
            <div className="modal-header">
              <h3>Setup Membership for {selectedUser.username}</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="classId" className="form-label required">
                  Assign to Class:
                </label>
                <select 
                  id="classId"
                  name="classId" 
                  value={membershipData.classId} 
                  onChange={handleMembershipDataChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a class...</option>
                  {classesLoading ? (
                    <option disabled>Loading classes...</option>
                  ) : classesError ? (
                    <option disabled>Error loading classes</option>
                  ) : (
                    classes?.map(cls => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name || cls.name} ({cls.class_id})
                      </option>
                    ))
                  )}
                </select>
                <small className="form-help">Required: User must be assigned to a class</small>
              </div>

              <div className="form-group">
                <label htmlFor="mentorConverseId" className="form-label">
                  Assign Mentor (Optional):
                </label>
                <select 
                  id="mentorConverseId"
                  name="mentorConverseId" 
                  value={membershipData.mentorConverseId} 
                  onChange={handleMembershipDataChange}
                  className="form-select"
                >
                  <option value="">No mentor assigned</option>
                  {mentorsLoading ? (
                    <option disabled>Loading mentors...</option>
                  ) : mentorsError ? (
                    <option disabled>Error loading mentors</option>
                  ) : (
                    mentors?.map(mentor => (
                      <option key={mentor.converse_id} value={mentor.converse_id}>
                        {formatIdForDisplay ? formatIdForDisplay(mentor.converse_id) : mentor.converse_id} 
                        ({mentor.role})
                      </option>
                    ))
                  )}
                </select>
                <small className="form-help">Optional: Assign a mentor to guide the user</small>
              </div>

              <div className="info-box">
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                  <p><strong>What happens when you grant membership:</strong></p>
                  <ul>
                    <li>User will be assigned a unique Converse ID</li>
                    <li>User identity will be masked for privacy</li>
                    <li>User will be enrolled in the selected class</li>
                    <li>User status will be updated to "granted"</li>
                    {membershipData.mentorConverseId && <li>User will be assigned to the selected mentor</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => handleGrantMembership(selectedUser)}
                className="btn-grant"
                disabled={maskIdentityMutation.isLoading || !membershipData.classId}
              >
                {maskIdentityMutation.isLoading ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✅</span>
                    Grant Membership & Mask Identity
                  </>
                )}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn-cancel"
                disabled={maskIdentityMutation.isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Create/Update Form */}
      {(selectedUser || showCreateForm) && (activeTab === 'legacy_granted' || activeTab === 'all_users' || showCreateForm) && (
        <div className="modal-overlay">
          <div className="modal-container user-form-modal">
            <div className="modal-header">
              <h3>
                {showCreateForm ? 'Create New User' : `Update User: ${formatUserDisplayName(selectedUser)}`}
              </h3>
              <button 
                onClick={handleCancelForm}
                className="modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form className="user-management-form" onSubmit={handleSubmit}>
              <div className="modal-content">
                <div className="form-sections">
                  {/* Basic Information */}
                  <div className="form-section">
                    <h4 className="section-title">Basic Information</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="username" className={`form-label ${showCreateForm ? 'required' : ''}`}>
                          Username:
                        </label>
                        <input
                          id="username"
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Enter username"
                          required={showCreateForm}
                          disabled={!showCreateForm} // Don't allow username changes for existing users
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email" className={`form-label ${showCreateForm ? 'required' : ''}`}>
                          Email:
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Enter email address"
                          required={showCreateForm}
                        />
                      </div>
                    </div>

                    {showCreateForm && (
                      <div className="form-group">
                        <label htmlFor="password" className="form-label required">
                          Password:
                        </label>
                        <input
                          id="password"
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Enter password"
                          required
                          minLength="6"
                        />
                        <small className="form-help">Minimum 6 characters</small>
                      </div>
                    )}
                  </div>

                  {/* System Information */}
                  <div className="form-section">
                    <h4 className="section-title">System Information</h4>
                    
                    <div className="form-group">
                      <label htmlFor="converse_id" className="form-label">
                        Converse ID:
                      </label>
                      <div className="input-group">
                        <input
                          id="converse_id"
                          type="text"
                          name="converse_id"
                          value={formData.converse_id}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="OTO#XXXXXX (10 characters)"
                          pattern="^OTO#[A-Z0-9]{6}$"
                          title="Converse ID must be OTO# followed by 6 alphanumeric characters"
                          maxLength="10"
                          readOnly
                        />
                        <div className="input-group-buttons">
                          <button 
                            type="button" 
                            onClick={handleGenerateConverseId}
                            className="btn-generate"
                            title="Generate unique Converse ID"
                          >
                            Generate Unique
                          </button>
                          <button 
                            type="button" 
                            onClick={handleGenerateRandomId}
                            className="btn-generate-alt"
                            title="Generate random ID (legacy)"
                          >
                            Generate Random
                          </button>
                        </div>
                      </div>
                      {formData.converse_id && validateIdFormat && (
                        <div className={`validation-message ${validateIdFormat(formData.converse_id, 'user') ? 'valid' : 'invalid'}`}>
                          {validateIdFormat(formData.converse_id, 'user') 
                            ? '✓ Valid Converse ID format (OTO#XXXXXX)' 
                            : '✗ Invalid format - should be OTO#XXXXXX'
                          }
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="role" className="form-label">
                          Role:
                        </label>
                        <select 
                          id="role"
                          name="role" 
                          value={formData.role} 
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Select role...</option>
                          <option value="user">User</option>
                          <option value="mentor">Mentor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="is_member" className="form-label">
                          Membership Status:
                        </label>
                        <select 
                          id="is_member"
                          name="is_member" 
                          value={formData.is_member} 
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Select status...</option>
                          <option value="applied">Applied</option>
                          <option value="granted">Granted</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Information */}
                  <div className="form-section">
                    <h4 className="section-title">Assignments</h4>
                    
                    <div className="form-group">
                      <label htmlFor="mentor_id" className="form-label">
                        Mentor:
                      </label>
                      <select 
                        id="mentor_id"
                        name="mentor_id" 
                        value={formData.mentor_id} 
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">No mentor assigned</option>
                        {mentors?.map(mentor => (
                          <option key={mentor.converse_id} value={mentor.converse_id}>
                            {formatIdForDisplay ? formatIdForDisplay(mentor.converse_id) : mentor.converse_id}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="mentor_id"
                        value={formData.mentor_id}
                        onChange={handleChange}
                        className="form-input alt-input"
                        placeholder="Or enter Mentor ID manually"
                      />
                      <small className="form-help">Select from dropdown or enter manually</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="class_id" className="form-label">
                        Class:
                      </label>
                      <select 
                        id="class_id"
                        name="class_id" 
                        value={formData.class_id} 
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">No class assigned</option>
                        {classes?.map(cls => (
                          <option key={cls.class_id} value={cls.class_id}>
                            {cls.class_name || cls.name} ({cls.class_id})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="class_id"
                        value={formData.class_id}
                        onChange={handleChange}
                        className="form-input alt-input"
                        placeholder="Or enter Class ID manually"
                      />
                      <small className="form-help">Select from dropdown or enter manually</small>
                    </div>
                  </div>

                  {/* Status Toggles */}
                  {!showCreateForm && (
                    <div className="form-section">
                      <h4 className="section-title">Account Status</h4>
                      
                      <div className="form-row">
                        <div className="form-group checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="isblocked"
                              checked={formData.isblocked}
                              onChange={handleChange}
                              className="form-checkbox"
                            />
                            <span className="checkbox-text">User is blocked</span>
                          </label>
                          <small className="form-help">Blocked users cannot access the system</small>
                        </div>

                        <div className="form-group checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="isbanned"
                              checked={formData.isbanned}
                              onChange={handleChange}
                              className="form-checkbox"
                            />
                            <span className="checkbox-text">User is banned</span>
                          </label>
                          <small className="form-help">Banned users are permanently restricted</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={updateMutation.isLoading || createMutation.isLoading}
                >
                  {(updateMutation.isLoading || createMutation.isLoading) ? (
                    <>
                      <span className="loading-spinner small"></span>
                      {showCreateForm ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">{showCreateForm ? '➕' : '💾'}</span>
                      {showCreateForm ? 'Create User' : 'Update User'}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelForm}
                  className="btn-cancel"
                  disabled={updateMutation.isLoading || createMutation.isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      //=======================================================
     
{/* Report Details Modal */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-container report-details-modal">
            <div className="modal-header">
              <h3>Report Details - #{selectedReport.id}</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className="modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="report-info-grid">
                <div className="info-section">
                  <h4>Report Information</h4>
                  <div className="info-item">
                    <strong>Report ID:</strong> 
                    <span>{selectedReport.id}</span>
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong> 
                    <span className={`status-badge ${getStatusBadgeClass(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Submitted:</strong> 
                    <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedReport.updatedAt && selectedReport.updatedAt !== selectedReport.createdAt && (
                    <div className="info-item">
                      <strong>Last Updated:</strong> 
                      <span>{new Date(selectedReport.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="info-section">
                  <h4>Participants</h4>
                  <div className="info-item">
                    <strong>Reporter:</strong> 
                    <span className="participant-id">
                      {formatIdForDisplay ? formatIdForDisplay(selectedReport.reporter_id) : selectedReport.reporter_id}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Reported User:</strong> 
                    <span className="participant-id reported">
                      {formatIdForDisplay ? formatIdForDisplay(selectedReport.reported_id) : selectedReport.reported_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="report-content-section">
                <div className="content-item">
                  <h4>Reason for Report</h4>
                  <div className="content-box reason">
                    {selectedReport.reason}
                  </div>
                </div>

                {selectedReport.description && (
                  <div className="content-item">
                    <h4>Detailed Description</h4>
                    <div className="content-box description">
                      {selectedReport.description}
                    </div>
                  </div>
                )}

                {selectedReport.evidence && (
                  <div className="content-item">
                    <h4>Evidence/Screenshots</h4>
                    <div className="content-box evidence">
                      {selectedReport.evidence}
                    </div>
                  </div>
                )}

                {selectedReport.admin_notes && (
                  <div className="content-item">
                    <h4>Admin Notes</h4>
                    <div className="content-box admin-notes">
                      {selectedReport.admin_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              {selectedReport.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleReportAction(selectedReport.id, 'ban', selectedReport.reported_id);
                      setSelectedReport(null);
                    }}
                    className="btn-ban"
                  >
                    <span className="btn-icon">🚫</span>
                    Ban Reported User
                  </button>
                  <button 
                    onClick={() => {
                      handleReportAction(selectedReport.id, 'block', selectedReport.reported_id);
                      setSelectedReport(null);
                    }}
                    className="btn-block"
                  >
                    <span className="btn-icon">🔒</span>
                    Block Reported User
                  </button>
                  <button 
                    onClick={() => {
                      handleReportAction(selectedReport.id, 'resolve');
                      setSelectedReport(null);
                    }}
                    className="btn-resolve"
                  >
                    <span className="btn-icon">✅</span>
                    Mark as Resolved
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedReport(null)}
                className="btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="modal-overlay">
          <div className="modal-container notification-modal">
            <div className="modal-header">
              <h3>Send Notification</h3>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="notif-user" className="form-label required">
                  Select User:
                </label>
                <select
                  id="notif-user"
                  name="userId"
                  value={notificationData.userId}
                  onChange={handleNotificationDataChange}
                  className="form-select"
                  required
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="error">❌ Error</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notif-message" className="form-label required">
                  Message:
                </label>
                <textarea
                  id="notif-message"
                  name="message"
                  value={notificationData.message}
                  onChange={handleNotificationDataChange}
                  className="form-textarea"
                  rows={4}
                  placeholder="Enter your notification message..."
                  required
                />
                <small className="form-help">
                  Character count: {notificationData.message.length}/500
                </small>
              </div>

              <div className="notification-preview">
                <h4>Preview:</h4>
                <div className={`preview-notification notification-${notificationData.type}`}>
                  <div className="notification-header">
                    <span className="notification-type">
                      {notificationData.type === 'info' && 'ℹ️'}
                      {notificationData.type === 'warning' && '⚠️'}
                      {notificationData.type === 'success' && '✅'}
                      {notificationData.type === 'error' && '❌'}
                      {notificationData.type === 'urgent' && '🚨'}
                      {notificationData.type.charAt(0).toUpperCase() + notificationData.type.slice(1)}
                    </span>
                    <span className="notification-date">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="notification-message">
                    {notificationData.message || 'Your message will appear here...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleSendNotification}
                className="btn-primary"
                disabled={notificationMutation.isLoading || !notificationData.userId || !notificationData.message}
              >
                {notificationMutation.isLoading ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📧</span>
                    Send Notification
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="btn-cancel"
                disabled={notificationMutation.isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-container export-modal">
            <div className="modal-header">
              <h3>Export User Data</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="export-format" className="form-label">
                  Export Format:
                </label>
                <select
                  id="export-format"
                  name="format"
                  value={exportFilters.format}
                  onChange={handleExportDataChange}
                  className="form-select"
                >
                  <option value="csv">📊 CSV (Comma Separated Values)</option>
                  <option value="json">📄 JSON (JavaScript Object Notation)</option>
                  <option value="xlsx">📈 Excel Spreadsheet</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="includePersonalData"
                    checked={exportFilters.includePersonalData}
                    onChange={handleExportDataChange}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Include Personal Data</span>
                </label>
                <small className="form-help warning">
                  ⚠️ Warning: Personal data should only be exported when necessary and handled securely
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="export-date-from" className="form-label">
                    From Date:
                  </label>
                  <input
                    id="export-date-from"
                    type="date"
                    name="dateFrom"
                    value={exportFilters.dateFrom}
                    onChange={handleExportDataChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="export-date-to" className="form-label">
                    To Date:
                  </label>
                  <input
                    id="export-date-to"
                    type="date"
                    name="dateTo"
                    value={exportFilters.dateTo}
                    onChange={handleExportDataChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="export-summary">
                <h4>Export Summary:</h4>
                <ul>
                  <li>Format: {exportFilters.format.toUpperCase()}</li>
                  <li>Personal Data: {exportFilters.includePersonalData ? 'Included' : 'Excluded'}</li>
                  <li>Date Range: {exportFilters.dateFrom || 'All time'} to {exportFilters.dateTo || 'Present'}</li>
                  <li>Estimated Records: {users?.length || 0} users</li>
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleExportUsers}
                className="btn-export"
                disabled={exportMutation.isLoading}
              >
                {exportMutation.isLoading ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📊</span>
                    Export Data
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowExportModal(false)}
                className="btn-cancel"
                disabled={exportMutation.isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading States */}
      {(usersLoading || classesLoading || mentorsLoading || reportsLoading || overviewLoading) && (
        <div className="global-loading-overlay">
          <div className="loading-container">
            <div className="loading-spinner large"></div>
            <p>Loading system data...</p>
            <small>This may take a few moments</small>
          </div>
        </div>
      )}

      {/* Global Error States */}
      {(usersError || classesError || mentorsError || reportsError || overviewError) && (
        <div className="global-error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-details">
              <strong>System Error Detected</strong>
              <p>Some components may not function properly. Please try refreshing the page.</p>
            </div>
            <div className="error-actions">
              <button 
                onClick={handleRefreshData}
                className="btn-retry"
              >
                Refresh Data
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn-reload"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {(bulkMutation.isSuccess || membershipUpdateMutation.isSuccess || updateMutation.isSuccess || 
        createMutation.isSuccess || maskIdentityMutation.isSuccess || notificationMutation.isSuccess) && (
        <div className="success-banner">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span>Operation completed successfully!</span>
          </div>
        </div>
      )}

      {/* Footer Information */}
      <div className="footer-info">
        <div className="system-stats">
          <span>Total Users: {users?.length || 0}</span>
          <span>•</span>
          <span>Active Members: {users?.filter(u => u.is_member === 'granted').length || 0}</span>
          <span>•</span>
          <span>Pending Reports: {reports?.filter(r => r.status === 'pending').length || 0}</span>
          <span>•</span>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="version-info">
          <small>User Management System v2.0 - Complete Integration</small>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;









// // ikootaclient/src/components/admin/UserManagement.jsx
// // Updated for 10-character format (OTO#XXXXXX)

// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '../service/api';
// import './userManagement.css';
// import { 
//   generateUniqueConverseId, 
//   validateIdFormat, 
//   formatIdForDisplay 
// } from '../service/idGenerationService';
// import './converseId.css';

// // API Functions
// const fetchUsers = async () => {
//   const { data } = await api.get('/admin/users');
//   return data;
// };

// const fetchClasses = async () => {
//   const { data } = await api.get('/classes');
//   return data;
// };

// const fetchMentors = async () => {
//   const { data } = await api.get('/admin/mentors');
//   return data;
// };

// const updateUser = async ({ id, formData }) => {
//   const { data } = await api.put(`/admin/update-user/${id}`, formData);
//   return data;
// };

// const maskUserIdentity = async ({ userId, adminConverseId, mentorConverseId, classId }) => {
//   const { data } = await api.post('/admin/mask-identity', {
//     userId,
//     adminConverseId,
//     mentorConverseId,
//     classId
//   });
//   return data;
// };

// const fetchReports = async () => {
//   const { data } = await api.get('/admin/reports');
//   return data;
// };

// const UserManagement = () => {
//   const queryClient = useQueryClient();
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [activeTab, setActiveTab] = useState('pending');
  
//   const [formData, setFormData] = useState({
//     converse_id: '',
//     mentor_id: '',
//     class_id: '',
//     is_member: '',
//     role: '',
//   });

//   const [membershipData, setMembershipData] = useState({
//     mentorConverseId: '',
//     classId: '',
//   });

//   // React Query hooks
//   const { data: users, isLoading, isError } = useQuery({
//     queryKey: ['users'],
//     queryFn: fetchUsers,
//   });

//   const { data: classes, isLoading: classesLoading } = useQuery({
//     queryKey: ['classes'],
//     queryFn: fetchClasses,
//   });

//   const { data: mentors, isLoading: mentorsLoading } = useQuery({
//     queryKey: ['mentors'],
//     queryFn: fetchMentors,
//   });

//   const { data: reports, isLoading: reportsLoading } = useQuery({
//     queryKey: ['reports'],
//     queryFn: fetchReports,
//   });

//   // Mutations
//   const updateMutation = useMutation({
//     mutationFn: updateUser,
//     onSuccess: () => {
//       alert('User updated successfully!');
//       queryClient.invalidateQueries(['users']);
//       queryClient.invalidateQueries(['reports']);
//     },
//     onError: () => {
//       alert('Failed to update user.');
//     },
//   });

//   const maskIdentityMutation = useMutation({
//     mutationFn: maskUserIdentity,
//     onSuccess: (data) => {
//       alert(`Identity masked successfully! Converse ID: ${data.converseId}`);
//       queryClient.invalidateQueries(['users']);
//       setSelectedUser(null);
//       setMembershipData({ mentorConverseId: '', classId: '' });
//     },
//     onError: (error) => {
//       alert(`Failed to mask identity: ${error.response?.data?.message || error.message}`);
//     },
//   });

//   // Filter users by membership status
//   const filteredUsers = users?.filter(user => {
//     if (activeTab === 'pending') return user.is_member === 'applied';
//     if (activeTab === 'granted') return user.is_member === 'granted';
//     if (activeTab === 'declined') return user.is_member === 'declined';
//     return true;
//   });

//   // Handle user actions
//   const handleUserUpdate = (userId, updateData) => {
//     updateMutation.mutate({ id: userId, formData: updateData });
//   };

//   const handleGrantMembership = (user) => {
//     if (!membershipData.classId) {
//       alert('Please select a class for the user.');
//       return;
//     }

//     const adminConverseId = 'OTO#ADMIN1'; // This should come from your auth context

//     maskIdentityMutation.mutate({
//       userId: user.id,
//       adminConverseId,
//       mentorConverseId: membershipData.mentorConverseId || null,
//       classId: membershipData.classId
//     });
//   };

//   const handleDeclineMembership = (userId) => {
//     handleUserUpdate(userId, { is_member: 'declined' });
//   };

//   const handleGenerateConverseId = async () => {
//     try {
//       const newId = await generateUniqueConverseId();
//       setFormData((prev) => ({ ...prev, converse_id: newId }));
//     } catch (error) {
//       console.error('Failed to generate converse ID:', error);
//       alert('Failed to generate unique converse ID. Please try again.');
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!selectedUser) {
//       alert('Please select a user to update.');
//       return;
//     }
//     updateMutation.mutate({ id: selectedUser.id, formData });
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleMembershipDataChange = (e) => {
//     setMembershipData({ ...membershipData, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="user-management-container">
//       <h2>User Management with Converse ID System</h2>

//       {/* Tab Navigation */}
//       <div className="tab-navigation">
//         <button 
//           className={activeTab === 'pending' ? 'active' : ''} 
//           onClick={() => setActiveTab('pending')}
//         >
//           Pending Applications ({users?.filter(u => u.is_member === 'applied').length || 0})
//         </button>
//         <button 
//           className={activeTab === 'granted' ? 'active' : ''} 
//           onClick={() => setActiveTab('granted')}
//         >
//           Active Members ({users?.filter(u => u.is_member === 'granted').length || 0})
//         </button>
//         <button 
//           className={activeTab === 'declined' ? 'active' : ''} 
//           onClick={() => setActiveTab('declined')}
//         >
//           Declined ({users?.filter(u => u.is_member === 'declined').length || 0})
//         </button>
//       </div>

//       {/* Users List */}
//       <div className="users-section">
//         <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users</h3>
//         {isLoading && <p>Loading users...</p>}
//         {isError && <p>Error loading users.</p>}
        
//         <div className="user-list">
//           {filteredUsers?.map((user) => (
//             <div key={user.id} className="user-card">
//               <div className="user-info">
//                 <h4>
//                   {user.is_identity_masked 
//                     ? formatIdForDisplay(user.converse_id)
//                     : user.username
//                   } 
//                   ({user.email})
//                 </h4>
//                 {user.converse_id && (
//                   <p>
//                     <strong>Converse ID:</strong> {user.converse_id}
//                     <span className={validateIdFormat(user.converse_id, 'user') ? 'valid-id' : 'invalid-id'}>
//                       {validateIdFormat(user.converse_id, 'user') ? ' ✓' : ' ✗'}
//                     </span>
//                   </p>
//                 )}
//                 {user.class_id && (
//                   <p>
//                     <strong>Class:</strong> {user.class_id}
//                     <span className={validateIdFormat(user.class_id, 'class') ? 'valid-id' : 'invalid-id'}>
//                       {validateIdFormat(user.class_id, 'class') ? ' ✓' : ' ✗'}
//                     </span>
//                   </p>
//                 )}
//                 {user.mentor_id && (
//                   <p><strong>Mentor:</strong> {user.mentor_id}</p>
//                 )}
//                 <p><strong>Role:</strong> {user.role}</p>
//                 <p><strong>Status:</strong> {user.is_member}</p>
//                 {user.is_identity_masked && (
//                   <p><em>Identity is masked for privacy</em></p>
//                 )}
//               </div>

//               <div className="user-actions">
//                 {activeTab === 'pending' && (
//                   <>
//                     <button 
//                       onClick={() => setSelectedUser(user)}
//                       className="btn-setup"
//                     >
//                       Setup Membership
//                     </button>
//                     <button 
//                       onClick={() => handleDeclineMembership(user.id)}
//                       className="btn-decline"
//                     >
//                       Decline
//                     </button>
//                   </>
//                 )}

//                 {activeTab === 'granted' && (
//                   <>
//                     <button 
//                       onClick={() => handleUserUpdate(user.id, { isblocked: !user.isblocked })}
//                       className={user.isblocked ? "btn-unblock" : "btn-block"}
//                     >
//                       {user.isblocked ? 'Unblock' : 'Block'}
//                     </button>
//                     <button 
//                       onClick={() => handleUserUpdate(user.id, { isbanned: !user.isbanned })}
//                       className={user.isbanned ? "btn-unban" : "btn-ban"}
//                     >
//                       {user.isbanned ? 'Unban' : 'Ban'}
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Membership Setup Modal */}
//       {selectedUser && activeTab === 'pending' && (
//         <div className="modal-overlay">
//           <div className="membership-setup-modal">
//             <h3>Setup Membership for {selectedUser.username}</h3>
            
//             <div className="form-group">
//               <label>Assign to Class (Required):</label>
//               <select 
//                 name="classId" 
//                 value={membershipData.classId} 
//                 onChange={handleMembershipDataChange}
//                 required
//               >
//                 <option value="">Select a class</option>
//                 {classes?.map(cls => (
//                   <option key={cls.class_id} value={cls.class_id}>
//                     {cls.name} ({cls.class_id})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Assign Mentor (Optional):</label>
//               <select 
//                 name="mentorConverseId" 
//                 value={membershipData.mentorConverseId} 
//                 onChange={handleMembershipDataChange}
//               >
//                 <option value="">No mentor assigned</option>
//                 {mentors?.map(mentor => (
//                   <option key={mentor.converse_id} value={mentor.converse_id}>
//                     {formatIdForDisplay(mentor.converse_id)} ({mentor.role})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="modal-actions">
//               <button 
//                 onClick={() => handleGrantMembership(selectedUser)}
//                 className="btn-grant"
//                 disabled={maskIdentityMutation.isLoading}
//               >
//                 {maskIdentityMutation.isLoading ? 'Processing...' : 'Grant Membership & Mask Identity'}
//               </button>
//               <button 
//                 onClick={() => setSelectedUser(null)}
//                 className="btn-cancel"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Reports Section */}
//       <div className="reports-section">
//         <h3>User Reports</h3>
//         {reportsLoading && <p>Loading reports...</p>}
//         <div className="reports-list">
//           {reports?.map(report => (
//             <div key={report.id} className="report-card">
//               <p><strong>Reporter:</strong> {formatIdForDisplay(report.reporter_id)}</p>
//               <p><strong>Reported User:</strong> {formatIdForDisplay(report.reported_id)}</p>
//               <p><strong>Reason:</strong> {report.reason}</p>
//               <p><strong>Status:</strong> {report.status}</p>
//               <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
              
//               {report.status === 'pending' && (
//                 <div className="report-actions">
//                   <button 
//                     onClick={() => handleUserUpdate(report.reported_id, { isbanned: true })}
//                     className="btn-ban"
//                   >
//                     Ban Reported User
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* User Update Form */}
//       {selectedUser && activeTab === 'granted' && (
//         <form className="user-management-form" onSubmit={handleSubmit}>
//           <h3>Update User: {selectedUser.is_identity_masked ? formatIdForDisplay(selectedUser.converse_id) : selectedUser.username}</h3>

//           <label>
//             Converse ID:
//             <input
//               type="text"
//               name="converse_id"
//               value={formData.converse_id}
//               onChange={handleChange}
//               placeholder="OTO#XXXXXX (10 characters)"
//               pattern="^OTO#[A-Z0-9]{6}$"
//               title="Converse ID must be OTO# followed by 6 alphanumeric characters (total 10 characters)"
//               maxLength="10"
//               readOnly
//             />
//             <button type="button" onClick={handleGenerateConverseId}>
//               Generate New Converse ID
//             </button>
//             {formData.converse_id && (
//               <span className={validateIdFormat(formData.converse_id, 'user') ? 'valid' : 'invalid'}>
//                 {validateIdFormat(formData.converse_id, 'user') ? '✓ Valid format (OTO#XXXXXX)' : '✗ Invalid format'}
//               </span>
//             )}
//           </label>

//           <label>
//             Mentor ID:
//             <select name="mentor_id" value={formData.mentor_id} onChange={handleChange}>
//               <option value="">No mentor</option>
//               {mentors?.map(mentor => (
//                 <option key={mentor.converse_id} value={mentor.converse_id}>
//                   {formatIdForDisplay(mentor.converse_id)}
//                 </option>
//               ))}
//             </select>
//           </label>

//           <label>
//             Class ID:
//             <select name="class_id" value={formData.class_id} onChange={handleChange}>
//               <option value="">No class</option>
//               {classes?.map(cls => (
//                 <option key={cls.class_id} value={cls.class_id}>
//                   {cls.name} ({cls.class_id})
//                 </option>
//               ))}
//             </select>
//           </label>

//           <label>
//             Role:
//             <select name="role" value={formData.role} onChange={handleChange}>
//               <option value="">Select</option>
//               <option value="user">User</option>
//               <option value="admin">Admin</option>
//               <option value="super_admin">Super Admin</option>
//             </select>
//           </label>

//           <div className="form-actions">
//             <button type="submit" disabled={updateMutation.isLoading}>
//               {updateMutation.isLoading ? 'Updating...' : 'Update User'}
//             </button>
//             <button type="button" onClick={() => setSelectedUser(null)}>
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default UserManagement;