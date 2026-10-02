import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../services/socket';
import LobbyHeader from '../components/lobby/LobbyHeader';
import LobbyVideoPreview from '../components/lobby/LobbyVideoPreview';
import LobbyJoinCard from '../components/lobby/LobbyJoinCard';

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
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef(null);
  const socketRef = useRef(null);

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
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted:', err);
        setCameraError(true);
      }
    };

    startMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync track state when toggled
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
      if (socketRef.current) {
        socketRef.current.off('join-approved');
        socketRef.current.off('waiting-for-host');
        socketRef.current.off('join-denied');
      }
    };
  }, [stream]);

  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const handleToggleVideo = async () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);

    if (stream) {
      const liveVideoTrack = stream.getVideoTracks().find((t) => t.readyState === 'live');
      if (liveVideoTrack) {
        stream.getVideoTracks().forEach((track) => {
          track.enabled = nextState;
        });
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
      } else if (nextState) {
        try {
          const fresh = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          const newTrack = fresh.getVideoTracks()[0];
          if (newTrack) {
            stream.getVideoTracks().forEach((t) => {
              t.stop();
              stream.removeTrack(t);
            });
            stream.addTrack(newTrack);
            setCameraError(false);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Lobby re-acquire camera error:', err);
          setCameraError(true);
        }
      }
    } else if (nextState) {
      try {
        const fresh = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMicOn,
        });
        setStream(fresh);
        setCameraError(false);
        if (videoRef.current) {
          videoRef.current.srcObject = fresh;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Lobby start camera error:', err);
        setCameraError(true);
      }
    }
  };

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
    setDeniedMessage('');

    // Connect socket for real-time host admission flow
    const socket = connectSocket();
    socketRef.current = socket;

    // Clean up previous listeners
    socket.off('join-approved');
    socket.off('waiting-for-host');
    socket.off('join-denied');

    // Host admitted or this user is first/host
    socket.on('join-approved', ({ isHost }) => {
      setJoining(false);
      setWaitingForApproval(false);

      navigate(`/meet/${roomCode}`, {
        state: {
          initialAudio: isMicOn,
          initialVideo: isVideoOn,
          participantName: finalName,
          isHost,
        },
      });
    });

    // Host must approve first
    socket.on('waiting-for-host', () => {
      setJoining(false);
      setWaitingForApproval(true);
    });

    // Host denied request
    socket.on('join-denied', ({ message }) => {
      setJoining(false);
      setWaitingForApproval(false);
      setDeniedMessage(message || 'The meeting host has denied your request to join.');
    });

    // Send knock to host
    socket.emit('request-to-join', {
      roomCode,
      user: {
        displayName: finalName,
        avatar: user?.avatar || '',
        isAudioMuted: !isMicOn,
        isVideoMuted: !isVideoOn,
      },
    });
  };

  return (
    <div className="page-wrapper lobby-page-container">
      <div className="ambient-cosmos" />

      {/* Lobby Header */}
      <LobbyHeader onReturnHome={() => navigate('/')} />

      <main className="lobby-content-grid">
        {/* Left Column: Camera Stage & Media Controls */}
        <LobbyVideoPreview
          videoRef={videoRef}
          stream={stream}
          isVideoOn={isVideoOn}
          isMicOn={isMicOn}
          cameraError={cameraError}
          displayName={inputName}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
        />

        {/* Right Column: Meeting Info & Host Approval Box */}
        <LobbyJoinCard
          roomCode={roomCode}
          roomData={roomData}
          error={error}
          inputName={inputName}
          setInputName={setInputName}
          joining={joining}
          waitingForApproval={waitingForApproval}
          deniedMessage={deniedMessage}
          onJoin={handleJoin}
          onCancelRequest={() => {
            setWaitingForApproval(false);
            setJoining(false);
          }}
          onResetDenied={() => setDeniedMessage('')}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
        />
      </main>
    </div>
  );
}
