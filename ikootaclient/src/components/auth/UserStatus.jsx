// ikootaclient/src/components/auth/UserStatus.jsx
// COMPLETE VERSION - Combines display component with context provider

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
// ✅ UNIFIED: Import unified API with membership functionality
import api, { membershipApi } from '../service/api';

// ✅ Create the UserContext
const UserContext = createContext();

// ✅ Export useUser hook for ProtectedRoute
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// ✅ COMPLETE: Status determination function - Updated for new field names
const determineUserStatus = ({ 
  role, 
  membershipStage, 
  userId, 
  initialApplicationStatus,
  fullMembershipApplStatus
}) => {
  console.log('🔍 Status determination with standardized levels:', { 
    role, membershipStage, userId, initialApplicationStatus, fullMembershipApplStatus 
  });

  // Normalize empty strings
  const normalizedMembershipStage = membershipStage === '' ? null : membershipStage;
  const normalizedRole = role === '' ? 'user' : role;
  const normalizedFullMembershipStatus = fullMembershipApplStatus === '' ? 'not_applied' : fullMembershipApplStatus;
  const normalizedInitialStatus = initialApplicationStatus === '' ? 'not_applied' : initialApplicationStatus;

  // ✅ Admin check
  if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
    console.log('👑 Admin user detected');
    return {
      isMember: true,
      isPendingMember: false,
      userType: 'admin',
      status: 'admin',
      canApplyForMembership: false,
      membershipApplicationStatus: 'admin_exempt',
      canAccessTowncrier: true,
      canAccessIko: true
    };
  }

  // ✅ FULL MEMBER CHECK - Simplified using membership_stage as primary
  if (normalizedMembershipStage === 'member') {
    console.log('💎 Full member detected');
    return {
      isMember: true,
      isPendingMember: false,
      userType: 'member',
      status: 'member',
      canApplyForMembership: false,
      membershipApplicationStatus: 'approved',
      canAccessTowncrier: true,
      canAccessIko: true
    };
  }

  // ✅ PRE-MEMBER WITH APPLICATION LOGIC - Simplified using membership_stage
  if (normalizedMembershipStage === 'pre_member') {
    console.log('👤 Pre-member detected, checking membership application status...');
    
    switch (normalizedFullMembershipStatus) {
      case 'pending':
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member_pending_upgrade',
          canApplyForMembership: false,
          membershipApplicationStatus: 'pending',
          canAccessTowncrier: true,
          canAccessIko: false
        };
        
      case 'approved':
        return {
          isMember: true,
          isPendingMember: false,
          userType: 'member',
          status: 'member',
          canApplyForMembership: false,
          membershipApplicationStatus: 'approved',
          canAccessTowncrier: true,
          canAccessIko: true
        };
        
      case 'declined':
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member_can_reapply',
          canApplyForMembership: true,
          membershipApplicationStatus: 'declined',
          canAccessTowncrier: true,
          canAccessIko: false
        };
        
      case 'not_applied':
      default:
        return {
          isMember: false,
          isPendingMember: true,
          userType: 'pre_member',
          status: 'pre_member',
          canApplyForMembership: true,
          membershipApplicationStatus: 'not_applied',
          canAccessTowncrier: true,
          canAccessIko: false
        };
    }
  }

  // ✅ APPLICANT check - Using membership_stage
  if (normalizedMembershipStage === 'applicant') {
    return {
      isMember: false,
      isPendingMember: true,
      userType: 'applicant',
      status: 'applicant',
      canApplyForMembership: false,
      membershipApplicationStatus: 'not_eligible',
      canAccessTowncrier: false,
      canAccessIko: false
    };
  }
  
  // Default fallback - Guest users
  return {
    isMember: false,
    isPendingMember: false,
    userType: 'guest',
    status: 'guest',
    canApplyForMembership: false,
    membershipApplicationStatus: 'not_eligible',
    canAccessTowncrier: false,
    canAccessIko: false
  };
};

