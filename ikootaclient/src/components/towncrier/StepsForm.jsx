// ikootaclient\src\components\towncrier\StepsForm.jsx
import React, { useState } from 'react';

const StepsForm = ({ addTopic}) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      message: '',
      audience: '',
    });
  
    const handleAddTopic = () => {
      const newTopic = { ...formData, id: Date.now() };
      addTopic(newTopic);
      setFormData({ title: '', description: '', message: '', audience: '' });
    };
  
    return (
      <div className="steps-form">
        <input
          type="text"
          placeholder="Enter Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <textarea
          placeholder="Enter Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <button onClick={handleAddTopic}>Add Topic</button>
      </div>
    );
  }
  export default StepsForm;
  


