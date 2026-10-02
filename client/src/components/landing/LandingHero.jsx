import React from 'react';
import { Video, Sparkles, ArrowRight, Globe, MessageSquare, Terminal } from 'lucide-react';

export default function LandingHero({ onNavigate, onOpenPreviewModal }) {
  return (
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

      {/* Dual Call-To-Action Buttons */}
      <div className="hero-cta-group" style={{ marginBottom: 20 }}>
        <button
          className="btn-white-pill"
          onClick={() => onNavigate('/home')}
        >
          <Video size={16} />
          <span>New Meeting / Console</span>
          <ArrowRight size={16} />
        </button>

        <button className="btn-glass-pill" onClick={onOpenPreviewModal}>
          <span>Test Camera Preview</span>
        </button>
      </div>

      {/* Panoramic Glowing Purple Horizon Arc & Client Logos */}
      <div className="horizon-container">
        {/* Atmospheric nebula domes */}
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

        {/* Partner logos */}
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
  );
}
