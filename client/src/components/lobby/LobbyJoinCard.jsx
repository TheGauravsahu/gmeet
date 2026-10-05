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
  audioOnly = false,
  roomData,
  user,
  loading,
  participantName,
  onParticipantNameChange,
  error,
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
          <span>{audioOnly ? 'AURA Audio Call' : 'AURA Meeting Room'}</span>
        </div>

        <h2 className="lobby-room-title">
          {roomData?.title || `Room #${roomCode}`}
        </h2>

        <p className="lobby-room-desc">
          {roomData?.description ||
            (audioOnly
              ? `Join audio-only call #${roomCode} without turning on or requesting your camera.`
              : `You are about to enter meeting #${roomCode}. You may need host approval before joining.`)}
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
          /* State 3: Join Info */
          <form onSubmit={onJoin} className="lobby-join-form">
            {user ? (
              <div className="lobby-join-identity">
                <div className="lobby-join-avatar">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="lobby-join-identity-copy">
                  <span className="lobby-join-identity-label">Joining as</span>
                  <span className="lobby-join-identity-name">{user.name}</span>
                  <span className="lobby-join-identity-email">{user.email}</span>
                </div>
              </div>
            ) : (
              <label className="lobby-guest-name-field">
                <span>Your name</span>
                <input
                  type="text"
                  value={participantName}
                  onChange={(event) => onParticipantNameChange(event.target.value)}
                  placeholder="Enter your name"
                  maxLength={40}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <button
              type="submit"
              disabled={loading || joining || Boolean(error) || roomData?.status === 'ended'}
              className="btn-pill-primary join-meeting-main-btn"
            >
              <span>
                {loading
                  ? 'Loading meeting…'
                  : joining
                    ? 'Connecting...'
                    : audioOnly
                      ? 'Join Audio Call'
                      : 'Join Meeting'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Meeting link copy box */}
        <div className="modal-link-box" style={{ marginTop: 20 }}>
          <span className="code-text">{window.location.origin}/lobby/{roomCode}</span>
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
