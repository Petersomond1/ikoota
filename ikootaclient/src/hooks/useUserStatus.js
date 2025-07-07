// src/
// ├── components/
// │   └── auth/
// │       └── RoleProtectedRoute.jsx (NEW)
// ├── config/
// │   └── accessMatrix.js (NEW)
// ├── hooks/
// │   └── useUserStatus.js (NEW)
// ├── components/
// │   └── Login.jsx (UPDATE existing)
// └── App.jsx (UPDATE existing)

import { useState, useEffect } from 'react';
import api from '../components/service/api';

export const useUserStatus = () => {
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    const getUserStatus = async () => {
      try {
        const response = await api.get('/membership/dashboard');
        setUserStatus(response.data.membershipStatus);
      } catch (error) {
        console.error('Failed to get user status:', error);
      }
    };

    getUserStatus();
  }, []);

  return {
    isAdmin: userStatus?.role === 'admin' || userStatus?.role === 'super_admin',
    isFullMember: userStatus?.membership_stage === 'member' && userStatus?.is_member === 'member',
    isPreMember: userStatus?.membership_stage === 'pre_member',
    isApplicant: userStatus?.membership_stage === 'applicant' || !userStatus?.membership_stage,
    userStatus
  };
};