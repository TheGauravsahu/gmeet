import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function DashboardSafetyBanner({ onLearnMore }) {
  return (
    <div className="dashboard-safety-banner">
      <div className="safety-banner-left">
        <div className="safety-shield-icon">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="safety-banner-title">Your meeting is safe</div>
          <p className="safety-banner-sub">
            No one can join a meeting unless invited or admitted by the host
          </p>
        </div>
      </div>
      <button
        className="safety-learn-btn"
        onClick={onLearnMore}
      >
        Learn more
      </button>
    </div>
  );
}
