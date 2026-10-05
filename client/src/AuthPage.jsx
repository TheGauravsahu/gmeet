import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AuthHeader from './components/auth/AuthHeader';
import AuthCard from './components/auth/AuthCard';
import AuthSecurityStrip from './components/auth/AuthSecurityStrip';
import './styles/Auth.css';

export default function AuthPage({ initialMode = 'signin', onNavigate }) {
  const isSignIn = initialMode === 'signin' || initialMode === 'login';
  const { login, register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authSuccessToast, setAuthSuccessToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (isSignIn) {
        await login(email, password);
      } else {
        await register(fullName || 'User', email, password);
      }

      setAuthSuccessToast(true);
      setTimeout(() => {
        setAuthSuccessToast(false);
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get('redirectTo');
        if (redirectTo) {
          onNavigate(redirectTo);
        } else {
          onNavigate('/home');
        }
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = (modePath) => {
    setErrorMessage('');
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      onNavigate(`${modePath}?redirectTo=${encodeURIComponent(redirectTo)}`);
    } else {
      onNavigate(modePath);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Ambient Cosmic Horizon Glows */}
      <div className="auth-ambient-glow" />
      <div className="auth-bottom-glow" />


      {/* 1. TOP NAVBAR */}
      <AuthHeader onNavigateHome={() => onNavigate('/')} />

      {/* 2. MAIN GLASSMORPHISM AUTH CARD CONTAINER */}
      <div className="auth-card-container">
        <AuthCard
          isSignIn={isSignIn}
          onSwitchMode={handleSwitchMode}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          agreeTerms={agreeTerms}
          setAgreeTerms={setAgreeTerms}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Floating Success Toast */}
      {authSuccessToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 150,
            background: 'rgba(16, 17, 28, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            color: '#f8fafc',
            backdropFilter: 'blur(12px)',
            animation: 'modalFadeIn 0.2s ease-out'
          }}
        >
          <Check size={18} color="#10b981" />
          <span>
            {isSignIn ? 'Welcome back! Launching AURA workspace...' : 'Account created! Welcome to AURA MEET.'}
          </span>
        </div>
      )}
    </div>
  );
}
