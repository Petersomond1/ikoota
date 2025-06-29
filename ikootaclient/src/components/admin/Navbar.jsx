import React from 'react'
import './navbar.css'

const Navbar = () => {
  return (
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
  )
}

export default Navbar