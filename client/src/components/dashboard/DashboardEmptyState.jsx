import React from 'react';
import { Plus } from 'lucide-react';

export default function DashboardEmptyState({ onNewMeeting }) {
  return (
    <div className="dashboard-empty-stage">
      <div className="empty-illustration-box">
        <svg
          viewBox="0 0 320 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Subtle desk line */}
          <path
            d="M20 170H300"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Tablet / Screen Stand */}
          <rect
            x="170"
            y="70"
            width="110"
            height="85"
            rx="8"
            fill="#151628"
            stroke="rgba(168,85,247,0.4)"
            strokeWidth="2"
          />
          {/* Video camera inside screen */}
          <rect
            x="200"
            y="95"
            width="36"
            height="24"
            rx="4"
            fill="rgba(139,92,246,0.3)"
            stroke="#c084fc"
            strokeWidth="1.5"
          />
          <path
            d="M236 102L250 94V120L236 112V102Z"
            fill="rgba(139,92,246,0.3)"
            stroke="#c084fc"
            strokeWidth="1.5"
          />

          {/* Pencil leaning against screen */}
          <line
            x1="160"
            y1="60"
            x2="182"
            y2="155"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <polygon points="158,54 163,58 159,62" fill="#e2e8f0" />

          {/* Pink organic shape (like Google Meet coffee mug backdrop) */}
          <path
            d="M75 125C75 110 88 100 102 100C116 100 128 110 128 125V155H75V125Z"
            fill="rgba(244,114,182,0.25)"
          />

          {/* Coffee Mug */}
          <path
            d="M102 120H132C132 142 118 155 102 155C86 155 72 142 72 120H102Z"
            fill="url(#mugGradient)"
          />
          {/* Mug handle */}
          <path
            d="M132 128C140 128 144 135 144 140C144 145 138 148 132 148"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Steam */}
          <path
            d="M95 105C90 98 105 90 98 80"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M112 108C108 100 120 92 115 82"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Little yellow spark / circle */}
          <circle cx="215" cy="45" r="10" fill="#facc15" opacity="0.85" />

          <defs>
            <linearGradient id="mugGradient" x1="72" y1="120" x2="132" y2="155">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h3 className="empty-stage-title">No meetings scheduled for today</h3>
      <p className="empty-stage-subtitle">
        Schedule a meeting or enjoy the free time
      </p>

      <button
        className="btn-empty-stage-cta"
        onClick={onNewMeeting}
      >
        <Plus size={18} />
        <span>New</span>
      </button>
    </div>
  );
}
