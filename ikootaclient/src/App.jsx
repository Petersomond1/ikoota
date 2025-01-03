import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Towncrier from './components/towncrier/Towncrier';
import Iko from './components/iko/Iko';
import Admin from './components/admin/Admin';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Applicationsurvey from './components/auth/Applicationsurvey';


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
          <Route path="/admin" element={<Admin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/applicationsurvey" element={<Applicationsurvey />} />
        </Routes>
      </div>
    </Router>
    </QueryClientProvider>
  )
}

export default App