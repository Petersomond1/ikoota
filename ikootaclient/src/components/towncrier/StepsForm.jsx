import React, { useState } from 'react';
import '../admin/admin.css';

const StepsForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    message: '',
    audience: '',
    subjectMatter: '',
  });

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div>
      {step === 0 && (
        <input
          type="text"
          placeholder="Enter Topic"
          value={formData.topic}
          onChange={(e) => handleInputChange('topic', e.target.value)}
        />
      )}
      {/* Add steps for other fields here */}
      <div className="input-buttons">
        {step > 0 && <button onClick={handlePrevStep}>Back</button>}
        {step < 4 && <button onClick={handleNextStep}>Next</button>}
      </div>
      <button className="SendButton" onClick={() => console.log(formData)}>Send</button>
    </div>
  );
};

export default StepsForm;
