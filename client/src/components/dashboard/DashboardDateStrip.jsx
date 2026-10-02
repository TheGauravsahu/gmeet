import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardDateStrip({
  formattedHeaderDate,
  weekDays,
  setWeekOffset,
  setSelectedDate,
}) {
  return (
    <div className="dashboard-date-strip-row">
      <h2 className="date-today-title">
        <span>{formattedHeaderDate}</span>
        <Calendar size={20} color="#c084fc" />
      </h2>

      <div className="date-picker-nav-group">
        <button
          className="nav-arrow-btn"
          onClick={() => setWeekOffset((prev) => prev - 1)}
          title="Previous Week"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="week-days-strip">
          {weekDays.map((d, idx) => (
            <button
              key={idx}
              className={`day-pill-item ${d.isSelected ? 'active' : ''}`}
              onClick={() => setSelectedDate(d.fullDate)}
            >
              <span className="day-name-label">{d.name}</span>
              <span className="day-num-circle">{d.number}</span>
            </button>
          ))}
        </div>

        <button
          className="nav-arrow-btn"
          onClick={() => setWeekOffset((prev) => prev + 1)}
          title="Next Week"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
