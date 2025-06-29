// Main Component: Admin.jsx
import React, { useState } from 'react';
import './admin.css'
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from "react-router-dom";

const Admin = () => {
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  return (
    <div className='adminContainer'>

      <div className='adminSidebar' >
        <Sidebar />
      </div>

      <div className='headerContent'>
        <div  className='adminNav'>
          <Navbar />
        </div>  
        <div  className="mainCOntent" >
          <Outlet />
        </div>
      </div>

      

    </div>
  );
};

export default Admin;


