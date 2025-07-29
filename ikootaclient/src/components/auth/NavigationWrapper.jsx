// // ikootaclient/src/components/auth/NavigationWrapper.jsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useUser } from './UserStatus';

// const NavigationWrapper = ({ children }) => {
//   const { loading, isAuthenticated, getUserStatus, getDefaultRoute } = useUser();

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner">Loading...</div>
//       </div>
//     );
//   }

//   // Auto-redirect logic based on user status
//   const userStatus = getUserStatus();
//   const currentPath = window.location.pathname;

//   // Define which paths are allowed for each user status
//   const allowedPaths = {
//     guest: ['/', '/login', '/signup', '/towncrier'],
//     pending: ['/towncrier', '/applicationsurvey', '/thankyou'],
//     member: ['/iko', '/iko/*'],
//     admin: ['/admin', '/admin/*', '/iko', '/iko/*', '/towncrier']
//   };

//   // Check if current path is allowed for user status
//   const isPathAllowed = (status, path) => {
//     const allowed = allowedPaths[status] || [];
//     return allowed.some(allowedPath => {
//       if (allowedPath.endsWith('/*')) {
//         return path.startsWith(allowedPath.slice(0, -2));
//       }
//       return path === allowedPath;
//     });
//   };

//   // Auto-redirect if user is on wrong path for their status
//   if (!isPathAllowed(userStatus, currentPath)) {
//     return <Navigate to={getDefaultRoute()} replace />;
//   }

//   return children;
// };

// export default NavigationWrapper;