import React from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function LobbyVideoPreview({
  videoRef,
  isVideoOn,
  isMicOn,
  cameraError,
  displayName,
  onToggleMic,
  onToggleVideo,
}) {
  return (
    <div className="lobby-camera-panel">
      <div className="lobby-video-wrapper">
        {isVideoOn && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="lobby-video-feed"
          />
        ) : (
          <div className="lobby-video-placeholder">
            <div className="avatar-pulse-circle">
              <span className="avatar-initials">
                {(displayName || 'G').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="placeholder-text">
              {cameraError ? 'Camera access not available' : 'Camera is turned off'}
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

          <button
            className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
            onClick={onToggleVideo}
            title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
      </div>

      <div className="media-status-notice">
        <span>Audio & video are ready. You can toggle anytime during the call.</span>
      </div>
    </div>
  );
}