// ✅ UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('not loaded');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializationRef = useRef(false);
  const membershipFetchRef = useRef(false);
  const lastFetchTime = useRef(0);
  const RATE_LIMIT_MS = 5000;

  const updateUserState = (newState) => {
    setUser(newState.user || null);
    setMembershipStatus(newState.membershipStatus || 'not loaded');
    setLoading(newState.loading || false);
    setError(newState.error || null);
  };

  const fetchMembershipStatus = async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < RATE_LIMIT_MS || membershipFetchRef.current) {
      return;
    }

    membershipFetchRef.current = true;
    lastFetchTime.current = now;
    
    try {
      const tokenData = getTokenUserData();
      if (!tokenData) {
        membershipFetchRef.current = false;
        return;
      }

      // ✅ FIXED: Use membershipApi which has the correct endpoints
      console.log('🔍 Fetching membership status...');
      
      // Get current membership status from the backend
      const membershipStatusResponse = await membershipApi.getCurrentStatus();
      console.log('✅ Membership status response:', membershipStatusResponse);

      // Debug: Check JWT token data
      console.log('🔍 UserStatus - JWT tokenData:', tokenData);
      console.log('🔍 UserStatus - tokenData.converse_id:', tokenData.converse_id);

      // Handle old JWT tokens that don't have converse_id
      let converseId = tokenData.converse_id;
      if (!converseId) {
        console.warn('⚠️ Old JWT token detected without converse_id. You may need to login again.');
        // For old tokens, try to get converse_id from membershipStatusResponse or use fallback
        converseId = membershipStatusResponse.converse_id || 'OLD_TOKEN';
      }

      const combinedUserData = {
        user_id: tokenData.user_id,
        converse_id: converseId,
        membership_stage: tokenData.membership_stage,
        role: tokenData.role,
        // Use data from membership status response with compatibility fallback
        survey_completed: membershipStatusResponse.survey_completed,
        initialApplicationStatus: membershipStatusResponse.initial_application_status || membershipStatusResponse.application_status || 'not_applied',
        needs_survey: membershipStatusResponse.needs_survey,
        // Full membership application data with compatibility
        fullMembershipApplStatus: membershipStatusResponse.full_membership_appl_status || membershipStatusResponse.full_membership_status || 'not_applied',
        membershipAppliedAt: membershipStatusResponse.submittedAt,
        membershipReviewedAt: membershipStatusResponse.reviewedAt,
        membershipTicket: membershipStatusResponse.latest_application?.application_ticket,
        membershipAdminNotes: membershipStatusResponse.latest_application?.notes || membershipStatusResponse.latest_application?.admin_notes
      };

      const statusResult = determineUserStatus({
        role: combinedUserData.role,
        membershipStage: combinedUserData.membership_stage,
        userId: combinedUserData.user_id,
        initialApplicationStatus: combinedUserData.initialApplicationStatus,
        fullMembershipApplStatus: combinedUserData.fullMembershipApplStatus
      });

      let finalStatus = statusResult.status;

      if (finalStatus !== 'admin' && finalStatus !== 'member') {
        if (combinedUserData.needs_survey === true || combinedUserData.survey_completed === false) {
          finalStatus = 'needs_application';
        }
      }

      const finalUserObject = {
        ...combinedUserData,
        ...statusResult,
        finalStatus
      };

      console.log('🔍 UserStatus - Final user object being set:', finalUserObject);
      console.log('🔍 UserStatus - Final user converse_id:', finalUserObject.converse_id);

      updateUserState({
        user: finalUserObject,
        membershipStatus: 'loaded',
        status: finalStatus,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching membership status:', error);
      
      const tokenData = getTokenUserData();
      if (tokenData) {
        const fallbackStatus = determineUserStatus({
          role: tokenData.role,
          membershipStage: tokenData.membership_stage,
          userId: tokenData.user_id,
          initialApplicationStatus: 'not_applied',
          fullMembershipApplStatus: 'not_applied'
        });
        
        updateUserState({
          user: {
            ...tokenData,
            ...fallbackStatus
          },
          membershipStatus: 'error',
          status: fallbackStatus.status,
          loading: false,
          error: `API Error: ${error.message}`
        });
      }
    } finally {
      membershipFetchRef.current = false;
    }
  };

  const getTokenUserData = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      // Clean the token
      const cleanToken = token
        .replace(/^["']|["']$/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\r?\n|\r/g, '');
      
      const tokenParts = cleanToken.split('.');
      if (tokenParts.length !== 3) {
        localStorage.removeItem('token');
        return null;
      }
      
      const decoded = jwtDecode(cleanToken);
      
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      localStorage.removeItem('token');
      return null;
    }
  };

  const initializeUser = async () => {
    if (initializationRef.current) return;

    initializationRef.current = true;
    
    const tokenData = getTokenUserData();
    
    if (!tokenData) {
      updateUserState({
        user: null,
        membershipStatus: 'not loaded',
        status: 'guest',
        loading: false,
        error: null
      });
      return;
    }

    const initialStatus = determineUserStatus({
      role: tokenData.role,
      membershipStage: tokenData.membership_stage,
      userId: tokenData.user_id,
      initialApplicationStatus: 'not_applied',
      fullMembershipApplStatus: 'not_applied'
    });

    updateUserState({
      user: {
        ...tokenData,
        ...initialStatus
      },
      membershipStatus: 'loading',
      status: initialStatus.status,
      loading: true,
      error: null
    });

    await fetchMembershipStatus();
  };

  useEffect(() => {
    if (!initializationRef.current) {
      initializeUser();
    }
  }, []);

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const getUserStatus = () => {
    if (!user) return 'guest';
    
    if (user.finalStatus) return user.finalStatus;
    if (user.status) return user.status;
    
    const fallbackStatus = determineUserStatus({
      role: user.role,
      membershipStage: user.membership_stage,
      userId: user.user_id,
      initialApplicationStatus: user.initialApplicationStatus || 'not_applied',
      fullMembershipApplStatus: user.fullMembershipApplStatus || 'not_applied'
    });
    
    return fallbackStatus.status;
  };

  const refreshUser = async () => {
    const now = Date.now();
    if (now - lastFetchTime.current > RATE_LIMIT_MS) {
      membershipFetchRef.current = false;
      await fetchMembershipStatus();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    
    initializationRef.current = false;
    membershipFetchRef.current = false;
    lastFetchTime.current = 0;
    
    updateUserState({
      user: null,
      membershipStatus: 'not loaded',
      status: 'guest',
      loading: false,
      error: null
    });
  };

  // ✅ Context value for ProtectedRoute
  const value = {
    user,
    membershipStatus,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    getUserStatus,
    refreshUser,
    updateUser: refreshUser,
    logout,
    isAdmin: () => getUserStatus() === 'admin',
    isMember: () => getUserStatus() === 'member',
    isPreMember: () => {
      const status = getUserStatus();
      return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply';
    },
    isPending: () => {
      const status = getUserStatus();
      return status === 'pre_member' || status === 'pre_member_pending_upgrade' || status === 'pre_member_can_reapply' || status === 'pending_verification';
    },
    needsApplication: () => getUserStatus() === 'needs_application',
    isPendingUpgrade: () => getUserStatus() === 'pre_member_pending_upgrade',
    canReapplyForMembership: () => getUserStatus() === 'pre_member_can_reapply',
    canApplyForMembership: () => user?.canApplyForMembership === true,
    getMembershipApplicationStatus: () => user?.membershipApplicationStatus || 'not_applied',
    getMembershipTicket: () => user?.membershipTicket || null,
    canAccessIko: () => user?.canAccessIko === true,
    canAccessTowncrier: () => user?.canAccessTowncrier === true
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// ✅ Display component for showing user status
const UserStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchMembershipStatus();
    }
  }, [user, authLoading]);

  const fetchMembershipStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await membershipApi.getCurrentStatus();
      
      if (response.success) {
        setMembershipStatus(response);
      } else {
        throw new Error(response.error || 'Failed to fetch status');
      }
    } catch (err) {
      console.error('Error fetching membership status:', err);
      setError(err.message || 'Failed to load membership status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembershipStatus();
    setRefreshing(false);
  };

  const getStatusDisplay = () => {
    if (!membershipStatus || !user) return getDefaultStatus();
    
    const { user_status, membership_stage, status, approval_status } = membershipStatus;
    const actualStatus = status || approval_status;
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      return {
        status: 'Administrator',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: '👑',
        description: 'You have administrative access to all features',
        priority: 'high'
      };
    }
    
    if (membership_stage === 'member' && user_status === 'member') {
      return {
        status: 'Full Member',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '💎',
        description: 'You have full access to all Ikoota features including Iko content',
        priority: 'high'
      };
    }
    
    if (membership_stage === 'pre_member' && user_status === 'pre_member') {
      const hasFullAppPending = membershipStatus.fullMembershipApplicationStatus === 'pending';
      
      return {
        status: hasFullAppPending ? 'Pre-Member (Upgrade Pending)' : 'Pre-Member',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '🌟',
        description: hasFullAppPending 
          ? 'Your full membership application is under review'
          : 'You have access to Towncrier content. Ready to apply for full membership!',
        priority: 'medium',
        canUpgrade: !hasFullAppPending
      };
    }
    
    if (membership_stage === 'applicant') {
      if (actualStatus === 'pending') {
        return {
          status: 'Application Under Review',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: '⏳',
          description: 'Your initial application is being reviewed by our team',
          priority: 'medium'
        };
      }
      
      if (actualStatus === 'declined' || user_status === 'rejected') {
        return {
          status: 'Application Declined',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '❌',
          description: 'Your application was not approved. You may reapply after reviewing feedback.',
          priority: 'medium',
          canReapply: true
        };
      }
    }
    
    return getDefaultStatus();
  };

  const getDefaultStatus = () => ({
    status: 'Ready to Apply',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '📝',
    description: 'Complete your membership application to join our community',
    priority: 'low'
  });

  const getNextActions = () => {
    if (!membershipStatus || !user) return getDefaultActions();
    
    const { user_status, membership_stage, needs_survey, survey_completed } = membershipStatus;
    const actions = [];
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      actions.push({
        label: 'Admin Dashboard',
        href: '/admin',
        variant: 'primary',
        icon: '⚙️'
      });
    } else if (membership_stage === 'member') {
      actions.push({
        label: 'Access Iko Content',
        href: '/iko',
        variant: 'primary',
        icon: '🎓'
      });
    } else if (membership_stage === 'pre_member') {
      actions.push({
        label: 'Access Towncrier',
        href: '/towncrier',
        variant: 'primary',
        icon: '📰'
      });
      
      if (membershipStatus.full_membership_appl_status !== 'pending' && membershipStatus.fullMembershipApplStatus !== 'pending') {
        actions.push({
          label: 'Apply for Full Membership',
          href: '/full-membership',
          variant: 'secondary',
          icon: '⬆️'
        });
      }
    }
    
    actions.push({
      label: 'View Dashboard',
      href: '/dashboard',
      variant: 'outline',
      icon: '📊'
    });
    
    return actions;
  };

  const getDefaultActions = () => [
    {
      label: 'Start Application',
      href: '/applicationsurvey',
      variant: 'primary',
      icon: '🚀'
    }
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading membership status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage 
          message={error} 
          onRetry={fetchMembershipStatus}
          showRetry={true}
        />
      </div>
    );
  }

  const statusInfo = getStatusDisplay();
  const nextActions = getNextActions();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Membership Status
        </h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`text-sm ${refreshing ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
          title="Refresh status"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className={`inline-flex items-center px-4 py-2 rounded-full ${statusInfo.bgColor} mb-4`}>
        <span className="text-lg mr-2">{statusInfo.icon}</span>
        <span className={`font-medium ${statusInfo.color}`}>
          {statusInfo.status}
        </span>
        {statusInfo.priority === 'high' && (
          <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        {statusInfo.description}
      </p>

      {membershipStatus && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Account Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Member ID:</span>
              <span className="ml-2 font-medium">{user?.converse_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Stage:</span>
              <span className="ml-2 font-medium capitalize">
                {membershipStatus.membership_stage || 'none'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium">
                {membershipStatus.user_status || 'pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {nextActions.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Recommended Actions</h3>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : action.variant === 'secondary'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {membershipStatus?.permissions && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Your Access Permissions</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center ${
              membershipStatus.permissions.can_access_towncrier ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span className="mr-2">
                {membershipStatus.permissions.can_access_towncrier ? '✅' : '❌'}
              </span>
              Towncrier Content
            </div>
            <div className={`flex items-center ${
              membershipStatus.permissions.can_access_iko ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span className="mr-2">
                {membershipStatus.permissions.can_access_iko ? '✅' : '❌'}
              </span>
              Iko Full Member Content
            </div>
            <div className={`flex items-center ${
              user?.role === 'admin' || user?.role === 'super_admin' ? 'text-purple-600' : 'text-gray-400'
            }`}>
              <span className="mr-2">
                {user?.role === 'admin' || user?.role === 'super_admin' ? '✅' : '❌'}
              </span>
              Administrative Access
            </div>
            <div className={`flex items-center ${
              membershipStatus.permissions.can_access_classes ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span className="mr-2">
                {membershipStatus.permissions.can_access_classes ? '✅' : '❌'}
              </span>
              Class Participation
            </div>
          </div>
        </div>
      )}

      {user && (membershipStatus?.membership_stage === 'member' || membershipStatus?.membership_stage === 'pre_member') && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-600">
                {membershipStatus.stats?.contentViews || 0}
              </div>
              <div className="text-xs text-blue-600">Content Views</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-600">
                {membershipStatus.stats?.commentsPosted || 0}
              </div>
              <div className="text-xs text-green-600">Comments Posted</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-purple-600">
                {membershipStatus.stats?.daysActive || 0}
              </div>
              <div className="text-xs text-purple-600">Days Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatus;

