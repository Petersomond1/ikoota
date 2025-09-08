// ikootaclient/src/App.jsx - UPDATED VERSION WITH NEW COMPONENT ROUTES
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Error boundary
import ErrorBoundary from './components/ErrorBoundary';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserProvider } from './components/auth/UserStatus';
import LandingPage from './components/auth/LandingPage';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Applicationsurvey from './components/auth/Applicationsurvey';
import AuthControl from './components/auth/AuthControls';
import UserManagement from './components/admin/UserManagement';

// ✅ Import IkoAuthWrapper instead of Iko directly
import IkoAuthWrapper from './components/iko/IkoAuthWrapper';

// Info components
import ApplicationThankyou from './components/info/ApplicationThankYou';
import SurveySubmitted from './components/info/SurveySubmitted';
import Pendverifyinfo from './components/info/Pendverifyinfo';
import Suspendedverifyinfo from './components/info/Suspendedverifyinfo';
import Approveverifyinfo from './components/info/Approveverifyinfo';
import Thankyou from './components/info/Thankyou';

// ✅ MEMBERSHIP COMPONENTS - Import the membership-related components
import FullMembershipSurvey from './components/membership/FullMembershipSurvey';
import FullMembershipInfo from './components/membership/FullMembershipInfo';
import FullMembershipSubmitted from './components/membership/FullMembershipSubmitted';
import FullMembershipDeclined from './components/membership/FullMembershipDeclined';

// Admin components
import Admin from './components/admin/Admin';
import Dashboard from './components/admin/Dashboard';
import Reports from './components/admin/Reports';
import AudienceClassMgr from './components/admin/AudienceClassMgr';
import FullMembershipReviewControls from './components/admin/FullMembershipReviewControls';

// ✅ NEW: Import the new admin components
import MembershipReviewControls from './components/admin/MembershipReviewControls';
import SurveyControls from './components/admin/SurveyControls';
import ConverseIdControls from './components/admin/ConverseIdControls';
import MentorshipControls from './components/admin/MentorshipControls';

// Towncrier components
import Towncrier from './components/towncrier/Towncrier';
import TowncrierControls from './components/towncrier/TowncrierControls';

// Iko components
import IkoControl from './components/iko/IkoControls';

// Search components
import SearchControls from './components/search/SearchControls';

// ✅ NEW: Import Class components
import ClassPreview from './components/classes/ClassPreview';
import ClassContentViewer from './components/classes/ClassContentViewer';
import ClassListPage from './components/classes/ClassListPage';
import MyClassesPage from './components/classes/MyClassesPage';

// Test component
// import Test from './Test';

// Import user dashboard component
import UserDashboard from './components/user/UserDashboard';

