import React from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
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
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-signin">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-getstarted">Get Started</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: 'navbar-user-avatar' } }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
