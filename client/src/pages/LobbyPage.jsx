import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  Check,
  Shield,
  ArrowRight,
  ArrowLeft,
  Users,
  AlertCircle,
  Sparkles,
  Settings,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { displayName, setGuestName, user } = useAuth();

  const [inputName, setInputName] = useState(displayName);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef(null);

  // Fetch room details from backend
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await api.rooms.getRoom(roomCode);
        if (res.success && res.data.room) {
          setRoomData(res.data.room);
          if (res.data.room.status === 'ended') {
            setError('This meeting has already ended.');
          }
        }
      } catch (err) {
        // If room does not exist yet, prompt to create it or show error
        setError(err.message || 'Meeting room not found');
      } finally {
        setLoading(false);
      }
    };

    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode]);

  // Request user camera and microphone
  useEffect(() => {
    let localStream = null;

    const startMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(localStream);
        setCameraError(false);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or unavailable:', err);
        setCameraError(true);
      }
    };

    if (isVideoOn) {
      startMedia();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update track state when toggled
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isVideoOn, isMicOn, stream]);

  // Clean up media streams before unmounting
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/meet/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const finalName = (inputName || '').trim() || (user ? user.name : 'Guest Participant');
    if (!user) {
      setGuestName(finalName);
    }

    setJoining(true);
    try {
      // Register participant in backend
      await api.participants.joinRoom(roomCode, {
        displayName: finalName,
        isAudioMuted: !isMicOn,
        isVideoMuted: !isVideoOn,
      });

      // Pass state into meeting room
      navigate(`/meet/${roomCode}`, {
        state: {
          initialAudio: isMicOn,
          initialVideo: isVideoOn,
          participantName: finalName,
        },
      });
    } catch (err) {
      // If room was not found, allow creating on the fly or display error
      if (err.message.includes('not found')) {
        navigate(`/meet/${roomCode}`);
      } else {
        alert(err.message || 'Could not join room');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="page-wrapper lobby-page-container">
      <div className="ambient-cosmos" />

      {/* Lobby Header */}
      <header className="lobby-topbar">
        <button className="back-link-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          <span>Return Home</span>
        </button>
        <div className="lobby-brand-tag">
          <div className="brand-icon" style={{ width: 24, height: 24 }}>
            <Video size={14} />
          </div>
          <span>AURA.MEET PRE-FLIGHT</span>
        </div>
      </header>

      <main className="lobby-content-grid">
        {/* Left Column: Camera Stage & Media Controls */}
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
                    {(inputName || 'G').charAt(0).toUpperCase()}
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
              <span className="preview-badge">1080p Studio Mesh</span>
            </div>

            {/* Float Controls on Preview */}
            <div className="preview-overlay-dock">
              <button
                className={`control-circle-btn ${!isMicOn ? 'muted' : ''}`}
                onClick={() => setIsMicOn(!isMicOn)}
                title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                className={`control-circle-btn ${!isVideoOn ? 'muted' : ''}`}
                onClick={() => setIsVideoOn(!isVideoOn)}
                title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </div>

          <div className="media-status-notice">
            <span>Audio & video are ready. You can still toggle anytime during the call.</span>
          </div>
        </div>

        {/* Right Column: Meeting Info & Join Box */}
        <div className="lobby-join-panel">
          <div className="lobby-card-glass">
            <div className="join-badge">
              <Sparkles size={13} />
              <span>AURA Meeting Room</span>
            </div>

            <h2 className="lobby-room-title">
              {roomData?.title || `Room #${roomCode}`}
            </h2>

            <p className="lobby-room-desc">
              {roomData?.description ||
                `You are about to enter end-to-end encrypted room #${roomCode}. Review your display name before entering.`}
            </p>

            {error ? (
              <div className="auth-error-banner" style={{ margin: '14px 0' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleJoin} className="lobby-join-form">
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">What's your name?</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="auth-input"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={joining || (roomData && roomData.status === 'ended')}
                className="btn-pill-primary join-meeting-main-btn"
              >
                <span>{joining ? 'Entering...' : 'Join Meeting Now'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Meeting link copy box */}
            <div className="modal-link-box" style={{ marginTop: 20 }}>
              <span className="code-text">{window.location.origin}/meet/{roomCode}</span>
              <button className="copy-pill-btn" onClick={handleCopyLink}>
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Room security specs */}
            <div className="room-meta-specs">
              <div className="spec-meta-item">
                <Shield size={14} color="#10b981" />
                <span>AES-256 E2E Encrypted</span>
              </div>
              <div className="spec-meta-item">
                <Users size={14} color="#8b5cf6" />
                <span>Sub-40ms Mesh Latency</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
