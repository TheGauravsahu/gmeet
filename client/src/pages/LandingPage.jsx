import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Sparkles,
  Shield,
  ShieldCheck,
  Layers,
  Activity,
  Globe,
  Lock,
  Zap,
  ArrowRight,
  Check,
  Copy,
  Sliders,
  TrendingUp,
  X,
  Calendar,
  MessageSquare,
  Terminal,
  Volume2,
  LogIn,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScheduleModal from '../components/ScheduleModal';

// 11 Participant Cards for the Semicircular Innovation Arch
const ARCH_PARTICIPANTS = [
  {
    id: 1,
    name: 'Elena Rostova',
    role: 'Lead Architect',
    status: '4K Ultra HD',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    name: 'Marcus Sterling',
    role: 'VP Engineering',
    status: 'Spatial Audio',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    name: 'Sarah Jenkins',
    role: 'AI Researcher',
    status: 'AI Framing',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Security Director',
    status: 'E2E Verified',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    name: 'Sophia Lin',
    role: 'Product Lead',
    status: 'Live Captions',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 6,
    name: 'Alex Rivera',
    role: 'Meeting Host',
    status: 'Host • 60fps',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 7,
    name: 'Amara Diallo',
    role: 'Staff ML Engineer',
    status: 'Noise Canceled',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 8,
    name: 'Liam O’Connor',
    role: 'Infrastructure Lead',
    status: 'Low Latency',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 9,
    name: 'Chloe Bennett',
    role: 'Design Director',
    status: 'Studio Lighting',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 10,
    name: 'Kenji Sato',
    role: 'Frontend Principal',
    status: 'Gesture AI',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 11,
    name: 'Mateo Alvarez',
    role: 'Distributed Systems',
    status: 'WebRTC Mesh',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
  }
];

// Ecosystem integration nodes for Card 1
const INTEGRATION_APPS = [
  { name: 'Slack', icon: '💬', pathId: 'p1' },
  { name: 'Calendar', icon: '📅', pathId: 'p2' },
  { name: 'Zoom', icon: '📹', pathId: 'p3' },
  { name: 'GitHub', icon: '🐙', pathId: 'p4' },
  { name: 'Figma', icon: '🎨', pathId: 'p5' },
  { name: 'Notion', icon: '📝', pathId: 'p6' }
];

