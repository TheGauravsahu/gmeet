import React, { memo, useRef, useEffect } from 'react';
import { Monitor, Mic, MicOff, Hand } from 'lucide-react';
import PeerVideoTile from './PeerVideoTile';

function VideoGridStageComponent({
  activeDrawer,
  isScreenSharing,
  screenStream,
  remoteScreenStreams = {},
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
  // Determine if a remote participant is currently screen sharing
  const remotePresenter = participants.find((p) => p.isScreenSharing);
  const isRemotePresenting = Boolean(remotePresenter);
  const isAnyPresenting = isScreenSharing || isRemotePresenting;

  const activeScreenShareStream = isScreenSharing
    ? screenStream
    : remotePresenter
    ? remoteScreenStreams[remotePresenter.socketId]
    : null;

  const presenterLabel = isScreenSharing
    ? 'You are presenting'
    : `${remotePresenter?.displayName || 'Participant'} is presenting`;

  // Dedicated presentation video element ref & effect
  const presentationVideoRef = useRef(null);
  const screenAudioRef = useRef(null);

  useEffect(() => {
    const video = presentationVideoRef.current;
    if (!video) return;
    if (activeScreenShareStream) {
      if (video.srcObject !== activeScreenShareStream) {
        video.srcObject = activeScreenShareStream;
      }
      video.play().catch((err) => {
        console.warn('[ScreenShare] Video autoplay caught:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [activeScreenShareStream]);

  // Sync external ref if passed from parent
  useEffect(() => {
    if (screenVideoRef) {
      screenVideoRef.current = presentationVideoRef.current;
    }
  });

  // Handle remote screen share audio (if system audio is shared)
  useEffect(() => {
    const audio = screenAudioRef.current;
    if (!audio) return;
    if (!isScreenSharing && activeScreenShareStream && activeScreenShareStream.getAudioTracks().length > 0) {
      if (audio.srcObject !== activeScreenShareStream) {
        audio.srcObject = activeScreenShareStream;
      }
      audio.play().catch(() => {});
    } else {
      audio.srcObject = null;
    }
  }, [activeScreenShareStream, isScreenSharing]);

  // Local user tile element
  const localUserTile = (
    <div
      key="local-user-tile"
      className={`video-tile-card ${isMicOn ? 'active-speaker-ring' : ''} ${
        !isVideoOn ? 'video-off-card' : ''
      }`}
    >
      <video
        ref={(el) => {
          if (localVideoRef) {
            localVideoRef.current = el;
          }
          if (el && localStream && el.srcObject !== localStream) {
            el.srcObject = localStream;
            el.play().catch(() => {});
          }
        }}
        autoPlay
        playsInline
        muted
        className="tile-video-feed mirror-mode"
        style={{ display: isVideoOn && localStream ? 'block' : 'none' }}
      />

      {(!isVideoOn || !localStream) && (
        <div className="tile-avatar-view">
          <div className="tile-initial-avatar">
            {(myName || 'G').charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {isHandRaised && (
        <div className="hand-raised-badge">
          <Hand size={16} />
        </div>
      )}

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
  );

  return (
    <main className={`meeting-stage-viewport ${activeDrawer ? 'drawer-open' : ''}`}>
      <div
        className={`video-tiles-grid ${
          isAnyPresenting ? 'has-screen-share' : `tiles-count-${totalParticipants}`
        }`}
      >
        {/* Screen Share Stage (active for either local presenter or remote presenter) */}
        {isAnyPresenting && (
          <div className="video-tile-card screen-share-card">
            <video
              ref={presentationVideoRef}
              autoPlay
              playsInline
              muted
              className="screen-share-video-feed"
            />
            {!isScreenSharing && (
              <audio ref={screenAudioRef} autoPlay playsInline />
            )}
            <div className="screen-share-floating-badge">
              <Monitor size={15} />
              <span>{presenterLabel}</span>
            </div>
          </div>
        )}

        {/* When screen sharing is active: sidebar tiles container so all cameras remain visible */}
        {isAnyPresenting ? (
          <div className="screen-share-side-tiles">
            {localUserTile}
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
        ) : (
          <>
            {localUserTile}
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
          </>
        )}
      </div>
    </main>
  );
}

export default memo(VideoGridStageComponent);
