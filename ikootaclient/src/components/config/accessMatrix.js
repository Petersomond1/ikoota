// ikootaclient/src/components/config/accessMatrix.js
// ✅ STANDARDIZED VERSION - Two Clear Levels: pre_member and member

const ACCESS_MATRIX = {
  // Super Admin - Full access to everything
  super_admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier', '/application-survey', '/dashboard', '/full-membership/*'],
    api_endpoints: ['ALL'],
    default_redirect: '/admin',
    dashboard_redirect: '/dashboard',
    permissions: ['admin', 'iko', 'towncrier', 'dashboard', 'membership_management', 'all'],
    userType: 'admin',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: true,
      dashboard: true,
      membershipApplication: true
    }
  },

  // Admin - Most access
  admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier', '/dashboard', '/full-membership/*'],
    api_endpoints: [
      '/admin/*',
      '/membership/*', 
      '/users/*',
      '/classes/*',
      '/teachings/*',
      '/chats/*'
    ],
    default_redirect: '/admin',
    dashboard_redirect: '/dashboard',
    permissions: ['admin', 'iko', 'towncrier', 'dashboard', 'membership_management'],
    userType: 'admin',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: true,
      dashboard: true,
      membershipApplication: true
    }
  },

  // ✅ MEMBER - Full access (highest non-admin level)
  member: {
    conditions: {
      membership_stage: 'member',
      is_member: 'member',
      status: 'member'
    },
    routes: ['/', '/iko', '/towncrier', '/dashboard', '/profile'],
    api_endpoints: [
      '/teachings/*',
      '/chats/*',
      '/users/profile',
      '/membership/dashboard'
    ],
    default_redirect: '/iko',
    dashboard_redirect: '/dashboard',
    permissions: ['iko', 'towncrier', 'dashboard'],
    userType: 'member',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: false // Already a member
    }
  },

  // ✅ PRE-MEMBER with Pending Membership Application
  pre_member_pending_upgrade: {
    conditions: {
      status: 'pre_member_pending_upgrade',
      membershipApplicationStatus: 'pending'
    },
    routes: ['/', '/towncrier', '/dashboard', '/full-membership/status', '/full-membership/pending'],
    api_endpoints: [
      '/teachings/*',
      '/membership/dashboard',
      '/membership/full-membership-status/*'
    ],
    default_redirect: '/towncrier',
    dashboard_redirect: '/dashboard',
    permissions: ['towncrier', 'dashboard', 'membership_status'],
    userType: 'pre_member',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: false // Cannot apply while pending
    },
    statusMessage: 'Your membership application is under review'
  },

  // ✅ PRE-MEMBER with Declined Application (can reapply)
  pre_member_can_reapply: {
    conditions: {
      status: 'pre_member_can_reapply',
      membershipApplicationStatus: 'declined'
    },
    routes: ['/', '/towncrier', '/dashboard', '/full-membership/info', '/full-membership/apply', '/full-membership/declined'],
    api_endpoints: [
      '/teachings/*',
      '/membership/dashboard',
      '/membership/full-membership-status/*',
      '/membership/full-membership/apply'
    ],
    default_redirect: '/towncrier',
    dashboard_redirect: '/dashboard',
    permissions: ['towncrier', 'dashboard', 'membership_reapply'],
    userType: 'pre_member',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: true // Can reapply
    },
    statusMessage: 'You can reapply for full membership'
  },

  // ✅ PRE-MEMBER - Eligible for membership application
  pre_member: {
    conditions: {
      membership_stage: 'pre_member',
      status: 'pre_member',
      membershipApplicationStatus: ['not_applied', null, undefined]
    },
    routes: ['/', '/towncrier', '/dashboard', '/full-membership/info', '/full-membership/apply'],
    api_endpoints: [
      '/teachings/*',
      '/membership/dashboard',
      '/membership/full-membership-status/*',
      '/membership/full-membership/apply'
    ],
    default_redirect: '/towncrier',
    dashboard_redirect: '/dashboard',
    permissions: ['towncrier', 'dashboard', 'membership_apply'],
    userType: 'pre_member',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: true // Can apply
    },
    statusMessage: 'You are eligible to apply for full membership'
  },

  // Applicant - Very limited access
  applicant: {
    conditions: {
      membership_stage: 'applicant'
    },
    routes: ['/', '/towncrier', '/application-survey', '/application-status', '/dashboard'],
    api_endpoints: [
      '/membership/survey/*',
      '/teachings/*'
    ],
    default_redirect: '/application-survey',
    dashboard_redirect: '/dashboard',
    permissions: ['towncrier', 'dashboard'],
    userType: 'applicant',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: false
    }
  },

  // Applied/Pending users (initial application)
  applied: {
    conditions: {
      is_member: ['applied', 'pending']
    },
    routes: ['/', '/towncrier', '/application-status', '/pending-verification', '/dashboard'],
    api_endpoints: [
      '/membership/survey/*',
      '/teachings/*'
    ],
    default_redirect: '/towncrier',
    dashboard_redirect: '/dashboard',
    permissions: ['towncrier', 'dashboard'],
    userType: 'pending',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true,
      membershipApplication: false
    }
  },

  // Non-authenticated users
  guest: {
    routes: ['/', '/login', '/register', '/signup', '/forgot-password'],
    api_endpoints: [
      '/auth/*',
      '/teachings/public'
    ],
    default_redirect: '/login',
    dashboard_redirect: '/login',
    permissions: [],
    userType: 'guest',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: false,
      membershipApplication: false
    }
  }
};

// ✅ STANDARDIZED: Helper function with clear member/pre_member logic
const checkUserAccess = (user, requestedRoute = null, requestedEndpoint = null) => {
  if (!user) {
    return ACCESS_MATRIX.guest;
  }

  console.log('🔍 Checking user access with standardized levels for:', {
    role: user.role,
    membership_stage: user.membership_stage,
    is_member: user.is_member,
    status: user.status,
    membershipApplicationStatus: user.membershipApplicationStatus
  });

  const role = user.role?.toLowerCase();
  const status = user.status || user.finalStatus;

  // ✅ Admin checks (preserved from original)
  if (role === 'super_admin' && ACCESS_MATRIX.super_admin) {
    console.log('👑 Super admin access granted');
    return ACCESS_MATRIX.super_admin;
  }
  
  if (role === 'admin' && ACCESS_MATRIX.admin) {
    console.log('👑 Admin access granted');
    return ACCESS_MATRIX.admin;
  }

  // ✅ STANDARDIZED: Status-based access
  switch (status) {
    case 'member':
      console.log('💎 Member access granted');
      return ACCESS_MATRIX.member;
      
    case 'pre_member_pending_upgrade':
      console.log('⏳ Pre-member with pending upgrade access');
      return ACCESS_MATRIX.pre_member_pending_upgrade;
      
    case 'pre_member_can_reapply':
      console.log('🔄 Pre-member can reapply access');
      return ACCESS_MATRIX.pre_member_can_reapply;
      
    case 'pre_member':
      console.log('👤 Pre-member access granted');
      return ACCESS_MATRIX.pre_member;
      
    case 'pending_verification':
    case 'applied':
      console.log('⏳ Applied/Pending access granted');
      return ACCESS_MATRIX.applied;
      
    default:
      console.log('📝 Default applicant access granted');
      return ACCESS_MATRIX.applicant;
  }
};

// ✅ STANDARDIZED: Usage function (preserving original structure)
const getUserAccess = (userData) => {
  if (!userData) {
    return {
      userType: 'guest',
      defaultRoute: '/',
      dashboardRoute: '/login',
      permissions: [],
      canAccess: ACCESS_MATRIX.guest.canAccess,
      canAccessIko: false,
      canAccessAdmin: false,
      canAccessTowncrier: true,
      canApplyForMembership: false,
      membershipApplicationStatus: 'not_eligible',
      allowedRoutes: ACCESS_MATRIX.guest.routes,
      allowedEndpoints: ACCESS_MATRIX.guest.api_endpoints
    };
  }

  const access = checkUserAccess(userData);
  
  return {
    userType: access.userType,
    defaultRoute: access.default_redirect,
    dashboardRoute: access.dashboard_redirect,
    permissions: access.permissions || [],
    canAccess: access.canAccess,
    statusMessage: access.statusMessage,
    
    // ✅ PRESERVED: Original properties
    canAccessIko: access.routes.includes('/iko'),
    canAccessAdmin: access.routes.some(route => route.startsWith('/admin')),
    canAccessTowncrier: access.routes.includes('/towncrier'),
    
    // ✅ STANDARDIZED: Membership properties
    canApplyForMembership: access.canAccess?.membershipApplication === true && 
                          userData.membershipApplicationStatus === 'not_applied',
    canReapplyForMembership: access.canAccess?.membershipApplication === true && 
                            userData.membershipApplicationStatus === 'declined',
    membershipApplicationStatus: userData.membershipApplicationStatus || 'not_applied',
    membershipTicket: userData.membershipTicket,
    
    allowedRoutes: access.routes,
    allowedEndpoints: access.api_endpoints
  };
};

// ✅ STANDARDIZED: Membership application route function
export const getMembershipApplicationRoute = (userData) => {
  const access = getUserAccess(userData);
  const status = userData?.membershipApplicationStatus;
  
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

// ✅ PRESERVED: Route checking from original
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
        return userData?.membershipApplicationStatus === 'pending';
      case 'approved':
        return userData?.membershipApplicationStatus === 'approved';
      case 'declined':
        return userData?.membershipApplicationStatus === 'declined';
      case 'status':
        return access.userType !== 'guest';
      default:
        return access.canAccess.membershipApplication;
    }
  }
  
  // ✅ PRESERVED: Original route checks
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

// ✅ STANDARDIZED: User status with clear levels (updated for member vs full_member)
export const getUserStatusString = (userData) => {
  if (!userData) return 'guest';
  
  const role = userData.role?.toLowerCase();
  const memberStatus = userData.is_member?.toLowerCase();
  const membershipStage = userData.membership_stage?.toLowerCase();
  const status = userData.status || userData.finalStatus;

  // Admin users
  if (role === 'admin' || role === 'super_admin') return 'admin';
  
  // ✅ STANDARDIZED: Member (no more "full_member")
  if (status === 'member' || 
      (memberStatus === 'member' && membershipStage === 'member')) {
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

// ✅ PRESERVED: Dashboard route function
export const getDashboardRoute = (userData) => {
  const access = getUserAccess(userData);
  return access.dashboardRoute || '/dashboard';
};

// ✅ PRESERVED: Default route function
export const getDefaultRoute = (userData) => {
  const access = getUserAccess(userData);
  return access.defaultRoute;
};

// ✅ PRESERVED: Endpoint access check
export const canAccessEndpoint = (userData, endpoint) => {
  const access = checkUserAccess(userData);
  
  if (access.api_endpoints.includes('ALL')) {
    return true;
  }
  
  if (access.api_endpoints.includes(endpoint)) {
    return true;
  }
  
  return access.api_endpoints.some(allowedEndpoint => {
    if (allowedEndpoint.endsWith('/*')) {
      const basePath = allowedEndpoint.replace('/*', '');
      return endpoint.startsWith(basePath);
    }
    return false;
  });
};

// ✅ PRESERVED: Export everything (maintaining backward compatibility)
export { 
  ACCESS_MATRIX, 
  checkUserAccess, 
  getUserAccess 
};

// ✅ PRESERVED: Default export for modern import styles
export default {
  ACCESS_MATRIX,
  checkUserAccess,
  getUserAccess,
  getDefaultRoute,
  getDashboardRoute,
  canAccessRoute,
  getUserStatusString,
  canAccessEndpoint,
  getMembershipApplicationRoute,
  canAccessMembershipFeature
};