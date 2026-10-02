import React from 'react';
import { Video, ArrowLeft } from 'lucide-react';

export default function AuthHeader({ onNavigateHome }) {
  return (
    <header className="auth-top-nav">
      <div className="nav-brand" onClick={onNavigateHome}>
        <div className="brand-icon">
          <Video size={17} />
        </div>
        <span className="brand-text">AURA.MEET</span>
      </div>

      <button className="back-home-btn" onClick={onNavigateHome}>
        <ArrowLeft size={15} />
        <span>Back to Home</span>
      </button>
    </header>
  );
}
