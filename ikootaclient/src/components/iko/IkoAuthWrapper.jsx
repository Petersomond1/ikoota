// ikootaclient/src/components/iko/IkoAuthWrapper.jsx
// ✅ Authorization wrapper for Iko component

import React from 'react';
import { useUser } from '../auth/UserStatus';
import { Navigate } from 'react-router-dom';
import { getFullConverseId } from '../../utils/converseIdUtils';
import Iko from './Iko';

const IkoAuthWrapper = ({ isNested = false }) => {
  const { user, loading, isAuthenticated } = useUser();

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <p>🔄 Checking member privileges...</p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>Verifying access to Iko Chat System</p>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ User not authenticated for Iko access');
    return <Navigate to="/login" replace />;
  }

  // ✅ Check member privileges based on your database structure
  const hasIkoAccess = () => {
    const membershipStage = user.membership_stage?.toLowerCase();
    const memberStatus = user.membership_stage?.toLowerCase();
    const userRole = user.role?.toLowerCase();

    console.log('🔍 Checking Iko access for user:', {
      id: user.id,
      converse_id: getFullConverseId(user),
      membershipStage,
      memberStatus,
      userRole
    });

    // ✅ PRIORITY 1: Admin users always have access
    if (['admin', 'super_admin'].includes(userRole)) {
      console.log('✅ Admin access granted to Iko');
      return true;
    }

    // ✅ PRIORITY 2: Full members have access
    if (membershipStage === 'member') {
      console.log('✅ Full member access granted to Iko');
      return true;
    }

    // ✅ PRIORITY 3: Check alternative member statuses (legacy support)
    if (memberStatus === 'member') {
      console.log('✅ Member access granted to Iko');
      return true;
    }

    // ❌ Deny access for others
    console.log('❌ Iko access denied:', {
      reason: 'Insufficient privileges',
      requiredStatus: 'member',
      currentStage: membershipStage,
      currentStatus: memberStatus
    });
    return false;
  };

  // Check access
  if (!hasIkoAccess()) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        background: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '50px'
      }}>
        <h2 style={{ color: '#e74c3c' }}>🚫 Access Restricted</h2>
        <p style={{ fontSize: '1.1em', marginBottom: '20px' }}>
          <strong>Iko Chat System</strong> is available to full members only.
        </p>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3>Your Current Status:</h3>
          <p><strong>Membership Stage:</strong> {user.membership_stage || 'Not set'}</p>
          <p><strong>Membership Stage:</strong> {user.membership_stage || 'Not set'}</p>
          <p><strong>Role:</strong> {user.role || 'User'}</p>
        </div>

        <div style={{ 
          background: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h4>To Access Iko Chat:</h4>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>Complete your membership application</li>
            <li>Wait for admin approval</li>
            <li>Check your email for updates</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => window.location.href = '/towncrier'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📖 Browse Public Content
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ✅ User has access, render Iko component
  console.log('✅ Iko access granted, rendering component');
  return <Iko isNested={isNested} />;
};

export default IkoAuthWrapper;