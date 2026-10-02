import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';

/**
 * Remote Participant Video/Audio Tile
 */
export default function PeerVideoTile({
  peer,
  stream,
  isHandRaised,
  isHost,
  onControlMedia,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const setVideoEl = (el) => {
    videoRef.current = el;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch((err) => {
        console.warn(`[WebRTC] Video autoplay caught for ${peer.displayName}:`, err);
      });
    }
  };

  const setAudioEl = (el) => {
    audioRef.current = el;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch((err) => {
        console.warn(`[WebRTC] Audio autoplay caught for ${peer.displayName}:`, err);
      });
    }
  };

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    if (audioRef.current && stream && audioRef.current.srcObject !== stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }, [stream]);

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
      {/* Dedicated audio element ensures incoming audio ALWAYS plays even if video is toggled or off */}
      <audio ref={setAudioEl} autoPlay playsInline style={{ display: 'none' }} />

      {/* Remote Video feed */}
      <video
        ref={setVideoEl}
        autoPlay
        playsInline
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
