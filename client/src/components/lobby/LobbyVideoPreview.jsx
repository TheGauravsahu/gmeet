import React from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function LobbyVideoPreview({
  videoRef,
  stream,
  isVideoOn,
  isMicOn,
  cameraError,
  displayName,
  onToggleMic,
  onToggleVideo,
  audioOnly = false,
}) {
  return (
    <div className="lobby-camera-panel">
      <div className="lobby-video-wrapper">
        <video
          ref={(el) => {
            if (videoRef) {
              videoRef.current = el;
            }
            if (el && stream && el.srcObject !== stream) {
              el.srcObject = stream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted
          className="lobby-video-feed"
          style={{ display: isVideoOn && !cameraError && stream ? 'block' : 'none' }}
        />

        {(!isVideoOn || cameraError || !stream) && (
          <div className="lobby-video-placeholder">
            <div className="avatar-pulse-circle">
              <span className="avatar-initials">
                {(displayName || 'G').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="placeholder-text">
              {audioOnly
                ? 'Camera-free audio call'
                : cameraError
                  ? 'Camera access not available'
                  : 'Camera is turned off'}
            </p>
          </div>
        )}

        {/* In-Preview Badges */}
        <div className="preview-top-badges">
          <span className="preview-badge live-indicator">
            <span className="green-dot" />
            Preview Ready
          </span>
          <span className="preview-badge">WebRTC Ready</span>
        </div>

        {/* Float Controls on Preview */}
        <div className="preview-overlay-dock">
          <button
            className={`control-circle-btn ${!isMicOn ? 'muted' : ''}`}
            onClick={onToggleMic}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {!audioOnly && (
            <button
              className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
              onClick={onToggleVideo}
              title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          )}
        </div>
      </div>

      <div className="media-status-notice">
        <span>
          {audioOnly
            ? 'Microphone audio only. Your camera is never requested.'
            : 'Audio & video are ready. You can toggle anytime during the call.'}
        </span>
      </div>
    </div>
  );
}
