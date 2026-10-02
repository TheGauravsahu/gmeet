import React from 'react';
import { UserCheck, Shield, Check, X } from 'lucide-react';

export default function HostKnockBanner({
  pendingGuests,
  handleAdmitGuest,
  handleDenyGuest,
  handleAdmitAll,
}) {
  if (!pendingGuests || pendingGuests.length === 0) return null;

  const currentGuest = pendingGuests[0];

  return (
    <div className="host-knock-alert-banner">
      <div className="knock-user-info">
        <div className="knock-avatar-dot">
          {(currentGuest.displayName || 'G').charAt(0).toUpperCase()}
        </div>
        <div className="knock-text-col">
          <div className="knock-title-text">
            <strong>{currentGuest.displayName}</strong>
            <span className="knock-action-desc">wants to join this call</span>
          </div>
          {pendingGuests.length > 1 && (
            <div className="knock-extra-count">
              +{pendingGuests.length - 1} more person waiting
            </div>
          )}
        </div>
      </div>

      <div className="knock-actions">
        {handleDenyGuest && (
          <button
            className="btn-deny-knock"
            onClick={() => handleDenyGuest(currentGuest.socketId)}
            title="Deny entry"
          >
            <X size={14} />
            <span>Deny</span>
          </button>
        )}

        <button
          className="btn-admit-knock"
          onClick={() => handleAdmitGuest(currentGuest.socketId)}
          title="Admit to call"
        >
          <Check size={14} />
          <span>Admit</span>
        </button>

        {pendingGuests.length > 1 && (
          <button
            className="btn-admit-all"
            onClick={handleAdmitAll}
            title="Admit all waiting guests"
          >
            Admit all ({pendingGuests.length})
          </button>
        )}
      </div>
    </div>
  );
}
