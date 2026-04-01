import React from 'react';
import './Navbar.css';

const Navbar = ({ onNavigate }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">CV</span>
          <span className="logo-text">CVlyze</span>
        </div>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <button className="navbar-link" onClick={() => onNavigate('home')}>Home</button>
          </li>
          <li className="navbar-item">
            <button className="navbar-link" onClick={() => onNavigate('saved')}>Analysis</button>
          </li>
        </ul>
        <div className="navbar-actions">
          <button className="btn-signin">Sign in</button>
          <button className="btn-getstarted">Get Started</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
