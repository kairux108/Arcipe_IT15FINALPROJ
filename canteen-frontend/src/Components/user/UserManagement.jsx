import { useState, useEffect } from 'react';
import api from '../../Services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const ROLE_STYLES = {
  admin:    { bg: 'rgba(255,209,102,0.15)', color: '#FFD166' },
  cashier:  { bg: 'rgba(17,138,178,0.15)',  color: '#118AB2' },
  customer: { bg: 'rgba(6,214,160,0.15)',   color: '#06D6A0' },
};

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [showPw, setShowPw]       = useState(false);

  const tableOverride = `
    .um-table { color: var(--text-primary) !important; }
    .um-table td, .um-table th { color: var(--text-primary) !important; border-color: var(--border-subtle) !important; background: transparent !important; vertical-align: middle; }
    .um-table thead th { background: var(--surface-2) !important; color: var(--text-muted) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .um-table tbody tr:hover td { background: rgba(255,107,53,0.04) !important; }
    .um-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
    .um-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
    .um-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
  `;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'cashier' });
    setErrors({});
    setShowPw(false);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setErrors({});
    setShowPw(false);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) await api.put(`/users/${editUser.id}`, form);
      else await api.post('/users', { ...form, password_confirmation: form.password });
      setShowModal(false);
      load();
    } catch (err) { setErrors(err.response?.data?.errors || {}); }
    finally { setSaving(false); }
  };

  const handleToggle = async (user) => {
    try { await api.patch(`/users/${user.id}/toggle-active`); load(); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete "${user.name}"?`)) return;
    try { await api.delete(`/users/${user.id}`); load(); }
    catch { alert('Failed to delete user'); }
  };

  return (
    <>
      <style>{tableOverride}</style>

      <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>User Management</h2>
            <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage system users and roles</p>
          </div>
          <button
            className="btn fw-bold"
            onClick={openCreate}
            style={{ background: '#FF6B35', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, padding: '10px 20px' }}
          >+ Add User</button>
        </div>

        {/* Table */}
        <div className="rounded-3 overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><LoadingSpinner /></div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0 um-table">
                <thead>
                  <tr>
                    {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5" style={{ color: 'var(--text-muted)' }}>No users found</td></tr>
                  ) : users.map(user => {
                    const rs = ROLE_STYLES[user.role] || ROLE_STYLES.customer;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
                              style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#FF6B35,#FFD166)', color: 'white', fontSize: 15 }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</td>
                        <td>
                          <span className="fw-bold" style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, background: rs.bg, color: rs.color }}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold" style={{
                            padding: '4px 12px', borderRadius: 99, fontSize: 12,
                            background: user.is_active ? 'rgba(6,214,160,0.15)' : 'rgba(239,71,111,0.15)',
                            color: user.is_active ? '#06D6A0' : '#EF476F',
                          }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button className="btn btn-sm fw-semibold" onClick={() => openEdit(user)}
                              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 8, fontSize: 12 }}>
                              Edit
                            </button>
                            <button className="btn btn-sm fw-semibold" onClick={() => handleToggle(user)}
                              style={{
                                background: user.is_active ? 'rgba(255,209,102,0.1)' : 'rgba(6,214,160,0.1)',
                                border: `1px solid ${user.is_active ? 'rgba(255,209,102,0.3)' : 'rgba(6,214,160,0.3)'}`,
                                color: user.is_active ? '#FFD166' : '#06D6A0', borderRadius: 8, fontSize: 12,
                              }}>
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-sm fw-semibold" onClick={() => handleDelete(user)}
                              style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', color: '#EF476F', borderRadius: 8, fontSize: 12 }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-4 p-4"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-bold mb-0" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
                {editUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button className="btn d-flex align-items-center justify-content-center" onClick={() => setShowModal(false)}
                style={{ width: 30, height: 30, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              {[
                { name: 'name',  label: 'Full Name',      type: 'text',  placeholder: 'Juan dela Cruz' },
                { name: 'email', label: 'Email Address',  type: 'email', placeholder: 'juan@example.com' },
              ].map(f => (
                <div key={f.name}>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{f.label}</label>
                  <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                    placeholder={f.placeholder} className="form-control um-input" style={{ padding: '10px 14px', fontSize: 14 }} />
                  {errors[f.name] && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors[f.name]}</div>}
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Password {editUser && <span style={{ textTransform: 'none', fontWeight: 400 }}>(blank to keep)</span>}
                </label>
                <div className="input-group">
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="form-control um-input"
                    style={{ padding: '10px 14px', fontSize: 14, borderRight: 'none', borderRadius: '10px 0 0 10px' }}
                  />
                  <button type="button" className="input-group-text" onClick={() => setShowPw(p => !p)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderLeft: 'none', borderRadius: '0 10px 10px 0', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 14px' }}>
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.password}</div>}
              </div>

              {/* Role */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="form-select um-input" style={{ padding: '10px 14px', fontSize: 14 }}>
                  <option value="admin">👑 Admin</option>
                  <option value="cashier">💳 Cashier</option>
                  <option value="customer">👤 Customer</option>
                </select>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" className="btn fw-semibold px-4" onClick={() => setShowModal(false)}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10 }}>
                  Cancel
                </button>
                <button type="submit" className="btn fw-bold px-4" disabled={saving}
                  style={{ background: '#FF6B35', color: 'white', border: 'none', borderRadius: 10, minWidth: 120 }}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}