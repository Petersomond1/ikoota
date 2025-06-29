import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import { useForm } from 'react-hook-form';
import useUpload from '../../hooks/useUpload';
import { jwtDecode } from 'jwt-decode';
import api from '../service/api';
import './teaching.css';

const Teaching = ({ setActiveItem, deactivateListChats }) => {
  const { handleSubmit, register, reset, formState: { errors } } = useForm();
  const { validateFiles, mutation: teachingMutation } = useUpload("/teachings");
  
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });
  const [teachings, setTeachings] = useState([]);
  const [filteredTeachings, setFilteredTeachings] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  useEffect(() => {
    const fetchTeachings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/teachings');
        const teachingsData = response.data.map(teaching => ({ 
          ...teaching, 
          content_type: 'teaching',
          content_title: teaching.topic || 'Untitled Teaching',
          // Ensure prefixed_id exists, fallback to generated one
          prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
          // Normalize date fields
          display_date: teaching.updatedAt || teaching.createdAt
        }));
        
        setTeachings(teachingsData);
        setFilteredTeachings(teachingsData);
      } catch (error) {
        console.error('Error fetching teachings:', error);
        setError('Failed to fetch teachings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachings();
  }, []);

  const handleSearch = (query) => {
    if (!Array.isArray(teachings)) return;
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = teachings.filter(teaching => {
      const searchFields = [
        teaching.topic,
        teaching.description,
        teaching.subjectMatter,
        teaching.prefixed_id,
        teaching.audience,
        teaching.content
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(lowercaseQuery)
      );
    });
    
    setFilteredTeachings(filtered);
  };

  const handleItemClick = (teaching) => {
    try {
      if (deactivateListChats) deactivateListChats();
      
      const enhancedTeaching = {
        ...teaching,
        id: teaching.prefixed_id || teaching.id,
        type: 'teaching',
        content_type: 'teaching'
      };
      
      setActiveItemState(enhancedTeaching);
      if (setActiveItem) setActiveItem(enhancedTeaching);
    } catch (error) {
      console.error('Error handling item click:', error);
    }
  };

  const handleNextStep = () => {
    if (step < 7) setStep(step + 1); // Updated to include media3
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSendTeaching = async (data) => {
    try {
      if (!user_id) {
        alert("User not authenticated");
        return;
      }

      const formData = new FormData();
      formData.append("user_id", user_id);
      formData.append("topic", data.topic);
      formData.append("description", data.description);
      formData.append("subjectMatter", data.subjectMatter);
      formData.append("audience", data.audience);
      formData.append("content", data.content);

      ["media1", "media2", "media3"].forEach((field) => {
        if (data[field]?.[0]) {
          formData.append(field, data[field][0]);
        }
      });

      const response = await teachingMutation.mutateAsync(formData);
      console.log("Teaching created with prefixed ID:", response.data?.prefixed_id);
      
      reset();
      setStep(0);
      setAddMode(false);
      
      // Refresh teachings list
      const updatedResponse = await api.get('/teachings');
      const updatedTeachings = updatedResponse.data.map(teaching => ({ 
        ...teaching, 
        content_type: 'teaching',
        content_title: teaching.topic || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt
      }));
      
      setTeachings(updatedTeachings);
      setFilteredTeachings(updatedTeachings);
      
      alert("Teaching created successfully!");
    } catch (error) {
      console.error("Error creating teaching:", error);
      alert("Failed to create teaching. Please try again.");
    }
  };

  // Helper functions
  const getContentIdentifier = (teaching) => {
    return teaching?.prefixed_id || `t${teaching?.id}` || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'Not specified';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className='teaching_container'>
        <div className="loading-message">
          <p>Loading teachings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='teaching_container'>
        <div className="error-message">
          <p style={{color: 'red'}}>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className='teaching_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="Search" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img 
          src={addMode ? "./minus.png" : "./plus.png"} 
          alt="Toggle" 
          className='add' 
          onClick={() => {
            setAddMode(!addMode);
            setStep(0);
          }} 
        />
      </div>

      {/* Add Mode Form */}
      {addMode && (
        <div className="add-teaching-form">
          <form onSubmit={handleSubmit(handleSendTeaching)} noValidate>
            <div className="step-indicator">
              Step {step + 1} of 8: {['Topic', 'Description', 'Subject', 'Audience', 'Content', 'Media 1', 'Media 2', 'Media 3'][step]}
            </div>
            
            {step === 0 && (
              <div>
                <input
                  type="text"
                  placeholder="Enter Topic"
                  {...register("topic", { required: "Topic is required" })}
                />
                {errors.topic && <span style={{color: 'red'}}>{errors.topic.message}</span>}
              </div>
            )}
            {step === 1 && (
              <div>
                <textarea
                  placeholder="Enter Description"
                  rows="3"
                  {...register("description", { required: "Description is required" })}
                />
                {errors.description && <span style={{color: 'red'}}>{errors.description.message}</span>}
              </div>
            )}
            {step === 2 && (
              <div>
                <input
                  type="text"
                  placeholder="Enter Subject Matter"
                  {...register("subjectMatter", { required: "Subject Matter is required" })}
                />
                {errors.subjectMatter && <span style={{color: 'red'}}>{errors.subjectMatter.message}</span>}
              </div>
            )}
            {step === 3 && (
              <div>
                <input
                  type="text"
                  placeholder="Enter Audience"
                  {...register("audience", { required: "Audience is required" })}
                />
                {errors.audience && <span style={{color: 'red'}}>{errors.audience.message}</span>}
              </div>
            )}
            {step === 4 && (
              <div>
                <textarea
                  placeholder="Enter Content"
                  rows="5"
                  {...register("content", { required: "Content is required" })}
                />
                {errors.content && <span style={{color: 'red'}}>{errors.content.message}</span>}
              </div>
            )}
            {step === 5 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 6 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 7 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media3", { validate: validateFiles })}
              />
            )}
            
            <div className="form-buttons">
              {step < 7 && <button type="button" onClick={handleNextStep}>Next</button>}
              {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
              <button 
                type="submit" 
                disabled={teachingMutation.isPending}
              >
                {teachingMutation.isPending ? 'Creating...' : 'Create Teaching'}
              </button>
              <button type="button" onClick={() => {setAddMode(false); setStep(0);}}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Teachings List */}
      {!addMode && filteredTeachings.length === 0 && (
        <p>No teachings available</p>
      )}
      
      {!addMode && filteredTeachings.map((teaching) => (
        <div 
          key={teaching.prefixed_id || `teaching-${teaching.id}`} 
          className={`item ${activeItem?.id === (teaching.prefixed_id || teaching.id) ? 'active' : ''}`}
          onClick={() => handleItemClick(teaching)}
        >
          <div className="texts">
            <div className="teaching-header">
              <span className="content-type-badge">Teaching</span>
              <span className="content-id">{getContentIdentifier(teaching)}</span>
            </div>
            
            <span className="topic">Topic: {teaching.topic || 'No topic'}</span>
            <p className="description">
              Description: {truncateText(teaching.description, 80)}
            </p>
            <p>Lesson#: {teaching.lessonNumber || getContentIdentifier(teaching)}</p>
            <p>Subject Matter: {truncateText(teaching.subjectMatter, 50)}</p>
            <p>Audience: {teaching.audience || 'General'}</p>
            <p>By: {teaching.user_id || 'Admin'}</p>
            <p>Created: {formatDate(teaching.createdAt)}</p>
            <p>Updated: {formatDate(teaching.updatedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Teaching;