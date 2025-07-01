// ikootaclient/src/App.jsx - Alternative approach with NavigationWrapper
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserProvider } from './components/auth/UserStatus';
import NavigationWrapper from './components/auth/NavigationWrapper';
import LandingPage from './components/auth/LandingPage';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Applicationsurvey from './components/auth/Applicationsurvey';
import AuthControl from './components/auth/AuthControls';
import UserManagement from './components/auth/UserManagement';

// Info components
import Thankyou from './components/info/Thankyou';

// Admin components
import Admin from './components/admin/Admin';
import Dashboard from './components/admin/Dashboard';
import Reports from './components/admin/Reports';
import AudienceClassMgr from './components/admin/AudienceClassMgr';

// Towncrier components
import Towncrier from './components/towncrier/Towncrier';
import TowncrierControls from './components/towncrier/TowncrierControls';

// Iko components
import Iko from './components/iko/Iko';
import IkoControl from './components/iko/IkoControls';

// Search components
import SearchControls from './components/search/SearchControls';

// Test component
import Test from './Test';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <NavigationWrapper>
            <div className='app_container'>
              <Routes>
                {/* 
                  LAYER 1: PUBLIC ROUTES - LANDING PAGE 
                */}
                <Route path="/" element={
                  <ProtectedRoute requireAuth={false}>
                    <LandingPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/login" element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } />
                
                <Route path="/signup" element={
                  <ProtectedRoute requireAuth={false}>
                    <Signup />
                  </ProtectedRoute>
                } />
                
                {/* Application process routes */}
                <Route path="/applicationsurvey" element={
                  <ProtectedRoute allowPending={true}>
                    <Applicationsurvey />
                  </ProtectedRoute>
                } />
                
                <Route path="/thankyou" element={
                  <ProtectedRoute allowPending={true}>
                    <Thankyou />
                  </ProtectedRoute>
                } />

                {/* 
                  LAYER 2: TOWNCRIER ROUTES 
                */}
                <Route path="/towncrier" element={
                  <ProtectedRoute allowPending={true}>
                    <Towncrier />
                  </ProtectedRoute>
                } />

                {/* 
                  LAYER 3: IKO ROUTES - MEMBER ACCESS
                */}
                <Route path="/iko" element={
                  <ProtectedRoute requireMember={true}>
                    <Iko />
                  </ProtectedRoute>
                }>
                  <Route index element={<Iko />} />
                  <Route path="content/:content_id" element={<Iko />} />
                  <Route path="teaching/:teaching_id" element={<Iko />} />
                  <Route path="chat/:chat_id" element={<Iko />} />
                </Route>

                {/* 
                  LAYER 4: ADMIN ROUTES 
                */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="content/:content_id" element={<Dashboard />} />
                  <Route path="towncrier" element={<Towncrier />} />
                  <Route path="towncriercontrols" element={<TowncrierControls />} />
                  <Route path="iko" element={<Iko />} />
                  <Route path="ikocontrols" element={<IkoControl />} />
                  <Route path="authcontrols" element={<AuthControl />} />
                  <Route path="searchcontrols" element={<SearchControls />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="usermanagement" element={<UserManagement />} />
                  <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
                </Route>
                
                {/* Test route */}
                <Route path="/test" element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </NavigationWrapper>
        </Router>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;


// // Updated App.jsx with Landing Page integration
// import './App.css';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// // Auth components
// import ProtectedRoute from './components/auth/ProtectedRoute';
// import AdminRoute from './components/auth/AdminRoute';
// import LandingPage from './components/auth/LandingPage'; // NEW
// import Signup from './components/auth/Signup';
// import Login from './components/auth/Login';
// import Applicationsurvey from './components/auth/Applicationsurvey';
// import AuthControl from './components/auth/AuthControls';
// import UserManagement from './components/auth/UserManagement';

// // Info components
// import Thankyou from './components/info/Thankyou';

// // Admin components
// import Admin from './components/admin/Admin';
// import Dashboard from './components/admin/Dashboard';
// import Reports from './components/admin/Reports';
// import AudienceClassMgr from './components/admin/AudienceClassMgr';

// // Towncrier components
// import Towncrier from './components/towncrier/Towncrier';
// import TowncrierControls from './components/towncrier/TowncrierControls';

// // Iko components
// import Iko from './components/iko/Iko';
// import IkoControl from './components/iko/IkoControls';

// // Search components
// import SearchControls from './components/search/SearchControls';

// // Test component
// import Test from './Test';

// // Create a client
// const queryClient = new QueryClient();

// function App() {
//    return (
//     <QueryClientProvider client={queryClient}>
//       <Router>
//         <div className='app_container'>
//           <Routes>
//             {/* Public routes - no authentication required */}
//             <Route path="/" element={
//               <ProtectedRoute requireAuth={false}>
//                 <LandingPage />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/login" element={
//               <ProtectedRoute requireAuth={false}>
//                 <Login />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/signup" element={
//               <ProtectedRoute requireAuth={false}>
//                 <Signup />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/applicationsurvey" element={<Applicationsurvey />} />
//             <Route path="/thankyou" element={<Thankyou />} />
            
//             {/* Public Towncrier route */}
//             <Route path="/towncrier" element={<Towncrier />} />
            
//             {/* Protected routes - authentication required */}
//             <Route path="/iko" element={
//               <ProtectedRoute>
//                 <Iko />
//               </ProtectedRoute>
//             }>
//               <Route index element={<Iko />} />
//               <Route path="content/:content_id" element={<Iko />} />
//               <Route path="teaching/:teaching_id" element={<Iko />} />
//               <Route path="chat/:chat_id" element={<Iko />} />
//             </Route>
            
//             {/* Admin routes - admin authentication required */}
//             <Route path="/admin" element={
//               <AdminRoute>
//                 <Admin />
//               </AdminRoute>
//             }>
//               <Route index element={<Dashboard />} />
//               <Route path="content/:content_id" element={<Dashboard />} />
//               <Route path="towncrier" element={<Towncrier />} />
//               <Route path="towncriercontrols" element={<TowncrierControls />} />
//               <Route path="iko" element={<Iko />} />
//               <Route path="ikocontrols" element={<IkoControl />} />
//               <Route path="authcontrols" element={<AuthControl />} />
//               <Route path="searchcontrols" element={<SearchControls />} />
//               <Route path="reports" element={<Reports />} />
//               <Route path="usermanagement" element={<UserManagement />} />
//               <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
//             </Route>
            
//             {/* Test route */}
//             <Route path="/test" element={<Test />} />
//           </Routes>
//         </div>
//       </Router>
//     </QueryClientProvider>
//   );
// }

// export default App;


// // File: src/App.jsx
// import './App.css';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// // Auth components
// import Signup from './components/auth/Signup';
// import Login from './components/auth/Login';
// import Applicationsurvey from './components/auth/Applicationsurvey';
// import AuthControl from './components/auth/AuthControls';
// import UserManagement from './components/auth/UserManagement';

// // Info components
// import Thankyou from './components/info/Thankyou';

// // Admin components (updated paths)
// import Admin from './components/admin/Admin';
// import Dashboard from './components/admin/Dashboard';
// import Reports from './components/admin/Reports';
// import AudienceClassMgr from './components/admin/AudienceClassMgr';

// // Towncrier components
// import Towncrier from './components/towncrier/Towncrier';
// import TowncrierControls from './components/towncrier/TowncrierControls';

// // Iko components
// import Iko from './components/iko/Iko';
// import IkoControl from './components/iko/IkoControls';

// // Search components
// import SearchControls from './components/search/SearchControls';

// // Test component
// import Test from './Test';

// // Create a client
// const queryClient = new QueryClient();

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <Router>
//         <div className='app_container'>
//           <Routes>
//             {/* Public routes */}
//             <Route path="/" element={<Towncrier />} />
            
//             {/* Iko routes with nested routing */}
//             <Route path="/iko" element={<Iko />}>
//               <Route index element={<Iko />} />
//               <Route path="teaching/:teaching_id" element={<Iko />} />
//               <Route path="chat/:chat_id" element={<Iko />} />
//             </Route>
            
//             {/* Admin routes with nested routing */}
//             <Route path="/admin" element={<Admin />}>
//               <Route index element={<Dashboard />} />
//               <Route path="towncrier" element={<Towncrier />} />
//               <Route path="towncriercontrols" element={<TowncrierControls />} />
//               <Route path="iko" element={<Iko />} />
//               <Route path="ikocontrols" element={<IkoControl />} />
//               <Route path="authcontrols" element={<AuthControl />} />
//               <Route path="searchcontrols" element={<SearchControls />} />
//               <Route path="reports" element={<Reports />} />
//               <Route path="usermanagement" element={<UserManagement />} />
//               <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
//             </Route>
            
//             {/* Auth routes */}
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<Signup />} />
//             <Route path="/applicationsurvey" element={<Applicationsurvey />} />
//             <Route path="/thankyou" element={<Thankyou />} />
//           </Routes>
//         </div>
//       </Router>
//     </QueryClientProvider>
//   );
// }

// export default App;


// import './App.css'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Signup from './components/auth/Signup';
// import Login from './components/auth/Login';
// import Thankyou from './components/info/Thankyou';
// import Applicationsurvey from './components/auth/Applicationsurvey';

// import Admin from './components/admin/Admin';
// import Dashboard from './components/admin/Dashboard';
// import Towncrier from './components/towncrier/Towncrier';
// import TowncrierControls from './components/towncrier/TowncrierControls';
// import Iko from './components/iko/Iko';
// import IkoControl from './components/iko/IkoControls';
// import AuthControl from './components/auth/AuthControls';
// import SearchControls from './components/search/SearchControls';
// import Reports from './components/admin/Reports';
// import UserManagement from './components/auth/UserManagement';
// import AudienceClassMgr from './components/admin/AudienceClassMgr';

// import Test from './Test';


// // Create a client
// const queryClient = new QueryClient();

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//     <Router>
//       <div className='app_container'>
//         <Routes>
//         <Route path="/" element={<Towncrier />} />


//         <Route path="/iko" element={<Iko />} > 
//           <Route index={true} element={<Iko />} />
//           <Route path='teaching/:teaching_id' element={<Iko />} />
//           <Route path='chat/:chat_id' element={<Iko />} />
//         </Route>

//           <Route path="/admin" element={<Admin />} >
//             <Route index={true} element={<Dashboard />} />
//             <Route path="towncrier" element={<Towncrier />} />
//             <Route path="towncriercontrols" element={<TowncrierControls />} />
//             <Route path="iko" element={<Iko />} />
//             <Route path="ikocontrols" element={<IkoControl />} />
//             <Route path="authcontrols" element={<AuthControl />} />
//             <Route path="searchcontrols" element={<SearchControls  />} />
//             <Route path="reports" element={<Reports />} />
//             <Route path="usermanagement" element={<UserManagement  />} />
//             <Route path="audienceclassmgr" element={<AudienceClassMgr  />} />
//           </Route>

//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/applicationsurvey" element={<Applicationsurvey />} />
//           <Route path="/thankyou" element={<Thankyou />} />
//           {/* </Route> */}
//         </Routes>
//       </div>
//     </Router>
//     </QueryClientProvider>
//   )
// }

// export default App