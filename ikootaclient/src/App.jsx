import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Towncrier from './components/towncrier/Towncrier';
import Iko from './components/iko/Iko';

function App() {
  return (
    <Router>
      <div className='app_container'>
        <Routes>
          <Route path="/towncrier" element={<Towncrier />} />
          <Route path="/iko" element={<Iko />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App