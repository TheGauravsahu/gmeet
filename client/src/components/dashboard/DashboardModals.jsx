import React from 'react';
import { X, Link as LinkIcon, Check, Copy, ShieldCheck } from 'lucide-react';

export function MeetingForLaterModal({
  isOpen,
  onClose,
  createdRoom,
  copiedLink,
  onCopyLink,
}) {
  if (!isOpen || !createdRoom) return null;

  return (
    <div className="aura-modal-overlay" onClick={onClose}>
      <div className="aura-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="aura-modal-header">
          <h3 className="aura-modal-title">
            <LinkIcon size={18} color="#c084fc" />
            Here's the link to your meeting
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <p className="aura-modal-desc">
          Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
        </p>

        <div className="modal-link-box" style={{ margin: '18px 0' }}>
          <span className="code-text">
            {window.location.origin}/meet/{createdRoom.roomCode}
          </span>
          <button
            className="copy-pill-btn"
            onClick={() => onCopyLink(createdRoom.roomCode)}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="aura-modal-actions">
          <button
            className="btn-pill-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function SafetyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="aura-modal-overlay" onClick={onClose}>
      <div className="aura-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="aura-modal-header">
          <h3 className="aura-modal-title">
            <ShieldCheck size={18} color="#10b981" />
            Meeting Security & Host Controls
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="aura-modal-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            <strong>Host Admission Protection:</strong> No uninvited person can directly enter your meeting. Guests must knock from the lobby and wait until the meeting host admits them.
          </p>
          <p>
            <strong>Real-time Mesh WebRTC:</strong> Video and audio feeds stream peer-to-peer with sub-40ms latency and high definition clarity.
          </p>
          <p>
            <strong>Aura AI Assistance:</strong> In-call intelligence powered by Google Gemini handles meeting questions, summarizes talking points, and suggests ideas upon request.
          </p>
        </div>
        <div className="aura-modal-actions" style={{ marginTop: 16 }}>
          <button
            className="btn-pill-primary"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
