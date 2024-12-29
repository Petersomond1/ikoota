import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Towncrier from './components/towncrier/Towncrier';
import Iko from './components/iko/Iko';
import Admin from './components/admin/Admin';

function App() {
  return (
    <Router>
      <div className='app_container'>
        <Routes>
          <Route path="/towncrier" element={<Towncrier />} />
          <Route path="/iko" element={<Iko />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App