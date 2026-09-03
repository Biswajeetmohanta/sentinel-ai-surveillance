import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertTriangle, KeyRound, Radio } from 'lucide-react';
import { BACKEND_URL } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('jyoti@deventtechnology.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed. Please check credentials.');
      }

      // Save credentials session in localStorage
      if (rememberMe) {
        localStorage.setItem('sentinel_user', JSON.stringify(data));
        localStorage.setItem('sentinel_token', data.token);
      } else {
        sessionStorage.setItem('sentinel_user', JSON.stringify(data));
        sessionStorage.setItem('sentinel_token', data.token);
      }

      onLoginSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to Gujarat Police Sentinel Server.');
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('jyoti@deventtechnology.com');
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 50% 20%, #0f172a 0%, #020617 75%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Cybernetic Surveillance Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Glow Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Login Card */}
      <div
        className="glass-card"
        style={{
          width: '460px',
          maxWidth: '100%',
          background: 'rgba(10, 15, 30, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(37, 99, 235, 0.15)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* State / Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              borderRadius: '16px',
              boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <Shield size={32} color="#ffffff" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              SENTINEL AI
            </h1>
            <span
              style={{
                background: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                letterSpacing: '0.5px',
              }}
            >
              GUJARAT POLICE
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Automated Video Surveillance & ANPR Command Gateway
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* User ID / Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              OFFICER ID / EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@sentinel.gujarat.gov.in"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              ACCESS PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 38px 12px 38px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Remember me & Demo Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              Remember this workstation
            </label>

            <button
              type="button"
              onClick={fillDefaultCredentials}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Autofill Credentials
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? 'rgba(37, 99, 235, 0.5)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s',
              marginTop: '6px',
            }}
          >
            {loading ? (
              <>
                <Radio size={16} className="animate-spin" />
                <span>Authenticating Officer...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Access Command Center</span>
              </>
            )}
          </button>
        </form>

        {/* Database Verification Badge */}
        <div
          style={{
            marginTop: '24px',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span>DB Auth: <strong>SQLite / users table</strong></span>
          </div>
          <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>GP-SEC-v2.6</span>
        </div>
      </div>
    </div>
  );
}