export default function LandingPage({ onNavigate }) {
  const { user, isAuthenticated, logout, displayName } = useAuth();

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState(ARCH_PARTICIPANTS[5]);
  const [hoveredApp, setHoveredApp] = useState(null);

  // Interactive Security Matrix toggles for Card 2
  const [secToggles, setSecToggles] = useState({
    e2e: true,
    soc2: true,
    bio: true,
    mesh: true
  });

  // Audio equalizer boosted mode
  const [audioBoost, setAudioBoost] = useState(false);

  // Real-time live transcript simulation for Card 3
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const transcripts = [
    'Sarah: "Gemini is synthesizing our cross-region telemetry in real time..."',
    'Sophia: "Sub-40ms latency confirmed across all Tokyo & Frankfurt edge nodes."',
    'Alex: "Let us review the security audit key hash and publish to main."',
    'Liam: "Spatial audio rendering calibrated for 12 simultaneous speakers."'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTranscriptIndex((prev) => (prev + 1) % transcripts.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [transcripts.length]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/xkq-92m-prv`);
    setCopiedLink(true);
    setShowToast(true);
    setTimeout(() => setCopiedLink(false), 2500);
    setTimeout(() => setShowToast(false), 3500);
  };

  const toggleSec = (key) => {
    setSecToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Instant Room Creation via Backend API
  const handleStartInstantMeeting = async () => {
    try {
      setIsCreatingRoom(true);
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Meeting`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        onNavigate(`/meet/${res.data.room.roomCode}`);
      }
    } catch (err) {
      alert(`Could not create instant room: ${err.message}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // 2. Join via typed Room Code
  const handleJoinWithCode = (e) => {
    e.preventDefault();
    const cleaned = quickCodeInput.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleaned) return;
    onNavigate(`/meet/${cleaned}`);
  };

  return (
    <div className="page-wrapper">
      {/* Ambient Cosmos Glow & Stardust Particles */}
      <div className="ambient-cosmos" />

      {/* Floating Stardust Particles */}
      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          className="floating-stardust"
          style={{
            left: `${(i * 7.2 + 3) % 96}%`,
            animationDelay: `${(i * 1.3) % 8}s`,
            animationDuration: `${12 + (i % 5) * 3}s`
          }}
        />
      ))}

      {/* ====================================================================
          1. NAVIGATION BAR
          ==================================================================== */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon">
            <Video size={18} />
          </div>
          <span className="brand-text">AURA.MEET</span>
        </div>

        <ul className="nav-links">
          <li><a href="#hero" className="nav-link active">Home</a></li>
          <li><a href="#about" className="nav-link">About</a></li>
          <li><a href="#features" className="nav-link">Features</a></li>
          <li><a href="#security" className="nav-link">Security</a></li>
          <li><a href="#specs" className="nav-link">Specs</a></li>
        </ul>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <button
                className="btn-glass-pill"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                onClick={() => setScheduleModalOpen(true)}
              >
                <Calendar size={14} />
                <span>Schedule</span>
              </button>

              <button
                className="btn-pill-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                disabled={isCreatingRoom}
                onClick={handleStartInstantMeeting}
              >
                <Plus size={14} />
                <span>{isCreatingRoom ? 'Creating...' : 'New Meeting'}</span>
              </button>

              <div className="nav-user-badge">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name || 'User'}
                  className="user-nav-avatar"
                />
                <span className="user-nav-name">{displayName}</span>
                <button
                  className="user-nav-logout-btn"
                  onClick={logout}
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
                <span>Sign In</span>
              </button>
              <button
                className="btn-white-pill"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                onClick={() => onNavigate('/signup')}
              >
                <span>Get Started</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ====================================================================
          2. HERO SECTION
          ==================================================================== */}
      <section className="hero-section" id="hero">
        {/* Top Floating Badge */}
        <div className="hero-pill-badge">
          <span className="badge-tag">
            <Sparkles size={12} /> NEW
          </span>
          <span>Next-Gen Video Architecture 2.0</span>
        </div>

        {/* Hero Title */}
        <h1 className="hero-title">
          Smart Video Experiences<br />
          Built From Every Angle
        </h1>

        {/* Hero Subtitle */}
        <p className="hero-subtitle">
          MEET.AI is an ultra-low latency intelligent video platform engineered for high-performing
          teams. Featuring spatial audio, real-time AI transcription, studio-grade video, and zero-latency
          screen streaming.
        </p>

        {/* Dual Call-To-Action Buttons & Quick Join Bar */}
        <div className="hero-cta-group" style={{ marginBottom: 20 }}>
          <button
            className="btn-white-pill"
            disabled={isCreatingRoom}
            onClick={handleStartInstantMeeting}
          >
            <Video size={16} />
            <span>{isCreatingRoom ? 'Generating Room...' : 'Start Instant Meeting'}</span>
            <ArrowRight size={16} />
          </button>

          <button className="btn-glass-pill" onClick={() => setMeetingModalOpen(true)}>
            <span>Test Camera Preview</span>
          </button>
        </div>

       

        {/* The Panoramic Glowing Purple Horizon Arc & Client Logos */}
        <div className="horizon-container">
          {/* Broad atmospheric nebula domes (soft unfocused cosmic light) */}
          <div className="horizon-ambient-dome" />
          <div className="horizon-ambient-spread" />

          {/* Panoramic Continuous Horizon Curve */}
          <svg
            className="horizon-svg-curve"
            viewBox="0 0 1600 240"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="arcDomeFill" cx="50%" cy="30%" r="55%" fx="50%" fy="20%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.18" />
                <stop offset="85%" stopColor="#07070a" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#07070a" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="arcRimGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                <stop offset="12%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="30%" stopColor="#a855f7" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="70%" stopColor="#a855f7" stopOpacity="0.85" />
                <stop offset="88%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="arcCoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="26%" stopColor="#c084fc" stopOpacity="0.25" />
                <stop offset="44%" stopColor="#f3e8ff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="56%" stopColor="#f3e8ff" stopOpacity="0.95" />
                <stop offset="74%" stopColor="#c084fc" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <filter id="arcGlowDeep" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="18" />
              </filter>
              <filter id="arcGlowMed" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
              <filter id="arcGlowSoft" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Atmosphere dome fill */}
            <path
              d="M 0 240 Q 800 20 1600 240 L 1600 240 L 0 240 Z"
              fill="url(#arcDomeFill)"
            />

            {/* Deep wide neon bloom */}
            <path
              d="M 0 240 Q 800 20 1600 240"
              stroke="url(#arcRimGlowGrad)"
              strokeWidth="26"
              filter="url(#arcGlowDeep)"
              opacity="0.8"
            />

            {/* Medium aura glow */}
            <path
              d="M 0 240 Q 800 20 1600 240"
              stroke="url(#arcRimGlowGrad)"
              strokeWidth="10"
              filter="url(#arcGlowMed)"
              opacity="0.9"
            />

            {/* Soft inner neon stroke */}
            <path
              d="M 0 240 Q 800 20 1600 240"
              stroke="url(#arcRimGlowGrad)"
              strokeWidth="4"
              filter="url(#arcGlowSoft)"
              opacity="0.95"
            />

            {/* Razor-sharp core neon line */}
            <path
              d="M 0 240 Q 800 20 1600 240"
              stroke="url(#arcCoreGrad)"
              strokeWidth="2"
              opacity="1"
            />
          </svg>

          {/* Partner logos sitting gracefully under the curve */}
          <div className="horizon-logos">
            <div className="logo-item">
              <Globe size={18} />
              <span>GOOGLE WORKSPACE</span>
            </div>
            <div className="logo-item">
              <MessageSquare size={18} />
              <span>SLACK</span>
            </div>
            <div className="logo-item">
              <Video size={18} />
              <span>ZOOM MESH</span>
            </div>
            <div className="logo-item">
              <Terminal size={18} />
              <span>DISCORD RTC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. SECTION: ABOUT / MANIFESTO STATEMENT
          ==================================================================== */}
      <section className="about-section" id="about">
        <div className="pill-section-tag">
          <Sparkles size={14} />
          <span>About Us</span>
        </div>

        <p className="about-statement">
          Built on creativity, collaboration, and top excellence,{' '}
          MEET.AI is a dynamic team of industry experts committed to achieving
          exceptional great results<span className="dim"> across global enterprise communication...</span>
        </p>

        <button className="btn-purple-pill" onClick={() => setScheduleModalOpen(true)}>
          <Calendar size={16} />
          <span>Schedule Conference</span>
        </button>
      </section>

      {/* ====================================================================
          4. SECTION: SEMICIRCULAR INNOVATION ARCH SHOWCASE
          ==================================================================== */}
      <section className="arch-showcase-section" id="features">
        <div className="arch-visual-stage">
          <div className="arch-tiles-track">
            {ARCH_PARTICIPANTS.map((item, index) => {
              const total = ARCH_PARTICIPANTS.length;
              const step = (168 - 12) / (total - 1);
              const thetaDeg = 168 - index * step;
              const thetaRad = (thetaDeg * Math.PI) / 180;
              
              const Rx = 380;
              const Ry = 220;
              
              const xOffset = Rx * Math.cos(thetaRad);
              const topPx = 280 - Ry * Math.sin(thetaRad);
              const rotateDeg = (90 - thetaDeg) * 0.82;

              const isHostOrSelected = activeParticipant.id === item.id;

              return (
                <div
                  key={item.id}
                  className="arch-tile"
                  style={{
                    left: `calc(50% + ${xOffset}px)`,
                    top: `${topPx}px`,
                    transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)`,
                    zIndex: isHostOrSelected ? 35 : Math.round(20 - Math.abs(index - 5) * 2),
                    borderColor: isHostOrSelected ? '#c084fc' : undefined,
                    animationDelay: `${index * 0.28}s`
                  }}
                  onClick={() => setActiveParticipant(item)}
                  title={`${item.name} (${item.role})`}
                >
                  <img src={item.avatar} alt={item.name} loading="lazy" />
                  {item.activeSpeaker && (
                    <>
                      <div className="arch-tile-status" />
                      <div className="active-speaker-ping" />
                    </>
                  )}
                  <div className="arch-tile-badge">
                    {item.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Text Inside the Arch Halo */}
          <div className="arch-center-copy">
            <div className="pill-section-tag" style={{ marginBottom: '14px' }}>
              <Sliders size={13} />
              <span>Features</span>
            </div>

            <h2 className="arch-heading">
              Packed with Innovation.
            </h2>

            <p className="arch-subheading">
              Hyper-scale WebRTC mesh with smart AI camera features designed to elevate your team interaction.
            </p>

            <button className="btn-purple-pill" onClick={handleStartInstantMeeting}>
              <Video size={15} />
              <span>Launch Live Call</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. SECTION: THREE FEATURE GLASS CARDS
          ==================================================================== */}
      <section className="feature-cards-section" id="security">
        <div className="feature-cards-grid">
          
          {/* CARD 1: Seamless API Integrations */}
          <div className="feature-glass-card">
            <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
              <Layers size={22} />
            </div>
            <h3 className="card-title">Seamless API Integrations</h3>
            <p className="card-desc">
              Native support with every modern calendar, cloud workspace, and WebRTC stack.
            </p>

            <div className="card-interactive-canvas">
              <div className="integration-network">
                <div className="integration-nodes-row">
                  {INTEGRATION_APPS.map((app) => (
                    <div
                      key={app.name}
                      className="app-node-pill"
                      onMouseEnter={() => setHoveredApp(app.name)}
                      onMouseLeave={() => setHoveredApp(null)}
                      title={`${app.name} (Sub-20ms Sync)`}
                    >
                      <span>{app.icon}</span>
                    </div>
                  ))}
                </div>

                <svg className="integration-svg-canvas" viewBox="0 0 300 130">
                  <defs>
                    <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  <path id="p1" className="svg-flow-path" d="M 25 15 C 25 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" fill="none" />
                  <path id="p2" className="svg-flow-path" d="M 75 15 C 75 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.55)" strokeWidth="1.5" fill="none" />
                  <path id="p3" className="svg-flow-path" d="M 125 15 C 125 70, 150 70, 150 115" stroke="rgba(168, 85, 247, 0.75)" strokeWidth="1.5" fill="none" />
                  <path id="p4" className="svg-flow-path" d="M 175 15 C 175 70, 150 70, 150 115" stroke="rgba(168, 85, 247, 0.75)" strokeWidth="1.5" fill="none" />
                  <path id="p5" className="svg-flow-path" d="M 225 15 C 225 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.55)" strokeWidth="1.5" fill="none" />
                  <path id="p6" className="svg-flow-path" d="M 275 15 C 275 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" fill="none" />

                  <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #c084fc)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path="M 25 15 C 25 70, 150 70, 150 115" />
                  </circle>
                  <circle r="3" fill="#c084fc" filter="drop-shadow(0 0 4px #c084fc)">
                    <animateMotion dur="2.1s" repeatCount="indefinite" path="M 75 15 C 75 70, 150 70, 150 115" />
                  </circle>
                  <circle r="3.5" fill="#ffffff" filter="drop-shadow(0 0 6px #c084fc)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 125 15 C 125 70, 150 70, 150 115" />
                  </circle>
                  <circle r="3.5" fill="#ffffff" filter="drop-shadow(0 0 6px #c084fc)">
                    <animateMotion dur="1.9s" repeatCount="indefinite" path="M 175 15 C 175 70, 150 70, 150 115" />
                  </circle>
                  <circle r="3" fill="#c084fc" filter="drop-shadow(0 0 4px #c084fc)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 225 15 C 225 70, 150 70, 150 115" />
                  </circle>
                  <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #c084fc)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 275 15 C 275 70, 150 70, 150 115" />
                  </circle>
                </svg>

                <div className="integration-hub-core">
                  <div className="hub-pulse-ring" />
                  <Video size={19} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Trusted Authentication */}
          <div className="feature-glass-card">
            <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 className="card-title">Trusted Authentication</h3>
            <p className="card-desc">
              Zero-leak protocols backed by post-quantum encryption and multi-factor host keys.
            </p>

            <div className="card-interactive-canvas">
              <div className="security-dashboard">
                <div className="security-matrix-pills">
                  <div
                    className={`sec-pill ${secToggles.e2e ? 'active' : ''}`}
                    onClick={() => toggleSec('e2e')}
                  >
                    <Lock size={11} /> 256-Bit E2E
                  </div>
                  <div
                    className={`sec-pill ${secToggles.soc2 ? 'active' : ''}`}
                    onClick={() => toggleSec('soc2')}
                  >
                    <Shield size={11} /> SOC2 Type II
                  </div>
                  <div
                    className={`sec-pill ${secToggles.bio ? 'active' : ''}`}
                    onClick={() => toggleSec('bio')}
                  >
                    <Check size={11} /> Biometric Key
                  </div>
                  <div
                    className={`sec-pill ${secToggles.mesh ? 'active' : ''}`}
                    onClick={() => toggleSec('mesh')}
                  >
                    <Zap size={11} /> Zero-Log Mesh
                  </div>
                </div>

                <div className="shield-center-circle" onClick={() => toggleSec('e2e')}>
                  <div className="radar-ring" />
                  <div className="radar-ring-2" />
                  <Check size={26} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: AI-Speech Recognition */}
          <div className="feature-glass-card">
            <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
              <Mic size={22} />
            </div>
            <h3 className="card-title">AI-Speech Recognition</h3>
            <p className="card-desc">
              Neural acoustic models transcribe multiple speakers with 99.4% precision in 68 languages.
            </p>

            <div className="card-interactive-canvas">
              <div className="speech-recognition-panel">
                <div
                  className="speech-active-badge"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setAudioBoost(!audioBoost)}
                  title="Click to toggle EQ boost"
                >
                  <Activity size={12} color="#10b981" />
                  <span>
                    {audioBoost ? 'Neural AI Noise Gate: MAX' : 'AI Acoustic Stream: Active'}
                  </span>
                </div>

                <div className="waveform-box">
                  {[28, 55, 85, 45, 95, 30, 70, 100, 65, 80, 40, 90, 60, 35, 75, 50, 85, 30].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{
                          height: `${audioBoost ? Math.min(100, height * 1.3) : height}%`,
                          animationDelay: `${i * 0.08}s`
                        }}
                      />
                    )
                  )}
                </div>

                <div className="transcript-floating-box">
                  <div className="transcript-glow-dot" />
                  <span className="transcript-live-text">
                    {transcripts[transcriptIndex]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

                  

      {/* ====================================================================
          7. BOTTOM HORIZON & FOOTER
          ==================================================================== */}
      <footer className="bottom-horizon-section">
        {/* Volumetric Stadium Light Rays & Cosmic Glow */}
        <div className="bottom-beams-container">
          <div className="bottom-beam-glow" />
          <div className="stadium-rays" />
        </div>

        <div className="footer">
          <div className="footer-left">
            <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="brand-icon">
                <Video size={16} />
              </div>
              <span className="brand-text">AURA.MEET</span>
            </div>
            <div className="system-status-indicator">
              <div className="status-dot" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="footer-links">
            <a href="#hero">Home</a>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#specs">Specs</a>
            <button
              onClick={() => onNavigate('/signin')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              Sign In
            </button>
          </div>

          <p className="footer-copy">
            © 2026 AURA.MEET. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ====================================================================
          8. INTERACTIVE MEETING PREVIEW MODAL
          ==================================================================== */}
      {meetingModalOpen && (
        <div className="modal-overlay" onClick={() => setMeetingModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMeetingModalOpen(false)}>
              <X size={18} />
            </button>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                Ready to Join the Meeting?
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Check your audio & video preview before joining room <strong>#xkq-92m-prv</strong>
              </p>
            </div>

            {/* Simulated Live Camera Box */}
            <div className="modal-camera-stage">
              {isVideoOn ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                    alt="Self camera feed"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span>HD 1080p • 60fps</span>
                  </div>
                </div>
              ) : (
                <div className="simulated-cam-view">
                  <VideoOff size={42} />
                  <span>Camera is turned off</span>
                </div>
              )}

              {/* In-Call Controls Toggle */}
              <div className="stage-overlay-controls">
                <button
                  className={`control-circle-btn ${!isMicOn ? 'muted' : ''}`}
                  onClick={() => setIsMicOn(!isMicOn)}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>

            {/* Room Link Bar */}
            <div className="modal-link-box">
              <span>{window.location.origin}/meet/xkq-92m-prv</span>
              <button className="copy-pill-btn" onClick={handleCopyLink}>
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-glass-pill" onClick={() => setMeetingModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-pill-primary"
                onClick={() => {
                  setMeetingModalOpen(false);
                  onNavigate('/meet/xkq-92m-prv');
                }}
              >
                <Video size={16} />
                <span>Join Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
}
