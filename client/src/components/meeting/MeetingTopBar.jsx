import React, { useState, useEffect, memo } from 'react';
import { Video, Crown, Copy, Check } from 'lucide-react';

function MeetingTopBarComponent({
  roomInfo,
  roomCode,
  isHost,
  copiedLink,
  handleCopyLink,
  callDuration: externalDuration,
  formatTimer: externalFormat,
}) {
  const [internalDuration, setInternalDuration] = useState(0);

  useEffect(() => {
    if (externalDuration !== undefined) return;
    const timer = setInterval(() => {
      setInternalDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [externalDuration]);

  const defaultFormat = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerText = externalFormat
    ? externalFormat(externalDuration !== undefined ? externalDuration : internalDuration)
    : defaultFormat(externalDuration !== undefined ? externalDuration : internalDuration);

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
          <span className="timer-text">{timerText}</span>
        </div>
      </div>

      <div className="meeting-topbar-right" />
    </header>
  );
}

export default memo(MeetingTopBarComponent);
