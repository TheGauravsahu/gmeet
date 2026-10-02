import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, Copy, Trash2 } from 'lucide-react';

export default function MeetingCard({
  room,
  onCopyLink,
  onDeleteRoom,
}) {
  const navigate = useNavigate();
  const isLive = room.status === 'active';
  const scheduledDate = room.scheduledFor ? new Date(room.scheduledFor) : null;

  return (
    <div className="meeting-card-item">
      <div>
        <div className="card-header-row">
          <h4 className="card-title-text">{room.title}</h4>
          <span
            className={`card-status-badge ${
              isLive ? 'active' : 'scheduled'
            }`}
          >
            {isLive ? '● Live' : 'Scheduled'}
          </span>
        </div>

        <div className="card-details-meta" style={{ marginTop: 10 }}>
          <div className="meta-info-row">
            <Clock size={14} color="#8b5cf6" />
            <span>
              {scheduledDate
                ? scheduledDate.toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : `Created ${new Date(room.createdAt).toLocaleDateString()}`}
            </span>
          </div>

          <div className="meta-info-row">
            <span className="card-room-code">#{room.roomCode}</span>
            <span style={{ fontSize: '0.74rem' }}>
              Host: {room.hostName || 'You'}
            </span>
          </div>
        </div>
      </div>

      <div className="card-actions-row">
        <div className="card-action-btns-left">
          <button
            className="btn-card-join"
            onClick={() => navigate(`/lobby/${room.roomCode}`)}
          >
            <Video size={14} />
            <span>Join</span>
          </button>

          <button
            className="btn-card-icon"
            onClick={(e) => onCopyLink(room.roomCode, e)}
            title="Copy meeting link"
          >
            <Copy size={14} />
          </button>
        </div>

        <button
          className="btn-card-icon delete"
          onClick={(e) => onDeleteRoom(room.roomCode, e)}
          title="Delete meeting"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
