import React, { useState, useEffect, useRef } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Check, Copy, AlertCircle } from 'lucide-react';

export default function LandingPreviewModal({
  isOpen,
  onClose,
  onJoinRoom,
}) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Keep streamRef synced
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Request actual camera & mic stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
      }
      return;
    }

    let activeStream = null;

    const startMedia = async () => {
      setCameraError(null);
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.warn('Initial mic+cam preview error, trying video only:', err);
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          setIsMicOn(false);
        } catch (videoErr) {
          console.error('Camera preview error:', videoErr);
          setCameraError('Camera access not granted or not available.');
          return;
        }
      }

      if (activeStream) {
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play().catch(() => {});
        }
      }
    };

    startMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
  }, [isOpen]);

  // Sync mic track enabled
  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Sync video track enabled
  const handleToggleVideo = async () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);

    if (stream) {
      const videoTrack = stream.getVideoTracks().find((t) => t.readyState === 'live');
      if (videoTrack) {
        stream.getVideoTracks().forEach((track) => {
          track.enabled = nextState;
        });
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
      } else if (nextState) {
        // Re-acquire camera if tracks were stopped
        try {
          const fresh = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const newVideoTrack = fresh.getVideoTracks()[0];
          if (newVideoTrack) {
            stream.getVideoTracks().forEach((t) => {
              t.stop();
              stream.removeTrack(t);
            });
            stream.addTrack(newVideoTrack);
            setCameraError(null);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Reacquire camera error in preview:', err);
          setCameraError('Unable to re-acquire camera feed.');
        }
      }
    }
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/lobby/xkq-92m-prv`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCloseModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    onClose();
  };

  const handleJoin = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    onClose();
    if (onJoinRoom) {
      onJoinRoom('/lobby/xkq-92m-prv');
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleCloseModal}>
          <X size={18} />
        </button>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
            Camera & Audio Preview
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Check your audio & video preview before joining room <strong>#xkq-92m-prv</strong>
          </p>
        </div>

        {/* Real Live Camera Preview Stage */}
        <div className="modal-camera-stage">
          {isVideoOn && !cameraError ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && stream && el.srcObject !== stream) {
                    el.srcObject = stream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  borderRadius: '12px',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fff',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>Live Camera Feed</span>
              </div>
            </div>
          ) : (
            <div className="simulated-cam-view">
              {cameraError ? (
                <>
                  <AlertCircle size={42} style={{ color: '#ef4444', marginBottom: 8 }} />
                  <span style={{ color: '#fca5a5' }}>{cameraError}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    Please check browser permissions
                  </span>
                </>
              ) : (
                <>
                  <VideoOff size={42} />
                  <span>Camera is turned off</span>
                </>
              )}
            </div>
          )}

          {/* In-Call Controls Toggle */}
          <div className="stage-overlay-controls">
            <button
              className={`control-circle-btn ${!isMicOn ? 'muted' : ''}`}
              onClick={handleToggleMic}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
              onClick={handleToggleVideo}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>
        </div>

        {/* Room Link Bar */}
        <div className="modal-link-box">
          <span>{window.location.origin}/lobby/xkq-92m-prv</span>
          <button className="copy-pill-btn" onClick={handleCopyLink}>
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button className="btn-glass-pill" onClick={handleCloseModal}>
            Cancel
          </button>
          <button className="btn-pill-primary" onClick={handleJoin}>
            <Video size={16} />
            <span>Join Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
