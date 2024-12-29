import React, { useState } from 'react';
import './admin.css';

const Admin = () => {
  const [selectedItem, setSelectedItem] = useState('Towncrier');

  return (
    <div className='admin_container'>
      <div className="navbar">
        <div className="logo">
          <img src="./palmTree.png" alt="" />
          <p>IKOOTA</p>
          </div>
          <div className="nav_page_heading" >The Clarion Call Admin Page</div>
        <div className="nav_items">
          <div className="nav_item">Home</div>
          <div className="nav_item">About</div>
          <div className="nav_item">Contact</div>
          
        </div>
      </div>
      <div className="admin_viewport">
        <div className="admin_sidebar">
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Towncrier')}><p>Towncrier</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Iko')}><p>Iko</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Auth')}><p>Auth</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Search')}><p>Search</p></div>
        </div>
        
        <div className="admin_controls_body">
          {selectedItem === 'Towncrier' && <div className="admin_controls_header">Towncrier Management</div>}
          {selectedItem === 'Iko' && <div className="admin_controls_header">Iko Controls</div>}
          {selectedItem === 'Auth' && <div className="admin_controls_header">Authorization Controls</div>}
          {selectedItem === 'Search' && <div className="admin_controls_header">Search Controls</div>}
        </div>
      </div>
    </div>
  );
}

export default Admin;