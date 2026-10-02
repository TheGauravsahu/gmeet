import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScheduleModal from '../components/ScheduleModal';
import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import LandingAbout from '../components/landing/LandingAbout';
import LandingArchShowcase from '../components/landing/LandingArchShowcase';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingFooter from '../components/landing/LandingFooter';
import LandingPreviewModal from '../components/landing/LandingPreviewModal';

export default function LandingPage({ onNavigate }) {
  const { user, isAuthenticated, logout, displayName } = useAuth();
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Instant Room Creation via Backend API
  const handleStartInstantMeeting = async () => {
    try {
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Meeting`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        onNavigate(`/meet/${res.data.room.roomCode}`);
      }
    } catch (err) {
      alert(`Could not create instant room: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Ambient Cosmos Glow & Stardust Particles */}
      <div className="ambient-cosmos" />

      {/* Floating Stardust Particles */}
      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          className="floating-stardust"
          style={{
            left: `${(i * 7.2 + 3) % 96}%`,
            animationDelay: `${(i * 1.3) % 8}s`,
            animationDuration: `${12 + (i % 5) * 3}s`
          }}
        />
      ))}

      {/* 1. NAVIGATION BAR */}
      <LandingNav
        isAuthenticated={isAuthenticated}
        user={user}
        displayName={displayName}
        logout={logout}
        onNavigate={onNavigate}
        onOpenScheduleModal={() => setScheduleModalOpen(true)}
      />

      {/* 2. HERO SECTION */}
      <LandingHero
        onNavigate={onNavigate}
        onOpenPreviewModal={() => setMeetingModalOpen(true)}
      />

      {/* 3. ABOUT / MANIFESTO */}
      <LandingAbout
        onOpenScheduleModal={() => setScheduleModalOpen(true)}
      />

      {/* 4. SEMICIRCULAR INNOVATION ARCH SHOWCASE */}
      <LandingArchShowcase
        onStartInstantMeeting={handleStartInstantMeeting}
      />

      {/* 5. FEATURE GLASS CARDS */}
      <LandingFeatures />

      {/* 6. BOTTOM HORIZON & FOOTER */}
      <LandingFooter onNavigate={onNavigate} />

      {/* 7. PREVIEW MODAL */}
      <LandingPreviewModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        onJoinRoom={onNavigate}
      />

      {/* 8. SCHEDULE MODAL */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
}
