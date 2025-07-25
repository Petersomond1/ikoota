// ikootaclient/src/components/config/accessMatrix.js
// ✅ ENHANCED VERSION - Preserving all existing functionality + dashboard fix

const ACCESS_MATRIX = {
  // Super Admin - Full access to everything
  super_admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier', '/application-survey', '/dashboard'],
    api_endpoints: ['ALL'],
    default_redirect: '/admin',
    dashboard_redirect: '/dashboard', // ✅ NEW: Separate dashboard redirect
    permissions: ['admin', 'iko', 'towncrier', 'dashboard', 'all'],
    userType: 'admin',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: true,
      dashboard: true
    }
  },

  // Admin - Most access, but maybe not system-level settings
  admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier', '/dashboard'],
    api_endpoints: [
      '/admin/*',
      '/membership/*', 
      '/users/*',
      '/classes/*',
      '/teachings/*',
      '/chats/*'
    ],
    default_redirect: '/admin',
    dashboard_redirect: '/dashboard', // ✅ NEW: Separate dashboard redirect
    permissions: ['admin', 'iko', 'towncrier', 'dashboard'],
    userType: 'admin',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: true,
      dashboard: true
    }
  },

  // Full Member - Can access Iko chat and member features
  member: {
    conditions: {
      membership_stage: 'member',
      is_member: 'member'
    },
    routes: ['/', '/iko', '/towncrier', '/dashboard', '/profile'],
    api_endpoints: [
      '/teachings/*',
      '/chats/*',
      '/users/profile',
      '/membership/dashboard'
    ],
    default_redirect: '/iko',
    dashboard_redirect: '/dashboard', // ✅ NEW: Dashboard buttons always go to dashboard
    permissions: ['iko', 'towncrier', 'dashboard'],
    userType: 'full_member',
    canAccess: {
      iko: true,
      towncrier: true,
      admin: false,
      dashboard: true
    }
  },

  // ✅ CRITICAL FIX: Pre-Member - Separate default navigation from dashboard navigation
  pre_member: {
    conditions: {
      membership_stage: 'pre_member'
    },
    routes: ['/', '/towncrier', '/dashboard', '/full-membership-intro'],
    api_endpoints: [
      '/teachings/*',
      '/membership/dashboard',
      '/membership/full-membership-status'
    ],
    default_redirect: '/towncrier', // ✅ PRESERVED: For general navigation/login redirects
    dashboard_redirect: '/dashboard', // ✅ NEW: Dashboard buttons specifically go here
    permissions: ['towncrier', 'dashboard'],
    userType: 'pre_member',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true
    }
  },

  // Applicant - Very limited access
  applicant: {
    conditions: {
      membership_stage: 'applicant'
    },
    routes: ['/', '/towncrier', '/application-survey', '/application-status', '/dashboard'],
    api_endpoints: [
      '/membership/survey/*',
      '/teachings/*' // Maybe limited access to some teachings
    ],
    default_redirect: '/application-survey',
    dashboard_redirect: '/dashboard', // ✅ NEW: Dashboard buttons go to dashboard
    permissions: ['towncrier', 'dashboard'],
    userType: 'applicant',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true // ✅ ENHANCED: Allow dashboard access for applicants
    }
  },

  // Applied/Pending users
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
    dashboard_redirect: '/dashboard', // ✅ NEW: Dashboard buttons go to dashboard
    permissions: ['towncrier', 'dashboard'],
    userType: 'pending',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: true // ✅ ENHANCED: Allow dashboard access for pending users
    }
  },

  // Non-authenticated users
  guest: {
    routes: ['/', '/login', '/register', '/signup', '/forgot-password'],
    api_endpoints: [
      '/auth/*',
      '/teachings/public' // If you have public teachings
    ],
    default_redirect: '/login',
    dashboard_redirect: '/login', // ✅ NEW: Guests go to login when trying to access dashboard
    permissions: [],
    userType: 'guest',
    canAccess: {
      iko: false,
      towncrier: true,
      admin: false,
      dashboard: false
    }
  }
};

