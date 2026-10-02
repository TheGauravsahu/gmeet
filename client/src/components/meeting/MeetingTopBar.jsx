import React from 'react';
import { Video, Crown, Copy, Check } from 'lucide-react';

export default function MeetingTopBar({
  roomInfo,
  roomCode,
  isHost,
  copiedLink,
  handleCopyLink,
  callDuration,
  formatTimer,
}) {
  return (
    <header className="meeting-topbar">
      <div className="meeting-topbar-left">
        <div className="brand-icon" style={{ width: 28, height: 28 }}>
          <Video size={16} />
        </div>
        <div className="meeting-title-box">
          <h1 className="meeting-header-title">{roomInfo?.title || 'AURA Meeting'}</h1>
          <span className="meeting-code-badge">#{roomCode}</span>
          {isHost && (
            <span
              style={{
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#eab308',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Crown size={12} /> Host
            </span>
          )}
        </div>

        <button
          className="copy-pill-btn"
          style={{ marginLeft: 8 }}
          onClick={handleCopyLink}
          title="Copy Meeting Link"
        >
          {copiedLink ? <Check size={13} /> : <Copy size={13} />}
          <span>{copiedLink ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      <div className="meeting-topbar-center">
        <div className="duration-pill-badge">
          <span className="rec-indicator-dot" />
          <span className="timer-text">{formatTimer(callDuration)}</span>
        </div>
      </div>

      <div className="meeting-topbar-right" />
    </header>
  );
}
