import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';

/**
 * Remote Participant Video/Audio Tile
 * High-performance, zero-latency audio playback & WebRTC track synchronization
 */
function PeerVideoTileComponent({
  peer,
  stream,
  isHandRaised,
  isHost,
  onControlMedia,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [, setTrackVersion] = useState(0);

  // Instant audio & video playback helper
  const tryPlayMedia = useCallback(() => {
    if (audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.warn(`[WebRTC] Audio playback failed for ${peer.displayName}:`, err);
        }
      });
    }

    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [peer.displayName, stream]);

  const setVideoEl = useCallback((el) => {
    videoRef.current = el;
  }, []);

  const setAudioEl = useCallback((el) => {
    audioRef.current = el;
  }, []);

  // Immediate playback as soon as stream or tracks change (eliminates audio arrival delay!)
  useEffect(() => {
    if (!stream) return;

    tryPlayMedia();

    const handleTrackChange = () => {
      tryPlayMedia();
      setTrackVersion((v) => v + 1);
    };

    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);

    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream, tryPlayMedia]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

  const showVideo = !peer.isVideoMuted && hasVideoTrack;

  return (
    <div
      className={`video-tile-card ${peer.activeSpeaker ? 'active-speaker-ring' : ''} ${
        !showVideo ? 'video-off-card' : ''
      }`}
    >
      {/* Offscreen audio element ensures incoming audio ALWAYS plays without display:none throttling */}
      <audio
        ref={setAudioEl}
        autoPlay
        playsInline
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* Remote Video feed (muted to prevent duplicate audio conflict with audio element) */}
      <video
        ref={setVideoEl}
        autoPlay
        playsInline
        muted
        className={`tile-video-feed ${!showVideo ? 'hidden-feed' : ''}`}
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* When video is off: Google Meet style avatar */}
      {!showVideo && (
        <div className="tile-avatar-view">
          {peer.avatar ? (
            <img src={peer.avatar} alt={peer.displayName} className="tile-peer-img" />
          ) : (
            <div className="tile-initial-avatar">
              {(peer.displayName || 'G').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Hand Raised badge */}
      {isHandRaised && (
        <div className="hand-raised-badge" title={`${peer.displayName} raised hand`}>
          <Hand size={16} />
        </div>
      )}

      {/* Speaking badge */}
      {peer.activeSpeaker && (
        <div className="audio-wave-badge">
          <span>Speaking</span>
        </div>
      )}

      {/* Host Quick Controls Overlay on Tile */}
      {isHost && onControlMedia && (
        <div className="tile-host-quick-actions">
          <button
            className={`tile-quick-btn ${peer.isAudioMuted ? 'btn-is-muted' : 'btn-is-active'}`}
            onClick={(e) => {
              e.stopPropagation();
              onControlMedia(
                peer.socketId,
                'audio',
                peer.isAudioMuted ? 'unmute' : 'mute'
              );
            }}
            title={peer.isAudioMuted ? `Unmute ${peer.displayName}` : `Mute ${peer.displayName}`}
          >
            {peer.isAudioMuted ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
          <button
            className={`tile-quick-btn ${peer.isVideoMuted ? 'btn-is-muted' : 'btn-is-active'}`}
            onClick={(e) => {
              e.stopPropagation();
              onControlMedia(
                peer.socketId,
                'video',
                peer.isVideoMuted ? 'enable-video' : 'disable-video'
              );
            }}
            title={
              peer.isVideoMuted
                ? `Turn on ${peer.displayName}'s camera`
                : `Turn off ${peer.displayName}'s camera`
            }
          >
            {peer.isVideoMuted ? <VideoOff size={13} /> : <Video size={13} />}
          </button>
        </div>
      )}

      {/* Bottom overlay with peer name & mic indicator */}
      <div className="tile-user-tag">
        <span className="user-name-text">
          {peer.displayName || 'Participant'}
          {peer.isHost && ' (Host)'}
        </span>
        <div className="tile-media-indicators">
          {peer.isAudioMuted ? (
            <span className="indicator-icon muted" title="Microphone off">
              <MicOff size={13} />
            </span>
          ) : (
            <span className="indicator-icon active" title="Microphone active">
              <Mic size={13} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PeerVideoTileComponent);
