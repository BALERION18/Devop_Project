import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate(from, { replace: true });
      } else {
        setFormError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to connect to server.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="hub-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 32px',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-violet)',
            }}
          >
            <Activity size={24} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
            Sign in to DevOpsHub
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter your credentials to access deployment telemetry
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'var(--error-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '0.8125rem',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
                autoComplete="email"
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                autoComplete="current-password"
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.9rem', marginBottom: '12px' }}
            disabled={loading}
            id="login-submit-button"
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={async () => {
              setEmail('demo@devopshub.io');
              setPassword('password123');
              setLoading(true);
              try {
                const res = await login('demo@devopshub.io', 'password123');
                if (res.success) {
                  addToast('Logged in as Demo Leader!', 'success');
                  navigate(from, { replace: true });
                }
              } catch (err) {
                setFormError(err.response?.data?.message || err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '9px',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            id="demo-login-button"
          >
            <Sparkles size={14} style={{ color: 'var(--accent-violet)' }} />
            <span>Explore as Demo Leader (1-Click)</span>
          </button>
        </form>

        {/* Link to Signup */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
