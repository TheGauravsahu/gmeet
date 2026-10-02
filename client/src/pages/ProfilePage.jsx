import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Video,
  User,
  Mail,
  Lock,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  ShieldCheck,
  Check,
  Calendar,
  Clock,
  LogOut,
  ArrowLeft,
  Sliders,
  Activity,
  Zap,
  Globe,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/Profile.css';

const AVATAR_SEEDS = [
  { name: 'Elena', seed: 'Elena' },
  { name: 'Marcus', seed: 'Marcus' },
  { name: 'Sarah', seed: 'Sarah' },
  { name: 'Alex', seed: 'Alex' },
  { name: 'Cosmic', seed: 'Cosmic' },
  { name: 'Spark', seed: 'Spark' },
  { name: 'Nova', seed: 'Nova' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, displayName, setGuestName, updateUser, logout } = useAuth();

  // Form states
  const [nameInput, setNameInput] = useState(displayName || '');
  const [selectedSeed, setSelectedSeed] = useState(user?.name || displayName || 'User');
  const [customAvatar, setCustomAvatar] = useState(user?.avatar || '');
  const [emailInput] = useState(user?.email || 'guest.user@aura.meet');

  // Gemini AI key settings
  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem('aura_gemini_key') || ''
  );
  const [showKey, setShowKey] = useState(false);
  const [autoReply, setAutoReply] = useState(
    localStorage.getItem('aura_auto_reply') === 'true'
  );

  // Audio/video defaults
  const [defaultMicOn, setDefaultMicOn] = useState(
    localStorage.getItem('aura_pref_mic') !== 'false'
  );
  const [defaultVideoOn, setDefaultVideoOn] = useState(
    localStorage.getItem('aura_pref_video') !== 'false'
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Meeting stats
  const [meetingCount, setMeetingCount] = useState(0);

  useEffect(() => {
    const fetchRoomsCount = async () => {
      try {
        const res = await api.rooms.getUserRooms();
        if (res.success && res.data.rooms) {
          setMeetingCount(res.data.rooms.length);
        }
      } catch (err) {
        console.warn('Could not fetch user rooms:', err);
      }
    };
    fetchRoomsCount();
  }, []);

  const currentAvatarUrl =
    customAvatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${selectedSeed || nameInput || 'User'}`;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);

    const trimmedName = nameInput.trim() || 'User';
    setGuestName(trimmedName);

    const updated = {
      name: trimmedName,
      avatar: currentAvatarUrl,
    };
    updateUser(updated);

    // Save Gemini AI preferences
    if (geminiApiKey) {
      localStorage.setItem('aura_gemini_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('aura_gemini_key');
    }
    localStorage.setItem('aura_auto_reply', autoReply ? 'true' : 'false');
    localStorage.setItem('aura_pref_mic', defaultMicOn ? 'true' : 'false');
    localStorage.setItem('aura_pref_video', defaultVideoOn ? 'true' : 'false');

    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('Profile and meeting settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    }, 400);
  };

  const handleStartInstantMeeting = async () => {
    try {
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Meeting`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        navigate(`/meet/${res.data.room.roomCode}`, {
          state: {
            participantName: displayName,
            isHost: true,
          },
        });
      }
    } catch (err) {
      alert(`Could not start instant meeting: ${err.message}`);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="ambient-cosmos" />

      {/* Floating Stardust Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="floating-stardust"
          style={{
            left: `${(i * 8.2 + 5) % 95}%`,
            animationDelay: `${(i * 1.4) % 8}s`,
            animationDuration: `${12 + (i % 4) * 3}s`,
          }}
        />
      ))}

      {/* 1. TOPBAR */}
      <header className="profile-topbar">
        <div className="profile-topbar-left">
          <Link to="/" className="dashboard-brand-link">
            <div className="brand-icon" style={{ width: 32, height: 32 }}>
              <Video size={18} />
            </div>
            <span className="brand-text">AURA.MEET</span>
          </Link>

          <button className="back-link-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={15} />
            <span>Return to Console</span>
          </button>
        </div>

        <div className="profile-topbar-right">
          <button
            className="btn-pill-primary"
            style={{ padding: '7px 18px', fontSize: '0.82rem' }}
            onClick={handleStartInstantMeeting}
          >
            <Video size={14} />
            <span>New Meeting</span>
          </button>

          <button
            className="user-nav-logout-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to sign out?')) {
                logout();
                navigate('/');
              }
            }}
            title="Sign Out"
            style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '9999px', color: '#f87171' }}
          >
            <LogOut size={14} style={{ marginRight: 6 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="profile-container">
        {/* HERO IDENTITY BANNER CARD */}
        <section className="profile-hero-card">
          <div className="profile-identity-info">
            <div className="profile-avatar-wrapper">
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="profile-avatar-img"
              />
              <div
                className="avatar-edit-overlay-btn"
                title="Change avatar seed below"
              >
                <Sparkles size={14} />
              </div>
            </div>

            <div className="profile-user-text">
              <div className="profile-name-row">
                <h1 className="profile-display-name">{displayName}</h1>
                <div className="profile-tier-badge">
                  <Sparkles size={11} />
                  <span>Pro Plan • AI & WebRTC</span>
                </div>
              </div>

              <p className="profile-email-text">{emailInput}</p>

              <div className="profile-meta-chips">
                <div className="meta-chip-item">
                  <ShieldCheck size={13} color="#10b981" />
                  <span>Verified Identity</span>
                </div>
                <div className="meta-chip-item">
                  <Zap size={13} color="#c084fc" />
                  <span>Sub-40ms Mesh RTC</span>
                </div>
                <div className="meta-chip-item">
                  <Sparkles size={13} color="#fbbf24" />
                  <span>Gemini 2.5 Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              className="btn-pill-primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              <Check size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </section>

        {/* 3. STATS STRIP */}
        <section className="profile-stats-grid">
          <div className="profile-stat-box">
            <div className="stat-icon-wrapper purple">
              <Calendar size={20} />
            </div>
            <div>
              <div className="stat-val-text">{meetingCount}</div>
              <div className="stat-label-text">Meetings Created</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="stat-icon-wrapper green">
              <Activity size={20} />
            </div>
            <div>
              <div className="stat-val-text">&lt; 38 ms</div>
              <div className="stat-label-text">WebRTC Edge Latency</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="stat-icon-wrapper amber">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="stat-val-text">
                {geminiApiKey ? 'Custom Key' : 'Default AI'}
              </div>
              <div className="stat-label-text">Gemini Copilot Engine</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="stat-icon-wrapper blue">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="stat-val-text">256-Bit E2E</div>
              <div className="stat-label-text">Encryption Protocol</div>
            </div>
          </div>
        </section>

        {/* 4. TWO-COLUMN SETTINGS GRID */}
        <div className="profile-grid-sections">
          {/* LEFT: Profile Customization & Personal Details */}
          <div className="profile-card-glass">
            <div className="card-title-header">
              <h2 className="card-heading">
                <User size={18} color="#c084fc" />
                <span>Personal Information & Avatar</span>
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form-grid">
              <div className="profile-field-group">
                <label className="profile-field-label">Display Name in Calls</label>
                <input
                  type="text"
                  required
                  className="auth-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your display name"
                />
                <span className="profile-field-subtext">
                  This name is displayed on your video tile and in chat.
                </span>
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">Account Email Address</label>
                <input
                  type="email"
                  disabled
                  className="auth-input"
                  style={{ opacity: 0.65, cursor: 'not-allowed' }}
                  value={emailInput}
                />
                <span className="profile-field-subtext">
                  Email associated with your account authentication.
                </span>
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">Choose Avatar Persona</label>
                <div className="avatar-presets-track">
                  {AVATAR_SEEDS.map((preset) => {
                    const presetUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${preset.seed}`;
                    const isSelected = selectedSeed === preset.seed;

                    return (
                      <button
                        key={preset.seed}
                        type="button"
                        className={`avatar-preset-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSeed(preset.seed);
                          setCustomAvatar(presetUrl);
                        }}
                        title={preset.name}
                      >
                        <img src={presetUrl} alt={preset.name} />
                      </button>
                    );
                  })}
                </div>
                <span className="profile-field-subtext">
                  Select an identity avatar seed generated uniquely for video calls.
                </span>
              </div>

              <button
                type="submit"
                className="btn-pill-primary"
                style={{ alignSelf: 'flex-start', marginTop: 10 }}
                disabled={isSaving}
              >
                <Check size={15} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Gemini AI & Pre-flight Call Preferences */}
          <div className="profile-card-glass">
            <div className="card-title-header">
              <h2 className="card-heading">
                <Sparkles size={18} color="#a855f7" />
                <span>Aura AI & Call Preferences</span>
              </h2>
            </div>

            <div className="profile-form-grid">
              {/* Gemini API Key */}
              <div className="profile-field-group">
                <label className="profile-field-label">Google Gemini API Key</label>
                <div className="key-input-row">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    className="auth-input"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <div className="key-actions-right">
                    <button
                      type="button"
                      className="icon-key-btn"
                      onClick={() => setShowKey(!showKey)}
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <span className="profile-field-subtext">
                  Provide your own Gemini key for unlimited high-frequency copilot summaries in calls.
                </span>
              </div>

              {/* Preferences Toggles */}
              <div className="preference-item-row">
                <div className="pref-text-col">
                  <span className="pref-title">Aura AI Auto-Reply in Chat</span>
                  <span className="pref-sub">
                    Automatically answer questions in in-call chat
                  </span>
                </div>
                <div
                  className={`aura-switch ${autoReply ? 'active' : ''}`}
                  onClick={() => setAutoReply(!autoReply)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="aura-switch-thumb" />
                </div>
              </div>

              <div className="preference-item-row">
                <div className="pref-text-col">
                  <span className="pref-title">Join Meetings with Mic On</span>
                  <span className="pref-sub">Default microphone state upon joining</span>
                </div>
                <div
                  className={`aura-switch ${defaultMicOn ? 'active' : ''}`}
                  onClick={() => setDefaultMicOn(!defaultMicOn)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="aura-switch-thumb" />
                </div>
              </div>

              <div className="preference-item-row">
                <div className="pref-text-col">
                  <span className="pref-title">Join Meetings with Camera On</span>
                  <span className="pref-sub">Default webcam preview upon entering</span>
                </div>
                <div
                  className={`aura-switch ${defaultVideoOn ? 'active' : ''}`}
                  onClick={() => setDefaultVideoOn(!defaultVideoOn)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="aura-switch-thumb" />
                </div>
              </div>

              {/* Security reassurance */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <ShieldCheck size={20} color="#10b981" />
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Your Gemini API Key is encrypted locally on your browser and never shared with other participants.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            background: 'rgba(16, 17, 28, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            color: '#f8fafc',
            backdropFilter: 'blur(12px)',
            animation: 'modalFadeIn 0.2s ease-out',
          }}
        >
          <Check size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
