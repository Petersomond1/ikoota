// ikootaclient/src/components/auth/ProtectedRoute.jsx
// ✅ PRESERVES ALL EXISTING FUNCTIONALITY + adds standardized membership support

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserStatus';
import { getUserAccess, getUserStatusString } from '../config/accessMatrix';

const ProtectedRoute = ({ 
  children, 
  // ✅ PRESERVED: All your existing props
  requireAuth = false,
  requireMember = false,        // ✅ ENHANCED: Now means "member" (highest level)
  requirePreMember = false,     // ✅ PRESERVED: Your existing logic
  requireAdmin = false,         // ✅ PRESERVED: Your existing logic
  allowedUserTypes = [],        // ✅ PRESERVED: Your existing logic
  redirectTo = '/login',        // ✅ PRESERVED: Your existing logic
  // ✅ NEW: Additional props for standardized membership
  allowPending = false          // ✅ NEW: Allow pending applications
}) => {
  const { user, isAuthenticated, loading, membershipStatus } = useUser();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // ✅ PRESERVED: Your exact loading logic
  useEffect(() => {
    if (!loading && (membershipStatus === 'loaded' || !user)) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [loading, membershipStatus, user]);

  // ✅ PRESERVED: Your exact loading component with styles
  if (!isReady) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Loading user status...</p>
        <style>
          {`
            .route-loading {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              flex-direction: column;
            }
            .loading-spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 2s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // ✅ ENHANCED: Use standardized status but preserve all your logic
  const userStatus = getUserStatusString(user);
  
  console.log('🔐 ProtectedRoute Check:', {
    path: location.pathname,
    userStatus,
    requireAuth,
    requireMember,
    requirePreMember,
    requireAdmin,
    allowedUserTypes,
    allowPending, // ✅ NEW
    isAuthenticated,
    membershipStatus,
    isReady
  });

  // ✅ PRESERVED: Your exact public routes logic
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/towncrier'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // ✅ PRESERVED: Your exact public route handling
  if (!requireAuth && !requireMember && !requirePreMember && !requireAdmin && allowedUserTypes.length === 0 && !allowPending) {
    console.log('✅ Public route access granted');
    return children;
  }

  // ✅ PRESERVED: Your exact authentication check
  if (requireAuth && !isAuthenticated) {
    console.log('🚨 SECURITY: Authentication required but user not authenticated');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ✅ ENHANCED: Authenticated user checks with standardized statuses
  if (isAuthenticated && user) {
    const access = getUserAccess(user);
    
    // ✅ PRESERVED: Your exact admin requirement check
    if (requireAdmin) {
      if (userStatus === 'admin') {
        console.log('✅ Admin access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Admin access required but user is not admin');
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ ENHANCED: Member requirement check (now standardized to "member" only)
    if (requireMember) {
      if (userStatus === 'member' || userStatus === 'admin') {
        console.log('✅ Member access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Member access required but user is not member');
        // ✅ ENHANCED: Better redirects based on current status
        if (userStatus === 'pre_member') {
          return <Navigate to="/full-membership/info" replace />;
        }
        if (userStatus === 'pre_member_pending_upgrade') {
          return <Navigate to="/full-membership/pending" replace />;
        }
        if (userStatus === 'pre_member_can_reapply') {
          return <Navigate to="/full-membership/declined" replace />;
        }
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ ENHANCED: Pre-member requirement check with ALL pre-member states
    if (requirePreMember) {
      const allowedForPreMember = [
        'pre_member', 
        'pre_member_pending_upgrade', 
        'pre_member_can_reapply', 
        'member', 
        'admin'
      ];
      
      if (allowedForPreMember.includes(userStatus)) {
        console.log('✅ Pre-member access granted for userStatus:', userStatus);
        return children;
      } else {
        console.log('🚨 SECURITY: Pre-member access required but user status insufficient:', {
          currentStatus: userStatus,
          expectedStatuses: allowedForPreMember,
          userObject: {
            role: user.role,
            is_member: user.is_member,
            membership_stage: user.membership_stage,
            approval_status: user.approval_status
          }
        });
        return <Navigate to="/towncrier" replace />;
      }
    }

    // ✅ NEW: Allow pending applications
    if (allowPending) {
      const allowedForPending = [
        'admin',
        'member',
        'pre_member',
        'pre_member_pending_upgrade', 
        'pre_member_can_reapply',
        'pending_verification',
        'needs_application'
      ];
      
      if (allowedForPending.includes(userStatus)) {
        console.log('✅ Pending access granted');
        return children;
      } else {
        console.log('❌ Pending access denied for status:', userStatus);
        return <Navigate to="/login" replace />;
      }
    }

    // ✅ PRESERVED: Your exact user types check
    if (allowedUserTypes.length > 0) {
      if (allowedUserTypes.includes(userStatus)) {
        console.log('✅ User type access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: User type not in allowed list');
        return <Navigate to={access.defaultRoute} replace />;
      }
    }

    // ✅ PRESERVED: Your exact auth-only check
    if (requireAuth && isAuthenticated) {
      console.log('✅ Authenticated access granted');
      return children;
    }
  }

  // ✅ PRESERVED: Your exact default case logic
  if (isAuthenticated && user) {
    const access = getUserAccess(user);
    
    // ✅ PRESERVED: Your exact dashboard route handling
    if (location.pathname === '/dashboard') {
      // ✅ ENHANCED: Include all membership states that can access dashboard
      const dashboardAllowed = ['admin', 'member', 'pre_member', 'pre_member_pending_upgrade', 'pre_member_can_reapply'];
      if (dashboardAllowed.includes(userStatus)) {
        console.log('✅ Dashboard access granted');
        return children;
      } else {
        console.log('🚨 SECURITY: Dashboard access denied for user status:', userStatus);
        return <Navigate to={access.defaultRoute} replace />;
      }
    }

    // ✅ PRESERVED: Your exact default authenticated access
    console.log('✅ Default authenticated access granted');
    return children;
  }

  // ✅ PRESERVED: Your exact final fallback
  console.log('🚨 SECURITY: Access denied, redirecting to login');
  return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default ProtectedRoute;

