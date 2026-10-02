import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import '../styles/Meeting.css';

// Modular Meeting Components
import MeetingTopBar from '../components/meeting/MeetingTopBar';
import HostKnockBanner from '../components/meeting/HostKnockBanner';
import VideoGridStage from '../components/meeting/VideoGridStage';
import MeetingDock from '../components/meeting/MeetingDock';
import ChatDrawer from '../components/meeting/ChatDrawer';
import ParticipantsDrawer from '../components/meeting/ParticipantsDrawer';
import {
  WaitingApprovalModal,
  AdmissionDeniedModal,
  GeminiKeyModal,
  FloatingToast,
} from '../components/meeting/MeetingModals';

// Google STUN servers for reliable peer-to-peer WebRTC connections
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export default function MeetingRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, user } = useAuth();

  // Settings passed from lobby
  const initialAudio = location.state?.initialAudio !== false;
  const initialVideo = location.state?.initialVideo !== false;
  const [myName, setMyName] = useState(
    location.state?.participantName || (user ? user.name : 'Guest')
  );

  // Host & Admission state
  const [isHost, setIsHost] = useState(location.state?.isHost || false);
  const [pendingGuests, setPendingGuests] = useState([]);
  const [waitingForAdmission, setWaitingForAdmission] = useState(false);
  const [admissionDenied, setAdmissionDenied] = useState(false);

  // Local media state
  const [isMicOn, setIsMicOn] = useState(initialAudio);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Call duration counter
  const [callDuration, setCallDuration] = useState(0);

  // Floating notification toast (e.g., host muted you)
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Active side drawer: 'chat' | 'participants' | null
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // REAL Remote participants list (no mock peers!)
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [raisedHands, setRaisedHands] = useState({});

  // Room details
  const [roomInfo, setRoomInfo] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // In-Call Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  // Aura AI state
  const [isAuraThinking, setIsAuraThinking] = useState(false);
  const [auraAutoReply, setAuraAutoReply] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('aura_gemini_api_key') || ''
  );
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(geminiApiKey);

  // Refs
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream
  const pendingCandidatesRef = useRef(new Map()); // socketId -> RTCIceCandidateInit[]

  // Keep localStreamRef synced
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const activeDrawerRef = useRef(activeDrawer);
  activeDrawerRef.current = activeDrawer;

  const isMicOnRef = useRef(isMicOn);
  isMicOnRef.current = isMicOn;

  const isVideoOnRef = useRef(isVideoOn);
  isVideoOnRef.current = isVideoOn;

  const myNameRef = useRef(myName);
  myNameRef.current = myName;

  const userRef = useRef(user);
  userRef.current = user;

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const [mediaReady, setMediaReady] = useState(false);

  // 1. Meeting Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Load Room info & existing chat messages from REST API
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const [roomRes, msgRes] = await Promise.allSettled([
          api.rooms.getRoom(roomCode),
          api.messages.getMessages(roomCode),
        ]);

        if (roomRes.status === 'fulfilled' && roomRes.value.success) {
          setRoomInfo(roomRes.value.data.room);
        }
        if (msgRes.status === 'fulfilled' && msgRes.value.success) {
          setMessages(msgRes.value.data.messages || []);
        }
      } catch (err) {
        console.warn('Error fetching meeting initial state:', err);
      }
    };

    if (roomCode) {
      loadRoomData();
    }
  }, [roomCode]);

  // --------------------------------------------------------------------------
  // WebRTC Peer Connection Helper
  // --------------------------------------------------------------------------
  const createPeerConnection = useCallback(
    (targetSocketId, isInitiator = false) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        peerConnectionsRef.current.get(targetSocketId).close();
      }

      console.log(`[WebRTC] Creating RTCPeerConnection for ${targetSocketId} (initiator: ${isInitiator})`);
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(targetSocketId, pc);

      let remoteStream = remoteStreamsRef.current.get(targetSocketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, remoteStream);
      }
      setRemoteStreams((prev) => ({ ...prev, [targetSocketId]: remoteStream }));

      // Add local audio and video tracks
      const streamToAdd = localStreamRef.current;
      if (streamToAdd) {
        streamToAdd.getTracks().forEach((track) => {
          pc.addTrack(track, streamToAdd);
        });
      }

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log(`[WebRTC] ontrack from ${targetSocketId}:`, event.track?.kind);
        const incomingTrack = event.track;
        if (incomingTrack && !remoteStream.getTracks().some((t) => t.id === incomingTrack.id)) {
          remoteStream.addTrack(incomingTrack);
        }
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
              remoteStream.addTrack(track);
            }
          });
        }
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSocketId]: remoteStream,
        }));
      };

      // Handle ICE candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`);
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (peerConnectionsRef.current.has(targetSocketId)) {
            try {
              peerConnectionsRef.current.get(targetSocketId).close();
            } catch (_) {}
            peerConnectionsRef.current.delete(targetSocketId);
          }
          remoteStreamsRef.current.delete(targetSocketId);
          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[targetSocketId];
            return updated;
          });
          setParticipants((prev) => prev.filter((p) => p.socketId !== targetSocketId));
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[targetSocketId];
            return updated;
          });
        }
      };

      // If initiator, create and send SDP offer
      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socketRef.current?.connected) {
              socketRef.current.emit('webrtc-offer', {
                targetSocketId,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error('[WebRTC] Error creating offer:', err));
      }

      return pc;
    },
    []
  );

  // --------------------------------------------------------------------------
  // 3. Local Media Setup (Camera & Microphone)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let currentStream = null;

    const startLocalMedia = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Apply initial mute settings
        currentStream.getVideoTracks().forEach((t) => {
          t.enabled = initialVideo;
        });
        currentStream.getAudioTracks().forEach((t) => {
          t.enabled = initialAudio;
        });

        localStreamRef.current = currentStream;
        setLocalStream(currentStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = currentStream;
        }

        // Attach local tracks to any peer connections that were established early
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          currentStream.getTracks().forEach((track) => {
            const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
            if (existingSender) {
              existingSender.replaceTrack(track).catch(console.warn);
            } else {
              try {
                pc.addTrack(track, currentStream);
              } catch (e) {
                console.warn('[WebRTC] Error adding track to existing PC:', e);
              }
            }
          });
        });
      } catch (err) {
        console.warn('Webcam/Mic permission error:', err);
      } finally {
        setMediaReady(true);
      }
    };

    startLocalMedia();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initialAudio, initialVideo]);

  // Sync mic & video enabled states on local stream
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('toggle-media-state', {
        isAudioMuted: !isMicOn,
        isVideoMuted: !isVideoOn,
        isScreenSharing,
      });
    }
  }, [isMicOn, isVideoOn, localStream, isScreenSharing]);

  // --------------------------------------------------------------------------
  // 4. Socket.io Real-Time Signaling, WebRTC Mesh & Host Admission
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mediaReady) return;

    const socket = connectSocket();
    socketRef.current = socket;

    // Join room event (server checks host admission)
    socket.emit('join-room', {
      roomCode,
      user: {
        displayName: myNameRef.current,
        avatar: userRef.current?.avatar || '',
        isAudioMuted: !isMicOnRef.current,
        isVideoMuted: !isVideoOnRef.current,
        isHost: isHostRef.current,
      },
    });

    // 4a. Host Status
    socket.on('host-status', ({ isHost: hostStatus, assignedName }) => {
      console.log('[Socket] Host status updated:', hostStatus, assignedName);
      setIsHost(!!hostStatus);
      if (assignedName && (!user || !user.name)) {
        setMyName(assignedName);
        myNameRef.current = assignedName;
      }
    });

    // 4b. Knocking / Admission Events
    socket.on('waiting-for-host', () => {
      setWaitingForAdmission(true);
    });

    socket.on('join-approved', ({ isHost: hostStatus, assignedName }) => {
      console.log('[Socket] join-approved received, entering room now...', assignedName);
      setWaitingForAdmission(false);
      setIsHost(!!hostStatus);

      const effectiveName = assignedName || myNameRef.current;
      if (assignedName && (!user || !user.name)) {
        setMyName(assignedName);
        myNameRef.current = assignedName;
      }

      // Re-emit join-room so that the approved guest enters the room and exchanges peer list
      socket.emit('join-room', {
        roomCode,
        user: {
          displayName: effectiveName,
          avatar: userRef.current?.avatar || '',
          isAudioMuted: !isMicOnRef.current,
          isVideoMuted: !isVideoOnRef.current,
          isHost: !!hostStatus,
        },
      });
    });

    socket.on('join-denied', () => {
      setWaitingForAdmission(false);
      setAdmissionDenied(true);
    });

    socket.on('guest-knocking', (guest) => {
      console.log('[Host] Guest knocking:', guest);
      setPendingGuests((prev) => {
        if (prev.some((g) => g.socketId === guest.socketId)) return prev;
        return [...prev, guest];
      });
    });

    socket.on('pending-knocks-updated', (knocks) => {
      setPendingGuests(knocks || []);
    });

    // 4c. Existing participants list when admitted
    socket.on('existing-participants', async ({ participants: existing }) => {
      if (!existing || existing.length === 0) return;

      console.log('[WebRTC] Received existing participants:', existing);
      setParticipants((prev) => {
        const map = new Map(prev.map((p) => [p.socketId, p]));
        existing.forEach((p) => map.set(p.socketId, p));
        return Array.from(map.values());
      });

      // Initiate WebRTC offer to each existing peer
      existing.forEach((peer) => {
        createPeerConnection(peer.socketId, true);
      });
    });

    // 4d. New user joined room
    socket.on('user-joined', (newcomer) => {
      console.log('[WebRTC] New user joined room:', newcomer);
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newcomer.socketId)) return prev;
        return [...prev, newcomer];
      });
    });

    // 4e. WebRTC Offer Received
    socket.on('webrtc-offer', async ({ callerSocketId, offer }) => {
      console.log('[WebRTC] Received offer from:', callerSocketId);
      const pc = createPeerConnection(callerSocketId, false);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const queue = pendingCandidatesRef.current.get(callerSocketId) || [];
        for (const candidate of queue) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
        }
        pendingCandidatesRef.current.delete(callerSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          targetSocketId: callerSocketId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // 4f. WebRTC Answer Received
    socket.on('webrtc-answer', async ({ responderSocketId, answer }) => {
      console.log('[WebRTC] Received answer from:', responderSocketId);
      const pc = peerConnectionsRef.current.get(responderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          const queue = pendingCandidatesRef.current.get(responderSocketId) || [];
          for (const candidate of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
          }
          pendingCandidatesRef.current.delete(responderSocketId);
        } catch (err) {
          console.error('[WebRTC] Error handling answer:', err);
        }
      }
    });

    // 4g. ICE Candidate Received
    socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        const queue = pendingCandidatesRef.current.get(senderSocketId) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(senderSocketId, queue);
      }
    });

    // 4h. Peer Media State Changed
    socket.on('user-media-state-changed', ({ socketId, isAudioMuted, isVideoMuted }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId ? { ...p, isAudioMuted, isVideoMuted } : p
        )
      );
    });

    // 4i. Peer Raised Hand
    socket.on('user-raised-hand', ({ socketId, isHandRaised: raised }) => {
      setRaisedHands((prev) => ({ ...prev, [socketId]: raised }));
    });

    // 4j. Chat messages (including Aura AI replies & @mentions)
    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activeDrawerRef.current !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);

        const content = (msg.content || '').toLowerCase();
        const myHandle = `@${myNameRef.current.replace(/\s+/g, '_').toLowerCase()}`;
        const isFromMe = msg.senderName === myNameRef.current;

        if (!isFromMe && (content.includes(myHandle) || content.includes('@everyone') || content.includes('@all'))) {
          setToastMessage(`💬 ${msg.senderName} mentioned you: "${msg.content.slice(0, 34)}..."`);
        }
      }
    });

    // 4k. Aura AI status
    socket.on('aura-status', ({ isThinking }) => {
      setIsAuraThinking(!!isThinking);
    });

    // 4l. User Left room
    socket.on('user-left', ({ socketId, displayName }) => {
      console.log('[WebRTC] User left:', socketId, displayName);
      if (peerConnectionsRef.current.has(socketId)) {
        try {
          peerConnectionsRef.current.get(socketId).close();
        } catch (_) {}
        peerConnectionsRef.current.delete(socketId);
      }
      remoteStreamsRef.current.delete(socketId);
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
      setParticipants((prev) => {
        const leaving = prev.find((p) => p.socketId === socketId);
        const name = displayName || leaving?.displayName || 'Participant';
        setToastMessage(`👋 ${name} left the meeting`);
        return prev.filter((p) => p.socketId !== socketId);
      });
      setRaisedHands((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    // 4m. Host Remote Media Action (Mute/Unmute & Turn On/Off Camera)
    socket.on('host-media-action', async ({ mediaType, action, hostName }) => {
      console.log(`[Host Action] ${hostName} executed ${action} on ${mediaType}`);

      if (mediaType === 'audio') {
        if (action === 'mute') {
          setIsMicOn(false);
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = false;
            });
          }
          socket.emit('toggle-media-state', {
            isAudioMuted: true,
            isVideoMuted: !isVideoOnRef.current,
            isScreenSharing: false,
          });
          setToastMessage(`${hostName || 'Host'} muted your microphone`);
        } else if (action === 'unmute') {
          setIsMicOn(true);
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = true;
            });
          }
          socket.emit('toggle-media-state', {
            isAudioMuted: false,
            isVideoMuted: !isVideoOnRef.current,
            isScreenSharing: false,
          });
          setToastMessage(`${hostName || 'Host'} unmuted your microphone`);
        }
      } else if (mediaType === 'video') {
        if (action === 'disable-video') {
          setIsVideoOn(false);
          if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach((t) => {
              t.enabled = false;
            });
          }
          socket.emit('toggle-media-state', {
            isAudioMuted: !isMicOnRef.current,
            isVideoMuted: true,
            isScreenSharing: false,
          });
          setToastMessage(`${hostName || 'Host'} turned off your camera`);
        } else if (action === 'enable-video') {
          setIsVideoOn(true);
          if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
            localStreamRef.current.getVideoTracks().forEach((t) => {
              t.enabled = true;
            });
          }
          socket.emit('toggle-media-state', {
            isAudioMuted: !isMicOnRef.current,
            isVideoMuted: false,
            isScreenSharing: false,
          });
          setToastMessage(`${hostName || 'Host'} turned on your camera`);
        }
      }
    });

    return () => {
      socket.emit('leave-room');
      socket.off('host-status');
      socket.off('waiting-for-host');
      socket.off('join-approved');
      socket.off('join-denied');
      socket.off('guest-knocking');
      socket.off('pending-knocks-updated');
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
      socket.off('user-media-state-changed');
      socket.off('user-raised-hand');
      socket.off('new-message');
      socket.off('aura-status');
      socket.off('user-left');
      socket.off('host-media-action');

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, [roomCode, mediaReady, createPeerConnection]);

  // Resume any paused video/audio on user interaction (resolves browser autoplay policy)
  useEffect(() => {
    const resumeMedia = () => {
      document.querySelectorAll('audio, video').forEach((el) => {
        if (el.paused && el.srcObject) {
          el.play().catch(() => {});
        }
      });
    };

    window.addEventListener('click', resumeMedia);
    window.addEventListener('keydown', resumeMedia);
    return () => {
      window.removeEventListener('click', resumeMedia);
      window.removeEventListener('keydown', resumeMedia);
    };
  }, []);

  // Broadcast leave-room before browser tab is closed or navigated away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-room');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Scroll to bottom on new chat messages
  useEffect(() => {
    if (activeDrawer === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeDrawer, isAuraThinking]);

  // --------------------------------------------------------------------------
  // Host Admission Controls (Admit / Deny Guests)
  // --------------------------------------------------------------------------
  const handleAdmitGuest = (guestSocketId) => {
    if (socketRef.current?.connected) {
      const guest = pendingGuests.find((g) => g.socketId === guestSocketId);
      socketRef.current.emit('admit-guest', {
        roomCode,
        guestSocketId,
        displayName: guest?.displayName || '',
      });
      setPendingGuests((prev) => prev.filter((g) => g.socketId !== guestSocketId));
    }
  };

  const handleDenyGuest = (guestSocketId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('deny-guest', { roomCode, guestSocketId });
      setPendingGuests((prev) => prev.filter((g) => g.socketId !== guestSocketId));
    }
  };

  const handleAdmitAll = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admit-all-guests', { roomCode });
      setPendingGuests([]);
    }
  };

  const handleHostControlMedia = (targetSocketId, mediaType, action) => {
    if (!isHost || !socketRef.current?.connected) return;
    socketRef.current.emit('host-control-media', {
      roomCode,
      targetSocketId,
      mediaType,
      action,
    });
  };

  const handleMuteAll = () => {
    if (!isHost || !socketRef.current?.connected) return;
    socketRef.current.emit('host-mute-all', { roomCode });
    setToastMessage('Muted all participants in the meeting');
  };

  // --------------------------------------------------------------------------
  // Camera & Microphone Controls (Seamless toggle & dynamic acquisition)
  // --------------------------------------------------------------------------
  const toggleCamera = async () => {
    const hasLiveVideo =
      localStream &&
      localStream.getVideoTracks().length > 0 &&
      localStream.getVideoTracks().some((t) => t.readyState === 'live');

    if (hasLiveVideo) {
      const nextState = !isVideoOn;
      setIsVideoOn(nextState);
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
      if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {});
      }
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle-media-state', {
          isAudioMuted: !isMicOn,
          isVideoMuted: !nextState,
          isScreenSharing,
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const newTrack = stream.getVideoTracks()[0];
        if (newTrack) {
          if (localStream) {
            localStream.getVideoTracks().forEach((t) => {
              t.stop();
              localStream.removeTrack(t);
            });
            localStream.addTrack(newTrack);
          } else {
            setLocalStream(stream);
            localStreamRef.current = stream;
          }

          setIsVideoOn(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(() => {});
          }

          peerConnectionsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(newTrack).catch(console.warn);
            } else {
              try {
                pc.addTrack(newTrack, localStreamRef.current);
              } catch (e) {
                console.warn(e);
              }
            }
          });

          if (socketRef.current?.connected) {
            socketRef.current.emit('toggle-media-state', {
              isAudioMuted: !isMicOn,
              isVideoMuted: false,
              isScreenSharing,
            });
          }
        }
      } catch (err) {
        console.warn('Could not turn on camera dynamically:', err);
      }
    }
  };

  const toggleMic = async () => {
    const hasAudio = localStream && localStream.getAudioTracks().length > 0;
    if (hasAudio) {
      const nextState = !isMicOn;
      setIsMicOn(nextState);
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle-media-state', {
          isAudioMuted: !nextState,
          isVideoMuted: !isVideoOn,
          isScreenSharing,
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicOn(true);
        peerConnectionsRef.current.forEach((pc) => {
          stream.getAudioTracks().forEach((track) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
            if (sender) {
              sender.replaceTrack(track).catch(console.warn);
            } else {
              try {
                pc.addTrack(track, stream);
              } catch (e) {
                console.warn(e);
              }
            }
          });
        });
        if (socketRef.current?.connected) {
          socketRef.current.emit('toggle-media-state', {
            isAudioMuted: false,
            isVideoMuted: !isVideoOn,
            isScreenSharing,
          });
        }
      } catch (err) {
        console.warn('Could not turn on mic dynamically:', err);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Screen Sharing
  // --------------------------------------------------------------------------
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    const localVideoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (localVideoTrack) {
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(localVideoTrack);
        }
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('toggle-media-state', { isScreenSharing: false });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setScreenStream(displayStream);
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }

        const screenVideoTrack = displayStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        });

        if (socketRef.current?.connected) {
          socketRef.current.emit('toggle-media-state', { isScreenSharing: true });
        }

        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn('Screen share canceled:', err);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Hand Raise
  // --------------------------------------------------------------------------
  const toggleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socketRef.current?.connected) {
      socketRef.current.emit('raise-hand', { isHandRaised: nextState });
    }
  };

  // --------------------------------------------------------------------------
  // Chat & @Mention Autocomplete (Google Meet style)
  // --------------------------------------------------------------------------
  const allMentionCandidates = [
    {
      id: 'aura',
      name: 'Aura AI',
      handle: 'aura',
      mentionText: '@aura',
      isAi: true,
      description: 'Gemini Copilot',
    },
    {
      id: 'everyone',
      name: 'Everyone',
      handle: 'everyone',
      mentionText: '@everyone',
      isEveryone: true,
      description: 'Notify all members',
    },
    // Remote participants
    ...participants.map((p) => ({
      id: p.socketId,
      name: p.displayName,
      handle: p.displayName.replace(/\s+/g, '_').toLowerCase(),
      mentionText: `@${p.displayName.replace(/\s+/g, '_')}`,
      role: p.isHost ? 'Host' : 'Guest',
      avatar: p.avatar,
    })),
  ];

  const filteredMentions =
    mentionQuery !== null
      ? allMentionCandidates.filter(
          (c) =>
            c.name.toLowerCase().includes(mentionQuery) ||
            c.handle.toLowerCase().includes(mentionQuery)
        )
      : [];

  const handleChatInputChange = (e) => {
    const value = e.target.value;
    setChatInput(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionSelectedIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (candidate) => {
    const input = chatInputRef.current;
    const cursorPos = input ? input.selectionStart : chatInput.length;
    const textBeforeCursor = chatInput.slice(0, cursorPos);
    const textAfterCursor = chatInput.slice(cursorPos);
    const newBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, `${candidate.mentionText} `);

    setChatInput(newBefore + textAfterCursor);
    setMentionQuery(null);

    setTimeout(() => {
      if (input) {
        input.focus();
        const newPos = newBefore.length;
        input.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleChatKeyDown = (e) => {
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex((prev) =>
          (prev - 1 + filteredMentions.length) % filteredMentions.length
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentions[mentionSelectedIndex]);
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
      }
    }
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const regex = /(@[a-zA-Z0-9_-]+)/g;
    const parts = content.split(regex);

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionLower = part.toLowerCase();
        const myHandle = `@${myName.replace(/\s+/g, '_').toLowerCase()}`;

        let chipClass = 'chat-mention-tag';
        if (mentionLower === '@aura') {
          chipClass += ' mention-aura';
        } else if (mentionLower === '@everyone' || mentionLower === '@all') {
          chipClass += ' mention-everyone';
        } else if (mentionLower === myHandle) {
          chipClass += ' mention-me';
        } else {
          chipClass += ' mention-user';
        }

        return (
          <span
            key={i}
            className={chipClass}
            onClick={() => {
              setChatInput((prev) => (prev ? `${prev} ${part} ` : `${part} `));
              if (chatInputRef.current) chatInputRef.current.focus();
            }}
            title={`Mention ${part}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // --------------------------------------------------------------------------
  // Chat & Aura AI Messaging
  // --------------------------------------------------------------------------
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput.trim();
    setChatInput('');
    setMentionQuery(null);

    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', {
        content,
        apiKey: geminiApiKey,
        autoReply: auraAutoReply,
      });
    }

    try {
      await api.messages.sendMessage(roomCode, {
        content,
        senderName: myName,
      });
    } catch (err) {
      console.warn('Error saving message to REST:', err);
    }
  };

  const handleTriggerAuraPrompt = (promptText) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', {
        content: promptText,
        apiKey: geminiApiKey,
        autoReply: true,
      });
    }
  };

  const handleSaveGeminiKey = (e) => {
    e.preventDefault();
    const cleanKey = tempKeyInput.trim();
    setGeminiApiKey(cleanKey);
    localStorage.setItem('aura_gemini_api_key', cleanKey);
    setShowKeyModal(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/meet/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLeaveCall = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room');
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch (_) {}
    });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    setRemoteStreams({});
    setParticipants([]);

    navigate(`/ended/${roomCode}`, {
      state: {
        roomCode,
        roomTitle: roomInfo?.title || `Meeting #${roomCode}`,
        callDuration,
        participantName: myName,
        isHost,
      },
    });
  };

  const totalParticipants = participants.length + 1; // You + real peers

  return (
    <div className="page-wrapper meeting-room-container">
      <div className="ambient-cosmos" />

      {/* 1. TOP APP BAR */}
      <MeetingTopBar
        roomInfo={roomInfo}
        roomCode={roomCode}
        isHost={isHost}
        copiedLink={copiedLink}
        handleCopyLink={handleCopyLink}
        callDuration={callDuration}
        formatTimer={formatTimer}
      />

      {/* FLOATING HOST ADMISSION ALERT (When guests are knocking) */}
      <HostKnockBanner
        pendingGuests={pendingGuests}
        handleAdmitGuest={handleAdmitGuest}
        handleDenyGuest={handleDenyGuest}
        handleAdmitAll={handleAdmitAll}
      />

      {/* 2. MAIN VIDEO GRID STAGE */}
      <VideoGridStage
        activeDrawer={activeDrawer}
        isScreenSharing={isScreenSharing}
        screenVideoRef={screenVideoRef}
        localVideoRef={localVideoRef}
        localStream={localStream}
        isVideoOn={isVideoOn}
        isMicOn={isMicOn}
        myName={myName}
        isHost={isHost}
        isHandRaised={isHandRaised}
        totalParticipants={totalParticipants}
        participants={participants}
        remoteStreams={remoteStreams}
        raisedHands={raisedHands}
        onControlMedia={handleHostControlMedia}
      />

      {/* 3. FLOATING MEETING CONTROLS DOCK */}
      <MeetingDock
        isMicOn={isMicOn}
        toggleMic={toggleMic}
        isVideoOn={isVideoOn}
        toggleCamera={toggleCamera}
        isScreenSharing={isScreenSharing}
        toggleScreenShare={toggleScreenShare}
        isHandRaised={isHandRaised}
        toggleRaiseHand={toggleRaiseHand}
        activeDrawer={activeDrawer}
        setActiveDrawer={setActiveDrawer}
        totalParticipants={totalParticipants}
        unreadChatCount={unreadChatCount}
        setUnreadChatCount={setUnreadChatCount}
        handleLeaveCall={handleLeaveCall}
      />

      {/* 4. SIDE DRAWERS */}
      {activeDrawer && (
        <aside className="meeting-side-drawer">
          <div className="drawer-header">
            <h3 className="drawer-title">
              {activeDrawer === 'chat' && 'In-Call Messages & Aura AI'}
              {activeDrawer === 'participants' && `People (${totalParticipants})`}
            </h3>
            <button
              className="drawer-close-btn"
              onClick={() => setActiveDrawer(null)}
              title="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Drawer */}
          {activeDrawer === 'chat' && (
            <ChatDrawer
              geminiApiKey={geminiApiKey}
              setShowKeyModal={setShowKeyModal}
              auraAutoReply={auraAutoReply}
              setAuraAutoReply={setAuraAutoReply}
              handleTriggerAuraPrompt={handleTriggerAuraPrompt}
              messages={messages}
              myName={myName}
              isAuraThinking={isAuraThinking}
              chatBottomRef={chatBottomRef}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatInputRef={chatInputRef}
              handleChatInputChange={handleChatInputChange}
              handleChatKeyDown={handleChatKeyDown}
              insertMention={insertMention}
              mentionQuery={mentionQuery}
              setMentionQuery={setMentionQuery}
              filteredMentions={filteredMentions}
              mentionSelectedIndex={mentionSelectedIndex}
              handleSendMessage={handleSendMessage}
              renderMessageContent={renderMessageContent}
            />
          )}

          {/* Participants Drawer */}
          {activeDrawer === 'participants' && (
            <ParticipantsDrawer
              isHost={isHost}
              pendingGuests={pendingGuests}
              handleDenyGuest={handleDenyGuest}
              handleAdmitGuest={handleAdmitGuest}
              handleAdmitAll={handleAdmitAll}
              totalParticipants={totalParticipants}
              participants={participants}
              handleMuteAll={handleMuteAll}
              handleHostControlMedia={handleHostControlMedia}
              myName={myName}
              isMicOn={isMicOn}
              isVideoOn={isVideoOn}
            />
          )}
        </aside>
      )}

      {/* Waiting For Admission Modal */}
      <WaitingApprovalModal
        waitingForAdmission={waitingForAdmission}
        handleLeaveCall={handleLeaveCall}
      />

      {/* Admission Denied Modal */}
      <AdmissionDeniedModal
        admissionDenied={admissionDenied}
        onReturnHome={() => navigate('/')}
      />

      {/* Gemini API Key Modal */}
      <GeminiKeyModal
        showKeyModal={showKeyModal}
        setShowKeyModal={setShowKeyModal}
        tempKeyInput={tempKeyInput}
        setTempKeyInput={setTempKeyInput}
        handleSaveGeminiKey={handleSaveGeminiKey}
      />

      {/* Floating Notification Toast */}
      <FloatingToast toastMessage={toastMessage} />
    </div>
  );
}
