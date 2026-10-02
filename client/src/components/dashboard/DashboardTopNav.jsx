import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  Keyboard,
  Plus,
  Zap,
  Link as LinkIcon,
  Calendar,
  HelpCircle,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';

export default function DashboardTopNav({
  displayName,
  user,
  logout,
  codeOrLink,
  setCodeOrLink,
  onJoinByCode,
  newMenuOpen,
  setNewMenuOpen,
  onStartInstantMeeting,
  onCreateMeetingForLater,
  onOpenScheduleModal,
  onOpenSafetyModal,
}) {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setNewMenuOpen]);

  return (
    <header className="dashboard-topbar">
      {/* Left: Brand Logo */}
      <div className="topbar-left-section">
        <Link to="/" className="dashboard-brand-link">
          <div className="brand-icon" style={{ width: 32, height: 32 }}>
            <Video size={18} />
          </div>
          <span className="dashboard-brand-title">AURA Meet</span>
        </Link>
      </div>

      {/* Center: Search / Enter Code & New Meeting */}
      <div className="topbar-center-section">
        <form onSubmit={onJoinByCode} className="quick-code-form">
          <Keyboard size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <input
            type="text"
            placeholder="Enter a code or link"
            className="quick-code-input"
            value={codeOrLink}
            onChange={(e) => setCodeOrLink(e.target.value)}
          />
          <button
            type="submit"
            disabled={!codeOrLink.trim()}
            className={`quick-code-btn ${codeOrLink.trim() ? 'active' : ''}`}
          >
            Join
          </button>
        </form>

        {/* "+ New" Dropdown Button */}
        <div className="new-meeting-dropdown-wrapper" ref={menuRef}>
          <button
            className="btn-new-meeting"
            onClick={() => setNewMenuOpen(!newMenuOpen)}
          >
            <Plus size={16} />
            <span>New</span>
          </button>

          {newMenuOpen && (
            <div className="new-meeting-menu">
              <button
                className="menu-item-action"
                onClick={onStartInstantMeeting}
              >
                <Zap size={16} className="menu-item-icon" />
                <div>
                  <div style={{ fontWeight: 600 }}>Start an instant meeting</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Jump directly into video call
                  </div>
                </div>
              </button>

              <button
                className="menu-item-action"
                onClick={onCreateMeetingForLater}
              >
                <LinkIcon size={16} className="menu-item-icon" />
                <div>
                  <div style={{ fontWeight: 600 }}>Create a meeting for later</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Get a link you can share
                  </div>
                </div>
              </button>

              <button
                className="menu-item-action"
                onClick={() => {
                  setNewMenuOpen(false);
                  onOpenScheduleModal();
                }}
              >
                <Calendar size={16} className="menu-item-icon" />
                <div>
                  <div style={{ fontWeight: 600 }}>Schedule in Calendar</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Set topic, date, and time
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="topbar-right-section">
        <button
          className="icon-round-btn"
          title="Safety & Security info"
          onClick={onOpenSafetyModal}
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="icon-round-btn"
          title="Settings"
          onClick={() => alert('Settings: Audio, Video & Gemini AI are configured and active.')}
        >
          <Settings size={18} />
        </button>

        <div
          className="upgrade-pill-tag"
          onClick={() => alert('You are enjoying AURA Meet Pro with Real-time WebRTC Mesh & Gemini AI.')}
        >
          <Sparkles size={13} />
          <span>Pro</span>
        </div>

        <div
          className="nav-user-badge"
          onClick={() => navigate('/profile')}
          title="View & Edit Profile"
        >
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || displayName || 'User'}`
            }
            alt="Avatar"
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
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
