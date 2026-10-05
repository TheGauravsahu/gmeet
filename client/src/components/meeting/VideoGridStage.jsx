import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import { Monitor, Mic, MicOff, Hand, Eye, EyeOff, XSquare } from 'lucide-react';
import PeerVideoTile from './PeerVideoTile';

function VideoGridStageComponent({
  activeDrawer,
  isScreenSharing,
  screenStream,
  remoteScreenStreams = {},
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
  onStopScreenShare,
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

  // Internal ref for the presentation <video> element — never exposed to parent
  const presentationVideoRef = useRef(null);
  const screenAudioRef = useRef(null);
  const activeScreenShareStreamRef = useRef(activeScreenShareStream);
  activeScreenShareStreamRef.current = activeScreenShareStream;

  // Toggle for presenter: Google Meet Presenter Banner vs Live Fullscreen Preview
  const [showSelfPreview, setShowSelfPreview] = useState(false);

  // Stable ref callback for the presentation <video> — binds stream immediately on mount
  const presentationRefCallback = useCallback((el) => {
    presentationVideoRef.current = el;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    const stream = activeScreenShareStreamRef.current;
    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.play().catch((err) => {
        console.warn('[ScreenShare] play failed on ref attach:', err);
      });
    } else {
      el.srcObject = null;
    }
  }, []);

  // Bind/rebind the presentation video whenever the stream changes
  useEffect(() => {
    const video = presentationVideoRef.current;
    if (!video) return;

    if (activeScreenShareStream) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      if (video.srcObject !== activeScreenShareStream) {
        video.srcObject = activeScreenShareStream;
      }

      video.play().catch((err) => {
        console.warn('[ScreenShare] play failed on effect:', err);
      });

      const videoTrack = activeScreenShareStream.getVideoTracks()[0];
      if (videoTrack) {
        const handleUnmute = () => {
          video.play().catch(() => {});
        };
        videoTrack.addEventListener('unmute', handleUnmute);
        return () => {
          videoTrack.removeEventListener('unmute', handleUnmute);
        };
      }
    } else {
      video.srcObject = null;
    }
  }, [activeScreenShareStream]);

  // Handle remote screen share audio (if system audio is shared)
  useEffect(() => {
    const audio = screenAudioRef.current;
    if (!audio) return;
    if (
      !isScreenSharing &&
      activeScreenShareStream &&
      activeScreenShareStream.getAudioTracks().length > 0
    ) {
      if (audio.srcObject !== activeScreenShareStream) {
        audio.srcObject = activeScreenShareStream;
      }
      audio.play().catch(() => {});
    } else {
      audio.srcObject = null;
    }
  }, [activeScreenShareStream, isScreenSharing]);

  // Local user tile — always shows camera (localStream), separate from screen share
  const localUserTile = (
    <div
      key="local-user-tile"
      className={`video-tile-card ${isMicOn ? 'active-speaker-ring' : ''} ${
        !isVideoOn ? 'video-off-card' : ''
      }`}
    >
      <video
        ref={(el) => {
          if (localVideoRef) localVideoRef.current = el;
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
        {/* Screen Share Stage — big presentation area */}
        {isAnyPresenting && (
          <div className="video-tile-card screen-share-card">
            {/* If local user is presenting and hasn't toggled full preview, show Google Meet presenter card */}
            {isScreenSharing && !showSelfPreview ? (
              <div className="presenter-stage-card">
                <div className="presenter-icon-box">
                  <Monitor size={44} />
                </div>
                <h2 className="presenter-stage-title">You're presenting to everyone</h2>
                <p className="presenter-stage-subtitle">
                  Your screen is being shared with everyone in this call.
                </p>
                <div className="presenter-actions-row">
                  {onStopScreenShare && (
                    <button
                      className="stop-presenting-pill"
                      onClick={onStopScreenShare}
                      title="Stop presenting"
                    >
                      <XSquare size={16} />
                      Stop presenting
                    </button>
                  )}
                  <button
                    className="view-preview-btn"
                    onClick={() => setShowSelfPreview(true)}
                    title="View your shared screen"
                  >
                    <Eye size={16} />
                    View presentation
                  </button>
                </div>
                {/* Keep the video element mounted so the media stream stays active */}
                <video
                  ref={presentationRefCallback}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <>
                <video
                  ref={presentationRefCallback}
                  autoPlay
                  playsInline
                  muted
                  className="screen-share-video-feed"
                />
                {/* Audio for remote screen share system audio */}
                {!isScreenSharing && (
                  <audio ref={screenAudioRef} autoPlay playsInline />
                )}
                <div className="screen-share-floating-badge">
                  <Monitor size={15} />
                  <span>{presenterLabel}</span>
                  {isScreenSharing && (
                    <button
                      className="inline-return-btn"
                      onClick={() => setShowSelfPreview(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginLeft: '8px',
                      }}
                    >
                      Hide preview
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Camera tiles — in sidebar when presenting, full grid otherwise */}
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

