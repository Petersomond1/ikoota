// // ikootaclient/src/components/debug/DebugUserInfo.jsx
// // ✅ DEBUG COMPONENT - Add this temporarily to see user state

// import React from 'react';
// import { useUser } from '../auth/UserStatus';
// import { getUserAccess, getUserStatusString } from '../config/accessMatrix';

// const DebugUserInfo = () => {
//   const { user, isAuthenticated, loading, error, membershipStatus } = useUser();

//   if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
//     return (
//       <div style={{
//         position: 'fixed',
//         top: '10px',
//         right: '10px',
//         background: '#f0f0f0',
//         border: '1px solid #ccc',
//         padding: '10px',
//         fontSize: '12px',
//         maxWidth: '300px',
//         zIndex: 9999,
//         borderRadius: '5px'
//       }}>
//         <h4>🐛 Debug Info</h4>
//         <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
//         <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
//         <div><strong>Membership Status:</strong> {membershipStatus}</div>
//         <div><strong>Error:</strong> {error || 'None'}</div>
        
//         {user && (
//           <>
//             <div><strong>User ID:</strong> {user.user_id}</div>
//             <div><strong>Username:</strong> {user.username}</div>
//             <div><strong>Role:</strong> {user.role}</div>
//             <div><strong>Member Status:</strong> {user.is_member}</div>
//             <div><strong>Membership Stage:</strong> {user.membership_stage}</div>
//             <div><strong>User Status:</strong> {getUserStatusString(user)}</div>
//             <div><strong>Default Route:</strong> {getUserAccess(user).defaultRoute}</div>
//             <div><strong>Survey Completed:</strong> {user.survey_completed ? 'Yes' : 'No'}</div>
//             <div><strong>Needs Survey:</strong> {user.needs_survey ? 'Yes' : 'No'}</div>
//           </>
//         )}
        
//         {!user && <div>No user data</div>}
//       </div>
//     );
//   }

//   return null;
// };

// export default DebugUserInfo;
