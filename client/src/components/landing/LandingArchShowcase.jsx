import React, { useState } from 'react';
import { Sliders, Video } from 'lucide-react';

export const ARCH_PARTICIPANTS = [
  {
    id: 1,
    name: 'Elena Rostova',
    role: 'Lead Architect',
    status: '4K Ultra HD',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    name: 'Marcus Sterling',
    role: 'VP Engineering',
    status: 'Spatial Audio',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    name: 'Sarah Jenkins',
    role: 'AI Researcher',
    status: 'AI Framing',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Security Director',
    status: 'E2E Verified',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    name: 'Sophia Lin',
    role: 'Product Lead',
    status: 'Live Captions',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 6,
    name: 'Alex Rivera',
    role: 'Meeting Host',
    status: 'Host • 60fps',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 7,
    name: 'Amara Diallo',
    role: 'Staff ML Engineer',
    status: 'Noise Canceled',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 8,
    name: 'Liam O’Connor',
    role: 'Infrastructure Lead',
    status: 'Low Latency',
    activeSpeaker: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 9,
    name: 'Chloe Bennett',
    role: 'Design Director',
    status: 'Studio Lighting',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 10,
    name: 'Kenji Sato',
    role: 'Frontend Principal',
    status: 'Gesture AI',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 11,
    name: 'Mateo Alvarez',
    role: 'Distributed Systems',
    status: 'WebRTC Mesh',
    activeSpeaker: false,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
  }
];

export default function LandingArchShowcase({ onStartInstantMeeting }) {
  const [activeParticipant, setActiveParticipant] = useState(ARCH_PARTICIPANTS[5]);

  return (
    <section className="arch-showcase-section" id="features">
      <div className="arch-visual-stage">
        <div className="arch-tiles-track">
          {ARCH_PARTICIPANTS.map((item, index) => {
            const total = ARCH_PARTICIPANTS.length;
            const step = (168 - 12) / (total - 1);
            const thetaDeg = 168 - index * step;
            const thetaRad = (thetaDeg * Math.PI) / 180;

            const Rx = 380;
            const Ry = 220;

            const xOffset = Rx * Math.cos(thetaRad);
            const topPx = 280 - Ry * Math.sin(thetaRad);
            const rotateDeg = (90 - thetaDeg) * 0.82;

            const isHostOrSelected = activeParticipant.id === item.id;

            return (
              <div
                key={item.id}
                className="arch-tile"
                style={{
                  left: `calc(50% + ${xOffset}px)`,
                  top: `${topPx}px`,
                  transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)`,
                  zIndex: isHostOrSelected ? 35 : Math.round(20 - Math.abs(index - 5) * 2),
                  borderColor: isHostOrSelected ? '#c084fc' : undefined,
                  animationDelay: `${index * 0.28}s`
                }}
                onClick={() => setActiveParticipant(item)}
                title={`${item.name} (${item.role})`}
              >
                <img src={item.avatar} alt={item.name} loading="lazy" />
                {item.activeSpeaker && (
                  <>
                    <div className="arch-tile-status" />
                    <div className="active-speaker-ping" />
                  </>
                )}
                <div className="arch-tile-badge">
                  {item.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Text Inside the Arch Halo */}
        <div className="arch-center-copy">
          <div className="pill-section-tag" style={{ marginBottom: '14px' }}>
            <Sliders size={13} />
            <span>Features</span>
          </div>

          <h2 className="arch-heading">
            Packed with Innovation.
          </h2>

          <p className="arch-subheading">
            Hyper-scale WebRTC mesh with smart AI camera features designed to elevate your team interaction.
          </p>

          <button className="btn-purple-pill" onClick={onStartInstantMeeting}>
            <Video size={15} />
            <span>Launch Live Call</span>
          </button>
        </div>
      </div>
    </section>
  );
}
