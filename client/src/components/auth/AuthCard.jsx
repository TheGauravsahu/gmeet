import React from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function AuthCard({
  isSignIn,
  onSwitchMode,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  agreeTerms,
  setAgreeTerms,
  isLoading,
  errorMessage,
  onSubmit,
}) {
  return (
    <div className="auth-glass-card">
      {/* Segmented Mode Tab Switcher */}
      <div className="auth-tabs-switcher">
        <div
          className={`auth-tab-btn ${isSignIn ? 'active' : ''}`}
          onClick={() => onSwitchMode('/signin')}
        >
          Sign In
        </div>
        <div
          className={`auth-tab-btn ${!isSignIn ? 'active' : ''}`}
          onClick={() => onSwitchMode('/signup')}
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
            color: '#fca5a5',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Authentication Form */}
      <form className="auth-form" onSubmit={onSubmit}>
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
            Don't have an account?{' '}
            <span
              className="auth-switch-link"
              onClick={() => onSwitchMode('/signup')}
            >
              Sign up free
            </span>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <span
              className="auth-switch-link"
              onClick={() => onSwitchMode('/signin')}
            >
              Sign in here
            </span>
          </>
        )}
      </div>
    </div>
  );
}
