// Main Component: Admin.jsx
import React, { useState } from 'react';
import './admin.css';
import Towncrier from '../towncrier/Towncrier';
import TowncrierControls from '../towncrier/TowncrierControls';
import Iko from '../iko/Iko';
import IkoControls from '../iko/IkoControls';
import AuthControls from '../auth/AuthControls';
import SearchControls from '../search/SearchControls';
import Dashboard from './Dashboard';
import Reports from './Reports';
import UserManagement from '../auth/UserManagement';
import AudienceClassMgr from './AudienceClassMgr';

const Admin = () => {
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  return (
    <div className='admin_container'>
      <div className="navbar">
        <div className="logo">
          <img src="./palmTree.png" alt="Logo" />
          <p>IKOOTA</p>
        </div>
        <div className="nav_page_heading"> 
         <div style={{fontSize: '2rem'}}>-IKO O'Ta umu'Elde</div>
         <div>The Clarion Call TownCriers: for the Synergy, Strategy and Rebuilding of 'The land of the Gods'</div>
          </div>
        <div className="nav_items">
          <div className="nav_item">Home</div>
          <div className="nav_item">About</div>
          <div className="nav_item">Contact</div>
        </div>
      </div>

      <div className="admin_viewport">
        <div className="admin_sidebar">
        <div className="admin_sidebar_item" onClick={() => setSelectedItem('Dashboard')}><p>Dashboard</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Towncrier')}><p>Towncrier</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('TowncrierControls')}>Towncrier Controls</div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Iko')}><p>Iko</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('IkoControls')}>Iko Controls</div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('AuthControls')}><p>AuthControls</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('SearchControls')}><p>SearchControls</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Reports')}><p>Reports</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('UserManagement')}><p>UserManagement</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('AudienceClassMgr')}><p>AudienceClassMgr</p></div>
        </div>

        <div className="admin_controls_body">
          {selectedItem === 'Dashboard' && <Dashboard />}
          {selectedItem === 'Towncrier' && <Towncrier />}
          {selectedItem === 'TowncrierControls' && <TowncrierControls />}
          {selectedItem === 'Iko' && <Iko isNested />}
          {selectedItem === 'IkoControls' && <IkoControls />}
          {selectedItem === 'AuthControls' && <AuthControls />}
          {selectedItem === 'SearchControls' && <SearchControls />}
          {selectedItem === 'Reports' && <Reports />}
          {selectedItem === 'UserManagement' && <UserManagement />}
          {selectedItem === 'AudienceClassMgr' && <AudienceClassMgr />}
        </div>
      </div>
    </div>
  );
};

export default Admin;


