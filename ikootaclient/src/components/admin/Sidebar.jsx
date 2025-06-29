import React from 'react'
import { Link } from 'react-router-dom'
import './sidbar.css'

const Sidebar = () => {
  return (
        <div className="admin_sidebar">
          <Link to="" className="admin_sidebar_item">Dashboard</Link>
          <Link to="towncrier" className="admin_sidebar_item">Towncrier</Link>
          <Link to="towncriercontrols" className="admin_sidebar_item">Towncrier Controls</Link>
          <Link to="iko" className="admin_sidebar_item">Iko</Link>
          <Link to="ikocontrols" className="admin_sidebar_item">Iko Controls</Link>
          <Link to="authcontrols" className="admin_sidebar_item">AuthControls</Link>
          <Link to="searchcontrols" className="admin_sidebar_item">SearchControls</Link>
          <Link to="reports" className="admin_sidebar_item">Reports</Link>
          <Link to="usermanagement" className="admin_sidebar_item">UserManagement</Link>
          <Link to="audienceclassmgr" className="admin_sidebar_item">AudienceClassMgr</Link>
        </div>
    
  )
}

export default Sidebar