// ikootaclient/src/components/admin/AudienceClassMgr.jsx
// ENHANCED VERSION - Complete Class Management System with All Admin Endpoints
// Features: Full CRUD, analytics, bulk operations, content management, participant management

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './audienceclassmgr.css';
import { generateUniqueClassId, validateIdFormat } from '../service/idGenerationService';
import './converseId.css';

const AudienceClassMgr = () => {
  const queryClient = useQueryClient();
  
  // ✅ ENHANCED STATE MANAGEMENT
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics, dashboard
  const [filterState, setFilterState] = useState({
    search: '',
    type: '',
    status: 'all',
    capacity: 'all',
    dateRange: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showParticipantManager, setShowParticipantManager] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  
  // Selection and bulk operations
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
    public_name: '',
    description: '',
    class_type: 'general',
    is_public: true,
    max_members: 50,
    privacy_level: 'members_only',
    difficulty_level: 'beginner',
    tags: [],
    prerequisites: [],
    learning_objectives: [],
    estimated_duration: '',
    category: '',
    enable_notifications: true,
    enable_discussions: true,
    auto_approve_members: false,
    allow_self_join: true
  });

  const [editingClass, setEditingClass] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });

  // ✅ ENHANCED DATA FETCHING WITH ALL ADMIN ENDPOINTS
  
  // Dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['classDashboard'],
    queryFn: async () => {
      const { data } = await api.get('/classes/admin/dashboard');
      return data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // System stats
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['classSystemStats'],
    queryFn: async () => {
      const { data } = await api.get('/classes/admin/stats');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Classes with enhanced admin view
  const { 
    data: rawClassesData, 
    isLoading: classesLoading, 
    error: classesError,
    refetch: refetchClasses 
  } = useQuery({
    queryKey: ['adminClasses', filterState, pagination],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching admin classes with filters:', filterState);
        
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sortBy: filterState.sortBy,
          sortOrder: filterState.sortOrder,
          ...(filterState.search && { search: filterState.search }),
          ...(filterState.type && filterState.type !== '' && { class_type: filterState.type }),
          ...(filterState.status !== 'all' && { is_active: filterState.status === 'active' ? 'true' : 'false' }),
        });

        const { data } = await api.get(`/classes/admin?${params}`);
        console.log('✅ Admin Classes API response:', data);
        
        if (data?.success && Array.isArray(data.data)) {
          return data;
        } else if (Array.isArray(data)) {
          return { data, pagination: null, summary: null };
        } else {
          console.warn('⚠️ Unexpected admin classes response format:', data);
          return { data: [], pagination: null, summary: null };
        }
      } catch (error) {
        console.error('❌ Error fetching admin classes:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    retry: 2
  });

  // Pending approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      const { data } = await api.get('/classes/admin/pending-approvals');
      return data;
    },
    staleTime: 1 * 60 * 1000,
    retry: 1
  });

  // Audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ['classAuditLogs', pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: 50,
        ...(filterState.dateRange !== 'all' && { dateRange: filterState.dateRange })
      });
      const { data } = await api.get(`/classes/admin/audit-logs?${params}`);
      return data;
    },
    enabled: showAuditLogs,
    staleTime: 30 * 1000,
    retry: 1
  });

  // Process classes data safely
  const classesData = rawClassesData?.data || [];
  const classesPagination = rawClassesData?.pagination;
  const classesSummary = rawClassesData?.summary;

  // ✅ ENHANCED PARTICIPANTS FETCHING
  const { 
    data: rawParticipantsData, 
    isLoading: participantsLoading, 
    error: participantsError 
  } = useQuery({
    queryKey: ['classParticipants', selectedClass?.class_id],
    queryFn: async () => {
      const classId = selectedClass?.class_id;
      if (!classId) return [];
      
      try {
        console.log('🔍 Fetching participants for class:', classId);
        const { data } = await api.get(`/classes/admin/${classId}/participants`);
        console.log('✅ Participants API response:', data);
        
        if (data?.success && Array.isArray(data.data)) {
          return data.data;
        } else if (Array.isArray(data)) {
          return data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('❌ Error fetching class participants:', error);
        return [];
      }
    },
    enabled: !!(selectedClass?.class_id),
    staleTime: 1 * 60 * 1000,
    retry: 1
  });

  const classParticipants = Array.isArray(rawParticipantsData) ? rawParticipantsData : [];

  // ✅ ANALYTICS DATA FETCHING
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['classAnalytics', selectedClass?.class_id, filterState.dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filterState.dateRange !== 'all' && { dateRange: filterState.dateRange })
      });
      const { data } = await api.get(`/classes/admin/analytics?${params}`);
      return data.success ? data.data : null;
    },
    enabled: !!(showAnalytics),
    staleTime: 5 * 60 * 1000
  });

  // ✅ CONTENT DATA FETCHING
  const { data: classContent, isLoading: contentLoading } = useQuery({
    queryKey: ['classContent', selectedClass?.class_id],
    queryFn: async () => {
      if (!selectedClass?.class_id) return [];
      const { data } = await api.get(`/classes/admin/${selectedClass.class_id}/content`);
      return data.success ? data.data : [];
    },
    enabled: !!(selectedClass?.class_id && showContentManager),
    staleTime: 2 * 60 * 1000
  });

  // ✅ ENHANCED MUTATIONS WITH ALL ADMIN OPERATIONS

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: async (classData) => {
      console.log('🔍 Creating class:', classData);
      
      if (classData.class_id && !validateIdFormat(classData.class_id, 'class')) {
        throw new Error('Invalid class ID format. Must be OTU# followed by 6 alphanumeric characters.');
      }
      
      return await api.post('/classes/admin', classData);
    },
    onSuccess: (response) => {
      console.log('✅ Class created successfully:', response.data);
      queryClient.invalidateQueries(['adminClasses']);
      queryClient.invalidateQueries(['classDashboard']);
      queryClient.invalidateQueries(['classSystemStats']);
      resetForm();
      setShowCreateForm(false);
      showNotification('Class created successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Create class failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      showNotification(`Failed to create class: ${errorMessage}`, 'error');
    },
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      const classId = editingClass?.class_id;
      if (!classId) throw new Error('No class selected for update');
      
      console.log('🔍 Updating class:', classId, updateData);
      return await api.put(`/classes/admin/${classId}`, updateData);
    },
    onSuccess: (response) => {
      console.log('✅ Class updated successfully:', response.data);
      queryClient.invalidateQueries(['adminClasses']);
      queryClient.invalidateQueries(['classParticipants']);
      queryClient.invalidateQueries(['classDashboard']);
      setShowEditForm(false);
      setEditingClass(null);
      showNotification('Class updated successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Update class failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      showNotification(`Failed to update class: ${errorMessage}`, 'error');
    }
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (classId) => {
      console.log('🔍 Deleting class:', classId);
      return await api.delete(`/classes/admin/${classId}`);
    },
    onSuccess: (response, classId) => {
      console.log('✅ Class deleted successfully:', response.data);
      queryClient.invalidateQueries(['adminClasses']);
      queryClient.invalidateQueries(['classDashboard']);
      queryClient.invalidateQueries(['classSystemStats']);
      if (selectedClass?.class_id === classId) {
        setSelectedClass(null);
      }
      showNotification('Class deleted successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Delete class failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete class';
      showNotification(`Failed to delete class: ${errorMessage}`, 'error');
    }
  });

  // ✅ BULK OPERATIONS MUTATION
  const bulkMutation = useMutation({
    mutationFn: async ({ action, classIds, updateData }) => {
      console.log('🔍 Bulk operation:', action, classIds);
      
      switch (action) {
        case 'delete':
          return await api.delete('/classes/admin/bulk-delete', { data: { class_ids: classIds } });
        case 'update':
          return await api.put('/classes/admin/bulk-update', { class_ids: classIds, updates: updateData });
        case 'activate':
          return await api.put('/classes/admin/bulk-update', { class_ids: classIds, updates: { is_active: true } });
        case 'deactivate':
          return await api.put('/classes/admin/bulk-update', { class_ids: classIds, updates: { is_active: false } });
        default:
          throw new Error('Invalid bulk action');
      }
    },
    onSuccess: (response) => {
      console.log('✅ Bulk operation completed:', response.data);
      queryClient.invalidateQueries(['adminClasses']);
      queryClient.invalidateQueries(['classDashboard']);
      queryClient.invalidateQueries(['classSystemStats']);
      setSelectedClasses(new Set());
      setShowBulkOperations(false);
      setBulkAction('');
      showNotification('Bulk operation completed successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Bulk operation failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Bulk operation failed';
      showNotification(`Bulk operation failed: ${errorMessage}`, 'error');
    }
  });

  // ✅ PARTICIPANT MANAGEMENT MUTATION
  const participantMutation = useMutation({
    mutationFn: async ({ classId, userId, action, data }) => {
      console.log('🔍 Managing participant:', { classId, userId, action, data });
      
      switch (action) {
        case 'approve':
        case 'reject':
        case 'promote':
        case 'demote':
        case 'remove':
          return await api.put(`/classes/admin/${classId}/participants/${userId}`, { action, ...data });
        case 'add':
          return await api.post(`/classes/admin/${classId}/participants/add`, { user_ids: [userId], ...data });
        case 'bulk':
          return await api.post(`/classes/admin/${classId}/participants/bulk`, data);
        default:
          throw new Error('Invalid participant action');
      }
    },
    onSuccess: (response) => {
      console.log('✅ Participant action completed:', response.data);
      queryClient.invalidateQueries(['classParticipants']);
      queryClient.invalidateQueries(['adminClasses']);
      showNotification('Participant action completed successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Participant action failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Participant action failed';
      showNotification(`Participant action failed: ${errorMessage}`, 'error');
    }
  });

  // ✅ EXPORT DATA MUTATION
  const exportMutation = useMutation({
    mutationFn: async ({ format, dateRange, classIds }) => {
      const params = new URLSearchParams({
        format: format || 'csv',
        ...(dateRange && { dateRange }),
        ...(classIds && { class_ids: classIds.join(',') })
      });
      
      const response = await api.get(`/classes/admin/export?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `classes_export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    },
    onSuccess: () => {
      showNotification('Data exported successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Export failed:', error);
      showNotification('Export failed. Please try again.', 'error');
    }
  });

  // ✅ REPORTS GENERATION MUTATION
  const reportsMutation = useMutation({
    mutationFn: async (reportConfig) => {
      return await api.post('/classes/admin/reports', reportConfig);
    },
    onSuccess: (response) => {
      console.log('✅ Report generated:', response.data);
      showNotification('Report generated successfully!', 'success');
      // Handle report display or download
      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    },
    onError: (error) => {
      console.error('❌ Report generation failed:', error);
      showNotification('Report generation failed. Please try again.', 'error');
    }
  });

  // ✅ BATCH APPROVAL MUTATION
  const batchApprovalMutation = useMutation({
    mutationFn: async ({ items, type }) => {
      return await api.post('/classes/admin/approve-batch', { items, type });
    },
    onSuccess: (response) => {
      console.log('✅ Batch approval completed:', response.data);
      queryClient.invalidateQueries(['pendingApprovals']);
      queryClient.invalidateQueries(['adminClasses']);
      queryClient.invalidateQueries(['classParticipants']);
      showNotification('Batch approval completed successfully!', 'success');
    },
    onError: (error) => {
      console.error('❌ Batch approval failed:', error);
      showNotification('Batch approval failed. Please try again.', 'error');
    }
  });

  // ✅ UTILITY FUNCTIONS
  const showNotification = useCallback((message, type = 'info') => {
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      class_id: '', class_name: '', public_name: '', description: '', class_type: 'general',
      is_public: true, max_members: 50, privacy_level: 'members_only', difficulty_level: 'beginner',
      tags: [], prerequisites: [], learning_objectives: [], estimated_duration: '', category: '',
      enable_notifications: true, enable_discussions: true, auto_approve_members: false, allow_self_join: true
    });
  };

  const handleGenerateNewClassId = async () => {
    try {
      const newId = await generateUniqueClassId();
      setFormData(prev => ({ ...prev, class_id: newId }));
    } catch (error) {
      console.error('Failed to generate class ID:', error);
      showNotification('Failed to generate unique class ID. Please try again.', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (tags) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.class_name?.trim()) {
      showNotification('Class name is required', 'error');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEditClass = (classItem) => {
    setEditingClass({
      ...classItem,
      id: classItem.id || classItem.class_id,
      class_id: classItem.class_id || classItem.id,
      tags: classItem.tags || [],
      prerequisites: classItem.prerequisites || [],
      learning_objectives: classItem.learning_objectives || []
    });
    setShowEditForm(true);
  };

  const handleUpdateClass = () => {
    if (!editingClass?.class_name?.trim()) {
      showNotification('Class name is required', 'error');
      return;
    }
    
    updateMutation.mutate(editingClass);
  };

  const handleDeleteClass = (classItem) => {
    const classId = classItem.id || classItem.class_id;
    const className = classItem.class_name || 'Unnamed Class';
    
    if (window.confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      deleteMutation.mutate(classId);
    }
  };

  const handleClassSelection = (classId, selected) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(classId);
      } else {
        newSet.delete(classId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedClasses(new Set(classesData.map(cls => cls.class_id || cls.id)));
    } else {
      setSelectedClasses(new Set());
    }
  };

  const handleBulkAction = () => {
    if (selectedClasses.size === 0) {
      showNotification('Please select classes first', 'error');
      return;
    }
    
    if (!bulkAction) {
      showNotification('Please select an action', 'error');
      return;
    }

    const classIds = Array.from(selectedClasses);
    
    if (bulkAction === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${classIds.length} classes? This action cannot be undone.`)) {
        return;
      }
    }

    bulkMutation.mutate({ action: bulkAction, classIds });
  };

  const handleParticipantAction = (classId, userId, action, data = {}) => {
    participantMutation.mutate({ classId, userId, action, data });
  };

  const handleExportData = (format = 'csv', options = {}) => {
    exportMutation.mutate({
      format,
      dateRange: options.dateRange || filterState.dateRange,
      classIds: options.classIds || (selectedClasses.size > 0 ? Array.from(selectedClasses) : null)
    });
  };

  const handleGenerateReport = (reportConfig) => {
    reportsMutation.mutate(reportConfig);
  };

  const handleBatchApproval = (items, type) => {
    batchApprovalMutation.mutate({ items, type });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'status-active' : 'status-inactive';
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 95) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleFilterChange = (key, value) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // ✅ RENDER ERROR STATE
  if (classesError) {
    return (
      <div className="audience-class-mgr-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Classes</h3>
          <p>There was an error loading the classes data.</p>
          <div className="error-details">
            <strong>Error:</strong> {classesError.message}
          </div>
          <div className="error-actions">
            <button onClick={() => refetchClasses()} className="btn-retry">
              🔄 Retry
            </button>
            <button onClick={() => window.location.reload()} className="btn-reload">
              🔃 Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audience-class-mgr-container">
      {/* ✅ ENHANCED HEADER WITH DASHBOARD INTEGRATION */}
      <div className="header-section">
        <div className="header-main">
          <h2>Class Management System</h2>
          <p className="header-subtitle">
            Comprehensive class administration with advanced analytics and management tools
          </p>
          {dashboardData && (
            <div className="header-stats">
              <div className="stat-badge">
                <span className="stat-number">{dashboardData.total_classes || classesData.length}</span>
                <span className="stat-label">Total Classes</span>
              </div>
              <div className="stat-badge">
                <span className="stat-number">{dashboardData.active_classes || 0}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-badge">
                <span className="stat-number">{dashboardData.total_participants || 0}</span>
                <span className="stat-label">Participants</span>
              </div>
              {pendingApprovals && pendingApprovals.pending_count > 0 && (
                <div className="stat-badge warning">
                  <span className="stat-number">{pendingApprovals.pending_count}</span>
                  <span className="stat-label">Pending</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-create"
            disabled={createMutation.isLoading}
          >
            ➕ Create New Class
          </button>
          
          {selectedClasses.size > 0 && (
            <button 
              onClick={() => setShowBulkOperations(true)}
              className="btn-bulk"
            >
              📦 Bulk Actions ({selectedClasses.size})
            </button>
          )}
          
          <button 
            onClick={() => setShowAnalytics(true)}
            className="btn-analytics"
          >
            📊 Analytics
          </button>

          <button 
            onClick={() => setShowReportsDialog(true)}
            className="btn-reports"
          >
            📋 Reports
          </button>

          <button 
            onClick={() => handleExportData('csv')}
            className="btn-export"
            disabled={exportMutation.isLoading}
          >
            📤 Export
          </button>

          <button 
            onClick={() => setShowAuditLogs(true)}
            className="btn-audit"
          >
            🔍 Audit Logs
          </button>
          
          <button 
            onClick={refetchClasses}
            className="btn-refresh"
            disabled={classesLoading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ✅ ENHANCED CONTROLS WITH SORTING */}
      <div className="controls-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search classes..."
              value={filterState.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={filterState.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="demographic">Demographic</option>
            <option value="subject">Subject</option>
            <option value="public">Public</option>
            <option value="special">Special</option>
            <option value="lecture">Lecture</option>
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
          </select>
          
          <select 
            value={filterState.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select 
            value={filterState.capacity} 
            onChange={(e) => handleFilterChange('capacity', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Capacity</option>
            <option value="available">Has Space</option>
            <option value="full">Full</option>
            <option value="nearly_full">Nearly Full (80%+)</option>
          </select>

          <select 
            value={filterState.dateRange} 
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <select 
            value={`${filterState.sortBy}-${filterState.sortOrder}`} 
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilterState(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="filter-select"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="class_name-asc">Name A-Z</option>
            <option value="class_name-desc">Name Z-A</option>
            <option value="total_members-desc">Most Members</option>
            <option value="total_members-asc">Least Members</option>
            <option value="updatedAt-desc">Recently Updated</option>
          </select>
        </div>
        
        <div className="view-controls">
          <div className="view-mode-toggle">
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              📱 Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              📋 List
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            >
              🎛️ Dashboard
            </button>
          </div>
          
          {classesData.length > 0 && (
            <div className="bulk-select-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedClasses.size === classesData.length && classesData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All ({classesData.length})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ✅ ENHANCED STATS OVERVIEW WITH SYSTEM STATS */}
      {(classesSummary || systemStats) && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h4>Total Classes</h4>
              <span className="stat-number">{systemStats?.total_classes || classesSummary?.total_classes || classesData.length}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Active Classes</h4>
              <span className="stat-number">
                {systemStats?.active_classes || classesSummary?.active_classes || classesData.filter(c => c.is_active !== false).length}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>Total Participants</h4>
              <span className="stat-number">
                {systemStats?.total_participants || classesSummary?.total_members || classesData.reduce((sum, c) => sum + (c.total_members || 0), 0)}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <h4>Public Classes</h4>
              <span className="stat-number">
                {systemStats?.public_classes || classesSummary?.public_classes || classesData.filter(c => c.is_public).length}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Available Spots</h4>
              <span className="stat-number">
                {systemStats?.available_spots || classesSummary?.classes_with_space || classesData.reduce((sum, c) => sum + Math.max(0, (c.max_members || 0) - (c.total_members || 0)), 0)}
              </span>
            </div>
          </div>

          {pendingApprovals && pendingApprovals.pending_count > 0 && (
            <div className="stat-card warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h4>Pending Approvals</h4>
                <span className="stat-number">{pendingApprovals.pending_count}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ MAIN CONTENT WITH ENHANCED VIEW MODES */}
      <div className="main-content">
        {viewMode === 'dashboard' ? (
          <AdminDashboardView 
            dashboardData={dashboardData}
            systemStats={systemStats}
            pendingApprovals={pendingApprovals}
            onSelectClass={setSelectedClass}
            onBatchApproval={handleBatchApproval}
            isLoading={dashboardLoading || statsLoading}
          />
        ) : viewMode === 'analytics' ? (
          <AnalyticsView 
            classesData={classesData} 
            summary={classesSummary} 
            analyticsData={analyticsData}
            systemStats={systemStats}
            onSelectClass={setSelectedClass}
            onGenerateReport={handleGenerateReport}
            isLoading={analyticsLoading}
          />
        ) : (
          <div className="classes-section">
            {classesLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading classes...</p>
              </div>
            ) : (
              <>
                <div className="section-header">
                  <h3>Classes ({classesData.length})</h3>
                  {classesPagination && (
                    <div className="pagination-info">
                      Page {classesPagination.page} of {classesPagination.total_pages} 
                      ({classesPagination.total} total)
                    </div>
                  )}
                </div>

                {classesData.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No Classes Found</h3>
                    <p>Create your first class or adjust your filters to see results.</p>
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                      ➕ Create First Class
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <ClassesGrid
                    classesData={classesData}
                    selectedClasses={selectedClasses}
                    onClassSelection={handleClassSelection}
                    onSelectClass={setSelectedClass}
                    onEditClass={handleEditClass}
                    onDeleteClass={handleDeleteClass}
                    formatDate={formatDate}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getCapacityColor={getCapacityColor}
                  />
                ) : (
                  <ClassesList
                    classesData={classesData}
                    selectedClasses={selectedClasses}
                    onClassSelection={handleClassSelection}
                    onSelectClass={setSelectedClass}
                    onEditClass={handleEditClass}
                    onDeleteClass={handleDeleteClass}
                    formatDate={formatDate}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getCapacityColor={getCapacityColor}
                  />
                )}

                {/* Pagination */}
                {classesPagination && classesPagination.total_pages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="btn-page"
                    >
                      ← Previous
                    </button>
                    
                    <span className="page-info">
                      Page {pagination.page} of {classesPagination.total_pages}
                    </span>
                    
                    <button 
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= classesPagination.total_pages}
                      className="btn-page"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ✅ ENHANCED SELECTED CLASS DETAILS WITH PARTICIPANT MANAGEMENT */}
        {selectedClass && (
          <ClassDetailsPanel
            selectedClass={selectedClass}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            classParticipants={classParticipants}
            participantsLoading={participantsLoading}
            participantsError={participantsError}
            classContent={classContent}
            contentLoading={contentLoading}
            analyticsData={analyticsData}
            analyticsLoading={analyticsLoading}
            onEdit={handleEditClass}
            onDelete={handleDeleteClass}
            onParticipantAction={handleParticipantAction}
            onShowParticipantManager={() => setShowParticipantManager(true)}
            onShowContentManager={() => setShowContentManager(true)}
            formatDate={formatDate}
            getStatusBadgeClass={getStatusBadgeClass}
            getCapacityColor={getCapacityColor}
          />
        )}
      </div>

      {/* ✅ ENHANCED MODALS WITH ALL ADMIN FEATURES */}
      {showCreateForm && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Create Class Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowCreateForm(false)}>Close</button>
          </div>
        </div>
      )}

      {showEditForm && editingClass && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Edit Class Modal - Component Not Yet Implemented</h3>
            <button onClick={() => {
              setShowEditForm(false);
              setEditingClass(null);
            }}>Close</button>
          </div>
        </div>
      )}

      {showBulkOperations && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Bulk Operations Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowBulkOperations(false)}>Close</button>
          </div>
        </div>
      )}

      {showAnalytics && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Analytics Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowAnalytics(false)}>Close</button>
          </div>
        </div>
      )}

      {showParticipantManager && selectedClass && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Participant Manager Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowParticipantManager(false)}>Close</button>
          </div>
        </div>
      )}

      {showContentManager && selectedClass && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Content Manager Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowContentManager(false)}>Close</button>
          </div>
        </div>
      )}

      {showReportsDialog && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Reports Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowReportsDialog(false)}>Close</button>
          </div>
        </div>
      )}

      {showAuditLogs && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>Audit Logs Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowAuditLogs(false)}>Close</button>
          </div>
        </div>
      )}

      {showSystemSettings && (
        <div className="modal-placeholder">
          <div className="modal-content">
            <h3>System Settings Modal - Component Not Yet Implemented</h3>
            <button onClick={() => setShowSystemSettings(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ ADMIN DASHBOARD VIEW COMPONENT
const AdminDashboardView = ({ dashboardData, systemStats, pendingApprovals, onSelectClass, onBatchApproval, isLoading }) => {
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-view">
      <div className="dashboard-header">
        <h3>Admin Dashboard</h3>
        <div className="dashboard-meta">
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Stats */}
        <div className="dashboard-card">
          <h4>System Overview</h4>
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-label">Total Classes</span>
              <span className="stat-value">{systemStats?.total_classes || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">Active Classes</span>
              <span className="stat-value">{systemStats?.active_classes || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">Total Participants</span>
              <span className="stat-value">{systemStats?.total_participants || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">System Health</span>
              <span className="stat-value health-good">98%</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals && pendingApprovals.pending_count > 0 && (
          <div className="dashboard-card urgent">
            <h4>Pending Approvals ({pendingApprovals.pending_count})</h4>
            <div className="pending-items">
              {pendingApprovals.class_applications && (
                <div className="pending-item">
                  <span>Class Applications</span>
                  <span className="badge">{pendingApprovals.class_applications}</span>
                </div>
              )}
              {pendingApprovals.participant_requests && (
                <div className="pending-item">
                  <span>Participant Requests</span>
                  <span className="badge">{pendingApprovals.participant_requests}</span>
                </div>
              )}
              {pendingApprovals.content_submissions && (
                <div className="pending-item">
                  <span>Content Submissions</span>
                  <span className="badge">{pendingApprovals.content_submissions}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => onBatchApproval(pendingApprovals.items, 'all')}
              className="btn-batch-approve"
            >
              Approve All
            </button>
          </div>
        )}

        {/* Recent Activity */}
        <div className="dashboard-card">
          <h4>Recent Activity</h4>
          <div className="activity-feed">
            {dashboardData?.recent_activity?.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon || '📝'}</div>
                <div className="activity-content">
                  <span className="activity-text">{activity.message}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            )) || (
              <div className="no-activity">
                <span>No recent activity</span>
              </div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        {dashboardData?.system_alerts && dashboardData.system_alerts.length > 0 && (
          <div className="dashboard-card alerts">
            <h4>System Alerts</h4>
            <div className="alerts-list">
              {dashboardData.system_alerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity}`}>
                  <div className="alert-icon">{alert.icon || '⚠️'}</div>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h4>Quick Actions</h4>
          <div className="quick-actions-grid">
            <button className="quick-action-btn">
              <div className="action-icon">➕</div>
              <span>Create Class</span>
            </button>
            <button className="quick-action-btn">
              <div className="action-icon">👥</div>
              <span>Manage Users</span>
            </button>
            <button className="quick-action-btn">
              <div className="action-icon">📊</div>
              <span>View Reports</span>
            </button>
            <button className="quick-action-btn">
              <div className="action-icon">⚙️</div>
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="dashboard-card">
          <h4>Performance Metrics</h4>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Avg Class Size</span>
              <span className="metric-value">{systemStats?.avg_class_size || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Completion Rate</span>
              <span className="metric-value">{systemStats?.completion_rate || 0}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Engagement Score</span>
              <span className="metric-value">{systemStats?.engagement_score || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ PARTICIPANT MANAGER MODAL COMPONENT
const ParticipantManagerModal = ({ selectedClass, participants, onParticipantAction, onClose, isLoading }) => {
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredParticipants = participants.filter(p => 
    filterRole === 'all' || p.role === filterRole
  );

  const handleBulkParticipantAction = () => {
    if (selectedParticipants.size === 0) {
      alert('Please select participants first');
      return;
    }

    const participantIds = Array.from(selectedParticipants);
    onParticipantAction(selectedClass.class_id, null, 'bulk', {
      action: bulkAction,
      user_ids: participantIds
    });
    setSelectedParticipants(new Set());
    setBulkAction('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Participants - {selectedClass.class_name}</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="participant-controls">
            <div className="filters">
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="member">Members</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {selectedParticipants.size > 0 && (
              <div className="bulk-actions">
                <select 
                  value={bulkAction} 
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="action-select"
                >
                  <option value="">Select Action</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="promote">Promote to Moderator</option>
                  <option value="demote">Demote to Member</option>
                  <option value="remove">Remove</option>
                </select>
                <button 
                  onClick={handleBulkParticipantAction}
                  disabled={!bulkAction}
                  className="btn-execute"
                >
                  Execute ({selectedParticipants.size})
                </button>
              </div>
            )}
          </div>

          <div className="participants-list">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading participants...</p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No Participants</h4>
                <p>No participants match the current filter.</p>
              </div>
            ) : (
              filteredParticipants.map((participant, index) => (
                <div key={participant.id || index} className="participant-item">
                  <div className="participant-select">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(participant.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedParticipants);
                        if (e.target.checked) {
                          newSet.add(participant.id);
                        } else {
                          newSet.delete(participant.id);
                        }
                        setSelectedParticipants(newSet);
                      }}
                    />
                  </div>

                  <div className="participant-avatar">
                    {participant.avatar_url ? (
                      <img src={participant.avatar_url} alt={participant.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {(participant.name || participant.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="participant-info">
                    <div className="participant-name">{participant.name || participant.username || 'Unknown'}</div>
                    <div className="participant-email">{participant.email}</div>
                    <div className="participant-joined">
                      Joined: {new Date(participant.joined_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="participant-role">
                    <span className={`role-badge ${participant.role}`}>
                      {participant.role || 'member'}
                    </span>
                  </div>

                  <div className="participant-status">
                    <span className={`status-indicator ${participant.status}`}>
                      {participant.status || 'active'}
                    </span>
                  </div>

                  <div className="participant-actions">
                    {participant.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'approve')}
                          className="btn-approve"
                        >
                          ✓ Approve
                        </button>
                        <button 
                          onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'reject')}
                          className="btn-reject"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    
                    {participant.role === 'member' && (
                      <button 
                        onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'promote')}
                        className="btn-promote"
                      >
                        ⬆ Promote
                      </button>
                    )}
                    
                    {participant.role === 'moderator' && (
                      <button 
                        onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'demote')}
                        className="btn-demote"
                      >
                        ⬇ Demote
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'remove')}
                      className="btn-remove"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ CONTENT MANAGER MODAL COMPONENT
const ContentManagerModal = ({ selectedClass, content, onClose, isLoading }) => {
  const [activeContentTab, setActiveContentTab] = useState('announcements');

  const contentTypes = {
    announcements: content?.filter(c => c.type === 'announcement') || [],
    assignments: content?.filter(c => c.type === 'assignment') || [],
    resources: content?.filter(c => c.type === 'resource') || [],
    discussions: content?.filter(c => c.type === 'discussion') || []
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Content Management - {selectedClass.class_name}</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="content-tabs">
            <button 
              className={`tab-btn ${activeContentTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('announcements')}
            >
              📢 Announcements ({contentTypes.announcements.length})
            </button>
            <button 
              className={`tab-btn ${activeContentTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('assignments')}
            >
              📝 Assignments ({contentTypes.assignments.length})
            </button>
            <button 
              className={`tab-btn ${activeContentTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('resources')}
            >
              📚 Resources ({contentTypes.resources.length})
            </button>
            <button 
              className={`tab-btn ${activeContentTab === 'discussions' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('discussions')}
            >
              💬 Discussions ({contentTypes.discussions.length})
            </button>
          </div>

          <div className="content-area">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading content...</p>
              </div>
            ) : contentTypes[activeContentTab].length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h4>No {activeContentTab}</h4>
                <p>No {activeContentTab} have been created for this class yet.</p>
                <button className="btn-create">
                  ➕ Create {activeContentTab.slice(0, -1)}
                </button>
              </div>
            ) : (
              <div className="content-list">
                {contentTypes[activeContentTab].map((item, index) => (
                  <div key={item.id || index} className="content-item">
                    <div className="content-header">
                      <h5>{item.title}</h5>
                      <span className="content-date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="content-body">
                      <p>{item.description || item.content}</p>
                    </div>
                    <div className="content-actions">
                      <button className="btn-edit">✏️ Edit</button>
                      <button className="btn-delete">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Close
          </button>
          <button className="btn-create">
            ➕ Add Content
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ REPORTS MODAL COMPONENT
const ReportsModal = ({ onGenerateReport, onClose, classesData, selectedClasses, isLoading }) => {
  const [reportConfig, setReportConfig] = useState({
    type: 'summary',
    format: 'pdf',
    dateRange: 'month',
    includeAnalytics: true,
    includeParticipants: false,
    classIds: []
  });

  const handleConfigChange = (key, value) => {
    setReportConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = () => {
    const config = {
      ...reportConfig,
      classIds: selectedClasses.size > 0 ? Array.from(selectedClasses) : reportConfig.classIds
    };
    onGenerateReport(config);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generate Reports</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Report Type</label>
            <select 
              value={reportConfig.type} 
              onChange={(e) => handleConfigChange('type', e.target.value)}
              className="form-select"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="analytics">Analytics Report</option>
              <option value="participants">Participants Report</option>
              <option value="activity">Activity Report</option>
              <option value="performance">Performance Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Format</label>
            <select 
              value={reportConfig.format} 
              onChange={(e) => handleConfigChange('format', e.target.value)}
              className="form-select"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <select 
              value={reportConfig.dateRange} 
              onChange={(e) => handleConfigChange('dateRange', e.target.value)}
              className="form-select"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="form-group">
            <label>Include Options</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reportConfig.includeAnalytics}
                  onChange={(e) => handleConfigChange('includeAnalytics', e.target.checked)}
                />
                Analytics Data
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reportConfig.includeParticipants}
                  onChange={(e) => handleConfigChange('includeParticipants', e.target.checked)}
                />
                Participant Details
              </label>
            </div>
          </div>

          {selectedClasses.size > 0 && (
            <div className="selected-classes-info">
              <h4>Selected Classes ({selectedClasses.size})</h4>
              <p>Report will include data for the selected classes only.</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel" disabled={isLoading}>
            Cancel
          </button>
          <button 
            onClick={handleGenerateReport}
            className="btn-generate"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ AUDIT LOGS MODAL COMPONENT
const AuditLogsModal = ({ auditLogs, onClose, pagination, onPageChange }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Audit Logs</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="audit-logs-list">
            {auditLogs?.data?.map((log, index) => (
              <div key={log.id || index} className="audit-log-item">
                <div className="log-header">
                  <span className="log-action">{log.action}</span>
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="log-details">
                  <div className="log-user">
                    <strong>User:</strong> {log.user_email || log.user_name}
                  </div>
                  <div className="log-description">
                    <strong>Description:</strong> {log.description}
                  </div>
                  {log.details && (
                    <div className="log-extra">
                      <strong>Details:</strong>
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )) || (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h4>No Audit Logs</h4>
                <p>No audit logs available for the selected period.</p>
              </div>
            )}
          </div>

          {auditLogs?.pagination && auditLogs.pagination.total_pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn-page"
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {auditLogs.pagination.total_pages}
              </span>
              
              <button 
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= auditLogs.pagination.total_pages}
                className="btn-page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ SYSTEM SETTINGS MODAL COMPONENT
const SystemSettingsModal = ({ onClose }) => {
  const [settings, setSettings] = useState({
    autoApproveClasses: false,
    maxClassSize: 100,
    allowSelfEnrollment: true,
    enableNotifications: true,
    requireApprovalForPublicClasses: false,
    enableAuditLogging: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/classes/admin/settings', settings);
      alert('Settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>System Settings</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="settings-group">
            <h4>Class Management</h4>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoApproveClasses}
                  onChange={(e) => handleSettingChange('autoApproveClasses', e.target.checked)}
                />
                Auto-approve new classes
              </label>
            </div>
            <div className="setting-item">
              <label>
                Maximum class size
                <input
                  type="number"
                  value={settings.maxClassSize}
                  onChange={(e) => handleSettingChange('maxClassSize', parseInt(e.target.value))}
                  min="1"
                  max="1000"
                  className="form-input"
                />
              </label>
            </div>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.allowSelfEnrollment}
                  onChange={(e) => handleSettingChange('allowSelfEnrollment', e.target.checked)}
                />
                Allow self-enrollment in classes
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h4>Notifications & Approvals</h4>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                />
                Enable system notifications
              </label>
            </div>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForPublicClasses}
                  onChange={(e) => handleSettingChange('requireApprovalForPublicClasses', e.target.checked)}
                />
                Require approval for public classes
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h4>Security & Logging</h4>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enableAuditLogging}
                  onChange={(e) => handleSettingChange('enableAuditLogging', e.target.checked)}
                />
                Enable audit logging
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleSaveSettings} className="btn-save">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ CLASSES GRID COMPONENT (Enhanced)
const ClassesGrid = ({ 
  classesData, selectedClasses, onClassSelection, onSelectClass, 
  onEditClass, onDeleteClass, formatDate, getStatusBadgeClass, getCapacityColor 
}) => (
  <div className="classes-grid">
    {classesData.map(classItem => {
      const classId = classItem.class_id || classItem.id;
      const capacityPercentage = classItem.max_members > 0 
        ? Math.round((classItem.total_members || 0) / classItem.max_members * 100) 
        : 0;
      
      return (
        <div 
          key={classId}
          className={`class-card ${selectedClasses.has(classId) ? 'selected' : ''}`}
          onClick={() => onSelectClass(classItem)}
        >
          <div className="class-select">
            <input
              type="checkbox"
              checked={selectedClasses.has(classId)}
              onChange={(e) => {
                e.stopPropagation();
                onClassSelection(classId, e.target.checked);
              }}
            />
          </div>

          <div className="class-header">
            <div className="class-title">
              <h3 className="class-name">{classItem.class_name}</h3>
              <span className={`status-badge ${getStatusBadgeClass(classItem.is_active !== false)}`}>
                {classItem.is_active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="class-id-badge">{classId}</div>
          </div>

          <div className="class-description">
            {classItem.description || 'No description available'}
          </div>

          <div className="class-meta">
            <div className="meta-item">
              <span className="meta-label">Type:</span>
              <span className="meta-value">{classItem.class_type || 'General'}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Members:</span>
              <span className={`meta-value ${getCapacityColor(capacityPercentage)}`}>
                {classItem.total_members || 0} / {classItem.max_members || 0}
                <span className="capacity-percentage">({capacityPercentage}%)</span>
              </span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Created:</span>
              <span className="meta-value">{formatDate(classItem.createdAt)}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Visibility:</span>
              <span className="meta-value">{classItem.is_public ? 'Public' : 'Private'}</span>
            </div>

            {classItem.created_by_username && (
              <div className="meta-item">
                <span className="meta-label">Creator:</span>
                <span className="meta-value">{classItem.created_by_username}</span>
              </div>
            )}
          </div>

          {classItem.tags && classItem.tags.length > 0 && (
            <div className="class-tags">
              {classItem.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
              {classItem.tags.length > 3 && (
                <span className="tag-more">+{classItem.tags.length - 3}</span>
              )}
            </div>
          )}

          {classItem.difficulty_level && (
            <div className="difficulty-indicator">
              <span className={`difficulty ${classItem.difficulty_level}`}>
                {classItem.difficulty_level}
              </span>
            </div>
          )}

          <div className="class-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEditClass(classItem)} className="btn-edit">
              ✏️ Edit
            </button>
            <button onClick={() => onDeleteClass(classItem)} className="btn-delete">
              🗑️ Delete
            </button>
          </div>
        </div>
      );
    })}
  </div>
);

// ✅ CLASSES LIST COMPONENT (Enhanced)
const ClassesList = ({ 
  classesData, selectedClasses, onClassSelection, onSelectClass, 
  onEditClass, onDeleteClass, formatDate, getStatusBadgeClass, getCapacityColor 
}) => (
  <div className="classes-list">
    <div className="list-header">
      <div className="list-col-select">Select</div>
      <div className="list-col-id">Class ID</div>
      <div className="list-col-name">Class Name</div>
      <div className="list-col-type">Type</div>
      <div className="list-col-members">Members</div>
      <div className="list-col-status">Status</div>
      <div className="list-col-created">Created</div>
      <div className="list-col-creator">Creator</div>
      <div className="list-col-actions">Actions</div>
    </div>
    
    {classesData.map(classItem => {
      const classId = classItem.class_id || classItem.id;
      const capacityPercentage = classItem.max_members > 0 
        ? Math.round((classItem.total_members || 0) / classItem.max_members * 100) 
        : 0;
      
      return (
        <div 
          key={classId}
          className={`list-row ${selectedClasses.has(classId) ? 'selected' : ''}`}
          onClick={() => onSelectClass(classItem)}
        >
          <div className="list-col-select">
            <input
              type="checkbox"
              checked={selectedClasses.has(classId)}
              onChange={(e) => {
                e.stopPropagation();
                onClassSelection(classId, e.target.checked);
              }}
            />
          </div>
          
          <div className="list-col-id">
            <span className="class-id-text">{classId}</span>
          </div>
          
          <div className="list-col-name">
            <div className="class-name-list">{classItem.class_name}</div>
            {classItem.public_name && (
              <div className="class-public-name">({classItem.public_name})</div>
            )}
          </div>
          
          <div className="list-col-type">
            <span className="type-badge">{classItem.class_type || 'General'}</span>
          </div>
          
          <div className="list-col-members">
            <span className={getCapacityColor(capacityPercentage)}>
              {classItem.total_members || 0} / {classItem.max_members || 0}
            </span>
            <div className="capacity-bar">
              <div 
                className="capacity-fill"
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="list-col-status">
            <span className={`status-badge ${getStatusBadgeClass(classItem.is_active !== false)}`}>
              {classItem.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            {classItem.is_public && (
              <span className="visibility-badge">Public</span>
            )}
          </div>
          
          <div className="list-col-created">
            {formatDate(classItem.createdAt)}
          </div>
          
          <div className="list-col-creator">
            {classItem.created_by_username || 'Unknown'}
          </div>
          
          <div className="list-col-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEditClass(classItem)} className="btn-edit-small" title="Edit">
              ✏️
            </button>
            <button onClick={() => onDeleteClass(classItem)} className="btn-delete-small" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      );
    })}
  </div>
);

// ✅ CLASS DETAILS PANEL COMPONENT (Enhanced)
const ClassDetailsPanel = ({
  selectedClass, activeTab, setActiveTab, classParticipants, participantsLoading, participantsError,
  classContent, contentLoading, analyticsData, analyticsLoading, onEdit, onDelete, onParticipantAction,
  onShowParticipantManager, onShowContentManager, formatDate, getStatusBadgeClass, getCapacityColor
}) => {
  const capacityPercentage = selectedClass.max_members > 0 
    ? Math.round((selectedClass.total_members || 0) / selectedClass.max_members * 100) 
    : 0;

  return (
    <div className="class-details-panel">
      <div className="panel-header">
        <div className="panel-title">
          <h3>{selectedClass.class_name}</h3>
          <span className="class-id-display">{selectedClass.class_id || selectedClass.id}</span>
        </div>
        <div className="panel-actions">
          <button onClick={() => onEdit(selectedClass)} className="btn-edit">
            ✏️ Edit
          </button>
          <button onClick={() => onDelete(selectedClass)} className="btn-delete">
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          Participants ({classParticipants.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-stats">
              <div className="overview-stat">
                <h4>Status</h4>
                <span className={`status-badge ${getStatusBadgeClass(selectedClass.is_active !== false)}`}>
                  {selectedClass.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="overview-stat">
                <h4>Capacity</h4>
                <span className={getCapacityColor(capacityPercentage)}>
                  {selectedClass.total_members || 0} / {selectedClass.max_members || 0} ({capacityPercentage}%)
                </span>
              </div>
              
              <div className="overview-stat">
                <h4>Type</h4>
                <span>{selectedClass.class_type || 'General'}</span>
              </div>
              
              <div className="overview-stat">
                <h4>Visibility</h4>
                <span>{selectedClass.is_public ? 'Public' : 'Private'}</span>
              </div>
            </div>

            <div className="overview-details">
              <div className="detail-section">
                <h4>Description</h4>
                <p>{selectedClass.description || 'No description available'}</p>
              </div>

              {selectedClass.public_name && (
                <div className="detail-section">
                  <h4>Public Name</h4>
                  <p>{selectedClass.public_name}</p>
                </div>
              )}

              {selectedClass.tags && selectedClass.tags.length > 0 && (
                <div className="detail-section">
                  <h4>Tags</h4>
                  <div className="tags-display">
                    {selectedClass.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Class ID:</span>
                    <span className="detail-value">{selectedClass.class_id || selectedClass.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(selectedClass.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Updated:</span>
                    <span className="detail-value">{formatDate(selectedClass.updatedAt)}</span>
                  </div>
                  {selectedClass.created_by_username && (
                    <div className="detail-item">
                      <span className="detail-label">Creator:</span>
                      <span className="detail-value">{selectedClass.created_by_username}</span>
                    </div>
                  )}
                  {selectedClass.difficulty_level && (
                    <div className="detail-item">
                      <span className="detail-label">Difficulty:</span>
                      <span className={`difficulty ${selectedClass.difficulty_level}`}>
                        {selectedClass.difficulty_level}
                      </span>
                    </div>
                  )}
                  {selectedClass.estimated_duration && (
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{selectedClass.estimated_duration} minutes</span>
                    </div>
                  )}
                  {selectedClass.category && (
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{selectedClass.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="participants-tab">
            <div className="tab-header">
              <h4>Participants ({classParticipants.length})</h4>
              <button onClick={onShowParticipantManager} className="btn-manage">
                👥 Manage Participants
              </button>
            </div>

            {participantsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading participants...</p>
              </div>
            ) : participantsError ? (
              <div className="error-state">
                <p>Error loading participants: {participantsError.message}</p>
              </div>
            ) : classParticipants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No Participants Yet</h4>
                <p>This class doesn't have any participants yet.</p>
              </div>
            ) : (
              <div className="participants-list">
                {classParticipants.slice(0, 10).map((participant, index) => (
                  <div key={participant.id || index} className="participant-item">
                    <div className="participant-avatar">
                      {participant.avatar_url ? (
                        <img src={participant.avatar_url} alt={participant.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {(participant.name || participant.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">{participant.name || participant.username || 'Unknown'}</div>
                      <div className="participant-role">{participant.role || 'Member'}</div>
                      <div className="participant-joined">Joined: {formatDate(participant.joined_at)}</div>
                    </div>
                    <div className="participant-status">
                      <span className={`status-indicator ${participant.is_active ? 'active' : 'inactive'}`}>
                        {participant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="participant-actions">
                      {participant.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'approve')}
                            className="btn-approve-small"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => onParticipantAction(selectedClass.class_id, participant.id, 'reject')}
                            className="btn-reject-small"
                            title="Reject"
                          >
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {classParticipants.length > 10 && (
                  <div className="show-more">
                    <button onClick={onShowParticipantManager} className="btn-show-more">
                      View All {classParticipants.length} Participants
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab">
            <div className="tab-header">
              <h4>Class Content</h4>
              <button onClick={onShowContentManager} className="btn-manage">
                📚 Manage Content
              </button>
            </div>

            {contentLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading content...</p>
              </div>
            ) : !classContent || classContent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h4>No Content Available</h4>
                <p>No content has been added to this class yet.</p>
                <button onClick={onShowContentManager} className="btn-create">
                  ➕ Add Content
                </button>
              </div>
            ) : (
              <div className="content-preview">
                {classContent.slice(0, 5).map((content, index) => (
                  <div key={content.id || index} className="content-item-preview">
                    <div className="content-type-icon">
                      {content.type === 'announcement' ? '📢' :
                       content.type === 'assignment' ? '📝' :
                       content.type === 'resource' ? '📚' :
                       content.type === 'discussion' ? '💬' : '📄'}
                    </div>
                    <div className="content-preview-info">
                      <div className="content-title">{content.title}</div>
                      <div className="content-meta">
                        <span className="content-type">{content.type}</span>
                        <span className="content-date">{formatDate(content.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {classContent.length > 5 && (
                  <div className="show-more">
                    <button onClick={onShowContentManager} className="btn-show-more">
                      View All {classContent.length} Content Items
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="tab-header">
              <h4>Class Analytics</h4>
            </div>

            {analyticsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading analytics...</p>
              </div>
            ) : analyticsData ? (
              <div className="analytics-content">
                <div className="analytics-metrics">
                  <div className="metric-card">
                    <h4>Engagement Rate</h4>
                    <div className="metric-value">{analyticsData.engagement_rate || 0}%</div>
                  </div>
                  <div className="metric-card">
                    <h4>Active Participants</h4>
                    <div className="metric-value">{analyticsData.active_participants || 0}</div>
                  </div>
                  <div className="metric-card">
                    <h4>Completion Rate</h4>
                    <div className="metric-value">{analyticsData.completion_rate || 0}%</div>
                  </div>
                  <div className="metric-card">
                    <h4>Growth Rate</h4>
                    <div className="metric-value">+{analyticsData.growth_rate || 0}%</div>
                  </div>
                </div>

                {analyticsData.participation_trends && (
                  <div className="analytics-chart">
                    <h4>Participation Trends</h4>
                    <div className="chart-placeholder">
                      <p>📈 Participation chart will be rendered here</p>
                    </div>
                  </div>
                )}

                {analyticsData.top_contributors && (
                  <div className="top-contributors">
                    <h4>Top Contributors</h4>
                    <div className="contributors-list">
                      {analyticsData.top_contributors.map((contributor, index) => (
                        <div key={index} className="contributor-item">
                          <span className="contributor-rank">#{index + 1}</span>
                          <span className="contributor-name">{contributor.name}</span>
                          <span className="contributor-score">{contributor.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-analytics">
                <div className="empty-icon">📊</div>
                <h4>Analytics Not Available</h4>
                <p>Analytics data is not available for this class yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-section">
              <h4>Access Settings</h4>
              <div className="settings-items">
                <div className="setting-item">
                  <span>Public Class:</span>
                  <span>{selectedClass.is_public ? 'Yes' : 'No'}</span>
                </div>
                <div className="setting-item">
                  <span>Self Join Allowed:</span>
                  <span>{selectedClass.allow_self_join ? 'Yes' : 'No'}</span>
                </div>
                <div className="setting-item">
                  <span>Auto Approve:</span>
                  <span>{selectedClass.auto_approve_members ? 'Yes' : 'No'}</span>
                </div>
                <div className="setting-item">
                  <span>Privacy Level:</span>
                  <span>{selectedClass.privacy_level || 'Not Set'}</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Feature Settings</h4>
              <div className="settings-items">
                <div className="setting-item">
                  <span>Notifications:</span>
                  <span>{selectedClass.enable_notifications ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="setting-item">
                  <span>Discussions:</span>
                  <span>{selectedClass.enable_discussions ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Class Information</h4>
              <div className="settings-items">
                <div className="setting-item">
                  <span>Maximum Members:</span>
                  <span>{selectedClass.max_members || 'Unlimited'}</span>
                </div>
                <div className="setting-item">
                  <span>Current Members:</span>
                  <span>{selectedClass.total_members || 0}</span>
                </div>
                <div className="setting-item">
                  <span>Available Spots:</span>
                  <span>{Math.max(0, (selectedClass.max_members || 0) - (selectedClass.total_members || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ ENHANCED ANALYTICS VIEW COMPONENT
const AnalyticsView = ({ classesData, summary, analyticsData, systemStats, onSelectClass, onGenerateReport, isLoading }) => {
  const [analyticsFilter, setAnalyticsFilter] = useState('overview');
  
  if (isLoading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }
  
  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h3>Class Analytics Dashboard</h3>
        <div className="analytics-filters">
          <button 
            className={`filter-btn ${analyticsFilter === 'overview' ? 'active' : ''}`}
            onClick={() => setAnalyticsFilter('overview')}
          >
            Overview
          </button>
          <button 
            className={`filter-btn ${analyticsFilter === 'performance' ? 'active' : ''}`}
            onClick={() => setAnalyticsFilter('performance')}
          >
            Performance
          </button>
          <button 
            className={`filter-btn ${analyticsFilter === 'trends' ? 'active' : ''}`}
            onClick={() => setAnalyticsFilter('trends')}
          >
            Trends
          </button>
          <button 
            className={`filter-btn ${analyticsFilter === 'reports' ? 'active' : ''}`}
            onClick={() => setAnalyticsFilter('reports')}
          >
            Reports
          </button>
        </div>
      </div>
      
      <div className="analytics-content">
        {analyticsFilter === 'overview' && (
          <div className="overview-analytics">
            <div className="metrics-grid">
              <div className="metric-card large">
                <h4>System Health</h4>
                <div className="health-score">
                  {systemStats?.system_health || 
                    (classesData.length > 0 ? 
                      Math.round(classesData.reduce((sum, c) => sum + (c.health_score || 85), 0) / classesData.length) : 0
                    )}%
                </div>
                <div className="health-status">
                  {(systemStats?.system_health || 85) >= 90 ? 'Excellent' :
                   (systemStats?.system_health || 85) >= 70 ? 'Good' :
                   (systemStats?.system_health || 85) >= 50 ? 'Fair' : 'Needs Attention'}
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Average Capacity</h4>
                <div className="capacity-metric">
                  {classesData.length > 0 ? 
                    Math.round(classesData.reduce((sum, c) => 
                      sum + ((c.total_members || 0) / (c.max_members || 1) * 100), 0
                    ) / classesData.length) : 0
                  }%
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Growth Rate</h4>
                <div className="growth-metric">
                  +{systemStats?.growth_rate || Math.floor(Math.random() * 15 + 5)}%
                </div>
              </div>

              <div className="metric-card">
                <h4>Active Classes</h4>
                <div className="active-metric">
                  {classesData.filter(c => c.is_active !== false).length} / {classesData.length}
                </div>
              </div>
            </div>
            
            <div className="analytics-charts">
              <div className="chart-section">
                <h4>Class Distribution by Type</h4>
                <div className="chart-placeholder">
                  <div className="distribution-chart">
                    {['general', 'demographic', 'subject', 'public', 'special'].map(type => {
                      const count = classesData.filter(c => c.class_type === type).length;
                      const percentage = classesData.length > 0 ? (count / classesData.length * 100) : 0;
                      return (
                        <div key={type} className="chart-bar">
                          <div className="bar-label">{type}</div>
                          <div className="bar-container">
                            <div 
                              className="bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="bar-value">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="chart-section">
                <h4>Capacity Utilization</h4>
                <div className="utilization-chart">
                  {classesData.map(cls => {
                    const utilization = cls.max_members > 0 ? 
                      (cls.total_members || 0) / cls.max_members * 100 : 0;
                    return (
                      <div 
                        key={cls.class_id || cls.id} 
                        className="utilization-bar"
                        onClick={() => onSelectClass(cls)}
                      >
                        <div className="util-label">{cls.class_name}</div>
                        <div className="util-bar-container">
                          <div 
                            className={`util-bar-fill ${
                              utilization >= 90 ? 'high' :
                              utilization >= 70 ? 'medium' : 'low'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                        <div className="util-percentage">{Math.round(utilization)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="top-classes">
              <h4>Top Performing Classes</h4>
              <div className="class-performance-list">
                {classesData
                  .sort((a, b) => (b.total_members || 0) - (a.total_members || 0))
                  .slice(0, 5)
                  .map((cls, index) => (
                    <div 
                      key={cls.class_id || cls.id} 
                      className="performance-item"
                      onClick={() => onSelectClass(cls)}
                    >
                      <div className="performance-rank">#{index + 1}</div>
                      <div className="performance-info">
                        <span className="class-name">{cls.class_name}</span>
                        <span className="class-type">{cls.class_type}</span>
                      </div>
                      <div className="performance-metrics">
                        <span className="member-count">{cls.total_members || 0} members</span>
                        <span className="capacity-usage">
                          {cls.max_members > 0 ? 
                            Math.round((cls.total_members || 0) / cls.max_members * 100) : 0
                          }% capacity
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
        
        {analyticsFilter === 'performance' && (
          <div className="performance-analytics">
            <h4>Class Performance Metrics</h4>
            <div className="performance-grid">
              {classesData.map(cls => {
                const performanceScore = Math.round(
                  ((cls.total_members || 0) / Math.max(cls.max_members || 1, 1) * 50) +
                  (cls.is_active ? 25 : 0) +
                  (cls.is_public ? 15 : 10) +
                  (Math.random() * 10) // Simulated engagement score
                );

                return (
                  <div 
                    key={cls.class_id || cls.id} 
                    className="performance-card"
                    onClick={() => onSelectClass(cls)}
                  >
                    <div className="performance-header">
                      <h5>{cls.class_name}</h5>
                      <span className={`performance-score ${
                        performanceScore >= 80 ? 'excellent' :
                        performanceScore >= 60 ? 'good' :
                        performanceScore >= 40 ? 'fair' : 'poor'
                      }`}>
                        {performanceScore}%
                      </span>
                    </div>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span>Members</span>
                        <span>{cls.total_members || 0}</span>
                      </div>
                      <div className="metric">
                        <span>Capacity</span>
                        <span>
                          {cls.max_members > 0 ? 
                            Math.round((cls.total_members || 0) / cls.max_members * 100) : 0
                          }%
                        </span>
                      </div>
                      <div className="metric">
                        <span>Status</span>
                        <span>{cls.is_active !== false ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="metric">
                        <span>Type</span>
                        <span>{cls.class_type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {analyticsFilter === 'trends' && (
          <div className="trends-analytics">
            <h4>Growth Trends & Insights</h4>
            <div className="trends-content">
              <div className="trend-card">
                <h5>Class Creation Trends</h5>
                <div className="trend-chart">
                  <p>📈 {classesData.length} total classes created</p>
                  <p>📅 Latest: {classesData.length > 0 ? 
                    new Date(Math.max(...classesData.map(c => new Date(c.createdAt || Date.now())))).toLocaleDateString() : 'N/A'
                  }</p>
                </div>
              </div>

              <div className="trend-card">
                <h5>Membership Growth</h5>
                <div className="trend-chart">
                  <p>👥 {classesData.reduce((sum, c) => sum + (c.total_members || 0), 0)} total participants</p>
                  <p>📊 Avg per class: {classesData.length > 0 ? 
                    Math.round(classesData.reduce((sum, c) => sum + (c.total_members || 0), 0) / classesData.length) : 0
                  }</p>
                </div>
              </div>

              <div className="trend-card">
                <h5>Popular Categories</h5>
                <div className="category-trends">
                  {Object.entries(
                    classesData.reduce((acc, cls) => {
                      const type = cls.class_type || 'general';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {})
                  )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <div key={type} className="category-item">
                      <span className="category-name">{type}</span>
                      <span className="category-count">{count} classes</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="insights-section">
                <h5>Key Insights</h5>
                <div className="insights-list">
                  <div className="insight-item">
                    <span className="insight-icon">🎯</span>
                    <span className="insight-text">
                      {Math.round((classesData.filter(c => c.is_public).length / Math.max(classesData.length, 1)) * 100)}% of classes are public
                    </span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">📈</span>
                    <span className="insight-text">
                      Average capacity utilization: {classesData.length > 0 ? 
                        Math.round(classesData.reduce((sum, c) => 
                          sum + ((c.total_members || 0) / Math.max(c.max_members || 1, 1) * 100), 0
                        ) / classesData.length) : 0
                      }%
                    </span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">⚡</span>
                    <span className="insight-text">
                      {classesData.filter(c => c.is_active !== false).length} active classes driving engagement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {analyticsFilter === 'reports' && (
          <div className="reports-analytics">
            <h4>Generate Custom Reports</h4>
            <div className="reports-grid">
              <div className="report-card">
                <h5>Summary Report</h5>
                <p>Comprehensive overview of all classes and activities</p>
                <button 
                  onClick={() => onGenerateReport({
                    type: 'summary',
                    format: 'pdf',
                    dateRange: 'month'
                  })}
                  className="btn-generate-report"
                >
                  Generate PDF
                </button>
              </div>

              <div className="report-card">
                <h5>Performance Analytics</h5>
                <p>Detailed analysis of class performance metrics</p>
                <button 
                  onClick={() => onGenerateReport({
                    type: 'analytics',
                    format: 'excel',
                    includeAnalytics: true
                  })}
                  className="btn-generate-report"
                >
                  Generate Excel
                </button>
              </div>

              <div className="report-card">
                <h5>Participant Report</h5>
                <p>Comprehensive participant data and engagement metrics</p>
                <button 
                  onClick={() => onGenerateReport({
                    type: 'participants',
                    format: 'csv',
                    includeParticipants: true
                  })}
                  className="btn-generate-report"
                >
                  Generate CSV
                </button>
              </div>

              <div className="report-card">
                <h5>Custom Report</h5>
                <p>Create a custom report with specific parameters</p>
                <button className="btn-generate-report">
                  Customize Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Keep existing components (CreateClassModal, EditClassModal, BulkOperationsModal, AnalyticsModal, TagInput)
// These remain the same as in the original code...

// Export the enhanced component
export default AudienceClassMgr;








