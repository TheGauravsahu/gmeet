import React from 'react';
import { Video } from 'lucide-react';

export default function LandingFooter({ onNavigate }) {
  return (
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
  );
}
