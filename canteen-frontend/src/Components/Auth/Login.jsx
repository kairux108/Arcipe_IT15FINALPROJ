import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'cashier') navigate('/cashier/pos');
      else navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const accounts = {
      admin:    { email: 'admin@canteen.com',    password: 'password' },
      cashier:  { email: 'cashier@canteen.com',  password: 'password' },
      customer: { email: 'customer@canteen.com', password: 'password' },
    };
    setEmail(accounts[role].email);
    setPassword(accounts[role].password);
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex" style={{ background: 'var(--surface-0)', fontFamily: 'var(--font-body)' }}>

      {/* ── Left Hero Panel ── */}
      <div
        className="d-none d-lg-flex flex-column justify-content-center px-5 position-relative overflow-hidden"
        style={{ flex: 1, background: 'linear-gradient(135deg, #0F1923 0%, #1A2B3C 50%, #162330 100%)' }}
      >
        {/* Grid overlay */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* Orb 1 */}
        <div className="position-absolute rounded-circle" style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,107,53,0.15), transparent 70%)',
          top: -150, left: -100, pointerEvents: 'none',
        }} />

        {/* Orb 2 */}
        <div className="position-absolute rounded-circle" style={{
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(17,138,178,0.12), transparent 70%)',
          bottom: -100, right: 200, pointerEvents: 'none',
        }} />

        <div className="position-relative" style={{ zIndex: 1, maxWidth: 480 }}>
          {/* Brand */}
          <div className="d-flex align-items-center gap-3 mb-5">
            <div className="d-flex align-items-center justify-content-center rounded-3 fs-4"
              style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #FF6B35, #FFD166)', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
              🍽️
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#FF6B35' }}>
                Inventopia
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
                CANTEEN MANAGEMENT SYSTEM
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800, lineHeight: 1.15, color: '#F0F4F8', marginBottom: 16 }}>
            Manage your canteen{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              smarter &amp; faster
            </span>
          </h1>

          <p className="mb-4" style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 400 }}>
            A complete solution for menu management, order processing,
            inventory tracking, and sales reporting.
          </p>

          {/* Features */}
          <div className="d-flex flex-column gap-2 mb-4">
            {[
              { icon: '📋', label: 'Menu Management' },
              { icon: '🛒', label: 'Point of Sale' },
              { icon: '📦', label: 'Inventory Tracking' },
              { icon: '📊', label: 'Sales Reports' },
            ].map(f => (
              <div key={f.label}
                className="d-flex align-items-center gap-3 rounded-3"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '12px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  maxWidth: 300,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Trusted by canteen teams everywhere
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div
        className="d-flex align-items-center justify-content-center p-4 p-md-5"
        style={{
          width: 480,
          flexShrink: 0,
          background: 'rgba(15,25,35,0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Header */}
          <div className="mb-4">
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F0F4F8', marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
              Sign in to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert d-flex align-items-center gap-2 mb-3"
              style={{
                background: 'rgba(239,71,111,0.1)',
                border: '1px solid rgba(239,71,111,0.3)',
                borderRadius: 10,
                color: '#EF476F',
                fontSize: 13,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10,
                  color: '#F0F4F8',
                  padding: '12px 16px',
                  fontSize: 14,
                }}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRight: 'none',
                    borderRadius: '10px 0 0 10px',
                    color: '#F0F4F8',
                    padding: '12px 16px',
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderLeft: 'none',
                    borderRadius: '0 10px 10px 0',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    padding: '0 14px',
                  }}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn w-100 fw-bold"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #e85a25)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 15,
                transition: 'all 0.15s ease',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.3)',
              }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Demo Section */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-center mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
              Quick Demo Access
            </p>
            <div className="d-flex gap-2">
              {['admin', 'cashier', 'customer'].map(role => (
                <button
                  key={role}
                  className="btn flex-fill"
                  onClick={() => fillDemo(role)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '9px 8px',
                    transition: 'all 0.15s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {role === 'admin' ? '👑' : role === 'cashier' ? '💳' : '👤'} {role}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}