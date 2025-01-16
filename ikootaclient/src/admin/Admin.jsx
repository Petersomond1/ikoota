// Main Component: Admin.jsx
import React, { useState } from 'react';
import './styles/admin.css'
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
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


