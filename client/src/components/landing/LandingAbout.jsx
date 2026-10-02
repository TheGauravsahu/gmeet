import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';

export default function LandingAbout({ onOpenScheduleModal }) {
  return (
    <section className="about-section" id="about">
      <div className="pill-section-tag">
        <Sparkles size={14} />
        <span>About Us</span>
      </div>

      <p className="about-statement">
        Built on creativity, collaboration, and top excellence,{' '}
        MEET.AI is a dynamic team of industry experts committed to achieving
        exceptional great results<span className="dim"> across global enterprise communication...</span>
      </p>

      <button className="btn-purple-pill" onClick={onOpenScheduleModal}>
        <Calendar size={16} />
        <span>Schedule Conference</span>
      </button>
    </section>
  );
}
