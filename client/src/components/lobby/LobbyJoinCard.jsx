import React from 'react';
import {
  Sparkles,
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Shield,
  Users,
} from 'lucide-react';

export default function LobbyJoinCard({
  roomCode,
  roomData,
  error,
  inputName,
  setInputName,
  joining,
  waitingForApproval,
  deniedMessage,
  onJoin,
  onCancelRequest,
  onResetDenied,
  copiedLink,
  onCopyLink,
}) {
  return (
    <div className="lobby-join-panel">
      <div className="lobby-card-glass">
        <div className="join-badge">
          <Sparkles size={13} />
          <span>AURA Meeting Room</span>
        </div>

        <h2 className="lobby-room-title">
          {roomData?.title || `Room #${roomCode}`}
        </h2>

        <p className="lobby-room-desc">
          {roomData?.description ||
            `You are about to enter meeting #${roomCode}. Host approval is required before joining.`}
        </p>

        {error ? (
          <div className="auth-error-banner" style={{ margin: '14px 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* State 1: Host Denied Request */}
        {deniedMessage ? (
          <div className="denied-admission-card">
            <AlertCircle size={32} color="#ef4444" />
            <h3 className="denied-title">Cannot Join Meeting</h3>
            <p className="denied-subtitle">{deniedMessage}</p>
            <button
              className="btn-pill-primary"
              onClick={onResetDenied}
              style={{ marginTop: 8 }}
            >
              Try Again
            </button>
          </div>
        ) : waitingForApproval ? (
          /* State 2: Waiting for Host to Admit */
          <div className="waiting-admission-card">
            <div className="waiting-pulse-spinner">
              <Sparkles size={26} className="spinning-sparkle" />
            </div>
            <h3 className="waiting-title">Asking to be let in...</h3>
            <p className="waiting-subtitle">
              You'll join the call when the meeting host approves your request.
            </p>
            <button
              className="cancel-knock-btn"
              onClick={onCancelRequest}
            >
              Cancel request
            </button>
          </div>
        ) : (
          /* State 3: Normal Form to Ask to Join */
          <form onSubmit={onJoin} className="lobby-join-form">
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">What's your name?</label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                className="auth-input"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={joining || (roomData && roomData.status === 'ended')}
              className="btn-pill-primary join-meeting-main-btn"
            >
              <span>{joining ? 'Connecting...' : 'Ask to Join / Join Now'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Meeting link copy box */}
        <div className="modal-link-box" style={{ marginTop: 20 }}>
          <span className="code-text">{window.location.origin}/meet/{roomCode}</span>
          <button className="copy-pill-btn" onClick={onCopyLink}>
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Room security specs */}
        <div className="room-meta-specs">
          <div className="spec-meta-item">
            <Shield size={14} color="#10b981" />
            <span>Host Approval Protected</span>
          </div>
          <div className="spec-meta-item">
            <Users size={14} color="#8b5cf6" />
            <span>Real-time WebRTC Mesh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
