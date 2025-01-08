import React, { useState } from 'react';
import StepsForm from './StepsForm';
import '../admin/admin.css';

const TowncrierControls = () => {
  return (
    <div className="towncrier_controls_body">
      <div className="admin_controls_header">Towncrier Controls</div>
      <StepsForm />
    </div>
  );
};

export default TowncrierControls;