// ✅ ENHANCED: Helper function to check access (preserving original logic)
const checkUserAccess = (user, requestedRoute = null, requestedEndpoint = null) => {
  if (!user) {
    return ACCESS_MATRIX.guest;
  }

  console.log('🔍 Checking user access for:', {
    role: user.role,
    membership_stage: user.membership_stage,
    is_member: user.is_member
  });

  // ✅ FIXED: Check role-based access first (admin/super_admin)
  const role = user.role?.toLowerCase();
  if (role === 'super_admin' && ACCESS_MATRIX.super_admin) {
    console.log('👑 Super admin access granted');
    return ACCESS_MATRIX.super_admin;
  }
  
  if (role === 'admin' && ACCESS_MATRIX.admin) {
    console.log('👑 Admin access granted');
    return ACCESS_MATRIX.admin;
  }

  // ✅ ENHANCED: Check membership-based access with better logic
  const membershipStage = user.membership_stage?.toLowerCase();
  const isMember = user.is_member?.toLowerCase();

  // Full member check
  if ((membershipStage === 'member' && isMember === 'member') || 
      (isMember === 'member' && membershipStage === 'member')) {
    console.log('💎 Full member access granted');
    return ACCESS_MATRIX.member;
  }

  // Pre-member check
  if (membershipStage === 'pre_member' || 
      (isMember === 'approved' && membershipStage === 'pre')) {
    console.log('👤 Pre-member access granted');
    return ACCESS_MATRIX.pre_member;
  }

  // Applied/Pending check
  if (isMember === 'applied' || isMember === 'pending') {
    console.log('⏳ Applied/Pending access granted');
    return ACCESS_MATRIX.applied;
  }

  // Default to applicant for authenticated users
  console.log('📝 Applicant access granted (fallback)');
  return ACCESS_MATRIX.applicant;
};

// ✅ ENHANCED: Usage function (preserving original + new features)
const getUserAccess = (userData) => {
  if (!userData) {
    return {
      userType: 'guest',
      defaultRoute: '/',
      dashboardRoute: '/login', // ✅ NEW: Separate dashboard route
      permissions: [],
      canAccess: ACCESS_MATRIX.guest.canAccess,
      canAccessIko: false,
      canAccessAdmin: false,
      canAccessTowncrier: true,
      allowedRoutes: ACCESS_MATRIX.guest.routes,
      allowedEndpoints: ACCESS_MATRIX.guest.api_endpoints
    };
  }

  const access = checkUserAccess(userData);
  
  return {
    // ✅ NEW: Enhanced properties
    userType: access.userType,
    defaultRoute: access.default_redirect, // ✅ PRESERVED: For general navigation
    dashboardRoute: access.dashboard_redirect, // ✅ NEW: Specifically for dashboard buttons
    permissions: access.permissions || [],
    canAccess: access.canAccess,
    
    // ✅ PRESERVED: Original properties
    canAccessIko: access.routes.includes('/iko'),
    canAccessAdmin: access.routes.some(route => route.startsWith('/admin')),
    canAccessTowncrier: access.routes.includes('/towncrier'),
    allowedRoutes: access.routes,
    allowedEndpoints: access.api_endpoints
  };
};

// ✅ NEW: Get dashboard route function (SOLUTION FOR THE REDIRECT ISSUE)
export const getDashboardRoute = (userData) => {
  const access = getUserAccess(userData);
  return access.dashboardRoute || '/dashboard'; // Always return dashboard route
};

// ✅ NEW: Get default route function (for general navigation - preserved functionality)
export const getDefaultRoute = (userData) => {
  const access = getUserAccess(userData);
  return access.defaultRoute;
};

// ✅ NEW: Check if user can access a specific route (preserved functionality)
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

// ✅ NEW: Get user status string (preserved functionality)
export const getUserStatusString = (userData) => {
  if (!userData) return 'guest';
  
  const role = userData.role?.toLowerCase();
  const memberStatus = userData.is_member?.toLowerCase();
  const membershipStage = userData.membership_stage?.toLowerCase();

  // Admin users
  if (role === 'admin' || role === 'super_admin') return 'admin';
  
  // Full members
  if ((memberStatus === 'member' && membershipStage === 'member')) return 'full_member';
  if (memberStatus === 'approved' && membershipStage === 'full') return 'full_member';
  
  // Pre-members
  if (memberStatus === 'approved' && membershipStage === 'pre') return 'pre_member';
  if (membershipStage === 'pre_member') return 'pre_member';
  
  // Pending/Applied
  if (memberStatus === 'applied' || memberStatus === 'pending') return 'pending_verification';
  
  // Denied
  if (memberStatus === 'declined' || memberStatus === 'denied') return 'denied';
  
  return 'authenticated';
};

// ✅ NEW: Check endpoint access (preserved functionality)
export const canAccessEndpoint = (userData, endpoint) => {
  const access = checkUserAccess(userData);
  
  // Check if user has access to ALL endpoints
  if (access.api_endpoints.includes('ALL')) {
    return true;
  }
  
  // Check direct endpoint access
  if (access.api_endpoints.includes(endpoint)) {
    return true;
  }
  
  // Check wildcard endpoint access
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

// ✅ NEW: Default export for modern import styles
export default {
  ACCESS_MATRIX,
  checkUserAccess,
  getUserAccess,
  getDefaultRoute,
  getDashboardRoute, // ✅ KEY ADDITION: Separate function for dashboard redirects
  canAccessRoute,
  getUserStatusString,
  canAccessEndpoint
};