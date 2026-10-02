import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, Plus, Calendar, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AuthModal from './AuthModal';
import ScheduleModal from './ScheduleModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, displayName } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleStartInstantMeeting = async () => {
    try {
      setIsCreating(true);
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Meeting`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        navigate(`/meet/${res.data.room.roomCode}`);
      }
    } catch (err) {
      alert(`Could not create meeting: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">
            <Video size={18} />
          </div>
          <span className="brand-text">AURA.MEET</span>
        </div>

        {isHome && (
          <ul className="nav-links">
            <li><a href="#hero" className="nav-link active">Home</a></li>
            <li><a href="#about" className="nav-link">About</a></li>
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#security" className="nav-link">Security</a></li>
            <li><a href="#specs" className="nav-link">Specs</a></li>
          </ul>
        )}

        <div className="nav-actions">
          <button
            className="btn-glass-pill"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => setScheduleModalOpen(true)}
            title="Schedule a future meeting"
          >
            <Calendar size={15} />
            <span>Schedule</span>
          </button>

          <button
            className="btn-pill-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            disabled={isCreating}
            onClick={handleStartInstantMeeting}
            title="Start an instant meeting now"
          >
            <Plus size={15} />
            <span>{isCreating ? 'Creating...' : 'New Meeting'}</span>
          </button>

          {isAuthenticated ? (
            <div className="nav-user-badge">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="user-nav-avatar"
              />
              <span className="user-nav-name">{user.name}</span>
              <button
                className="user-nav-logout-btn"
                onClick={logout}
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className="btn-glass-pill"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </>
  );
}
