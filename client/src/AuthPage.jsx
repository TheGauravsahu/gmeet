import React, { useState } from 'react';
import {
  Video,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './Auth.css';

export default function AuthPage({ initialMode = 'signin', onNavigate }) {
  // mode can be 'signin' or 'signup'
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
        onNavigate('/');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Ambient Cosmic Horizon Glows */}
      <div className="auth-ambient-glow" />
      <div className="auth-bottom-glow" />

      {/* Floating Stardust Particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="floating-stardust"
          style={{
            left: `${(i * 9.5 + 4) % 95}%`,
            animationDelay: `${(i * 1.5) % 8}s`,
            animationDuration: `${11 + (i % 4) * 3}s`
          }}
        />
      ))}

      {/* Top Navbar with matching #07070a background */}
      <header className="auth-top-nav">
        <div className="nav-brand" onClick={() => onNavigate('/')}>
          <div className="brand-icon">
            <Video size={17} />
          </div>
          <span className="brand-text">AURA.MEET</span>
        </div>

        <button className="back-home-btn" onClick={() => onNavigate('/')}>
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Glassmorphism Auth Card */}
      <div className="auth-card-container">
        <div className="auth-glass-card">
          
          {/* Segmented Mode Tab Switcher: /signin vs /signup */}
          <div className="auth-tabs-switcher">
            <div
              className={`auth-tab-btn ${isSignIn ? 'active' : ''}`}
              onClick={() => {
                setErrorMessage('');
                onNavigate('/signin');
              }}
            >
              Sign In
            </div>
            <div
              className={`auth-tab-btn ${!isSignIn ? 'active' : ''}`}
              onClick={() => {
                setErrorMessage('');
                onNavigate('/signup');
              }}
            >
              Create Account
            </div>
          </div>

          {/* Clean Focused Header */}
          <div className="auth-card-header">
            <h1 className="auth-card-title">
              {isSignIn ? 'Sign in to AURA' : 'Create an account'}
            </h1>
            <p className="auth-card-sub">
              {isSignIn
                ? 'Enter your credentials to access your secure rooms.'
                : 'Start meeting with ultra-low latency & spatial audio.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                color: '#fca5a5'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Clean & Short Authentication Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Full Name Field (Signup only) */}
            {!isSignIn && (
              <div className="form-field">
                <label className="field-label">Full Name</label>
                <div className="input-box-wrapper">
                  <User size={16} className="input-icon-left" />
                  <input
                    type="text"
                    required
                    placeholder="Elena Rostova"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-field">
              <label className="field-label">Work Email</label>
              <div className="input-box-wrapper">
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-field">
              <div className="field-label">
                <span>Password</span>
                {isSignIn && (
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset instructions sent to ' + (email || 'your email'));
                    }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="input-box-wrapper">
                <Lock size={16} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
                <button
                  type="button"
                  className="input-icon-btn-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            {isSignIn ? (
              <div
                className="auth-checkbox-row"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <Check size={12} strokeWidth={3} />}
                </div>
                <span>Remember me for 30 days</span>
              </div>
            ) : (
              <div
                className="auth-checkbox-row"
                onClick={() => setAgreeTerms(!agreeTerms)}
              >
                <div className={`custom-checkbox ${agreeTerms ? 'checked' : ''}`}>
                  {agreeTerms && <Check size={12} strokeWidth={3} />}
                </div>
                <span>
                  I agree to the <span style={{ color: '#c084fc' }}>Terms</span> & zero-knowledge encryption <span style={{ color: '#c084fc' }}>Privacy Policy</span>.
                </span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>
                    {isSignIn ? 'Sign In to AURA' : 'Create Free Account'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch Prompt */}
          <div className="auth-switch-prompt">
            {isSignIn ? (
              <>
                Don't have an account?
                <span
                  className="auth-switch-link"
                  onClick={() => {
                    setErrorMessage('');
                    onNavigate('/signup');
                  }}
                >
                  Sign up free
                </span>
              </>
            ) : (
              <>
                Already have an account?
                <span
                  className="auth-switch-link"
                  onClick={() => {
                    setErrorMessage('');
                    onNavigate('/signin');
                  }}
                >
                  Sign in here
                </span>
              </>
            )}
          </div>
        </div>

        {/* Security Reassurance Strip */}
        <div className="auth-security-strip">
          <div className="auth-sec-item">
            <ShieldCheck size={14} />
            <span>256-Bit E2E Encrypted</span>
          </div>
          <div className="auth-sec-item">
            <Lock size={14} />
            <span>SOC2 Type II Certified</span>
          </div>
          <div className="auth-sec-item">
            <Zap size={14} />
            <span>Biometric Host Keys</span>
          </div>
        </div>
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
