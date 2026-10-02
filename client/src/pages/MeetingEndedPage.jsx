import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Video,
  PhoneOff,
  RotateCcw,
  Home,
  Plus,
  Star,
  ShieldCheck,
  Clock,
  User,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/MeetingEnded.css';

export default function MeetingEndedPage() {
  const navigate = useNavigate();
  const { roomCode: paramCode } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  // Extract navigation state passed from MeetingRoomPage
  const state = location.state || {};
  const roomCode = state.roomCode || paramCode || 'aura-call';
  const roomTitle = state.roomTitle || `Meeting #${roomCode}`;
  const callDuration = state.callDuration || 0;
  const participantName = state.participantName || user?.name || 'Participant';

  // Feedback rating state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  // Format call duration MM:SS or HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRate = (star) => {
    setRating(star);
    setFeedbackSubmitted(true);
  };

  // Rejoin meeting via lobby
  const handleRejoin = () => {
    navigate(`/lobby/${roomCode}`);
  };

  // Return to home dashboard
  const handleReturnHome = () => {
    navigate('/home');
  };

  // Start a new instant meeting
  const handleStartNewMeeting = async () => {
    setIsCreatingMeeting(true);
    try {
      const name = user?.name || participantName || 'Host';
      const res = await api.rooms.createRoom({
        title: `${name}'s Meeting`,
        hostName: name,
      });

      if (res?.success && res?.data?.room?.roomCode) {
        navigate(`/meet/${res.data.room.roomCode}`, {
          state: {
            participantName: name,
            isHost: true,
          },
        });
        return;
      }
    } catch (err) {
      console.warn('API room creation failed, falling back to client-generated room code:', err);
    } finally {
      setIsCreatingMeeting(false);
    }

    // Fallback: Generate 9-character code (xxx-yyyy-zzz)
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const newCode = `${part1}-${part2}-${part3}`;
    navigate(`/meet/${newCode}`, {
      state: {
        participantName: user?.name || participantName || 'Host',
        isHost: true,
      },
    });
  };

  return (
    <div className="ended-page-wrapper">
      <div className="ambient-cosmos" />

      {/* 1. TOPBAR */}
      <header className="ended-topbar">
        <Link to="/home" className="dashboard-brand-link" style={{ textDecoration: 'none' }}>
          <div className="brand-icon" style={{ width: 34, height: 34 }}>
            <Video size={18} />
          </div>
          <span className="dashboard-brand-title">AURA Meet</span>
        </Link>

        <button
          onClick={handleReturnHome}
          className="ended-btn ended-btn-secondary"
          style={{ padding: '8px 18px', fontSize: '0.86rem' }}
        >
          <Home size={15} />
          <span>Home</span>
        </button>
      </header>

      {/* 2. MAIN STAGE */}
      <main className="ended-main-stage">
        <div className="ended-glass-card">
          {/* Status Icon */}
          <div className="ended-icon-ring">
            <PhoneOff size={30} />
          </div>

          {/* Headline */}
          <h1 className="ended-headline">You left the meeting</h1>
          <p className="ended-room-sub">
            {roomTitle !== `Meeting #${roomCode}` && <span>{roomTitle} &bull; </span>}
            Room Code: <span className="ended-code-pill">{roomCode}</span>
          </p>

          {/* Metadata Badges */}
          <div className="ended-meta-strip">
            <div className="ended-meta-pill" title="Call duration">
              <Clock size={13} color="#a78bfa" />
              <span>{formatDuration(callDuration)}</span>
            </div>
            <div className="ended-meta-pill" title="Participant">
              <User size={13} color="#60a5fa" />
              <span>{participantName}</span>
            </div>
            <div className="ended-meta-pill" title="Security">
              <ShieldCheck size={13} color="#34d399" />
              <span>Encrypted Session</span>
            </div>
          </div>

          {/* Feedback Rating Widget */}
          <div className="ended-feedback-box">
            <p className="feedback-question-text">
              {feedbackSubmitted
                ? 'Thank you! Your feedback helps us improve.'
                : 'How was your audio & video quality?'}
            </p>

            <div className="stars-rating-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={26}
                    fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                    color={(hoverRating || rating) >= star ? '#fbbf24' : '#64748b'}
                  />
                </button>
              ))}
            </div>

            {feedbackSubmitted && (
              <div className="feedback-submitted-banner">
                <Check size={16} />
                <span>Rating recorded ({rating}/5 stars)</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="ended-actions-group">
            <button
              onClick={handleRejoin}
              className="ended-btn ended-btn-primary"
              title="Rejoin this room"
            >
              <RotateCcw size={16} />
              <span>Rejoin</span>
            </button>

            <button
              onClick={handleReturnHome}
              className="ended-btn ended-btn-secondary"
              title="Return to the dashboard"
            >
              <Home size={16} />
              <span>Return to Home</span>
            </button>

            <button
              onClick={handleStartNewMeeting}
              disabled={isCreatingMeeting}
              className="ended-btn ended-btn-ghost"
              title="Host a brand new meeting"
            >
              {isCreatingMeeting ? (
                <span>Starting...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>New Meeting</span>
                </>
              )}
            </button>
          </div>

          {/* Safety Footnote */}
          <div className="ended-safety-note">
            <ShieldCheck size={14} color="#a855f7" />
            <span>Secured with end-to-end WebRTC peer encryption.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
