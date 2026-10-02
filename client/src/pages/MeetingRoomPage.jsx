import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Hand,
  MessageSquare,
  Users,
  Subtitles,
  ShieldCheck,
  Copy,
  Check,
  Send,
  X,
  Sparkles,
  Info,
  Maximize2,
  Volume2,
  Share2,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

// Fallback initial participants to create a lively realistic room
const INITIAL_DEMO_PEERS = [
  {
    id: 'demo-1',
    displayName: 'Elena Rostova',
    role: 'Lead Architect',
    isAudioMuted: false,
    isVideoMuted: false,
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'demo-2',
    displayName: 'Marcus Sterling',
    role: 'VP Engineering',
    isAudioMuted: true,
    isVideoMuted: false,
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'demo-3',
    displayName: 'Sarah Jenkins',
    role: 'AI Researcher',
    isAudioMuted: false,
    isVideoMuted: false,
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
];

export default function MeetingRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, user } = useAuth();

  // Settings from lobby or defaults
  const initialAudio = location.state?.initialAudio !== false;
  const initialVideo = location.state?.initialVideo !== false;
  const myName = location.state?.participantName || displayName || 'You';

  // Local media states
  const [isMicOn, setIsMicOn] = useState(initialAudio);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Call duration counter
  const [callDuration, setCallDuration] = useState(0);

  // Active drawers: 'chat' | 'participants' | 'transcripts' | null
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Captions / AI Transcript state
  const [showCaptions, setShowCaptions] = useState(true);
  const [liveCaptionText, setLiveCaptionText] = useState(
    'Sarah: "Gemini is synthesizing our cross-region telemetry in real time..."'
  );
  const [transcriptsList, setTranscriptsList] = useState([]);
  const [customTranscriptInput, setCustomTranscriptInput] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Participants in meeting
  const [participants, setParticipants] = useState(INITIAL_DEMO_PEERS);
  const [roomInfo, setRoomInfo] = useState(null);

  // Toast / link copy
  const [copiedLink, setCopiedLink] = useState(false);

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Timer for meeting duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format call duration MM:SS or HH:MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Fetch room info, initial messages & transcripts from REST API
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const [roomRes, msgRes, transcriptRes, partRes] = await Promise.allSettled([
          api.rooms.getRoom(roomCode),
          api.messages.getMessages(roomCode),
          api.transcripts.getTranscripts(roomCode),
          api.participants.getParticipants(roomCode),
        ]);

        if (roomRes.status === 'fulfilled' && roomRes.value.success) {
          setRoomInfo(roomRes.value.data.room);
        }
        if (msgRes.status === 'fulfilled' && msgRes.value.success) {
          setMessages(msgRes.value.data.messages || []);
        }
        if (transcriptRes.status === 'fulfilled' && transcriptRes.value.success) {
          setTranscriptsList(transcriptRes.value.data.transcripts || []);
        }
        if (partRes.status === 'fulfilled' && partRes.value.success) {
          const apiParticipants = partRes.value.data.participants || [];
          if (apiParticipants.length > 0) {
            // Merge with demo participants
            setParticipants((prev) => {
              const combined = [...apiParticipants];
              INITIAL_DEMO_PEERS.forEach((demo) => {
                if (!combined.some((p) => p.displayName === demo.displayName)) {
                  combined.push(demo);
                }
              });
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching meeting initial state:', err);
      }
    };

    if (roomCode) {
      loadRoomData();
    }
  }, [roomCode]);

  // 3. Initialize local webcam stream
  useEffect(() => {
    let streamInstance = null;

    const startLocalMedia = async () => {
      try {
        streamInstance = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(streamInstance);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = streamInstance;
        }
      } catch (err) {
        console.warn('Webcam permission not granted:', err);
      }
    };

    startLocalMedia();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync mic/camera track enable state
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }

    // Broadcast media state update to socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('toggle-media-state', {
        isAudioMuted: !isMicOn,
        isVideoMuted: !isVideoOn,
        isScreenSharing,
      });
    }
  }, [isMicOn, isVideoOn, localStream, isScreenSharing]);

  // 4. Socket.io Real-Time Integration
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    // Join room
    socket.emit('join-room', {
      roomCode,
      user: {
        displayName: myName,
        avatar: user?.avatar || '',
        isAudioMuted: !isMicOn,
        isVideoMuted: !isVideoOn,
      },
    });

    // Handle existing participants
    socket.on('existing-participants', ({ participants: existing }) => {
      if (existing && existing.length > 0) {
        setParticipants((prev) => {
          const map = new Map(prev.map((p) => [p.socketId || p.id, p]));
          existing.forEach((p) => map.set(p.socketId, p));
          return Array.from(map.values());
        });
      }
    });

    // Handle new user joined
    socket.on('user-joined', (newcomer) => {
      setParticipants((prev) => [...prev, newcomer]);
    });

    // Handle peer media state change
    socket.on('user-media-state-changed', ({ socketId, isAudioMuted, isVideoMuted }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId ? { ...p, isAudioMuted, isVideoMuted } : p
        )
      );
    });

    // Handle chat messages
    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activeDrawer !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
    });

    // Handle live transcripts
    socket.on('transcript-update', (t) => {
      setTranscriptsList((prev) => [...prev, t]);
      setLiveCaptionText(`${t.speaker}: "${t.text}"`);
    });

    // Handle user left
    socket.on('user-left', ({ socketId }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      socket.emit('leave-room');
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('user-media-state-changed');
      socket.off('new-message');
      socket.off('transcript-update');
      socket.off('user-left');
    };
  }, [roomCode, myName, user?.avatar]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    if (activeDrawer === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeDrawer]);

  // Screen Sharing toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn('Screen share canceled or not permitted:', err);
      }
    }
  };

  // Hand raise toggle
  const toggleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socketRef.current?.connected) {
      socketRef.current.emit('raise-hand', { isHandRaised: nextState });
    }
  };

  // Send in-call chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput.trim();
    setChatInput('');

    // Emit via socket immediately
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', { content });
    }

    // Also persist via REST
    try {
      await api.messages.sendMessage(roomCode, {
        content,
        senderName: myName,
      });
    } catch (err) {
      console.warn('Error saving message via REST:', err);
    }
  };

  // Broadcast AI live transcript
  const handleSendTranscript = async (e) => {
    e.preventDefault();
    if (!customTranscriptInput.trim()) return;

    const text = customTranscriptInput.trim();
    setCustomTranscriptInput('');

    const payload = {
      speaker: myName,
      text,
      confidence: 0.99,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit('live-transcript', payload);
    }

    try {
      await api.transcripts.addTranscript(roomCode, payload);
    } catch (err) {
      console.warn('Error saving transcript:', err);
    }
  };

  // Copy meeting link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/meet/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Leave Call
  const handleLeaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    navigate('/');
  };

  return (
    <div className="page-wrapper meeting-room-container">
      <div className="ambient-cosmos" />

      {/* ====================================================================
          1. TOP APP BAR
          ==================================================================== */}
      <header className="meeting-topbar">
        <div className="meeting-topbar-left">
          <div className="brand-icon" style={{ width: 28, height: 28 }}>
            <Video size={16} />
          </div>
          <div className="meeting-title-box">
            <h1 className="meeting-header-title">{roomInfo?.title || 'AURA Meeting'}</h1>
            <span className="meeting-code-badge">#{roomCode}</span>
          </div>

          <button
            className="copy-pill-btn"
            style={{ marginLeft: 8 }}
            onClick={handleCopyLink}
            title="Copy Meeting Link"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        <div className="meeting-topbar-center">
          <div className="duration-pill-badge">
            <span className="rec-indicator-dot" />
            <span className="timer-text">{formatTimer(callDuration)}</span>
          </div>
        </div>

        <div className="meeting-topbar-right">
          <div className="security-verified-tag">
            <ShieldCheck size={14} color="#10b981" />
            <span>E2E Verified</span>
          </div>

          <div className="spec-tag-pill">
            <Sparkles size={13} color="#c084fc" />
            <span>4K 60fps Mesh</span>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. MAIN VIDEO GRID STAGE
          ==================================================================== */}
      <main className="meeting-stage-viewport">
        <div
          className={`video-tiles-grid ${
            isScreenSharing ? 'has-screen-share' : `tiles-count-${participants.length + 1}`
          }`}
        >
          {/* Screen Share Stage (if active) */}
          {isScreenSharing && (
            <div className="video-tile-card screen-share-card">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="tile-video-feed"
              />
              <div className="tile-user-tag">
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

            {/* Hand Raised Icon */}
            {isHandRaised && (
              <div className="hand-raised-badge">
                <Hand size={16} />
              </div>
            )}

            {/* Overlay User Tag */}
            <div className="tile-user-tag">
              <span className="user-name-text">{myName} (You)</span>
              <div className="tile-media-indicators">
                {!isMicOn ? (
                  <span className="indicator-icon muted" title="Muted">
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

          {/* Remote Participants Tiles */}
          {participants.map((peer, idx) => (
            <div
              key={peer.id || peer.socketId || idx}
              className={`video-tile-card ${
                peer.activeSpeaker ? 'active-speaker-ring' : ''
              }`}
            >
              <div className="tile-avatar-view">
                {peer.avatar ? (
                  <img
                    src={peer.avatar}
                    alt={peer.displayName}
                    className="tile-peer-img"
                  />
                ) : (
                  <div className="tile-initial-avatar">
                    {(peer.displayName || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {peer.activeSpeaker && (
                <div className="audio-wave-badge">
                  <Volume2 size={13} color="#10b981" />
                  <span>Speaking</span>
                </div>
              )}

              <div className="tile-user-tag">
                <span className="user-name-text">{peer.displayName}</span>
                {peer.role && <span className="peer-role-badge">{peer.role}</span>}
                <div className="tile-media-indicators">
                  {peer.isAudioMuted ? (
                    <span className="indicator-icon muted">
                      <MicOff size={13} />
                    </span>
                  ) : (
                    <span className="indicator-icon active">
                      <Mic size={13} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Subtitle CC Caption Bar */}
        {showCaptions && liveCaptionText && (
          <div className="live-caption-overlay-bar">
            <div className="cc-sparkle-icon">
              <Sparkles size={14} color="#8b5cf6" />
            </div>
            <p className="caption-text-content">{liveCaptionText}</p>
          </div>
        )}
      </main>

      {/* ====================================================================
          3. FLOATING MEETING CONTROLS DOCK
          ==================================================================== */}
      <footer className="meeting-dock-bar">
        <div className="dock-controls-group">
          {/* Microphone */}
          <button
            className={`dock-circle-btn ${!isMicOn ? 'btn-danger' : 'btn-active'}`}
            onClick={() => setIsMicOn(!isMicOn)}
            title={isMicOn ? 'Mute Mic (Ctrl+D)' : 'Unmute Mic (Ctrl+D)'}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera */}
          <button
            className={`dock-circle-btn ${!isVideoOn ? 'btn-danger' : 'btn-active'}`}
            onClick={() => setIsVideoOn(!isVideoOn)}
            title={isVideoOn ? 'Turn Off Camera (Ctrl+E)' : 'Turn On Camera (Ctrl+E)'}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share */}
          <button
            className={`dock-circle-btn ${isScreenSharing ? 'btn-highlight' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor size={20} />
          </button>

          {/* Raise Hand */}
          <button
            className={`dock-circle-btn ${isHandRaised ? 'btn-highlight' : ''}`}
            onClick={toggleRaiseHand}
            title="Raise Hand"
          >
            <Hand size={20} />
          </button>

          {/* Live Captions Toggle */}
          <button
            className={`dock-circle-btn ${showCaptions ? 'btn-highlight' : ''}`}
            onClick={() => setShowCaptions(!showCaptions)}
            title="Toggle Live AI Captions"
          >
            <Subtitles size={20} />
          </button>

          <div className="dock-separator" />

          {/* Participants Drawer Toggle */}
          <button
            className={`dock-circle-btn ${
              activeDrawer === 'participants' ? 'btn-highlight' : ''
            }`}
            onClick={() =>
              setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')
            }
            title="Participants"
          >
            <Users size={20} />
            <span className="dock-badge-count">{participants.length + 1}</span>
          </button>

          {/* Chat Drawer Toggle */}
          <button
            className={`dock-circle-btn ${
              activeDrawer === 'chat' ? 'btn-highlight' : ''
            }`}
            onClick={() => {
              setActiveDrawer(activeDrawer === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            title="In-Call Chat"
          >
            <MessageSquare size={20} />
            {unreadChatCount > 0 && (
              <span className="dock-badge-unread">{unreadChatCount}</span>
            )}
          </button>

          {/* Transcripts Drawer Toggle */}
          <button
            className={`dock-circle-btn ${
              activeDrawer === 'transcripts' ? 'btn-highlight' : ''
            }`}
            onClick={() =>
              setActiveDrawer(activeDrawer === 'transcripts' ? null : 'transcripts')
            }
            title="AI Live Transcripts & Notes"
          >
            <Sparkles size={20} />
          </button>

          {/* Leave / End Call */}
          <button
            className="dock-end-call-btn"
            onClick={handleLeaveCall}
            title="Leave Meeting"
          >
            <PhoneOff size={20} />
            <span>Leave</span>
          </button>
        </div>
      </footer>

      {/* ====================================================================
          4. SIDE DRAWERS (CHAT / PARTICIPANTS / TRANSCRIPTS)
          ==================================================================== */}
      {activeDrawer && (
        <aside className="meeting-slide-drawer">
          <div className="drawer-header">
            <h3 className="drawer-title">
              {activeDrawer === 'chat' && 'In-Call Chat'}
              {activeDrawer === 'participants' && `Participants (${participants.length + 1})`}
              {activeDrawer === 'transcripts' && 'Live AI Transcripts'}
            </h3>
            <button
              className="modal-close-btn"
              onClick={() => setActiveDrawer(null)}
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* --- CHAT DRAWER CONTENT --- */}
          {activeDrawer === 'chat' && (
            <div className="drawer-body chat-drawer-body">
              <div className="chat-messages-container">
                {messages.length === 0 ? (
                  <div className="drawer-empty-state">
                    <MessageSquare size={32} opacity={0.3} />
                    <p>No messages yet. Say hello to everyone!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg._id || i}
                      className={`chat-message-bubble ${
                        msg.senderName === myName ? 'my-message' : ''
                      }`}
                    >
                      <div className="chat-message-meta">
                        <span className="chat-sender-name">{msg.senderName}</span>
                        <span className="chat-time">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'now'}
                        </span>
                      </div>
                      <p className="chat-message-text">{msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Send a message to everyone..."
                  className="chat-text-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="chat-send-btn"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* --- PARTICIPANTS DRAWER CONTENT --- */}
          {activeDrawer === 'participants' && (
            <div className="drawer-body">
              <div className="participants-list-view">
                {/* Local user entry */}
                <div className="participant-roster-item me-item">
                  <div className="participant-info-group">
                    <div className="roster-avatar-dot">
                      {myName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="roster-name">{myName} (You)</span>
                      <span className="roster-role-tag">Host</span>
                    </div>
                  </div>
                  <div className="roster-controls-state">
                    {isMicOn ? (
                      <Mic size={15} color="#10b981" />
                    ) : (
                      <MicOff size={15} color="#ef4444" />
                    )}
                    {isVideoOn ? (
                      <Video size={15} color="#10b981" />
                    ) : (
                      <VideoOff size={15} color="#ef4444" />
                    )}
                  </div>
                </div>

                {/* Remote peers */}
                {participants.map((peer, idx) => (
                  <div key={peer.id || peer.socketId || idx} className="participant-roster-item">
                    <div className="participant-info-group">
                      {peer.avatar ? (
                        <img
                          src={peer.avatar}
                          alt={peer.displayName}
                          className="roster-avatar-img"
                        />
                      ) : (
                        <div className="roster-avatar-dot">
                          {(peer.displayName || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="roster-name">{peer.displayName}</span>
                        <span className="roster-role-tag">{peer.role || 'Member'}</span>
                      </div>
                    </div>
                    <div className="roster-controls-state">
                      {peer.isAudioMuted ? (
                        <MicOff size={15} color="#ef4444" />
                      ) : (
                        <Mic size={15} color="#10b981" />
                      )}
                      {peer.isVideoMuted ? (
                        <VideoOff size={15} color="#ef4444" />
                      ) : (
                        <Video size={15} color="#10b981" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TRANSCRIPTS DRAWER CONTENT --- */}
          {activeDrawer === 'transcripts' && (
            <div className="drawer-body transcripts-drawer-body">
              <div className="transcripts-log-container">
                {transcriptsList.length === 0 ? (
                  <div className="drawer-empty-state">
                    <Sparkles size={32} opacity={0.3} />
                    <p>AI speech-to-text will automatically record discussion points here.</p>
                  </div>
                ) : (
                  transcriptsList.map((t, idx) => (
                    <div key={t._id || idx} className="transcript-log-item">
                      <div className="transcript-speaker-tag">
                        <span className="speaker-name">{t.speaker}</span>
                        <span className="confidence-pill">
                          {Math.round((t.confidence || 0.98) * 100)}% accurate
                        </span>
                      </div>
                      <p className="transcript-content-text">"{t.text}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add live note / transcript simulation input */}
              <form onSubmit={handleSendTranscript} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Record note / transcript..."
                  className="chat-text-input"
                  value={customTranscriptInput}
                  onChange={(e) => setCustomTranscriptInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!customTranscriptInput.trim()}
                  className="chat-send-btn"
                  title="Broadcast caption"
                >
                  <Sparkles size={16} />
                </button>
              </form>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
