import React from 'react';
import { ShieldCheck, Lock, Zap } from 'lucide-react';

export default function AuthSecurityStrip() {
  return (
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
  );
}
