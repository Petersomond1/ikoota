// ikootaclient/src/App.jsx - CORRECTED VERSION WITH PROPER ERROR BOUNDARY
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

// Admin components
import Admin from './components/admin/Admin';
import Dashboard from './components/admin/Dashboard';
import Reports from './components/admin/Reports';
import AudienceClassMgr from './components/admin/AudienceClassMgr';

// Towncrier components
import Towncrier from './components/towncrier/Towncrier';
import TowncrierControls from './components/towncrier/TowncrierControls';

// Iko components
import IkoControl from './components/iko/IkoControls';

// Search components
import SearchControls from './components/search/SearchControls';

// Test component
import Test from './Test';

// Import user dashboard component
import UserDashboard from './components/user/UserDashboard';

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
                  ✅ LAYER 2: TOWNCRIER ROUTES - STRICT SECURITY
                  ONLY for approved pre-members - NOT for applicants
                */}
                <Route path="/towncrier" element={
                  <ProtectedRoute requirePreMember={true}>
                    <Towncrier />
                  </ProtectedRoute>
                } />

                {/* User Dashboard route - for personal dashboard view */}
                <Route path="/dashboard" element={
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
                </Route>
                
                {/* Development/Test route */}
                <Route path="/test" element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                } />

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






// // ikootaclient/src/App.jsx - ENHANCED WITH FULL MEMBERSHIP ROUTES
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

// // Iko components
// import IkoAuthWrapper from './components/iko/IkoAuthWrapper';

// // Info components
// import ApplicationThankyou from './components/info/ApplicationThankYou';
// import SurveySubmitted from './components/info/SurveySubmitted';
// import Pendverifyinfo from './components/info/Pendverifyinfo';
// import Suspendedverifyinfo from './components/info/Suspendedverifyinfo';
// import Approveverifyinfo from './components/info/Approveverifyinfo';
// import Thankyou from './components/info/Thankyou';

// // ✅ NEW: Full Membership Components
// import FullMembershipInfo from './components/membership/FullMembershipInfo';
// import FullMembershipSurvey from './components/membership/FullMembershipSurvey';
// import FullMembershipSubmitted from './components/membership/FullMembershipSubmitted';
// import FullMembershipApproved from './components/membership/FullMembershipApproved';
// import FullMembershipPending from './components/membership/FullMembershipPending';
// import FullMembershipDeclined from './components/membership/FullMembershipDeclined';

// // Admin components
// import Admin from './components/admin/Admin';
// import Dashboard from './components/admin/Dashboard';
// import Reports from './components/admin/Reports';
// import AudienceClassMgr from './components/admin/AudienceClassMgr';

// // Towncrier components
// import Towncrier from './components/towncrier/Towncrier';
// import TowncrierControls from './components/towncrier/TowncrierControls';

// // Iko components
// import IkoControl from './components/iko/IkoControls';

// // Search components
// import SearchControls from './components/search/SearchControls';

// // Test component
// import Test from './Test';

// // User dashboard component
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
//                 */}
//                 <Route path="/" element={
//                   <ErrorBoundary>
//                     <LandingPage />
//                   </ErrorBoundary>
//                 } />
                
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/signup" element={<Signup />} />

//                 {/* 
//                   SIGNUP PROCESS ROUTES
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
//                 */}
//                 <Route path="/pending-verification" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Pendverifyinfo />
//                   </ProtectedRoute>
//                 } />
                
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

//                 <Route path="/thankyou" element={
//                   <ProtectedRoute allowPending={true}>
//                     <Thankyou />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ NEW: FULL MEMBERSHIP ROUTES
//                   Organized by user journey flow
//                 */}
                
//                 {/* Full Membership Information (Pre-members only) */}
//                 <Route path="/full-membership/info" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipInfo />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Full Membership Application Form (Pre-members who haven't applied) */}
//                 <Route path="/full-membership/apply" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipSurvey />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Application Submitted Confirmation */}
//                 <Route path="/full-membership/submitted" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipSubmitted />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Application Status Check (For pending applications) */}
//                 <Route path="/full-membership/pending" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipPending />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Application Status Check (Generic) */}
//                 <Route path="/full-membership/status" element={
//                   <ProtectedRoute allowPending={true}>
//                     <FullMembershipPending />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Application Approved */}
//                 <Route path="/full-membership/approved" element={
//                   <ProtectedRoute requireMember={true}>
//                     <FullMembershipApproved />
//                   </ProtectedRoute>
//                 } />
                
//                 {/* Application Declined */}
//                 <Route path="/full-membership/declined" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <FullMembershipDeclined />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 2: TOWNCRIER ROUTES - PRE-MEMBER ACCESS
//                 */}
//                 <Route path="/towncrier" element={
//                   <ProtectedRoute requirePreMember={true}>
//                     <Towncrier />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 3: USER DASHBOARD - AUTHENTICATED USERS
//                 */}
//                 <Route path="/dashboard" element={
//                   <ProtectedRoute allowPending={true}>
//                     <UserDashboard />
//                   </ProtectedRoute>
//                 } />

