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

