import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './userManagement.css';
import { generateRandomId } from '../service/generateRandomId';

// Fetch Users API
const fetchUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

// Update User API
const updateUser = async ({ id, formData }) => {
  const { data } = await api.put(`/admin/update-user/${id}`, formData);
  return data;
};

const fetchReports = async () => {
    const { data } = await api.get('/admin/reports');
    return data;
  };

const UserManagement = () => {
  const queryClient = useQueryClient();
 const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    converse_id: '',
    mentor_id: '',
    class_id: '',
    is_member: '',
    role: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);

  // React Query hooks
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({ queryKey: ['reports'], queryFn: fetchReports });

 
  const mutation = useMutation({
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

  const handleUserUpdate = (userId, updateData) => {
    mutation.mutate({ id: userId, formData: updateData });
  };


  // Generate Converse ID
  const handleGenerateConverseId = () => {
    const newId = generateRandomId();
    setFormData((prev) => ({ ...prev, converse_id: newId }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user to update.');
      return;
    }
    mutation.mutate({ id: selectedUser.id, formData });
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="user-management-container">
      <h2>User Management</h2>

      <div>
        <h3>Users</h3>
        {isLoading && <p>Loading users...</p>}
        {isError && <p>Error loading users.</p>}
        <ul className="user-list" style={{color: 'black'}}>
          {users?.map((user) => (
            <li key={user.id} onClick={() => setSelectedUser(user)}>
              {user.username} ({user.email})
              <button onClick={() => handleUserUpdate(user.id, { isblocked: !user.isblocked })}>
              {user.isblocked ? 'Unblock' : 'Block'}
            </button>
            <button onClick={() => handleUserUpdate(user.id, { isbanned: !user.isbanned })}>
              {user.isbanned ? 'Unban' : 'Ban'}
            </button>
            </li>
          ))}
        </ul>

        <h3>Reports</h3>
      {reportsLoading && <p>Loading reports...</p>}
      <ul>
        {reports?.map(report => (
          <li key={report.id}>
            Reported User ID: {report.reported_id} | Reason: {report.reason}
            <button onClick={() => handleUserUpdate(report.reported_id, { isbanned: true })}>
              Ban User
            </button>
          </li>
        ))}
      </ul>
      </div>

      {selectedUser && (
        <form className="user-management-form" onSubmit={handleSubmit}>
          <h3>Update User: {selectedUser.username}</h3>

          <label>
            Converse ID:
            <input
              type="text"
              name="converse_id"
              value={formData.converse_id}
              onChange={handleChange}
              readOnly
            />
            <button type="button" onClick={handleGenerateConverseId}>
              Generate Converse ID
            </button>
          </label>

          <label>
            Mentor ID:
            <input
              type="text"
              name="mentor_id"
              value={formData.mentor_id}
              onChange={handleChange}
              placeholder="Enter Mentor ID"
            />
          </label>

          <label>
            Class ID:
            <input
              type="text"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              placeholder="Enter Class ID"
            />
          </label>

          <label>
            Is Member:
            <select name="is_member" value={formData.is_member} onChange={handleChange}>
              <option value="">Select</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
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

          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Updating...' : 'Update User'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserManagement;