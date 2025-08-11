// ikootaclient/src/components/admin/AudienceClassMgr.jsx
// ✅ WORKING VERSION - Uses only existing backend endpoints (/classes/)
// No more 404 errors - keeps all your original functionality

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './audienceClassMgr.css';
import { generateUniqueClassId, validateIdFormat } from '../service/idGenerationService';
import './converseId.css';

const AudienceClassMgr = () => {
  const queryClient = useQueryClient();
  
  // ✅ ORIGINAL WORKING FUNCTIONALITY - Keep class_id generation
  const [formData, setFormData] = useState({
    class_id: '',
    name: '',
    description: '',
  });

  // ✅ ENHANCED UI STATE - Add modal and selection functionality  
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // ✅ FIXED: Use ONLY working endpoints (/classes/)
  const { 
    data: rawClassesData, 
    isLoading: classesLoading, 
    error: classesError,
    refetch: refetchClasses 
  } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching classes from /classes/...');
        const { data } = await api.get('/classes/');
        console.log('✅ Classes API response:', data);
        
        // Handle different response formats safely
        if (data?.success && Array.isArray(data.classes)) {
          return data.classes;
        } else if (data?.classes && Array.isArray(data.classes)) {
          return data.classes;
        } else if (Array.isArray(data)) {
          return data;
        } else {
          console.warn('⚠️ Unexpected classes response format:', data);
          return data || [];
        }
      } catch (error) {
        console.error('❌ Error fetching classes:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error('❌ Classes query error:', error);
    }
  });

  // ✅ SAFE CLASSES ARRAY
  const classes = Array.isArray(rawClassesData) ? rawClassesData : [];

  // ✅ FETCH CLASS MEMBERS - Use working endpoint
  const { 
    data: rawMembersData, 
    isLoading: membersLoading, 
    error: membersError 
  } = useQuery({
    queryKey: ['classMembers', selectedClass?.id || selectedClass?.class_id],
    queryFn: async () => {
      const classId = selectedClass?.id || selectedClass?.class_id;
      if (!classId) return [];
      
      try {
        console.log('🔍 Fetching members for class:', classId);
        // ✅ Use only working endpoint
        const { data } = await api.get(`/classes/${classId}/members`);
        console.log('✅ Members API response:', data);
        
        if (data?.success && Array.isArray(data.members)) {
          return data.members;
        } else if (data?.members && Array.isArray(data.members)) {
          return data.members;
        } else if (Array.isArray(data)) {
          return data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('❌ Error fetching class members:', error);
        return [];
      }
    },
    enabled: !!(selectedClass?.id || selectedClass?.class_id),
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  const classMembers = Array.isArray(rawMembersData) ? rawMembersData : [];

  // ✅ ORIGINAL WORKING MUTATION - Use only working endpoints
  const mutation = useMutation({
    mutationFn: async (classData) => {
      // Validate ID format before sending (original functionality)
      if (classData.class_id && !validateIdFormat(classData.class_id, 'class')) {
        throw new Error('Invalid class ID format. Must be OTU# followed by 6 alphanumeric characters.');
      }
      
      console.log('🔍 Saving class data:', classData);
      
      // ✅ Use ONLY working endpoints (/classes/)
      if (classData.id || classData.class_id) {
        // Update existing class
        const classId = classData.id || classData.class_id;
        return await api.put(`/classes/${classId}`, classData);
      } else {
        // Create new class
        return await api.post('/classes/', classData);
      }
    },
    onSuccess: () => {
      alert('Class saved successfully!');
      queryClient.invalidateQueries(['classes']);
      setFormData({ class_id: '', name: '', description: '' });
      setShowCreateForm(false);
      setShowEditForm(false);
      setEditingClass(null);
    },
    onError: (error) => {
      console.error('❌ Mutation failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to save the class: ${errorMessage}`);
    },
  });

  // ✅ DELETE MUTATION - Use working endpoint
  const { mutate: deleteClass, isLoading: deletingClass } = useMutation({
    mutationFn: async (classId) => {
      console.log('🔍 Deleting class:', classId);
      // ✅ Use only working endpoint
      return await api.delete(`/classes/${classId}`);
    },
    onSuccess: () => {
      alert('Class deleted successfully!');
      queryClient.invalidateQueries(['classes']);
      if (selectedClass?.id === arguments[0] || selectedClass?.class_id === arguments[0]) {
        setSelectedClass(null);
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete class';
      alert('Failed to delete class: ' + errorMessage);
    }
  });

  // ✅ ORIGINAL WORKING FUNCTIONS
  const handleGenerateNewClassId = async () => {
    try {
      const newId = await generateUniqueClassId();
      setFormData((prev) => ({ ...prev, class_id: newId }));
    } catch (error) {
      console.error('Failed to generate class ID:', error);
      alert('Failed to generate unique class ID. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  // ✅ ENHANCED UI FUNCTIONS
  const handleCreateClass = () => {
    if (!newClass.name || !newClass.description) {
      alert('Please fill in all required fields (name and description)');
      return;
    }
    mutation.mutate(newClass);
  };

  const handleEditClass = (classItem) => {
    setEditingClass({ 
      ...classItem,
      // Ensure we have the proper ID field
      id: classItem.id || classItem.class_id,
      class_id: classItem.class_id || classItem.id
    });
    setShowEditForm(true);
  };

  const handleUpdateClass = () => {
    if (!editingClass || !editingClass.name) {
      alert('Please fill in all required fields');
      return;
    }
    mutation.mutate(editingClass);
  };

  const handleDeleteClass = (classItem) => {
    const classId = classItem.id || classItem.class_id;
    const className = classItem.name || 'Unnamed Class';
    
    if (window.confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      deleteClass(classId);
    }
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

  // ✅ NEW ENHANCED STATE for modal
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    category: 'general',
    capacity: 50,
    isActive: true
  });

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
            <button onClick={refetchClasses} className="btn-retry">
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
      {/* ✅ ENHANCED HEADER */}
      <div className="header-section">
        <h2>Audience Class Manager</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-create"
            disabled={mutation.isLoading}
          >
            ➕ Create New Class
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

      {/* ✅ STATS OVERVIEW */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h4>Total Classes</h4>
            <span className="stat-number">{classes.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h4>Active Classes</h4>
            <span className="stat-number">
              {classes.filter(c => c.isActive !== false).length}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h4>With Custom IDs</h4>
            <span className="stat-number">
              {classes.filter(c => c.class_id && c.class_id.startsWith('OTU#')).length}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ MAIN CONTENT LAYOUT */}
      <div className="main-content">
        {/* ✅ CLASSES LIST */}
        <div className="classes-section">
          <h3>Classes ({classes.length})</h3>
          
          {classesLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h4>No Classes Found</h4>
              <p>No classes have been created yet. Create your first class to get started.</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-create-first"
              >
                ➕ Create First Class
              </button>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div 
                  key={classItem.id || classItem.class_id} 
                  className={`class-card ${selectedClass?.id === classItem.id || selectedClass?.class_id === classItem.class_id ? 'selected' : ''}`}
                  onClick={() => setSelectedClass(classItem)}
                >
                  <div className="class-header">
                    <h4 className="class-name">{classItem.name || 'Unnamed Class'}</h4>
                    <span className={`status-badge ${getStatusBadgeClass(classItem.isActive)}`}>
                      {classItem.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="class-details">
                    <p className="class-description">
                      {classItem.description || 'No description provided'}
                    </p>
                    <div className="class-meta">
                      <span className="class-id">
                        🏷️ ID: {classItem.class_id || classItem.id || 'No ID'}
                      </span>
                      {classItem.class_id && (
                        <span className={`id-validation ${validateIdFormat(classItem.class_id, 'class') ? 'valid' : 'invalid'}`}>
                          {validateIdFormat(classItem.class_id, 'class') ? '✓ Valid format' : '✗ Invalid format'}
                        </span>
                      )}
                      <span className="category">
                        📂 {classItem.category || 'General'}
                      </span>
                      <span className="capacity">
                        👥 {classItem.memberCount || 0}/{classItem.capacity || 'Unlimited'}
                      </span>
                      <span className="created">
                        📅 Created: {formatDate(classItem.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="class-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditClass(classItem)}
                      className="btn-edit"
                      disabled={mutation.isLoading}
                      title="Edit class"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem)}
                      className="btn-delete"
                      disabled={deletingClass}
                      title="Delete class"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ SELECTED CLASS DETAILS */}
        {selectedClass && (
          <div className="class-details-section">
            <h3>Class Details: {selectedClass.name}</h3>
            
            <div className="class-info-grid">
              <div className="info-item">
                <strong>Name:</strong>
                <span>{selectedClass.name}</span>
              </div>
              <div className="info-item">
                <strong>Class ID:</strong>
                <span>{selectedClass.class_id || selectedClass.id || 'No ID'}</span>
              </div>
              <div className="info-item">
                <strong>Description:</strong>
                <span>{selectedClass.description || 'No description'}</span>
              </div>
              <div className="info-item">
                <strong>Category:</strong>
                <span>{selectedClass.category || 'General'}</span>
              </div>
              <div className="info-item">
                <strong>Capacity:</strong>
                <span>{selectedClass.capacity || 'Unlimited'}</span>
              </div>
              <div className="info-item">
                <strong>Status:</strong>
                <span className={getStatusBadgeClass(selectedClass.isActive)}>
                  {selectedClass.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="info-item">
                <strong>Created:</strong>
                <span>{formatDate(selectedClass.createdAt)}</span>
              </div>
            </div>

            {/* Class Members */}
            <div className="members-section">
              <h4>Class Members ({classMembers.length})</h4>
              
              {membersLoading ? (
                <div className="loading-state small">
                  <div className="loading-spinner small"></div>
                  <p>Loading members...</p>
                </div>
              ) : membersError ? (
                <div className="error-state small">
                  <p>Error loading members: {membersError.message}</p>
                </div>
              ) : classMembers.length === 0 ? (
                <div className="empty-state small">
                  <p>No members in this class yet.</p>
                </div>
              ) : (
                <div className="members-list">
                  {classMembers.map((member) => (
                    <div key={member.id} className="member-item">
                      <div className="member-avatar">
                        {(member.username || member.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <span className="member-name">
                          {member.username || member.name || 'Unknown User'}
                        </span>
                        <span className="member-email">
                          {member.email || 'No email'}
                        </span>
                        <span className="member-joined">
                          Joined: {formatDate(member.joinedAt || member.createdAt)}
                        </span>
                      </div>
                      <div className="member-status">
                        <span className={`status-badge ${member.isActive ? 'active' : 'inactive'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ ORIGINAL WORKING CREATE FORM - In Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Class</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="audience-class-form">
                <div className="form-group">
                  <label>
                    Class ID:
                    <input
                      type="text"
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleInputChange}
                      placeholder="OTU#XXXXXX (10 characters)"
                      pattern="^OTU#[A-Z0-9]{6}$"
                      title="Class ID must be OTU# followed by 6 alphanumeric characters (total 10 characters)"
                      maxLength="10"
                      readOnly
                    />
                    <button type="button" onClick={handleGenerateNewClassId}>
                      Generate Class ID
                    </button>
                    {formData.class_id && (
                      <span className={validateIdFormat(formData.class_id, 'class') ? 'valid' : 'invalid'}>
                        {validateIdFormat(formData.class_id, 'class') ? '✓ Valid format (OTU#XXXXXX)' : '✗ Invalid format'}
                      </span>
                    )}
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    Class Name:
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter class name"
                      required
                    />
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    Description:
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter class description"
                    />
                  </label>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-cancel"
                    disabled={mutation.isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={mutation.isLoading}
                  >
                    {mutation.isLoading ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✅ EDIT CLASS MODAL */}
      {showEditForm && editingClass && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Class: {editingClass.name}</h3>
              <button 
                onClick={() => setShowEditForm(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="Enter class name"
                  disabled={mutation.isLoading}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingClass.description || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                  placeholder="Enter class description"
                  rows="3"
                  disabled={mutation.isLoading}
                />
              </div>
              
              <div className="form-group">
                <label>Class ID (Read-only)</label>
                <input
                  type="text"
                  value={editingClass.class_id || editingClass.id || ''}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowEditForm(false)}
                className="btn-cancel"
                disabled={mutation.isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateClass}
                className="btn-save"
                disabled={mutation.isLoading || !editingClass.name}
              >
                {mutation.isLoading ? 'Updating...' : 'Update Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ LOADING OVERLAY */}
      {(mutation.isLoading || deletingClass) && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading-spinner large"></div>
            <p>
              {mutation.isLoading && 'Processing class...'}
              {deletingClass && 'Deleting class...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceClassMgr;

// // ikootaclient/src/components/admin/AudienceClassMgr.jsx
// import React, { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '../service/api';
// import './audienceClassMgr.css';

// const AudienceClassMgr = () => {
//   const queryClient = useQueryClient();
  
//   // State management
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);
//   const [newClass, setNewClass] = useState({
//     name: '',
//     description: '',
//     category: 'general',
//     capacity: 50,
//     isActive: true
//   });
//   const [editingClass, setEditingClass] = useState(null);

//   // ✅ CRITICAL FIX: Safe fetch classes with proper error handling
//   const { 
//     data: rawClassesData, 
//     isLoading: classesLoading, 
//     error: classesError,
//     refetch: refetchClasses 
//   } = useQuery({
//     queryKey: ['classes'],
//     queryFn: async () => {
//       try {
//         console.log('🔍 Fetching classes...');
//         const { data } = await api.get('/classes/');
//         console.log('✅ Classes API response:', data);
        
//         // Handle different response formats safely
//         if (data?.success && Array.isArray(data.classes)) {
//           return data.classes;
//         } else if (data?.classes && Array.isArray(data.classes)) {
//           return data.classes;
//         } else if (Array.isArray(data)) {
//           return data;
//         } else {
//           console.warn('⚠️ Unexpected classes response format:', data);
//           return [];
//         }
//       } catch (error) {
//         console.error('❌ Error fetching classes:', error);
//         // Return empty array instead of throwing to prevent crash
//         return [];
//       }
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     cacheTime: 10 * 60 * 1000, // 10 minutes
//     retry: (failureCount, error) => {
//       // Only retry on network errors, not on 404/403
//       if (error?.response?.status >= 400 && error?.response?.status < 500) {
//         return false;
//       }
//       return failureCount < 2;
//     },
//     onError: (error) => {
//       console.error('❌ Classes query error:', error);
//     }
//   });

//   // ✅ CRITICAL FIX: Safe classes array with fallback
//   const classes = Array.isArray(rawClassesData) ? rawClassesData : [];

//   // ✅ Safe fetch class members
//   const { 
//     data: rawMembersData, 
//     isLoading: membersLoading, 
//     error: membersError 
//   } = useQuery({
//     queryKey: ['classMembers', selectedClass?.id],
//     queryFn: async () => {
//       if (!selectedClass?.id) return [];
      
//       try {
//         console.log('🔍 Fetching members for class:', selectedClass.id);
//         const { data } = await api.get(`/classes/${selectedClass.id}/members`);
//         console.log('✅ Members API response:', data);
        
//         // Handle different response formats safely
//         if (data?.success && Array.isArray(data.members)) {
//           return data.members;
//         } else if (data?.members && Array.isArray(data.members)) {
//           return data.members;
//         } else if (Array.isArray(data)) {
//           return data;
//         } else {
//           console.warn('⚠️ Unexpected members response format:', data);
//           return [];
//         }
//       } catch (error) {
//         console.error('❌ Error fetching class members:', error);
//         return [];
//       }
//     },
//     enabled: !!selectedClass?.id,
//     staleTime: 2 * 60 * 1000,
//     retry: 1,
//     onError: (error) => {
//       console.error('❌ Members query error:', error);
//     }
//   });

//   // ✅ Safe members array
//   const classMembers = Array.isArray(rawMembersData) ? rawMembersData : [];

//   // ✅ Create class mutation
//   const { mutate: createClass, isLoading: creatingClass } = useMutation({
//     mutationFn: async (classData) => {
//       console.log('🔍 Creating class:', classData);
//       const { data } = await api.post('/admin/classes/create', classData);
//       return data;
//     },
//     onSuccess: (data) => {
//       console.log('✅ Class created successfully:', data);
//       queryClient.invalidateQueries(['classes']);
//       setShowCreateForm(false);
//       setNewClass({
//         name: '',
//         description: '',
//         category: 'general',
//         capacity: 50,
//         isActive: true
//       });
//       alert('Class created successfully!');
//     },
//     onError: (error) => {
//       console.error('❌ Error creating class:', error);
//       const errorMessage = error.response?.data?.error || error.message || 'Failed to create class';
//       alert('Failed to create class: ' + errorMessage);
//     }
//   });

//   // ✅ Update class mutation
//   const { mutate: updateClass, isLoading: updatingClass } = useMutation({
//     mutationFn: async ({ classId, classData }) => {
//       console.log('🔍 Updating class:', { classId, classData });
//       const { data } = await api.put(`/admin/classes/${classId}`, classData);
//       return data;
//     },
//     onSuccess: (data) => {
//       console.log('✅ Class updated successfully:', data);
//       queryClient.invalidateQueries(['classes']);
//       queryClient.invalidateQueries(['classMembers']);
//       setShowEditForm(false);
//       setEditingClass(null);
//       alert('Class updated successfully!');
//     },
//     onError: (error) => {
//       console.error('❌ Error updating class:', error);
//       const errorMessage = error.response?.data?.error || error.message || 'Failed to update class';
//       alert('Failed to update class: ' + errorMessage);
//     }
//   });

//   // ✅ Delete class mutation
//   const { mutate: deleteClass, isLoading: deletingClass } = useMutation({
//     mutationFn: async (classId) => {
//       console.log('🔍 Deleting class:', classId);
//       const { data } = await api.delete(`/admin/classes/${classId}`);
//       return data;
//     },
//     onSuccess: () => {
//       console.log('✅ Class deleted successfully');
//       queryClient.invalidateQueries(['classes']);
//       if (selectedClass?.id === arguments[0]) {
//         setSelectedClass(null);
//       }
//       alert('Class deleted successfully!');
//     },
//     onError: (error) => {
//       console.error('❌ Error deleting class:', error);
//       const errorMessage = error.response?.data?.error || error.message || 'Failed to delete class';
//       alert('Failed to delete class: ' + errorMessage);
//     }
//   });

//   // ✅ Helper functions
//   const handleCreateClass = () => {
//     if (!newClass.name || !newClass.description) {
//       alert('Please fill in all required fields (name and description)');
//       return;
//     }
//     createClass(newClass);
//   };

//   const handleEditClass = (classItem) => {
//     setEditingClass({ ...classItem });
//     setShowEditForm(true);
//   };

//   const handleUpdateClass = () => {
//     if (!editingClass || !editingClass.name || !editingClass.description) {
//       alert('Please fill in all required fields');
//       return;
//     }
//     updateClass({ classId: editingClass.id, classData: editingClass });
//   };

//   const handleDeleteClass = (classId, className) => {
//     if (window.confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
//       deleteClass(classId);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString();
//     } catch {
//       return 'Invalid Date';
//     }
//   };

//   const getStatusBadgeClass = (isActive) => {
//     return isActive ? 'status-active' : 'status-inactive';
//   };

//   // ✅ Render error state
//   if (classesError) {
//     return (
//       <div className="audience-class-mgr-container">
//         <div className="error-state">
//           <div className="error-icon">⚠️</div>
//           <h3>Unable to Load Classes</h3>
//           <p>There was an error loading the classes data.</p>
//           <div className="error-details">
//             <strong>Error:</strong> {classesError.message}
//           </div>
//           <div className="error-actions">
//             <button onClick={refetchClasses} className="btn-retry">
//               🔄 Retry
//             </button>
//             <button onClick={() => window.location.reload()} className="btn-reload">
//               🔃 Reload Page
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="audience-class-mgr-container">
//       {/* Header */}
//       <div className="header-section">
//         <h2>Audience Class Manager</h2>
//         <div className="header-actions">
//           <button 
//             onClick={() => setShowCreateForm(true)}
//             className="btn-create"
//             disabled={creatingClass}
//           >
//             ➕ Create New Class
//           </button>
//           <button 
//             onClick={refetchClasses}
//             className="btn-refresh"
//             disabled={classesLoading}
//           >
//             🔄 Refresh
//           </button>
//         </div>
//       </div>

//       {/* Stats Overview */}
//       <div className="stats-section">
//         <div className="stat-card">
//           <div className="stat-icon">📚</div>
//           <div className="stat-content">
//             <h4>Total Classes</h4>
//             <span className="stat-number">{classes.length}</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">✅</div>
//           <div className="stat-content">
//             <h4>Active Classes</h4>
//             <span className="stat-number">
//               {classes.filter(c => c.isActive).length}
//             </span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">👥</div>
//           <div className="stat-content">
//             <h4>Total Members</h4>
//             <span className="stat-number">
//               {classes.reduce((total, c) => total + (c.memberCount || 0), 0)}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* Classes List */}
//         <div className="classes-section">
//           <h3>Classes ({classes.length})</h3>
          
//           {classesLoading ? (
//             <div className="loading-state">
//               <div className="loading-spinner"></div>
//               <p>Loading classes...</p>
//             </div>
//           ) : classes.length === 0 ? (
//             <div className="empty-state">
//               <div className="empty-icon">📚</div>
//               <h4>No Classes Found</h4>
//               <p>No classes have been created yet. Create your first class to get started.</p>
//               <button 
//                 onClick={() => setShowCreateForm(true)}
//                 className="btn-create-first"
//               >
//                 ➕ Create First Class
//               </button>
//             </div>
//           ) : (
//             <div className="classes-grid">
//               {classes.map((classItem) => (
//                 <div 
//                   key={classItem.id} 
//                   className={`class-card ${selectedClass?.id === classItem.id ? 'selected' : ''}`}
//                   onClick={() => setSelectedClass(classItem)}
//                 >
//                   <div className="class-header">
//                     <h4 className="class-name">{classItem.name}</h4>
//                     <span className={`status-badge ${getStatusBadgeClass(classItem.isActive)}`}>
//                       {classItem.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>
                  
//                   <div className="class-details">
//                     <p className="class-description">
//                       {classItem.description || 'No description provided'}
//                     </p>
//                     <div className="class-meta">
//                       <span className="category">
//                         📂 {classItem.category || 'General'}
//                       </span>
//                       <span className="capacity">
//                         👥 {classItem.memberCount || 0}/{classItem.capacity || 'Unlimited'}
//                       </span>
//                       <span className="created">
//                         📅 Created: {formatDate(classItem.createdAt)}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="class-actions" onClick={(e) => e.stopPropagation()}>
//                     <button
//                       onClick={() => handleEditClass(classItem)}
//                       className="btn-edit"
//                       disabled={updatingClass}
//                       title="Edit class"
//                     >
//                       ✏️
//                     </button>
//                     <button
//                       onClick={() => handleDeleteClass(classItem.id, classItem.name)}
//                       className="btn-delete"
//                       disabled={deletingClass}
//                       title="Delete class"
//                     >
//                       🗑️
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Selected Class Details */}
//         {selectedClass && (
//           <div className="class-details-section">
//             <h3>Class Details: {selectedClass.name}</h3>
            
//             <div className="class-info-grid">
//               <div className="info-item">
//                 <strong>Name:</strong>
//                 <span>{selectedClass.name}</span>
//               </div>
//               <div className="info-item">
//                 <strong>Description:</strong>
//                 <span>{selectedClass.description || 'No description'}</span>
//               </div>
//               <div className="info-item">
//                 <strong>Category:</strong>
//                 <span>{selectedClass.category || 'General'}</span>
//               </div>
//               <div className="info-item">
//                 <strong>Capacity:</strong>
//                 <span>{selectedClass.capacity || 'Unlimited'}</span>
//               </div>
//               <div className="info-item">
//                 <strong>Status:</strong>
//                 <span className={getStatusBadgeClass(selectedClass.isActive)}>
//                   {selectedClass.isActive ? 'Active' : 'Inactive'}
//                 </span>
//               </div>
//               <div className="info-item">
//                 <strong>Created:</strong>
//                 <span>{formatDate(selectedClass.createdAt)}</span>
//               </div>
//             </div>

//             {/* Class Members */}
//             <div className="members-section">
//               <h4>Class Members ({classMembers.length})</h4>
              
//               {membersLoading ? (
//                 <div className="loading-state small">
//                   <div className="loading-spinner small"></div>
//                   <p>Loading members...</p>
//                 </div>
//               ) : membersError ? (
//                 <div className="error-state small">
//                   <p>Error loading members: {membersError.message}</p>
//                 </div>
//               ) : classMembers.length === 0 ? (
//                 <div className="empty-state small">
//                   <p>No members in this class yet.</p>
//                 </div>
//               ) : (
//                 <div className="members-list">
//                   {classMembers.map((member) => (
//                     <div key={member.id} className="member-item">
//                       <div className="member-avatar">
//                         {(member.username || member.name || 'U').charAt(0).toUpperCase()}
//                       </div>
//                       <div className="member-info">
//                         <span className="member-name">
//                           {member.username || member.name || 'Unknown User'}
//                         </span>
//                         <span className="member-email">
//                           {member.email || 'No email'}
//                         </span>
//                         <span className="member-joined">
//                           Joined: {formatDate(member.joinedAt || member.createdAt)}
//                         </span>
//                       </div>
//                       <div className="member-status">
//                         <span className={`status-badge ${member.isActive ? 'active' : 'inactive'}`}>
//                           {member.isActive ? 'Active' : 'Inactive'}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Create Class Modal */}
//       {showCreateForm && (
//         <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h3>Create New Class</h3>
//               <button 
//                 onClick={() => setShowCreateForm(false)}
//                 className="btn-close"
//               >
//                 ✕
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="form-group">
//                 <label>Class Name *</label>
//                 <input
//                   type="text"
//                   value={newClass.name}
//                   onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
//                   placeholder="Enter class name"
//                   disabled={creatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Description *</label>
//                 <textarea
//                   value={newClass.description}
//                   onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
//                   placeholder="Enter class description"
//                   rows="3"
//                   disabled={creatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Category</label>
//                 <select
//                   value={newClass.category}
//                   onChange={(e) => setNewClass({ ...newClass, category: e.target.value })}
//                   disabled={creatingClass}
//                 >
//                   <option value="general">General</option>
//                   <option value="academic">Academic</option>
//                   <option value="professional">Professional</option>
//                   <option value="technical">Technical</option>
//                   <option value="creative">Creative</option>
//                 </select>
//               </div>
              
//               <div className="form-group">
//                 <label>Capacity</label>
//                 <input
//                   type="number"
//                   value={newClass.capacity}
//                   onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 0 })}
//                   placeholder="Enter maximum capacity"
//                   min="1"
//                   disabled={creatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label className="checkbox-label">
//                   <input
//                     type="checkbox"
//                     checked={newClass.isActive}
//                     onChange={(e) => setNewClass({ ...newClass, isActive: e.target.checked })}
//                     disabled={creatingClass}
//                   />
//                   Active (class is open for enrollment)
//                 </label>
//               </div>
//             </div>
            
//             <div className="modal-footer">
//               <button 
//                 onClick={() => setShowCreateForm(false)}
//                 className="btn-cancel"
//                 disabled={creatingClass}
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleCreateClass}
//                 className="btn-save"
//                 disabled={creatingClass || !newClass.name || !newClass.description}
//               >
//                 {creatingClass ? 'Creating...' : 'Create Class'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Class Modal */}
//       {showEditForm && editingClass && (
//         <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h3>Edit Class: {editingClass.name}</h3>
//               <button 
//                 onClick={() => setShowEditForm(false)}
//                 className="btn-close"
//               >
//                 ✕
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="form-group">
//                 <label>Class Name *</label>
//                 <input
//                   type="text"
//                   value={editingClass.name}
//                   onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
//                   placeholder="Enter class name"
//                   disabled={updatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Description *</label>
//                 <textarea
//                   value={editingClass.description || ''}
//                   onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
//                   placeholder="Enter class description"
//                   rows="3"
//                   disabled={updatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Category</label>
//                 <select
//                   value={editingClass.category || 'general'}
//                   onChange={(e) => setEditingClass({ ...editingClass, category: e.target.value })}
//                   disabled={updatingClass}
//                 >
//                   <option value="general">General</option>
//                   <option value="academic">Academic</option>
//                   <option value="professional">Professional</option>
//                   <option value="technical">Technical</option>
//                   <option value="creative">Creative</option>
//                 </select>
//               </div>
              
//               <div className="form-group">
//                 <label>Capacity</label>
//                 <input
//                   type="number"
//                   value={editingClass.capacity || 50}
//                   onChange={(e) => setEditingClass({ ...editingClass, capacity: parseInt(e.target.value) || 0 })}
//                   placeholder="Enter maximum capacity"
//                   min="1"
//                   disabled={updatingClass}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label className="checkbox-label">
//                   <input
//                     type="checkbox"
//                     checked={editingClass.isActive !== false}
//                     onChange={(e) => setEditingClass({ ...editingClass, isActive: e.target.checked })}
//                     disabled={updatingClass}
//                   />
//                   Active (class is open for enrollment)
//                 </label>
//               </div>
//             </div>
            
//             <div className="modal-footer">
//               <button 
//                 onClick={() => setShowEditForm(false)}
//                 className="btn-cancel"
//                 disabled={updatingClass}
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleUpdateClass}
//                 className="btn-save"
//                 disabled={updatingClass || !editingClass.name || !editingClass.description}
//               >
//                 {updatingClass ? 'Updating...' : 'Update Class'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Loading Overlay */}
//       {(creatingClass || updatingClass || deletingClass) && (
//         <div className="loading-overlay">
//           <div className="loading-container">
//             <div className="loading-spinner large"></div>
//             <p>
//               {creatingClass && 'Creating class...'}
//               {updatingClass && 'Updating class...'}
//               {deletingClass && 'Deleting class...'}
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AudienceClassMgr;




// // ikootaclient/src/components/admin/AudienceClassMgr.jsx
// // Updated for 10-character format (OTU#XXXXXX)

// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '../service/api';
// import './audienceclassmgr.css';
// import { generateUniqueClassId, validateIdFormat } from '../service/idGenerationService';
// import './converseId.css';


// const AudienceClassMgr = () => {
//   const queryClient = useQueryClient();
//   const [formData, setFormData] = useState({
//     class_id: '',
//     name: '',
//     description: '',
//   });

//   const { data: classes, isLoading, isError } = useQuery({
//     queryKey: ['classes'],
//     queryFn: async () => {
//       const { data } = await api.get('/classes/');
//       return data;
//     },
//   });

//   const mutation = useMutation({
//     mutationFn: async (classData) => {
//       // Validate ID format before sending
//       if (!validateIdFormat(classData.class_id, 'class')) {
//         throw new Error('Invalid class ID format. Must be OTU# followed by 6 alphanumeric characters.');
//       }
      
//       if (classData.id) {
//         return await api.put(`/classes/${classData.id}`, classData);
//       } else {
//         return await api.post('/classes/', classData);
//       }
//     },
//     onSuccess: () => {
//       alert('Class saved successfully!');
//       queryClient.invalidateQueries(['classes']);
//       setFormData({ class_id: '', name: '', description: '' });
//     },
//     onError: (error) => {
//       alert(`Failed to save the class: ${error.message}`);
//     },
//   });

//   const handleGenerateNewClassId = async () => {
//     try {
//       const newId = await generateUniqueClassId();
//       setFormData((prev) => ({ ...prev, class_id: newId }));
//     } catch (error) {
//       console.error('Failed to generate class ID:', error);
//       alert('Failed to generate unique class ID. Please try again.');
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     mutation.mutate(formData);
//   };

//   return (
//     <div className="audience-class-mgr-container">
//       <h2>Manage Classes</h2>
      
//       <form onSubmit={handleSubmit} className="audience-class-form">
//         <label>
//           Class ID:
//           <input
//             type="text"
//             name="class_id"
//             value={formData.class_id}
//             onChange={handleInputChange}
//             placeholder="OTU#XXXXXX (10 characters)"
//             pattern="^OTU#[A-Z0-9]{6}$"
//             title="Class ID must be OTU# followed by 6 alphanumeric characters (total 10 characters)"
//             maxLength="10"
//             readOnly
//           />
//           <button type="button" onClick={handleGenerateNewClassId}>
//             Generate Class ID
//           </button>
//           {formData.class_id && (
//             <span className={validateIdFormat(formData.class_id, 'class') ? 'valid' : 'invalid'}>
//               {validateIdFormat(formData.class_id, 'class') ? '✓ Valid format (OTU#XXXXXX)' : '✗ Invalid format'}
//             </span>
//           )}
//         </label>
        
//         <label>
//           Class Name:
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleInputChange}
//             placeholder="Enter class name"
//             required
//           />
//         </label>
        
//         <label>
//           Description:
//           <textarea
//             name="description"
//             value={formData.description}
//             onChange={handleInputChange}
//             placeholder="Enter class description"
//           />
//         </label>
        
//         <button type="submit" disabled={mutation.isLoading}>
//           {mutation.isLoading ? 'Saving...' : 'Save Class'}
//         </button>
//       </form>

//       <div className="class-list">
//         <h3>Existing Classes</h3>
//         {isLoading && <p>Loading classes...</p>}
//         {isError && <p>Error loading classes.</p>}
//         <ul>
//           {classes?.map((cls) => (
//             <li key={cls.class_id}>
//               <strong>{cls.name}</strong> ({cls.class_id}) - {cls.description}
//               <div className="id-info">
//                 <small>Format: {cls.class_id.length === 10 ? '✓ 10 chars' : '✗ Invalid length'}</small>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default AudienceClassMgr;