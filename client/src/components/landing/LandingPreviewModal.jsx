import React, { useState } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Check, Copy } from 'lucide-react';

export default function LandingPreviewModal({
  isOpen,
  onClose,
  onJoinRoom,
}) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/xkq-92m-prv`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
            Ready to Join the Meeting?
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Check your audio & video preview before joining room <strong>#xkq-92m-prv</strong>
          </p>
        </div>

        {/* Simulated Live Camera Box */}
        <div className="modal-camera-stage">
          {isVideoOn ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                alt="Self camera feed"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>HD 1080p • 60fps</span>
              </div>
            </div>
          ) : (
            <div className="simulated-cam-view">
              <VideoOff size={42} />
              <span>Camera is turned off</span>
            </div>
          )}

          {/* In-Call Controls Toggle */}
          <div className="stage-overlay-controls">
            <button
              className={`control-circle-btn ${!isMicOn ? 'muted' : ''}`}
              onClick={() => setIsMicOn(!isMicOn)}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
              onClick={() => setIsVideoOn(!isVideoOn)}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>
        </div>

        {/* Room Link Bar */}
        <div className="modal-link-box">
          <span>{window.location.origin}/meet/xkq-92m-prv</span>
          <button className="copy-pill-btn" onClick={handleCopyLink}>
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button className="btn-glass-pill" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-pill-primary"
            onClick={() => {
              onClose();
              onJoinRoom('/meet/xkq-92m-prv');
            }}
          >
            <Video size={16} />
            <span>Join Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
