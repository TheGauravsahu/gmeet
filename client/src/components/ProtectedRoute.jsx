import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#07070a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: '#c084fc',
        }}
      >
        <div className="waiting-pulse-spinner">
          <Sparkles size={28} className="spinning-sparkle" />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Authenticating session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to /signin with target return URL
    const targetUrl = location.pathname + location.search;
    return (
      <Navigate
        to={`/signin?redirectTo=${encodeURIComponent(targetUrl)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}
