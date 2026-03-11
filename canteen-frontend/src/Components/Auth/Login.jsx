import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');

    try {
      const data = await login(form.email, form.password);
      const role = data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'cashier') navigate('/cashier/pos');
      else navigate('/menu');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@canteen.com', password: 'password' },
      cashier: { email: 'cashier@canteen.com', password: 'password' },
      customer: { email: 'customer@canteen.com', password: 'password' },
    };
    setForm(demos[role]);
  };

  return (
    <div className={styles.loginPage}>

      {/* Background */}
      <div className={styles.background}>
        <div className={styles.grid} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandRow}>
          <div className={styles.logoBox}>🍽️</div>
          <span className={styles.brandName}>Inventopia</span>
        </div>

        <div className={styles.heroText}>
          <h1>
            Manage your canteen<br />
            <span className={styles.highlight}>in one place.</span>
          </h1>
          <p className={styles.heroSub}>
            Your all-in-one system for menu management, orders,
            inventory, and sales reports — built for school canteens.
          </p>
        </div>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📊</div>
            <span>Real-time Sales Analytics</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>💳</div>
            <span>Point of Sale Interface</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📦</div>
            <span>Inventory Tracking</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>👥</div>
            <span>Role-based Access Control</span>
          </div>
        </div>

        <div className={styles.trusted}>
          Trusted by canteen staff everywhere
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {serverError && (
            <div className={styles.errorAlert}>
              <span>⚠️</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <><span className="animate-spin">⟳</span> Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className={styles.demoSection}>
            <p className={styles.demoLabel}>Demo accounts</p>
            <div className={styles.demoButtons}>
              {['admin', 'cashier', 'customer'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className={styles.demoBtn}
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