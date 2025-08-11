// ikootaclient/src/components/admin/AudienceClassMgr.jsx
// Updated for 10-character format (OTU#XXXXXX)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import './audienceclassmgr.css';
import { generateUniqueClassId, validateIdFormat } from '../service/idGenerationService';
import './converseId.css';


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
      const { data } = await api.get('/classes/');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (classData) => {
      // Validate ID format before sending
      if (!validateIdFormat(classData.class_id, 'class')) {
        throw new Error('Invalid class ID format. Must be OTU# followed by 6 alphanumeric characters.');
      }
      
      if (classData.id) {
        return await api.put(`/classes/${classData.id}`, classData);
      } else {
        return await api.post('/classes/', classData);
      }
    },
    onSuccess: () => {
      alert('Class saved successfully!');
      queryClient.invalidateQueries(['classes']);
      setFormData({ class_id: '', name: '', description: '' });
    },
    onError: (error) => {
      alert(`Failed to save the class: ${error.message}`);
    },
  });

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
              <strong>{cls.name}</strong> ({cls.class_id}) - {cls.description}
              <div className="id-info">
                <small>Format: {cls.class_id.length === 10 ? '✓ 10 chars' : '✗ Invalid length'}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AudienceClassMgr;