//ikootaclient\src\components\towncrier\TowncrierControls.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { jwtDecode } from "jwt-decode";
import useUpload from "../../hooks/useUpload";
import { useFetchTeachings } from "../service/useFetchTeachings";
import "../../components/admin/navbar.css";

const TowncrierControls = () => {
  const { handleSubmit, register, reset, formState: { errors } } = useForm();
  const { validateFiles, mutation } = useUpload("/teachings");
  const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
  
  const [step, setStep] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  const onSubmit = async (data) => {
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

      ["media1", "media2", "media3"].forEach((file) => {
        if (data[file]?.[0]) {
          formData.append(file, data[file][0]);
        }
      });

      const response = await mutation.mutateAsync(formData);
      console.log("Teaching uploaded successfully with ID:", response.data?.prefixed_id);
      
      reset();
      setStep(0);
      setShowForm(false);
      
      // Refresh the teachings list
      refetch();
      
      alert("Teaching created successfully!");
    } catch (error) {
      console.error("Error uploading teaching material:", error);
      alert("Failed to create teaching. Please try again.");
    }
  };

  const handleNextStep = () => {
    if (step < 7) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

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

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'Not specified';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="towncrier_controls_body">
      <div className="controls-header">
        <h2>Towncrier Controls</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              setStep(0);
            }}
            className="toggle-form-btn"
          >
            {showForm ? 'Hide Form' : 'Add New Teaching'}
          </button>
          <button onClick={refetch} className="refresh-btn">
            Refresh List
          </button>
        </div>
      </div>

      {/* Add Teaching Form */}
      {showForm && (
        <div className="teaching-form-container">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="step-indicator">
              Step {step + 1} of 8: {['Topic', 'Description', 'Subject', 'Audience', 'Content', 'Media 1', 'Media 2', 'Media 3'][step]}
            </div>

            <div className="form-content">
              {step === 0 && (
                <div className="form-step">
                  <label>Topic *</label>
                  <input
                    type="text"
                    placeholder="Enter Topic"
                    {...register("topic", { required: "Topic is required" })}
                  />
                  {errors.topic && <span className="error">{errors.topic.message}</span>}
                </div>
              )}

              {step === 1 && (
                <div className="form-step">
                  <label>Description *</label>
                  <textarea
                    placeholder="Enter Description"
                    rows="4"
                    {...register("description", { required: "Description is required" })}
                  />
                  {errors.description && <span className="error">{errors.description.message}</span>}
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <label>Subject Matter *</label>
                  <input
                    type="text"
                    placeholder="Enter Subject Matter"
                    {...register("subjectMatter", { required: "Subject Matter is required" })}
                  />
                  {errors.subjectMatter && <span className="error">{errors.subjectMatter.message}</span>}
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <label>Audience *</label>
                  <input
                    type="text"
                    placeholder="Enter Target Audience"
                    {...register("audience", { required: "Audience is required" })}
                  />
                  {errors.audience && <span className="error">{errors.audience.message}</span>}
                </div>
              )}

              {step === 4 && (
                <div className="form-step">
                  <label>Content *</label>
                  <textarea
                    placeholder="Enter Content (Text, Emoji, URLs)"
                    rows="6"
                    {...register("content", { required: "Content is required" })}
                  />
                  {errors.content && <span className="error">{errors.content.message}</span>}
                </div>
              )}

              {step === 5 && (
                <div className="form-step">
                  <label>Media 1 (Optional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    {...register("media1", { validate: validateFiles })}
                  />
                </div>
              )}

              {step === 6 && (
                <div className="form-step">
                  <label>Media 2 (Optional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    {...register("media2", { validate: validateFiles })}
                  />
                </div>
              )}

              {step === 7 && (
                <div className="form-step">
                  <label>Media 3 (Optional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    {...register("media3", { validate: validateFiles })}
                  />
                </div>
              )}
            </div>

            <div className="form-navigation">
              {step > 0 && (
                <button type="button" onClick={handlePrevStep} className="nav-btn">
                  Previous
                </button>
              )}
              
              {step < 7 && (
                <button type="button" onClick={handleNextStep} className="nav-btn">
                  Next
                </button>
              )}
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Creating...' : 'Add Teaching'}
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setStep(0);
                  reset();
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachings List */}
      <div className="teachings_list">
        <div className="list-header">
          <h3>Existing Teachings ({teachings.length})</h3>
          <div className="list-stats">
            {isLoading && <span>Loading...</span>}
            {error && <span style={{color: 'red'}}>Error: {error.message}</span>}
          </div>
        </div>

        <div className="teachings-grid">
          {isLoading ? (
            <div className="loading-message">
              <p>Loading teachings...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p style={{color: 'red'}}>Error: {error.message}</p>
              <button onClick={refetch}>Retry</button>
            </div>
          ) : teachings.length === 0 ? (
            <div className="no-teachings">
              <p>No teachings available. Create your first teaching!</p>
            </div>
          ) : (
            teachings.map((teaching) => (
              <div key={teaching.prefixed_id || `teaching-${teaching.id}`} className="teaching-card">
                <div className="card-header">
                  <span className="content-type-badge">Teaching</span>
                  <span className="content-id">{getContentIdentifier(teaching)}</span>
                </div>
                
                <div className="card-content">
                  <h4 className="teaching-topic">{teaching.topic || 'Untitled'}</h4>
                  <p className="teaching-description">
                    {truncateText(teaching.description, 60)}
                  </p>
                  
                  <div className="teaching-details">
                    <p><strong>Lesson #:</strong> {teaching.lessonNumber || getContentIdentifier(teaching)}</p>
                    <p><strong>Subject:</strong> {truncateText(teaching.subjectMatter, 30)}</p>
                    <p><strong>Audience:</strong> {teaching.audience || 'General'}</p>
                    <p><strong>By:</strong> {teaching.user_id || 'Admin'}</p>
                  </div>
                  
                  <div className="teaching-dates">
                    <p><strong>Created:</strong> {formatDate(teaching.createdAt)}</p>
                    <p><strong>Updated:</strong> {formatDate(teaching.updatedAt)}</p>
                  </div>
                </div>
                
                {/* Media indicators */}
                <div className="media-indicators">
                  {teaching.media_url1 && <span className="media-badge">📷</span>}
                  {teaching.media_url2 && <span className="media-badge">🎥</span>}
                  {teaching.media_url3 && <span className="media-badge">🎵</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TowncrierControls;