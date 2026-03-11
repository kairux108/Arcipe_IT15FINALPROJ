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
      <div className={styles.background}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>🍽️</div>
          <h1 className={styles.brandName}>CanteenPro</h1>
          <p className={styles.brandTagline}>Smart Canteen Management</p>
        </div>

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