import React, { useState } from 'react';
import { X, Calendar, Clock, Copy, Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScheduleModal({ isOpen, onClose }) {
  const { displayName } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [lockRoom, setLockRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const scheduledDateTime = date && time ? new Date(`${date}T${time}`) : null;

      const res = await api.rooms.createRoom({
        title: title || 'Scheduled Conference',
        hostName: displayName,
        scheduledFor: scheduledDateTime,
        settings: {
          muteOnEntry,
          isLocked: lockRoom,
          allowChat: true,
          allowScreenShare: true,
        },
      });

      if (res.success && res.data.room) {
        setCreatedRoom(res.data.room);
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdRoom) return;
    const url = `${window.location.origin}/meet/${createdRoom.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setCreatedRoom(null);
    setTitle('');
    setDate('');
    setTime('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleReset}>
      <div className="modal-content schedule-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleReset}>
          <X size={18} />
        </button>

        {createdRoom ? (
          <div className="schedule-success-card">
            <div className="success-icon-badge">
              <Check size={28} />
            </div>
            <h3 className="auth-title">Meeting Scheduled!</h3>
            <p className="auth-subtitle">
              Your meeting <strong>"{createdRoom.title}"</strong> is scheduled and ready.
            </p>

            <div className="modal-link-box" style={{ margin: '20px 0' }}>
              <span>{window.location.origin}/meet/{createdRoom.roomCode}</span>
              <button className="copy-pill-btn" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-glass-pill" onClick={handleReset}>
                Done
              </button>
              <a
                href={`/meet/${createdRoom.roomCode}`}
                className="btn-pill-primary"
                style={{ textDecoration: 'none' }}
              >
                <span>Join Lobby Now</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="auth-header">
              <div className="brand-icon auth-icon">
                <Calendar size={18} />
              </div>
              <h3 className="auth-title">Schedule a Meeting</h3>
              <p className="auth-subtitle">
                Plan ahead and distribute instant secure links to your team members.
              </p>
            </div>

            {error && (
              <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSchedule} className="auth-form">
              <div className="form-group">
                <label className="form-label">Meeting Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Architectural Review"
                  className="auth-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    required
                    className="auth-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    required
                    className="auth-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="schedule-toggles">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={muteOnEntry}
                    onChange={(e) => setMuteOnEntry(e.target.checked)}
                  />
                  <span>Mute participants upon entry</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={lockRoom}
                    onChange={(e) => setLockRoom(e.target.checked)}
                  />
                  <span>Require host approval to join (Lock Room)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-glass-pill" onClick={handleReset}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-pill-primary">
                  <span>{loading ? 'Creating...' : 'Schedule Meeting'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