//                 <Route path="/member-dashboard" element={
//                   <ProtectedRoute allowPending={true}>
//                     <UserDashboard />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 4: IKO ROUTES - FULL MEMBERS ONLY
//                 */}
//                 <Route path="/iko" element={
//                   <ProtectedRoute requireFullMember={true}>
//                     <IkoAuthWrapper />
//                   </ProtectedRoute>
//                 } />

//                 {/* 
//                   ✅ LAYER 5: ADMIN ROUTES - ADMIN ACCESS ONLY
//                 */}
//                 <Route path="/admin" element={
//                   <ProtectedRoute requireAdmin={true}>
//                     <Admin />
//                   </ProtectedRoute>
//                 }>
//                   <Route index element={<Dashboard />} />
//                   <Route path="content/:content_id" element={<Dashboard />} />
                  
//                   {/* Admin can access all areas */}
//                   <Route path="towncrier" element={<Towncrier />} />
//                   <Route path="towncriercontrols" element={<TowncrierControls />} />
                  
//                   {/* Iko management for admins */}
//                   <Route path="iko" element={<IkoAuthWrapper isNested={true} />} />
//                   <Route path="ikocontrols" element={<IkoControl />} />
                  
//                   {/* ✅ NEW: Full Membership Management Routes */}
//                   <Route path="full-membership" element={<UserManagement activeTab="full_membership_pending" />} />
//                   <Route path="full-membership/pending" element={<UserManagement activeTab="full_membership_pending" />} />
//                   <Route path="full-membership/overview" element={<UserManagement activeTab="full_membership_overview" />} />
                  
//                   {/* Standard admin tools */}
//                   <Route path="authcontrols" element={<AuthControl />} />
//                   <Route path="searchcontrols" element={<SearchControls />} />
//                   <Route path="reports" element={<Reports />} />
//                   <Route path="usermanagement" element={<UserManagement />} />
//                   <Route path="audienceclassmgr" element={<AudienceClassMgr />} />
//                 </Route>
                
//                 {/* Development/Test route */}
//                 <Route path="/test" element={
//                   <ProtectedRoute>
//                     <Test />
//                   </ProtectedRoute>
//                 } />

//                 {/* ✅ ENHANCED: 404 fallback with better UX */}
//                 <Route path="*" element={
//                   <div style={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     minHeight: '100vh',
//                     textAlign: 'center',
//                     padding: '20px',
//                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                     color: 'white'
//                   }}>
//                     <h1 style={{ fontSize: '4rem', margin: '0', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>404</h1>
//                     <h2 style={{ color: '#f8f9ff', margin: '10px 0', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>Page Not Found</h2>
//                     <p style={{ color: '#e2e8f0', marginBottom: '30px', fontSize: '1.1rem' }}>
//                       The page you're looking for doesn't exist.
//                     </p>
                    
//                     <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
//                       <a 
//                         href="/" 
//                         style={{
//                           background: 'rgba(255,255,255,0.2)',
//                           color: 'white',
//                           padding: '12px 24px',
//                           borderRadius: '8px',
//                           textDecoration: 'none',
//                           fontWeight: '600',
//                           backdropFilter: 'blur(10px)',
//                           border: '1px solid rgba(255,255,255,0.3)',
//                           transition: 'all 0.3s ease'
//                         }}
//                         onMouseOver={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.3)';
//                           e.target.style.transform = 'translateY(-2px)';
//                         }}
//                         onMouseOut={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.2)';
//                           e.target.style.transform = 'translateY(0)';
//                         }}
//                       >
//                         🏠 Go Home
//                       </a>
                      
//                       <a 
//                         href="/dashboard" 
//                         style={{
//                           background: 'rgba(255,255,255,0.2)',
//                           color: 'white',
//                           padding: '12px 24px',
//                           borderRadius: '8px',
//                           textDecoration: 'none',
//                           fontWeight: '600',
//                           backdropFilter: 'blur(10px)',
//                           border: '1px solid rgba(255,255,255,0.3)',
//                           transition: 'all 0.3s ease'
//                         }}
//                         onMouseOver={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.3)';
//                           e.target.style.transform = 'translateY(-2px)';
//                         }}
//                         onMouseOut={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.2)';
//                           e.target.style.transform = 'translateY(0)';
//                         }}
//                       >
//                         📊 Dashboard
//                       </a>
                      
//                       <a 
//                         href="/towncrier" 
//                         style={{
//                           background: 'rgba(255,255,255,0.2)',
//                           color: 'white',
//                           padding: '12px 24px',
//                           borderRadius: '8px',
//                           textDecoration: 'none',
//                           fontWeight: '600',
//                           backdropFilter: 'blur(10px)',
//                           border: '1px solid rgba(255,255,255,0.3)',
//                           transition: 'all 0.3s ease'
//                         }}
//                         onMouseOver={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.3)';
//                           e.target.style.transform = 'translateY(-2px)';
//                         }}
//                         onMouseOut={(e) => {
//                           e.target.style.background = 'rgba(255,255,255,0.2)';
//                           e.target.style.transform = 'translateY(0)';
//                         }}
//                       >
//                         📚 Content
//                       </a>
//                     </div>

//                     <div style={{ marginTop: '40px', opacity: '0.8' }}>
//                       <small>Having trouble? Contact support@ikoota.com</small>
//                     </div>
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
