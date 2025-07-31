//ikootaclient\src\components\membership\FullMembershipStatus.jsx
import './fullMembershipStatus.css';
import React from 'react';  
import { useNavigate } from 'react-router-dom';
import { useMembershipStatus } from '../../hooks/useMembershipStatus';

const FullMembershipStatus = () => {
  const navigate = useNavigate();
  const { isFullMember, isLoading } = useMembershipStatus();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isFullMember) {
    return (
      <div>
        <h2>Membership Required</h2>
        <p>You need a full membership to access this content.</p>
        <button onClick={() => navigate('/upgrade')}>Upgrade Membership</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Full Membership Status</h2>
      <p>Congratulations! You have full access to all features.</p>
    </div>
  );
};

export default FullMembershipStatus;
