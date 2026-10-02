import React from 'react';
import { Sparkles } from 'lucide-react';

export default function DashboardFilterBar({
  activeFilter,
  setActiveFilter,
  totalMeetingsCount,
  onRefresh,
}) {
  return (
    <div className="dashboard-filter-bar">
      <div className="filter-pills-group">
        <button
          className={`filter-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Meetings ({totalMeetingsCount})
        </button>
        <button
          className={`filter-tab-pill ${activeFilter === 'today' ? 'active' : ''}`}
          onClick={() => setActiveFilter('today')}
        >
          Today
        </button>
        <button
          className={`filter-tab-pill ${activeFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab-pill ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          Live Rooms
        </button>
      </div>

      <button
        className="btn-card-icon"
        onClick={onRefresh}
        title="Refresh meetings list"
      >
        <Sparkles size={16} color="#c084fc" />
      </button>
    </div>
  );
}
