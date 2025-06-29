import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import { useForm } from 'react-hook-form';
import useUpload from '../../hooks/useUpload';
import { jwtDecode } from 'jwt-decode';
import api from '../service/api';
import './teaching.css';

const Teaching = ({ setActiveItem, deactivateListChats }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: teachingMutation } = useUpload("/teachings");
  
  const [addMode, setAddMode] = useState(false);
  const [activeItem, setActiveItemState] = useState({ id: null, type: null });
  const [teachings, setTeachings] = useState([]);
  const [filteredTeachings, setFilteredTeachings] = useState([]);
  const [step, setStep] = useState(0);

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  useEffect(() => {
    const fetchTeachings = async () => {
      try {
        const response = await api.get('/teachings');
        const teachingsData = response.data.map(teaching => ({ 
          ...teaching, 
          content_type: 'teaching',
          content_title: teaching.topic,
          // Ensure prefixed_id exists, fallback to generated one
          prefixed_id: teaching.prefixed_id || `t${teaching.id}`
        }));
        
        setTeachings(teachingsData);
        setFilteredTeachings(teachingsData);
      } catch (error) {
        console.error('Error fetching teachings:', error);
      }
    };

    fetchTeachings();
  }, []);

  const handleSearch = (query) => {
    const filtered = teachings.filter(teaching =>
      (teaching.topic && teaching.topic.toLowerCase().includes(query.toLowerCase())) ||
      (teaching.description && teaching.description.toLowerCase().includes(query.toLowerCase())) ||
      (teaching.subjectMatter && teaching.subjectMatter.toLowerCase().includes(query.toLowerCase())) ||
      (teaching.prefixed_id && teaching.prefixed_id.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredTeachings(filtered);
  };

  const handleItemClick = (teaching) => {
    if (deactivateListChats) deactivateListChats();
    setActiveItemState({ 
      id: teaching.prefixed_id || teaching.id, 
      type: 'teaching' 
    });
    if (setActiveItem) setActiveItem(teaching);
  };

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSendTeaching = (data) => {
    const formData = new FormData();
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

    teachingMutation.mutate(formData, {
      onSuccess: (response) => {
        console.log("Teaching created with prefixed ID:", response.data?.prefixed_id);
        reset();
        setStep(0);
        setAddMode(false);
        
        // Refresh teachings list
        window.location.reload(); // Quick refresh, you can implement better state management
      },
      onError: (error) => {
        console.error("Error creating teaching:", error);
        alert("Failed to create teaching. Please try again.");
      },
    });
  };

  // Helper function to get content identifier
  const getContentIdentifier = (teaching) => {
    return teaching?.prefixed_id || `t${teaching?.id}` || 'Unknown';
  };

  return (
    <div className='teaching_container'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <SearchControls onSearch={handleSearch} />
        </div>
        <img 
          src={addMode ? "./minus.png" : "./plus.png"} 
          alt="" 
          className='add' 
          onClick={() => setAddMode(!addMode)} 
        />
      </div>

      {/* Add Mode Form */}
      {addMode && (
        <div className="add-teaching-form">
          <form onSubmit={handleSubmit(handleSendTeaching)} noValidate>
            <div className="step-indicator">
              Step {step + 1} of 7: {['Topic', 'Description', 'Subject', 'Audience', 'Content', 'Media 1', 'Media 2'][step]}
            </div>
            
            {step === 0 && (
              <input
                type="text"
                placeholder="Enter Topic"
                {...register("topic", { required: "Topic is required" })}
              />
            )}
            {step === 1 && (
              <textarea
                placeholder="Enter Description"
                rows="3"
                {...register("description", { required: "Description is required" })}
              />
            )}
            {step === 2 && (
              <input
                type="text"
                placeholder="Enter Subject Matter"
                {...register("subjectMatter", { required: "Subject Matter is required" })}
              />
            )}
            {step === 3 && (
              <input
                type="text"
                placeholder="Enter Audience"
                {...register("audience", { required: "Audience is required" })}
              />
            )}
            {step === 4 && (
              <textarea
                placeholder="Enter Content"
                rows="5"
                {...register("content", { required: "Content is required" })}
              />
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
            
            <div className="form-buttons">
              {step < 6 && <button type="button" onClick={handleNextStep}>Next</button>}
              {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
              <button type="submit">Create Teaching</button>
              <button type="button" onClick={() => setAddMode(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Teachings List */}
      {filteredTeachings.length === 0 && !addMode && (
        <p>No teachings available</p>
      )}
      
      {filteredTeachings.map((teaching) => (
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
              Description: {teaching.description || 'No description available'}
            </p>
            <p>Lesson#: {teaching.lessonNumber || getContentIdentifier(teaching)}</p>
            <p>Subject Matter: {teaching.subjectMatter || 'Not specified'}</p>
            <p>Audience: {teaching.audience || 'General'}</p>
            <p>By: {teaching.user_id || 'Admin'}</p>
            <p>Date: {new Date(teaching.createdAt || teaching.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Teaching;


// import React, {useState} from 'react'
// import './teaching.css'

// const Teaching = () => {
//   const [addMode, setAddMode] = useState(false)
//      return (
//        <div className='teaching_container'>
//            <div className="search">
//                <div className="searchbar">
//                    <img src="./search.png" alt="" />
//                    <input type="text" placeholder="Search" />
//                </div>
//        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>Audience: General</p>
//                    <p>By: Admin</p>
//                     <p>Date: 1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>Audience: General</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//            <div className="item">
//                <div className="texts">
//                    <span>Topic: Greeting</span>
//                    <p>Description: Lorem, ipsum dolor sit
//                       amet consectetur adipisicing elit.
//                    </p>
//                    <p>Leasson#: 100001</p>
//                    <p>Subject Matter: Eden</p>
//                    <p>By: Admin</p>
//                     <p>1hr 30min ago</p>
//                     </div>
//            </div>
//         </div>
//      )
//    }
// export default Teaching