import React, { useState } from 'react';
import { Video, Calendar, Plus, LogIn, Menu, X } from 'lucide-react';

export default function LandingNav({
  isAuthenticated,
  user,
  displayName,
  logout,
  onNavigate,
  onOpenScheduleModal,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-icon">
          <Video size={18} />
        </div>
        <span className="brand-text">AURA.MEET</span>
      </div>

      <button
        className="mobile-nav-toggle"
        type="button"
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="landing-navigation-links"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <ul
        id="landing-navigation-links"
        className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <li><a href="#hero" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
        <li>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('/home');
            }}
            className="nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Meetings
          </button>
        </li>
        <li><a href="#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
        <li><a href="#security" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Security</a></li>
        <li><a href="#specs" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Specs</a></li>
      </ul>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <button
              className="btn-glass-pill"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={onOpenScheduleModal}
            >
              <Calendar size={14} />
              <span>Schedule</span>
            </button>

            <button
              className="btn-pill-primary"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={() => onNavigate('/home')}
            >
              <Plus size={14} />
              <span>New Meeting</span>
            </button>

            <div
              className="nav-user-badge"
              onClick={() => onNavigate('/profile')}
              title="View & Edit Profile"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || displayName || 'User'}`}
                alt={user?.name || 'User'}
                className="user-nav-avatar"
              />
              <span className="user-nav-name">{displayName}</span>
              <button
                className="user-nav-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                title="Sign Out"
              >
                <LogIn size={13} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              className="btn-glass-pill"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={() => onNavigate('/signin')}
            >
              <Plus size={14} />
              <span>New Meeting</span>
            </button>
            <button
              className="btn-white-pill"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={() => onNavigate('/signin')}
            >
              <span>Sign In</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
