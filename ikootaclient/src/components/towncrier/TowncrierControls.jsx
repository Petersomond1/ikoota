import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../admin/admin.css';

const TowncrierControls = () => {
  const [teachings, setTeachings] = useState([]);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    lessonNumber: '',
    subjectMatter: '',
    audience: '',
    content: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchTeachings();
  }, []);

  const fetchTeachings = async () => {
    try {
      const response = await axios.get('/api/teachings'); // Adjust endpoint as necessary
      setTeachings(Array.isArray(response.data) ? response.data : []); // Ensure teachings is an array
    } catch (error) {
      console.error('Error fetching teachings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await axios.put(`/api/teachings/${currentId}`, formData);
      } else {
        await axios.post('/api/teachings', formData);
      }
      fetchTeachings();
      resetForm();
    } catch (error) {
      console.error('Error saving teaching:', error);
    }
  };

  const handleEdit = (teaching) => {
    setFormData(teaching);
    setEditMode(true);
    setCurrentId(teaching.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/teachings/${id}`);
      fetchTeachings();
    } catch (error) {
      console.error('Error deleting teaching:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      description: '',
      lessonNumber: '',
      subjectMatter: '',
      audience: '',
      content: '',
    });
    setEditMode(false);
    setCurrentId(null);
  };

  return (
    <div className="towncrier_controls_body">
      <h2>Towncrier Controls</h2>
      <div className="teaching_form">
        <input
          type="text"
          placeholder="Topic"
          value={formData.topic}
          onChange={(e) => handleInputChange('topic', e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
        <input
          type="text"
          placeholder="Lesson Number"
          value={formData.lessonNumber}
          onChange={(e) => handleInputChange('lessonNumber', e.target.value)}
        />
        <input
          type="text"
          placeholder="Subject Matter"
          value={formData.subjectMatter}
          onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
        />
        <input
          type="text"
          placeholder="Audience"
          value={formData.audience}
          onChange={(e) => handleInputChange('audience', e.target.value)}
        />
        <textarea
          placeholder="Content (Text, Emoji, URLs)"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
        />
        <button onClick={handleSubmit}>{editMode ? 'Update' : 'Add'} Teaching</button>
        {editMode && <button onClick={resetForm}>Cancel</button>}
      </div>
      <div className="teachings_list">
        <h3>Existing Teachings</h3>
        {teachings.map((teaching) => (
          <div key={teaching.id} className="teaching_item">
            <span>Topic: {teaching.topic}</span>
            <p>Description: {teaching.description}</p>
            <p>Lesson#: {teaching.lessonNumber}</p>
            <p>Subject Matter: {teaching.subjectMatter}</p>
            <p>Audience: {teaching.audience}</p>
            <p>Date: {new Date(teaching.createdAt).toLocaleString()}</p>
            <div className="teaching_controls">
              <button onClick={() => handleEdit(teaching)}>Edit</button>
              <button onClick={() => handleDelete(teaching.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TowncrierControls;





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import '../admin/admin.css';

// const TowncrierControls = () => {
//   const [teachings, setTeachings] = useState([]);
//   const [formData, setFormData] = useState({
//     topic: '',
//     description: '',
//     lessonNumber: '',
//     subjectMatter: '',
//     audience: '',
//     content: '', // Will hold emojis, text, images, or video URLs
//   });
//   const [editMode, setEditMode] = useState(false);
//   const [currentId, setCurrentId] = useState(null);

//   // Fetch teachings from the database
//   useEffect(() => {
//     fetchTeachings();
//   }, []);

//   const fetchTeachings = async () => {
//     try {
//       const response = await axios.get('/api/teachings'); // Replace with your API endpoint
//       setTeachings(response.data);
//     } catch (error) {
//       console.error('Error fetching teachings:', error);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData({ ...formData, [field]: value });
//   };

//   const handleSubmit = async () => {
//     try {
//       if (editMode) {
//         await axios.put(`/api/teachings/${currentId}`, formData);
//       } else {
//         await axios.post('/api/teachings', formData);
//       }
//       fetchTeachings();
//       resetForm();
//     } catch (error) {
//       console.error('Error saving teaching:', error);
//     }
//   };

//   const handleEdit = (teaching) => {
//     setFormData(teaching);
//     setEditMode(true);
//     setCurrentId(teaching.id);
//   };

//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(`/api/teachings/${id}`);
//       fetchTeachings();
//     } catch (error) {
//       console.error('Error deleting teaching:', error);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       topic: '',
//       description: '',
//       lessonNumber: '',
//       subjectMatter: '',
//       audience: '',
//       content: '',
//     });
//     setEditMode(false);
//     setCurrentId(null);
//   };

//   return (
//     <div className="towncrier_controls_body">
//       <div className="admin_controls_header">Towncrier Controls</div>
//       <div className="teaching_form">
//         <input
//           type="text"
//           placeholder="Topic"
//           value={formData.topic}
//           onChange={(e) => handleInputChange('topic', e.target.value)}
//         />
//         <textarea
//           placeholder="Description"
//           value={formData.description}
//           onChange={(e) => handleInputChange('description', e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Lesson Number"
//           value={formData.lessonNumber}
//           onChange={(e) => handleInputChange('lessonNumber', e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Subject Matter"
//           value={formData.subjectMatter}
//           onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Audience"
//           value={formData.audience}
//           onChange={(e) => handleInputChange('audience', e.target.value)}
//         />
//         <textarea
//           placeholder="Content (Text, Emoji, URLs)"
//           value={formData.content}
//           onChange={(e) => handleInputChange('content', e.target.value)}
//         />
//         <button onClick={handleSubmit}>{editMode ? 'Update' : 'Add'} Teaching</button>
//         {editMode && <button onClick={resetForm}>Cancel</button>}
//       </div>
//       <div className="teachings_list">
//         <h3>Existing Teachings</h3>
//         {teachings?.map((teaching) => (
//           <div key={teaching.id} className="teaching_item">
//             <span>Topic: {teaching.topic}</span>
//             <p>Description: {teaching.description}</p>
//             <p>Lesson#: {teaching.lessonNumber}</p>
//             <p>Subject Matter: {teaching.subjectMatter}</p>
//             <p>Audience: {teaching.audience}</p>
//             <p>Date: {new Date(teaching.createdAt).toLocaleString()}</p>
//             <div className="teaching_controls">
//               <button onClick={() => handleEdit(teaching)}>Edit</button>
//               <button onClick={() => handleDelete(teaching.id)}>Delete</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TowncrierControls;





// import React, { useState } from 'react';
// import StepsForm from './StepsForm';
// import '../admin/admin.css';

// const TowncrierControls = () => {
//   return (
//     <div className="towncrier_controls_body">
//       <div className="admin_controls_header">Towncrier Controls</div>
//       <StepsForm />
//     </div>
//   );
// };

// export default TowncrierControls;