// Import user pages
import ProfilePage from './components/user/ProfilePage';
import HelpPage from './components/user/HelpPage';
import SettingsPage from './components/user/SettingsPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <Router>
            <div className='app_container'>
              <Routes>
                {/* 
                  ✅ LAYER 1: COMPLETELY PUBLIC ROUTES - NO PROTECTION
                  Open to all visitors without any authentication checks
                */}
                <Route path="/" element={
                  <ErrorBoundary>
                    <LandingPage />
                  </ErrorBoundary>
                } />
                
                {/* ✅ Public auth routes - also no protection needed */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* 
                  SIGNUP PROCESS ROUTES
                  Post-registration flow components
                */}
                <Route path="/application-thankyou" element={
                  <ProtectedRoute allowPending={true}>
                    <ApplicationThankyou />
                  </ProtectedRoute>
                } />
                
                <Route path="/applicationsurvey" element={
                  <ProtectedRoute allowPending={true}>
                    <Applicationsurvey />
                  </ProtectedRoute>
                } />
                
                <Route path="/survey-submitted" element={
                  <ProtectedRoute allowPending={true}>
                    <SurveySubmitted />
                  </ProtectedRoute>
                } />

                {/* 
                  ✅ APPLICATION STATUS ROUTES
                  Different status pages based on review outcome
                */}
                <Route path="/pending-verification" element={
                  <ProtectedRoute allowPending={true}>
                    <Pendverifyinfo />
                  </ProtectedRoute>
                } />
                
                {/* ✅ Application status route */}
                <Route path="/application-status" element={
                  <ProtectedRoute allowPending={true}>
                    <Pendverifyinfo />
                  </ProtectedRoute>
                } />
                
                <Route path="/suspended-verification" element={
                  <ProtectedRoute allowPending={true}>
                    <Suspendedverifyinfo />
                  </ProtectedRoute>
                } />
                
                <Route path="/approved-verification" element={
                  <ProtectedRoute requireMember={true}>
                    <Approveverifyinfo />
                  </ProtectedRoute>
                } />

                {/* Legacy thank you route */}
                <Route path="/thankyou" element={
                  <ProtectedRoute allowPending={true}>
                    <Thankyou />
                  </ProtectedRoute>
                } />

                {/* 
                  ✅ FIXED: MEMBERSHIP ROUTES - For pre-members to apply for full membership
                */}
                <Route path="/full-membership-info" element={
                  <ProtectedRoute requirePreMember={true}>
                    <FullMembershipInfo />
                  </ProtectedRoute>
                } />

                <Route path="/full-membership-application" element={
                  <ProtectedRoute requirePreMember={true}>
                    <FullMembershipSurvey />
                  </ProtectedRoute>
                } />

                <Route path="/full-membership-survey" element={
                  <ProtectedRoute requirePreMember={true}>
                    <FullMembershipSurvey />
                  </ProtectedRoute>
                } />

                <Route path="/full-membership-submitted" element={
                  <ProtectedRoute requirePreMember={true}>
                    <FullMembershipSubmitted />
                  </ProtectedRoute>
                } />

                <Route path="/full-membership-declined" element={
                  <ProtectedRoute requirePreMember={true}>
                    <FullMembershipDeclined />
                  </ProtectedRoute>
                } />

                {/* 
                  ✅ LAYER 2: TOWNCRIER ROUTES - STRICT SECURITY
                  ONLY for approved pre-members - NOT for applicants
                */}
                <Route path="/towncrier" element={
                  <ProtectedRoute requirePreMember={true}>
                    <Towncrier />
                  </ProtectedRoute>
                } />

                {/* 
                  ✅ ENHANCED: CLASS SYSTEM ROUTES - TWO-STAGE FLOW
                  Stage 1: Class Preview/Summary → Stage 2: Live Classroom
                */}
                
                {/* Classes routes with nested structure */}
                <Route path="/classes">
                  {/* Exact /classes route - Class listing */}
                  <Route index element={
                    <ProtectedRoute requirePreMember={true}>
                      <ClassListPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* My classes route */}
                  <Route path="my-classes" element={
                    <ProtectedRoute requirePreMember={true}>
                      <MyClassesPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* STAGE 1: Class Preview/Summary - Shows overview, description, "Enter Classroom" button */}
                  <Route path=":classId" element={
                    <ProtectedRoute requirePreMember={true}>
                      <ClassPreview />
                    </ProtectedRoute>
                  } />
                  
                  {/* STAGE 2: Live Classroom - The actual teaching hub with interactive content */}
                  <Route path=":classId/classroom" element={
                    <ProtectedRoute requirePreMember={true}>
                      <ClassContentViewer />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Backward compatibility route - redirects to new two-stage flow */}
                <Route path="/class/:classId" element={
                  <ProtectedRoute requirePreMember={true}>
                    <ClassPreview />
                  </ProtectedRoute>
                } />

                {/* User Dashboard routes - for personal dashboard view */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowPending={true}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Profile dashboard route - direct profile access */}
                <Route path="/dashboard/profile" element={
                  <ProtectedRoute allowPending={true}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Analytics dashboard route - direct analytics access */}
                <Route path="/dashboard/analytics" element={
                  <ProtectedRoute allowPending={true}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />

                {/* Route alias for backward compatibility */}
                <Route path="/member-dashboard" element={
                  <ProtectedRoute allowPending={true}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />

                {/* User Profile, Help, and Settings pages */}
                <Route path="/profile" element={
                  <ProtectedRoute allowPending={true}>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                
                <Route path="/help" element={
                  <ProtectedRoute allowPending={true}>
                    <HelpPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute allowPending={true}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                {/* 
                  ✅ LAYER 3: IKO ROUTES - CORRECTED
                  Simple route - IkoAuthWrapper handles all authorization internally
                */}
                <Route path="/iko" element={<IkoAuthWrapper />} />

                {/* 
                  LAYER 4: ADMIN ROUTES 
                  Only users with admin role privileges
                */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="content/:content_id" element={<Dashboard />} />
                  
                  {/* Admin can access and manage all areas */}
                  <Route path="towncrier" element={<Towncrier />} />
                  <Route path="towncriercontrols" element={<TowncrierControls />} />
                  
                  {/* ✅ Use IkoAuthWrapper in admin context */}
                  <Route path="iko" element={<IkoAuthWrapper isNested={true} />} />
                  <Route path="ikocontrols" element={<IkoControl />} />
                  
                  {/* Admin-specific management tools */}
                  <Route path="authcontrols" element={<AuthControl />} />
                  <Route path="searchcontrols" element={<SearchControls />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="usermanagement" element={<UserManagement />} />
                  <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
                  
                  {/* ✅ UPDATED: Membership Review Routes */}
                  <Route path="full-membership-review" element={<FullMembershipReviewControls />} />
                  <Route path="membership-review" element={<MembershipReviewControls />} />
                  
                  {/* ✅ NEW: Survey Controls Route */}
                  <Route path="survey-controls" element={<SurveyControls />} />
                  
                  {/* ✅ NEW: Converse ID Controls Route */}
                  <Route path="converseidcontrols" element={<ConverseIdControls />} />
                  
                  {/* ✅ NEW: Mentorship Controls Route */}
                  <Route path="mentorshipcontrols" element={<MentorshipControls />} />
                  
                  {/* ✅ ADMIN MEMBERSHIP MANAGEMENT ROUTES */}
                  <Route path="membership/info" element={<FullMembershipInfo />} />
                  <Route path="membership/applications" element={<FullMembershipSurvey />} />

                  {/* ✅ NEW: Admin access to ClassContentViewer */}
                  <Route path="classes/:classId" element={<ClassContentViewer />} />
                  <Route path="class/:classId" element={<ClassContentViewer />} />
                </Route>
                
                {/* Development/Test route */}
                {/* <Route path="/test" element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                } /> */}

                {/* ✅ CATCHALL: 404 fallback route */}
                <Route path="*" element={
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
                    <h2 style={{ color: '#666', margin: '10px 0' }}>Page Not Found</h2>
                    <p style={{ color: '#999', marginBottom: '20px' }}>
                      The page you're looking for doesn't exist.
                    </p>
                    <a 
                      href="/" 
                      style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Go to Home Page
                    </a>
                  </div>
                } />
              </Routes>
            </div>
          </Router>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;





// // ikootaclient/src/App.jsx - UPDATED VERSION WITH NEW COMPONENT ROUTES
// import './App.css';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// // Error boundary
// import ErrorBoundary from './components/ErrorBoundary';

// // Auth components
// import ProtectedRoute from './components/auth/ProtectedRoute';
// import { UserProvider } from './components/auth/UserStatus';
// import LandingPage from './components/auth/LandingPage';
// import Signup from './components/auth/Signup';
// import Login from './components/auth/Login';
// import Applicationsurvey from './components/auth/Applicationsurvey';
// import AuthControl from './components/auth/AuthControls';
// import UserManagement from './components/admin/UserManagement';

// // ✅ Import IkoAuthWrapper instead of Iko directly
// import IkoAuthWrapper from './components/iko/IkoAuthWrapper';

// // Info components
// import ApplicationThankyou from './components/info/ApplicationThankYou';
// import SurveySubmitted from './components/info/SurveySubmitted';
// import Pendverifyinfo from './components/info/Pendverifyinfo';
// import Suspendedverifyinfo from './components/info/Suspendedverifyinfo';
// import Approveverifyinfo from './components/info/Approveverifyinfo';
// import Thankyou from './components/info/Thankyou';

// // ✅ MEMBERSHIP COMPONENTS - Import the membership-related components
// import FullMembershipSurvey from './components/membership/FullMembershipSurvey';
// import FullMembershipInfo from './components/membership/FullMembershipInfo';
// import FullMembershipSubmitted from './components/membership/FullMembershipSubmitted';
// import FullMembershipDeclined from './components/membership/FullMembershipDeclined';

// // Admin components
// import Admin from './components/admin/Admin';
// import Dashboard from './components/admin/Dashboard';
// import Reports from './components/admin/Reports';
// import AudienceClassMgr from './components/admin/AudienceClassMgr';
// import FullMembershipReviewControls from './components/admin/FullMembershipReviewControls';

// // ✅ NEW: Import the new admin components
// import MembershipReviewControls from './components/admin/MembershipReviewControls';
// import SurveyControls from './components/admin/SurveyControls';

// // Towncrier components
// import Towncrier from './components/towncrier/Towncrier';
// import TowncrierControls from './components/towncrier/TowncrierControls';

// // Iko components
// import IkoControl from './components/iko/IkoControls';

// // Search components
// import SearchControls from './components/search/SearchControls';

// // Test component
// // import Test from './Test';

// // Import user dashboard component
// import UserDashboard from './components/user/UserDashboard';

// // Create a client
// const queryClient = new QueryClient();

// function App() {
//   return (
//     <ErrorBoundary>
//       <QueryClientProvider client={queryClient}>
//         <UserProvider>
//           <Router>
//             <div className='app_container'>
//               <Routes>
//                 {/* 
//                   ✅ LAYER 1: COMPLETELY PUBLIC ROUTES - NO PROTECTION
//                   Open to all visitors without any authentication checks
//                 */}
//                 <Route path="/" element={
//                   <ErrorBoundary>
//                     <LandingPage />
//                   </ErrorBoundary>
//                 } />
                
//                 {/* ✅ Public auth routes - also no protection needed */}
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/signup" element={<Signup />} />

//                 {/* 
//                   SIGNUP PROCESS ROUTES
//                   Post-registration flow components
//                 */}
//                 <Route path="/application-thankyou" element={
//                   <ProtectedRoute allowPending={true}>
//                     <ApplicationThankyou />
//                   </ProtectedRoute>
//                 } />
                
//                 <Route path="/applicationsurvey" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Applicationsurvey />
//                   </ProtectedRoute>
//                 } />
                
//                 <Route path="/survey-submitted" element={
//                   <ProtectedRoute allowPending={true}>
//                     <SurveySubmitted />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ APPLICATION STATUS ROUTES
//                   Different status pages based on review outcome
//                 */}
//                 <Route path="/pending-verification" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Pendverifyinfo />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* ✅ Application status route */}
//                 <Route path="/application-status" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Pendverifyinfo />
//                   </ProtectedRoute>
//                 } />
                
//                 <Route path="/suspended-verification" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Suspendedverifyinfo />
//                   </ProtectedRoute>
//                 } />
                
//                 <Route path="/approved-verification" element={
//                   <ProtectedRoute requireMember={true}>
//                     <Approveverifyinfo />
//                   </ProtectedRoute>
//                 } />

//                 {/* Legacy thank you route */}
//                 <Route path="/thankyou" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Thankyou />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ FIXED: MEMBERSHIP ROUTES - For pre-members to apply for full membership
//                 */}
//                 <Route path="/full-membership-info" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipInfo />
//                   </ProtectedRoute>
//                 } />

//                 <Route path="/full-membership-application" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipSurvey />
//                   </ProtectedRoute>
//                 } />

//                 <Route path="/full-membership-survey" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipSurvey />
//                   </ProtectedRoute>
//                 } />

//                 <Route path="/full-membership-submitted" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipSubmitted />
//                   </ProtectedRoute>
//                 } />

//                 <Route path="/full-membership-declined" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipDeclined />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 2: TOWNCRIER ROUTES - STRICT SECURITY
//                   ONLY for approved pre-members - NOT for applicants
//                 */}
//                 <Route path="/towncrier" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <Towncrier />
//                   </ProtectedRoute>
//                 } />

//                 {/* User Dashboard route - for personal dashboard view */}
//                 <Route path="/dashboard" element={
//                   <ProtectedRoute allowPending={true}>
//                     <UserDashboard />
//                   </ProtectedRoute>
//                 } />

//                 {/* Route alias for backward compatibility */}
//                 <Route path="/member-dashboard" element={
//                   <ProtectedRoute allowPending={true}>
//                     <UserDashboard />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 3: IKO ROUTES - CORRECTED
//                   Simple route - IkoAuthWrapper handles all authorization internally
//                 */}
//                 <Route path="/iko" element={<IkoAuthWrapper />} />

//                 {/* 
//                   LAYER 4: ADMIN ROUTES 
//                   Only users with admin role privileges
//                 */}
//                 <Route path="/admin" element={
//                   <ProtectedRoute requireAdmin={true}>
//                     <Admin />
//                   </ProtectedRoute>
//                 }>
//                   <Route index element={<Dashboard />} />
//                   <Route path="content/:content_id" element={<Dashboard />} />
                  
//                   {/* Admin can access and manage all areas */}
//                   <Route path="towncrier" element={<Towncrier />} />
//                   <Route path="towncriercontrols" element={<TowncrierControls />} />
                  
//                   {/* ✅ Use IkoAuthWrapper in admin context */}
//                   <Route path="iko" element={<IkoAuthWrapper isNested={true} />} />
//                   <Route path="ikocontrols" element={<IkoControl />} />
                  
//                   {/* Admin-specific management tools */}
//                   <Route path="authcontrols" element={<AuthControl />} />
//                   <Route path="searchcontrols" element={<SearchControls />} />
//                   <Route path="reports" element={<Reports />} />
//                   <Route path="usermanagement" element={<UserManagement />} />
//                   <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
                  
//                   {/* ✅ UPDATED: Membership Review Routes */}
//                   <Route path="full-membership-review" element={<FullMembershipReviewControls />} />
//                   <Route path="membership-review" element={<MembershipReviewControls />} />
                  
//                   {/* ✅ NEW: Survey Controls Route */}
//                   <Route path="survey-controls" element={<SurveyControls />} />
                  
//                   {/* ✅ ADMIN MEMBERSHIP MANAGEMENT ROUTES */}
//                   <Route path="membership/info" element={<FullMembershipInfo />} />
//                   <Route path="membership/applications" element={<FullMembershipSurvey />} />
//                 </Route>
                
//                 {/* Development/Test route */}
//                 {/* <Route path="/test" element={
//                   <ProtectedRoute>
//                     <Test />
//                   </ProtectedRoute>
//                 } /> */}

//                 {/* ✅ CATCHALL: 404 fallback route */}
//                 <Route path="*" element={
//                   <div style={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     minHeight: '100vh',
//                     textAlign: 'center',
//                     padding: '20px'
//                   }}>
//                     <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
//                     <h2 style={{ color: '#666', margin: '10px 0' }}>Page Not Found</h2>
//                     <p style={{ color: '#999', marginBottom: '20px' }}>
//                       The page you're looking for doesn't exist.
//                     </p>
//                     <a 
//                       href="/" 
//                       style={{
//                         background: '#667eea',
//                         color: 'white',
//                         padding: '12px 24px',
//                         borderRadius: '8px',
//                         textDecoration: 'none',
//                         fontWeight: '600'
//                       }}
//                     >
//                       Go to Home Page
//                     </a>
//                   </div>
//                 } />
//               </Routes>
//             </div>
//           </Router>
//         </UserProvider>
//       </QueryClientProvider>
//     </ErrorBoundary>
//   );
// }

// export default App;



