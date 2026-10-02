import React from 'react';
import { Sparkles, AlertCircle, X } from 'lucide-react';

export function WaitingApprovalModal({ waitingForAdmission, handleLeaveCall }) {
  if (!waitingForAdmission) return null;

  return (
    <div className="aura-modal-overlay">
      <div className="aura-modal-box" style={{ textAlign: 'center' }}>
        <div className="waiting-pulse-spinner" style={{ margin: '0 auto 16px auto' }}>
          <Sparkles size={26} className="spinning-sparkle" />
        </div>
        <h3 className="waiting-title">Waiting for Host Approval...</h3>
        <p className="waiting-subtitle" style={{ margin: '10px auto' }}>
          The meeting host has been notified that you want to join this call.
        </p>
        <button
          className="btn-pill-primary"
          style={{ marginTop: 16 }}
          onClick={handleLeaveCall}
        >
          Cancel & Return Home
        </button>
      </div>
    </div>
  );
}

export function AdmissionDeniedModal({ admissionDenied, onReturnHome }) {
  if (!admissionDenied) return null;

  return (
    <div className="aura-modal-overlay">
      <div className="aura-modal-box" style={{ textAlign: 'center' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 14px auto' }} />
        <h3 className="denied-title">Join Request Denied</h3>
        <p className="denied-subtitle" style={{ margin: '10px auto' }}>
          The meeting host has denied your request to join this meeting.
        </p>
        <button
          className="btn-pill-primary"
          style={{ marginTop: 16 }}
          onClick={onReturnHome}
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

export function GeminiKeyModal({
  showKeyModal,
  setShowKeyModal,
  tempKeyInput,
  setTempKeyInput,
  handleSaveGeminiKey,
}) {
  if (!showKeyModal) return null;

  return (
    <div className="aura-modal-overlay" onClick={() => setShowKeyModal(false)}>
      <div className="aura-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="aura-modal-header">
          <h3 className="aura-modal-title">
            <Sparkles size={18} color="#c084fc" />
            Google Gemini API Key
          </h3>
          <button
            className="modal-close-btn"
            onClick={() => setShowKeyModal(false)}
          >
            <X size={16} />
          </button>
        </div>
        <p className="aura-modal-desc">
          Aura AI uses Google Gemini to answer chat questions, summarize meetings, and generate insights. Enter your API key below or configure it in <code>api/.env</code> as <code>GEMINI_API_KEY</code>.
        </p>
        <form onSubmit={handleSaveGeminiKey}>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={tempKeyInput}
            onChange={(e) => setTempKeyInput(e.target.value)}
            className="aura-modal-input"
          />
          <div className="aura-modal-actions">
            <button
              type="button"
              className="aura-btn-cancel"
              onClick={() => setShowKeyModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="aura-btn-save">
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FloatingToast({ toastMessage }) {
  if (!toastMessage) return null;

  return (
    <div className="aura-floating-toast">
      <Sparkles size={16} color="#c084fc" />
      <span>{toastMessage}</span>
    </div>
  );
}
