import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

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

export function FloatingToast({ toastMessage }) {
  if (!toastMessage) return null;

  return (
    <div className="aura-floating-toast">
      <Sparkles size={16} color="#c084fc" />
      <span>{toastMessage}</span>
    </div>
  );
}
