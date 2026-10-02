import React from 'react';

export default function HostKnockBanner({
  pendingGuests,
  handleAdmitGuest,
  handleAdmitAll,
}) {
  if (!pendingGuests || pendingGuests.length === 0) return null;

  return (
    <div className="host-knock-alert-banner">
      <div className="knock-user-info">
        <div className="knock-avatar-dot">
          {(pendingGuests[0].displayName || 'G').charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="knock-title-text">
            <strong>{pendingGuests[0].displayName}</strong> wants to join this call
          </span>
          {pendingGuests.length > 1 && (
            <span className="knock-extra-count">
              (+{pendingGuests.length - 1} more waiting)
            </span>
          )}
        </div>
      </div>
      <div className="knock-actions">
        <button
          className="btn-admit-knock"
          onClick={() => handleAdmitGuest(pendingGuests[0].socketId)}
        >
          Admit
        </button>
        {pendingGuests.length > 1 && (
          <button className="btn-admit-all" onClick={handleAdmitAll}>
            Admit all
          </button>
        )}
      </div>
    </div>
  );
}
