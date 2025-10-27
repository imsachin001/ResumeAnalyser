import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">CV</span>
          <span className="logo-text">CVlyze</span>
        </div>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <a href="#home" className="navbar-link">Home</a>
          </li>
          <li className="navbar-item">
            <a href="#analysis" className="navbar-link">Analysis</a>
          </li>
          <li className="navbar-item">
            <a href="#other" className="navbar-link">Other</a>
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
