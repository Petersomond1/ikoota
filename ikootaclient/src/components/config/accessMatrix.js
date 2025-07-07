// ikootaclient\src\components\config\accessMatrix.js

const ACCESS_MATRIX = {
  // Super Admin - Full access to everything
  super_admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier', '/application-survey'],
    api_endpoints: ['ALL'],
    default_redirect: '/admin'
  },

  // Admin - Most access, but maybe not system-level settings
  admin: {
    routes: ['/', '/admin/*', '/iko', '/towncrier'],
    api_endpoints: [
      '/admin/*',
      '/membership/*', 
      '/users/*',
      '/classes/*',
      '/teachings/*',
      '/chats/*'
    ],
    default_redirect: '/admin'
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
    default_redirect: '/iko'
  },

  // Pre-Member - Limited access, preparing for full membership
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
    default_redirect: '/towncrier'
  },

  // Applicant - Very limited access
  applicant: {
    conditions: {
      membership_stage: 'applicant'
    },
    routes: ['/', '/towncrier', '/application-survey', '/application-status'],
    api_endpoints: [
      '/membership/survey/*',
      '/teachings/*' // Maybe limited access to some teachings
    ],
    default_redirect: '/application-survey'
  },

  // Non-authenticated users
  guest: {
    routes: ['/', '/login', '/register', '/forgot-password'],
    api_endpoints: [
      '/auth/*',
      '/teachings/public' // If you have public teachings
    ],
    default_redirect: '/login'
  }
};

// Helper function to check access
const checkUserAccess = (user, requestedRoute, requestedEndpoint = null) => {
  if (!user) {
    return ACCESS_MATRIX.guest;
  }

  // Check role-based access first (admin/super_admin)
  if (user.role && ACCESS_MATRIX[user.role]) {
    return ACCESS_MATRIX[user.role];
  }

  // Check membership-based access
  const membershipStage = user.membership_stage || 'applicant';
  const isMember = user.is_member;

  if (membershipStage === 'member' && isMember === 'member') {
    return ACCESS_MATRIX.member;
  } else if (membershipStage === 'pre_member') {
    return ACCESS_MATRIX.pre_member;
  } else {
    return ACCESS_MATRIX.applicant;
  }
};

// Usage example:
const getUserAccess = (user) => {
  const access = checkUserAccess(user);
  
  return {
    canAccessIko: access.routes.includes('/iko'),
    canAccessAdmin: access.routes.some(route => route.startsWith('/admin')),
    canAccessTowncrier: access.routes.includes('/towncrier'),
    defaultRoute: access.default_redirect,
    allowedRoutes: access.routes,
    allowedEndpoints: access.api_endpoints
  };
};

// Export everything
export { ACCESS_MATRIX, checkUserAccess, getUserAccess };