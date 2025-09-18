// File: utils/membershipUtils.js

import { getUserAccess } from './accessMatrix';

// ✅ STANDARDIZED: Membership application route function
export const getMembershipApplicationRoute = (userData) => {
  const access = getUserAccess(userData);
  const status = userData?.membershipApplicationStatus || userData?.full_membership_appl_status;
  
  switch (status) {
    case 'not_applied':
      return access.canApplyForMembership ? '/full-membership/info' : '/towncrier';
    case 'pending':
      return '/full-membership/pending';
    case 'approved':
      return '/iko'; // Members go to Iko
    case 'declined':
      return '/full-membership/declined';
    default:
      return '/dashboard';
  }
};

// ✅ STANDARDIZED: Feature access checking
export const canAccessMembershipFeature = (userData, feature) => {
  const access = getUserAccess(userData);
  
  switch (feature) {
    case 'apply':
      return access.canApplyForMembership;
    case 'reapply':
      return access.canReapplyForMembership;
    case 'status':
      return access.userType !== 'guest';
    case 'iko_chat':
      return access.canAccessIko;
    default:
      return false;
  }
};

// ✅ STANDARDIZED: Route access checking
export const canAccessRoute = (userData, route) => {
  const access = getUserAccess(userData);
  
  // Check direct route access
  if (access.allowedRoutes.includes(route)) {
    return true;
  }
  
  // Check wildcard routes
  const hasWildcardAccess = access.allowedRoutes.some(allowedRoute => {
    if (allowedRoute.endsWith('/*')) {
      const basePath = allowedRoute.replace('/*', '');
      return route.startsWith(basePath);
    }
    return false;
  });
  
  if (hasWildcardAccess) {
    return true;
  }
  
  // ✅ STANDARDIZED: Membership route checks
  if (route.startsWith('/full-membership/')) {
    const subRoute = route.replace('/full-membership/', '');
    
    switch (subRoute) {
      case 'info':
      case 'apply':
        return access.canApplyForMembership || access.canReapplyForMembership;
      case 'pending':
        return userData?.membershipApplicationStatus === 'pending' || 
               userData?.full_membership_appl_status === 'pending';
      case 'approved':
        return userData?.membershipApplicationStatus === 'approved' || 
               userData?.full_membership_appl_status === 'approved';
      case 'declined':
        return userData?.membershipApplicationStatus === 'declined' || 
               userData?.full_membership_appl_status === 'declined';
      case 'status':
        return access.userType !== 'guest';
      default:
        return access.canAccess.membershipApplication;
    }
  }
  
  // Check specific access properties
  switch (route) {
    case '/admin':
      return access.canAccess.admin;
    case '/iko':
      return access.canAccess.iko;
    case '/towncrier':
      return access.canAccess.towncrier;
    case '/dashboard':
      return access.canAccess.dashboard;
    default:
      return false;
  }
};

// ✅ STANDARDIZED: User status with clear levels
export const getUserStatusString = (userData) => {
  if (!userData) return 'guest';

  const role = userData.role?.toLowerCase();
  const membershipStage = userData.membership_stage?.toLowerCase();
  const status = userData.status || userData.finalStatus;
  const memberStatus = userData.member_status || userData.memberStatus;

  // Admin users
  if (role === 'admin' || role === 'super_admin') return 'admin';

  // ✅ STANDARDIZED: Member (full member)
  if (status === 'member' || membershipStage === 'member') {
    return 'member';
  }

  // ✅ STANDARDIZED: Pre-member states
  if (status === 'pre_member_pending_upgrade') return 'pre_member_pending_upgrade';
  if (status === 'pre_member_can_reapply') return 'pre_member_can_reapply';

  if (status === 'pre_member' ||
      memberStatus === 'approved' && membershipStage === 'pre' ||
      membershipStage === 'pre_member') {
    return 'pre_member';
  }

  // Pending/Applied
  if (memberStatus === 'applied' || memberStatus === 'pending') return 'pending_verification';

  // Denied
  if (memberStatus === 'declined' || memberStatus === 'denied') return 'denied';

  return 'authenticated';
};

// ✅ STANDARDIZED: Dashboard content configuration
export const getDashboardContent = (userData) => {
  const access = getUserAccess(userData);
  const status = getUserStatusString(userData);
  
  return {
    showMembershipApplicationCard: ['pre_member', 'pre_member_can_reapply'].includes(status),
    showApplicationPending: status === 'pre_member_pending_upgrade',
    showIkoAccess: access.canAccessIko,
    showTowncrierAccess: access.canAccessTowncrier,
    showAdminPanel: access.canAccessAdmin,
    primaryAction: getPrimaryAction(userData),
    statusMessage: access.statusMessage
  };
};

// ✅ STANDARDIZED: Primary action determination
export const getPrimaryAction = (userData) => {
  const status = getUserStatusString(userData);
  const access = getUserAccess(userData);
  
  switch (status) {
    case 'admin':
      return { text: 'Admin Panel', link: '/admin', type: 'admin' };
    case 'member':
      return { text: 'Iko Chat', link: '/iko', type: 'primary' };
    case 'pre_member':
      return access.canApplyForMembership 
        ? { text: 'Apply for Full Membership', link: '/full-membership/info', type: 'upgrade' }
        : { text: 'Access Towncrier', link: '/towncrier', type: 'secondary' };
    case 'pre_member_pending_upgrade':
      return { text: 'Check Application Status', link: '/full-membership/status', type: 'info' };
    case 'pre_member_can_reapply':
      return { text: 'Reapply for Full Membership', link: '/full-membership/info', type: 'retry' };
    case 'pending_verification':
      return { text: 'Check Application Status', link: '/application-status', type: 'warning' };
    default:
      return { text: 'Complete Application', link: '/application-survey', type: 'primary' };
  }
};

// ✅ STANDARDIZED: Route protection helpers
export const requireMembershipLevel = (userData, requiredLevel) => {
  const access = getUserAccess(userData);
  
  switch (requiredLevel) {
    case 'member':
      return access.canAccessIko;
    case 'pre_member':
      return access.userType === 'pre_member' || access.canAccessIko;
    case 'authenticated':
      return access.userType !== 'guest';
    case 'admin':
      return access.canAccessAdmin;
    default:
      return false;
  }
};

// ✅ STANDARDIZED: Application status helpers
export const getApplicationStatusDisplay = (userData) => {
  const status = userData?.full_membership_appl_status || userData?.membershipApplicationStatus;
  
  const statusConfig = {
    'not_applied': {
      text: 'Not Applied',
      color: 'gray',
      icon: 'clock',
      description: 'You have not applied for full membership yet'
    },
    'pending': {
      text: 'Under Review',
      color: 'yellow',
      icon: 'hourglass',
      description: 'Your application is being reviewed by our team'
    },
    'approved': {
      text: 'Approved',
      color: 'green',
      icon: 'check-circle',
      description: 'Congratulations! Your membership has been approved'
    },
    'declined': {
      text: 'Declined',
      color: 'red',
      icon: 'x-circle',
      description: 'Your application was not approved at this time'
    }
  };
  
  return statusConfig[status] || statusConfig['not_applied'];
};