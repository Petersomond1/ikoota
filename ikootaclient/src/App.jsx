import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Thankyou from './components/info/Thankyou';
import Applicationsurvey from './components/auth/Applicationsurvey';

import Admin from './admin/Admin';
import Dashboard from './components/admin/Dashboard';
import Towncrier from './components/towncrier/Towncrier';
import TowncrierControls from './components/towncrier/TowncrierControls';
import Iko from './components/iko/Iko';
import IkoControl from './components/iko/IkoControls';
import AuthControl from './components/auth/AuthControls';
import SearchControls from './components/search/SearchControls';
import Reports from './components/admin/Reports';
import UserManagement from './components/auth/UserManagement';
import AudienceClassMgr from './components/admin/AudienceClassMgr';

import Test from './Test';


// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <div className='app_container'>
        <Routes>
        <Route path="/" element={<Towncrier />} />


        <Route path="/iko" element={<Iko />} /> 
          {/* <Route index={true} element={<Iko />} />
          <Route path='teaching/:teaching_id' element={<Iko />} />
          <Route path='chat/:chat_id' element={<Iko />} />
        </Route> */}

          <Route path="/admin" element={<Admin />} >
            <Route index={true} element={<Dashboard />} />
            <Route path="towncrier" element={<Towncrier />} />
            <Route path="towncriercontrols" element={<TowncrierControls />} />
            <Route path="iko" element={<Iko />} />
            <Route path="ikocontrols" element={<IkoControl />} />
            <Route path="authcontrols" element={<AuthControl />} />
            <Route path="searchcontrols" element={<SearchControls  />} />
            <Route path="reports" element={<Reports />} />
            <Route path="usermanagement" element={<UserManagement  />} />
            <Route path="audienceclassmgr" element={<AudienceClassMgr  />} />
          </Route>

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/applicationsurvey" element={<Applicationsurvey />} />
          <Route path="/thankyou" element={<Thankyou />} />
        </Routes>
      </div>
    </Router>
    </QueryClientProvider>
  )
}

export default App