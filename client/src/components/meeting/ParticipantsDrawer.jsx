import React from 'react';
import { Users, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function ParticipantsDrawer({
  isHost,
  pendingGuests,
  handleDenyGuest,
  handleAdmitGuest,
  handleAdmitAll,
  totalParticipants,
  participants,
  handleMuteAll,
  handleHostControlMedia,
  myName,
  isMicOn,
  isVideoOn,
}) {
  return (
    <div className="drawer-body">
      {/* Waiting Room Section for Host */}
      {isHost && pendingGuests.length > 0 && (
        <div className="waiting-room-drawer-section">
          <div className="waiting-section-header">
            <span className="waiting-section-title">
              <Users size={14} /> Waiting Room ({pendingGuests.length})
            </span>
            {pendingGuests.length > 1 && (
              <button className="btn-admit-all" onClick={handleAdmitAll}>
                Admit all
              </button>
            )}
          </div>
          {pendingGuests.map((g) => (
            <div key={g.socketId} className="waiting-item-row">
              <span className="knock-name-text">{g.displayName}</span>
              <div className="knock-actions-group">
                <button
                  className="btn-deny-knock"
                  onClick={() => handleDenyGuest(g.socketId)}
                >
                  Deny
                </button>
                <button
                  className="btn-admit-knock"
                  onClick={() => handleAdmitGuest(g.socketId)}
                >
                  Admit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="participants-drawer-toolbar">
        <span className="roster-count-text">In Meeting ({totalParticipants})</span>
        {isHost && participants.length > 0 && (
          <button
            className="btn-mute-all-toolbar"
            onClick={handleMuteAll}
            title="Mute all remote participants"
          >
            <MicOff size={13} />
            <span>Mute All</span>
          </button>
        )}
      </div>

      <div className="participants-list-view">
        {/* Local user */}
        <div className="participant-roster-item me-item">
          <div className="participant-info-group">
            <div className="roster-avatar-dot">
              {myName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="roster-name">{myName} (You)</span>
              <span className="roster-role-tag">{isHost ? 'Host' : 'Member'}</span>
            </div>
          </div>
          <div className="roster-controls-state">
            {isMicOn ? (
              <Mic size={15} color="#10b981" />
            ) : (
              <MicOff size={15} color="#ef4444" />
            )}
            {isVideoOn ? (
              <Video size={15} color="#10b981" />
            ) : (
              <VideoOff size={15} color="#ef4444" />
            )}
          </div>
        </div>

        {/* Real Remote Participants */}
        {participants.map((peer) => (
          <div key={peer.socketId} className="participant-roster-item">
            <div className="participant-info-group">
              {peer.avatar ? (
                <img
                  src={peer.avatar}
                  alt={peer.displayName}
                  className="roster-avatar-img"
                />
              ) : (
                <div className="roster-avatar-dot">
                  {(peer.displayName || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="roster-name">{peer.displayName}</span>
                <span className="roster-role-tag">{peer.isHost ? 'Host' : 'Guest'}</span>
              </div>
            </div>
            <div className="roster-controls-state">
              {isHost ? (
                <>
                  <button
                    className={`roster-action-btn ${peer.isAudioMuted ? 'btn-is-muted' : 'btn-is-active'}`}
                    onClick={() =>
                      handleHostControlMedia(
                        peer.socketId,
                        'audio',
                        peer.isAudioMuted ? 'unmute' : 'mute'
                      )
                    }
                    title={
                      peer.isAudioMuted
                        ? `Unmute ${peer.displayName}`
                        : `Mute ${peer.displayName}`
                    }
                  >
                    {peer.isAudioMuted ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button
                    className={`roster-action-btn ${peer.isVideoMuted ? 'btn-is-muted' : 'btn-is-active'}`}
                    onClick={() =>
                      handleHostControlMedia(
                        peer.socketId,
                        'video',
                        peer.isVideoMuted ? 'enable-video' : 'disable-video'
                      )
                    }
                    title={
                      peer.isVideoMuted
                        ? `Turn on ${peer.displayName}'s camera`
                        : `Turn off ${peer.displayName}'s camera`
                    }
                  >
                    {peer.isVideoMuted ? <VideoOff size={14} /> : <Video size={14} />}
                  </button>
                </>
              ) : (
                <>
                  {peer.isAudioMuted ? (
                    <MicOff size={15} color="#ef4444" />
                  ) : (
                    <Mic size={15} color="#10b981" />
                  )}
                  {peer.isVideoMuted ? (
                    <VideoOff size={15} color="#ef4444" />
                  ) : (
                    <Video size={15} color="#10b981" />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
