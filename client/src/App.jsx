import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './AuthPage';
import LobbyPage from './pages/LobbyPage';
import MeetingRoomPage from './pages/MeetingRoomPage';

import './App.css';
import './Auth.css';
import './Meeting.css';

// Wrapper for LandingPage so onNavigate works with React Router
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onNavigate={(path) => navigate(path)} />;
}

// Wrapper for AuthPage with navigation helper
function AuthWrapper({ mode }) {
  const navigate = useNavigate();
  return <AuthPage initialMode={mode} onNavigate={(path) => navigate(path)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Home Page */}
          <Route path="/" element={<LandingWrapper />} />

          {/* Authentication Pages */}
          <Route path="/signin" element={<AuthWrapper mode="signin" />} />
          <Route path="/login" element={<AuthWrapper mode="signin" />} />
          <Route path="/signup" element={<AuthWrapper mode="signup" />} />
          <Route path="/register" element={<AuthWrapper mode="signup" />} />

          {/* Pre-Call Lobby / Green Room */}
          <Route path="/lobby/:roomCode" element={<LobbyPage />} />

          {/* Live Video Meeting Room */}
          <Route path="/meet/:roomCode" element={<MeetingRoomPage />} />
          <Route path="/meeting/:roomCode" element={<MeetingRoomPage />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
