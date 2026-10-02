import React from 'react';
import { Monitor, Mic, MicOff, Hand } from 'lucide-react';
import PeerVideoTile from './PeerVideoTile';

export default function VideoGridStage({
  isScreenSharing,
  screenVideoRef,
  localVideoRef,
  localStream,
  isVideoOn,
  isMicOn,
  myName,
  isHost,
  isHandRaised,
  totalParticipants,
  participants,
  remoteStreams,
  raisedHands,
  onControlMedia,
}) {
  return (
    <main className="meeting-stage-viewport">
      <div
        className={`video-tiles-grid ${
          isScreenSharing ? 'has-screen-share' : `tiles-count-${totalParticipants}`
        }`}
      >
        {/* Screen Share Stage (if active) */}
        {isScreenSharing && (
          <div className="video-tile-card screen-share-card">
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="screen-share-video-feed"
            />
            <div className="screen-share-floating-badge">
              <Monitor size={14} />
              <span>{myName} is presenting</span>
            </div>
          </div>
        )}

        {/* Local User Tile */}
        <div
          className={`video-tile-card ${isMicOn ? 'active-speaker-ring' : ''} ${
            !isVideoOn ? 'video-off-card' : ''
          }`}
        >
          {isVideoOn && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="tile-video-feed mirror-mode"
            />
          ) : (
            <div className="tile-avatar-view">
              <div className="tile-initial-avatar">
                {myName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Hand Raised badge */}
          {isHandRaised && (
            <div className="hand-raised-badge">
              <Hand size={16} />
            </div>
          )}

          {/* User Overlay Tag */}
          <div className="tile-user-tag">
            <span className="user-name-text">
              {myName} (You)
              {isHost && ' (Host)'}
            </span>
            <div className="tile-media-indicators">
              {!isMicOn ? (
                <span className="indicator-icon muted" title="Mic off">
                  <MicOff size={13} />
                </span>
              ) : (
                <span className="indicator-icon active" title="Mic active">
                  <Mic size={13} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* REAL Remote Participants Tiles (No mock people!) */}
        {participants.map((peer) => (
          <PeerVideoTile
            key={peer.socketId}
            peer={peer}
            stream={remoteStreams[peer.socketId]}
            isHandRaised={raisedHands[peer.socketId]}
            isHost={isHost}
            onControlMedia={onControlMedia}
          />
        ))}
      </div>
    </main>
  );
}
