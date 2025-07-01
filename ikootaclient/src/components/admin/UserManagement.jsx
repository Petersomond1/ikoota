// ikootaclient/src/components/admin/UserManagement.jsx
// Updated for 10-character format (OTO#XXXXXX)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './userManagement.css';
import { 
  generateUniqueConverseId, 
  validateIdFormat, 
  formatIdForDisplay 
} from '../service/idGenerationService';
import './converseId.css';

// API Functions
const fetchUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

const fetchClasses = async () => {
  const { data } = await api.get('/classes');
  return data;
};

const fetchMentors = async () => {
  const { data } = await api.get('/admin/mentors');
  return data;
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

const fetchReports = async () => {
  const { data } = await api.get('/admin/reports');
  return data;
};

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [formData, setFormData] = useState({
    converse_id: '',
    mentor_id: '',
    class_id: '',
    is_member: '',
    role: '',
  });

  const [membershipData, setMembershipData] = useState({
    mentorConverseId: '',
    classId: '',
  });

  // React Query hooks
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  const { data: mentors, isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: fetchMentors,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      alert('User updated successfully!');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['reports']);
    },
    onError: () => {
      alert('Failed to update user.');
    },
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
      alert(`Failed to mask identity: ${error.response?.data?.message || error.message}`);
    },
  });

  // Filter users by membership status
  const filteredUsers = users?.filter(user => {
    if (activeTab === 'pending') return user.is_member === 'applied';
    if (activeTab === 'granted') return user.is_member === 'granted';
    if (activeTab === 'declined') return user.is_member === 'declined';
    return true;
  });

  // Handle user actions
  const handleUserUpdate = (userId, updateData) => {
    updateMutation.mutate({ id: userId, formData: updateData });
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
    handleUserUpdate(userId, { is_member: 'declined' });
  };

  const handleGenerateConverseId = async () => {
    try {
      const newId = await generateUniqueConverseId();
      setFormData((prev) => ({ ...prev, converse_id: newId }));
    } catch (error) {
      console.error('Failed to generate converse ID:', error);
      alert('Failed to generate unique converse ID. Please try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user to update.');
      return;
    }
    updateMutation.mutate({ id: selectedUser.id, formData });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMembershipDataChange = (e) => {
    setMembershipData({ ...membershipData, [e.target.name]: e.target.value });
  };

  return (
    <div className="user-management-container">
      <h2>User Management with Converse ID System</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Applications ({users?.filter(u => u.is_member === 'applied').length || 0})
        </button>
        <button 
          className={activeTab === 'granted' ? 'active' : ''} 
          onClick={() => setActiveTab('granted')}
        >
          Active Members ({users?.filter(u => u.is_member === 'granted').length || 0})
        </button>
        <button 
          className={activeTab === 'declined' ? 'active' : ''} 
          onClick={() => setActiveTab('declined')}
        >
          Declined ({users?.filter(u => u.is_member === 'declined').length || 0})
        </button>
      </div>

      {/* Users List */}
      <div className="users-section">
        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users</h3>
        {isLoading && <p>Loading users...</p>}
        {isError && <p>Error loading users.</p>}
        
        <div className="user-list">
          {filteredUsers?.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <h4>
                  {user.is_identity_masked 
                    ? formatIdForDisplay(user.converse_id)
                    : user.username
                  } 
                  ({user.email})
                </h4>
                {user.converse_id && (
                  <p>
                    <strong>Converse ID:</strong> {user.converse_id}
                    <span className={validateIdFormat(user.converse_id, 'user') ? 'valid-id' : 'invalid-id'}>
                      {validateIdFormat(user.converse_id, 'user') ? ' ✓' : ' ✗'}
                    </span>
                  </p>
                )}
                {user.class_id && (
                  <p>
                    <strong>Class:</strong> {user.class_id}
                    <span className={validateIdFormat(user.class_id, 'class') ? 'valid-id' : 'invalid-id'}>
                      {validateIdFormat(user.class_id, 'class') ? ' ✓' : ' ✗'}
                    </span>
                  </p>
                )}
                {user.mentor_id && (
                  <p><strong>Mentor:</strong> {user.mentor_id}</p>
                )}
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.is_member}</p>
                {user.is_identity_masked && (
                  <p><em>Identity is masked for privacy</em></p>
                )}
              </div>

              <div className="user-actions">
                {activeTab === 'pending' && (
                  <>
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="btn-setup"
                    >
                      Setup Membership
                    </button>
                    <button 
                      onClick={() => handleDeclineMembership(user.id)}
                      className="btn-decline"
                    >
                      Decline
                    </button>
                  </>
                )}

                {activeTab === 'granted' && (
                  <>
                    <button 
                      onClick={() => handleUserUpdate(user.id, { isblocked: !user.isblocked })}
                      className={user.isblocked ? "btn-unblock" : "btn-block"}
                    >
                      {user.isblocked ? 'Unblock' : 'Block'}
                    </button>
                    <button 
                      onClick={() => handleUserUpdate(user.id, { isbanned: !user.isbanned })}
                      className={user.isbanned ? "btn-unban" : "btn-ban"}
                    >
                      {user.isbanned ? 'Unban' : 'Ban'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Setup Modal */}
      {selectedUser && activeTab === 'pending' && (
        <div className="modal-overlay">
          <div className="membership-setup-modal">
            <h3>Setup Membership for {selectedUser.username}</h3>
            
            <div className="form-group">
              <label>Assign to Class (Required):</label>
              <select 
                name="classId" 
                value={membershipData.classId} 
                onChange={handleMembershipDataChange}
                required
              >
                <option value="">Select a class</option>
                {classes?.map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.name} ({cls.class_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assign Mentor (Optional):</label>
              <select 
                name="mentorConverseId" 
                value={membershipData.mentorConverseId} 
                onChange={handleMembershipDataChange}
              >
                <option value="">No mentor assigned</option>
                {mentors?.map(mentor => (
                  <option key={mentor.converse_id} value={mentor.converse_id}>
                    {formatIdForDisplay(mentor.converse_id)} ({mentor.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => handleGrantMembership(selectedUser)}
                className="btn-grant"
                disabled={maskIdentityMutation.isLoading}
              >
                {maskIdentityMutation.isLoading ? 'Processing...' : 'Grant Membership & Mask Identity'}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="reports-section">
        <h3>User Reports</h3>
        {reportsLoading && <p>Loading reports...</p>}
        <div className="reports-list">
          {reports?.map(report => (
            <div key={report.id} className="report-card">
              <p><strong>Reporter:</strong> {formatIdForDisplay(report.reporter_id)}</p>
              <p><strong>Reported User:</strong> {formatIdForDisplay(report.reported_id)}</p>
              <p><strong>Reason:</strong> {report.reason}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
              
              {report.status === 'pending' && (
                <div className="report-actions">
                  <button 
                    onClick={() => handleUserUpdate(report.reported_id, { isbanned: true })}
                    className="btn-ban"
                  >
                    Ban Reported User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Update Form */}
      {selectedUser && activeTab === 'granted' && (
        <form className="user-management-form" onSubmit={handleSubmit}>
          <h3>Update User: {selectedUser.is_identity_masked ? formatIdForDisplay(selectedUser.converse_id) : selectedUser.username}</h3>

          <label>
            Converse ID:
            <input
              type="text"
              name="converse_id"
              value={formData.converse_id}
              onChange={handleChange}
              placeholder="OTO#XXXXXX (10 characters)"
              pattern="^OTO#[A-Z0-9]{6}$"
              title="Converse ID must be OTO# followed by 6 alphanumeric characters (total 10 characters)"
              maxLength="10"
              readOnly
            />
            <button type="button" onClick={handleGenerateConverseId}>
              Generate New Converse ID
            </button>
            {formData.converse_id && (
              <span className={validateIdFormat(formData.converse_id, 'user') ? 'valid' : 'invalid'}>
                {validateIdFormat(formData.converse_id, 'user') ? '✓ Valid format (OTO#XXXXXX)' : '✗ Invalid format'}
              </span>
            )}
          </label>

          <label>
            Mentor ID:
            <select name="mentor_id" value={formData.mentor_id} onChange={handleChange}>
              <option value="">No mentor</option>
              {mentors?.map(mentor => (
                <option key={mentor.converse_id} value={mentor.converse_id}>
                  {formatIdForDisplay(mentor.converse_id)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Class ID:
            <select name="class_id" value={formData.class_id} onChange={handleChange}>
              <option value="">No class</option>
              {classes?.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.name} ({cls.class_id})
                </option>
              ))}
            </select>
          </label>

          <label>
            Role:
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="">Select</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>

          <div className="form-actions">
            <button type="submit" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update User'}
            </button>
            <button type="button" onClick={() => setSelectedUser(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserManagement;