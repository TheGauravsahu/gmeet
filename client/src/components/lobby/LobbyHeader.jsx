import React from 'react';
import { ArrowLeft, Video } from 'lucide-react';

export default function LobbyHeader({ onReturnHome }) {
  return (
    <header className="lobby-topbar">
      <button className="back-link-btn" onClick={onReturnHome}>
        <ArrowLeft size={16} />
        <span>Return Home</span>
      </button>
      <div className="lobby-brand-tag">
        <div className="brand-icon" style={{ width: 24, height: 24 }}>
          <Video size={14} />
        </div>
        <span>AURA.MEET PRE-FLIGHT</span>
      </div>
    </header>
  );
}
