import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldCheck,
  Lock,
  Shield,
  Check,
  Zap,
  Mic,
  Activity,
  Video,
} from 'lucide-react';

const INTEGRATION_APPS = [
  { name: 'Slack', icon: '💬', pathId: 'p1' },
  { name: 'Calendar', icon: '📅', pathId: 'p2' },
  { name: 'Zoom', icon: '📹', pathId: 'p3' },
  { name: 'GitHub', icon: '🐙', pathId: 'p4' },
  { name: 'Figma', icon: '🎨', pathId: 'p5' },
  { name: 'Notion', icon: '📝', pathId: 'p6' }
];

export default function LandingFeatures() {
  const [hoveredApp, setHoveredApp] = useState(null);

  const [secToggles, setSecToggles] = useState({
    e2e: true,
    soc2: true,
    bio: true,
    mesh: true
  });

  const [audioBoost, setAudioBoost] = useState(false);
  const [transcriptIndex, setTranscriptIndex] = useState(0);

  const transcripts = [
    'Sarah: "Gemini is synthesizing our cross-region telemetry in real time..."',
    'Sophia: "Sub-40ms latency confirmed across all Tokyo & Frankfurt edge nodes."',
    'Alex: "Let us review the security audit key hash and publish to main."',
    'Liam: "Spatial audio rendering calibrated for 12 simultaneous speakers."'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTranscriptIndex((prev) => (prev + 1) % transcripts.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [transcripts.length]);

  const toggleSec = (key) => {
    setSecToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="feature-cards-section" id="security">
      <div className="feature-cards-grid">
        
        {/* CARD 1: Seamless API Integrations */}
        <div className="feature-glass-card">
          <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
            <Layers size={22} />
          </div>
          <h3 className="card-title">Seamless API Integrations</h3>
          <p className="card-desc">
            Native support with every modern calendar, cloud workspace, and WebRTC stack.
          </p>

          <div className="card-interactive-canvas">
            <div className="integration-network">
              <div className="integration-nodes-row">
                {INTEGRATION_APPS.map((app) => (
                  <div
                    key={app.name}
                    className="app-node-pill"
                    onMouseEnter={() => setHoveredApp(app.name)}
                    onMouseLeave={() => setHoveredApp(null)}
                    title={`${app.name} (Sub-20ms Sync)`}
                  >
                    <span>{app.icon}</span>
                  </div>
                ))}
              </div>

              <svg className="integration-svg-canvas" viewBox="0 0 300 130">
                <defs>
                  <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                <path id="p1" className="svg-flow-path" d="M 25 15 C 25 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" fill="none" />
                <path id="p2" className="svg-flow-path" d="M 75 15 C 75 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.55)" strokeWidth="1.5" fill="none" />
                <path id="p3" className="svg-flow-path" d="M 125 15 C 125 70, 150 70, 150 115" stroke="rgba(168, 85, 247, 0.75)" strokeWidth="1.5" fill="none" />
                <path id="p4" className="svg-flow-path" d="M 175 15 C 175 70, 150 70, 150 115" stroke="rgba(168, 85, 247, 0.75)" strokeWidth="1.5" fill="none" />
                <path id="p5" className="svg-flow-path" d="M 225 15 C 225 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.55)" strokeWidth="1.5" fill="none" />
                <path id="p6" className="svg-flow-path" d="M 275 15 C 275 70, 150 70, 150 115" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" fill="none" />

                <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #c084fc)">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 25 15 C 25 70, 150 70, 150 115" />
                </circle>
                <circle r="3" fill="#c084fc" filter="drop-shadow(0 0 4px #c084fc)">
                  <animateMotion dur="2.1s" repeatCount="indefinite" path="M 75 15 C 75 70, 150 70, 150 115" />
                </circle>
                <circle r="3.5" fill="#ffffff" filter="drop-shadow(0 0 6px #c084fc)">
                  <animateMotion dur="1.8s" repeatCount="indefinite" path="M 125 15 C 125 70, 150 70, 150 115" />
                </circle>
                <circle r="3.5" fill="#ffffff" filter="drop-shadow(0 0 6px #c084fc)">
                  <animateMotion dur="1.9s" repeatCount="indefinite" path="M 175 15 C 175 70, 150 70, 150 115" />
                </circle>
                <circle r="3" fill="#c084fc" filter="drop-shadow(0 0 4px #c084fc)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 225 15 C 225 70, 150 70, 150 115" />
                </circle>
                <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #c084fc)">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 275 15 C 275 70, 150 70, 150 115" />
                </circle>
              </svg>

              <div className="integration-hub-core">
                <div className="hub-pulse-ring" />
                <Video size={19} />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Trusted Authentication */}
        <div className="feature-glass-card">
          <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
            <ShieldCheck size={22} />
          </div>
          <h3 className="card-title">Trusted Authentication</h3>
          <p className="card-desc">
            Zero-leak protocols backed by post-quantum encryption and multi-factor host keys.
          </p>

          <div className="card-interactive-canvas">
            <div className="security-dashboard">
              <div className="security-matrix-pills">
                <div
                  className={`sec-pill ${secToggles.e2e ? 'active' : ''}`}
                  onClick={() => toggleSec('e2e')}
                >
                  <Lock size={11} /> 256-Bit E2E
                </div>
                <div
                  className={`sec-pill ${secToggles.soc2 ? 'active' : ''}`}
                  onClick={() => toggleSec('soc2')}
                >
                  <Shield size={11} /> SOC2 Type II
                </div>
                <div
                  className={`sec-pill ${secToggles.bio ? 'active' : ''}`}
                  onClick={() => toggleSec('bio')}
                >
                  <Check size={11} /> Biometric Key
                </div>
                <div
                  className={`sec-pill ${secToggles.mesh ? 'active' : ''}`}
                  onClick={() => toggleSec('mesh')}
                >
                  <Zap size={11} /> Zero-Log Mesh
                </div>
              </div>

              <div className="shield-center-circle" onClick={() => toggleSec('e2e')}>
                <div className="radar-ring" />
                <div className="radar-ring-2" />
                <Check size={26} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: AI-Speech Recognition */}
        <div className="feature-glass-card">
          <div className="card-icon-badge" style={{ margin: '0 auto 20px' }}>
            <Mic size={22} />
          </div>
          <h3 className="card-title">AI-Speech Recognition</h3>
          <p className="card-desc">
            Neural acoustic models transcribe multiple speakers with 99.4% precision in 68 languages.
          </p>

          <div className="card-interactive-canvas">
            <div className="speech-recognition-panel">
              <div
                className="speech-active-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => setAudioBoost(!audioBoost)}
                title="Click to toggle EQ boost"
              >
                <Activity size={12} color="#10b981" />
                <span>
                  {audioBoost ? 'Neural AI Noise Gate: MAX' : 'AI Acoustic Stream: Active'}
                </span>
              </div>

              <div className="waveform-box">
                {[28, 55, 85, 45, 95, 30, 70, 100, 65, 80, 40, 90, 60, 35, 75, 50, 85, 30].map(
                  (height, i) => (
                    <div
                      key={i}
                      className="waveform-bar"
                      style={{
                        height: `${audioBoost ? Math.min(100, height * 1.3) : height}%`,
                        animationDelay: `${i * 0.08}s`
                      }}
                    />
                  )
                )}
              </div>

              <div className="transcript-floating-box">
                <div className="transcript-glow-dot" />
                <span className="transcript-live-text">
                  {transcripts[transcriptIndex]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
