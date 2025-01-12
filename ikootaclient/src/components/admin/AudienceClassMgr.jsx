import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './audienceclassmgr.css';
import { generateRandomId } from '../service/generateRandomId';

const AudienceClassMgr = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    class_id: '',
    name: '',
    description: '',
  });

  const { data: classes, isLoading, isError } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (classData) => {
      if (classData.id) {
        return await api.put(`/classes/${classData.id}`, classData);
      } else {
        return await api.post('/classes', classData);
      }
    },
    onSuccess: () => {
      alert('Class saved successfully!');
      queryClient.invalidateQueries(['classes']);
    },
    onError: () => {
      alert('Failed to save the class.');
    },
  });

  const handleGenerateNewClassId = () => {
    const newId = generateRandomId();
    setFormData((prev) => ({ ...prev, class_id: newId }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="audience-class-mgr-container">
      <h2>Manage Classes</h2>
      <form onSubmit={handleSubmit} className="audience-class-form">
        <label>
          Class ID:
          <input
            type="text"
            name="class_id"
            value={formData.class_id}
            onChange={handleInputChange}
            readOnly
          />
          <button type="button" onClick={handleGenerateNewClassId}>
            Generate Class ID
          </button>
        </label>
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
        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter class description"
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? 'Saving...' : 'Save Class'}
        </button>
      </form>
      <div className="class-list">
        <h3>Existing Classes</h3>
        {isLoading && <p>Loading classes...</p>}
        {isError && <p>Error loading classes.</p>}
        <ul>
          {classes?.map((cls) => (
            <li key={cls.class_id}>
              <strong>{cls.name}</strong> - {cls.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AudienceClassMgr;
