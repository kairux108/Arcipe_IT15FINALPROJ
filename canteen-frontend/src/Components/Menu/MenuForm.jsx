import { useState, useEffect } from 'react';
import { menuService } from '../../Services/orderService';

export default function MenuForm({ item, categories, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    is_available: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name:           item.name || '',
        description:    item.description || '',
        price:          item.price || '',
        category_id:    item.category_id || '',
        stock_quantity: item.stock_quantity || '',
        is_available:   item.is_available ?? true,
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) {
        await menuService.updateItem(item.id, form);
      } else {
        await menuService.createItem(form);
      }
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    borderRadius: 10,
    fontSize: 14,
    padding: '10px 14px',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    marginBottom: 6,
  };

  return (
    <div
      className="rounded-4 p-4"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
            {item ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}
          </h3>
          <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {item ? 'Update the details below' : 'Fill in the details below'}
          </p>
        </div>
        <button
          className="btn d-flex align-items-center justify-content-center rounded-3"
          onClick={onCancel}
          style={{
            width: 32, height: 32,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-3">

          {/* Name */}
          <div className="col-12">
            <label style={labelStyle}>Item Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Chicken Adobo"
              style={inputStyle}
            />
            {errors.name && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Description */}
          <div className="col-12">
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-control"
              placeholder="Short description of the item..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Price + Category */}
          <div className="col-6">
            <label style={labelStyle}>Price (₱)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="form-control"
              placeholder="0.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
            {errors.price && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.price}</div>}
          </div>

          <div className="col-6">
            <label style={labelStyle}>Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="form-select"
              style={inputStyle}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.category_id}</div>}
          </div>

          {/* Stock */}
          <div className="col-6">
            <label style={labelStyle}>Stock Quantity</label>
            <input
              type="number"
              name="stock_quantity"
              value={form.stock_quantity}
              onChange={handleChange}
              className="form-control"
              placeholder="0"
              min="0"
              style={inputStyle}
            />
            {errors.stock_quantity && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.stock_quantity}</div>}
          </div>

          {/* Available toggle */}
          <div className="col-6 d-flex align-items-end">
            <div
              className="d-flex align-items-center gap-3 rounded-3 px-3 w-100"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                height: 44,
              }}
            >
              <div
                className="position-relative flex-shrink-0"
                onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}
                style={{ cursor: 'pointer' }}
              >
                <div style={{
                  width: 40, height: 22,
                  borderRadius: 11,
                  background: form.is_available ? '#06D6A0' : 'var(--surface-3)',
                  transition: 'background 0.2s ease',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 3, left: form.is_available ? 20 : 3,
                    width: 16, height: 16,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {form.is_available ? '✅ Available' : '❌ Unavailable'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="col-12 d-flex gap-2 justify-content-end mt-2">
            <button
              type="button"
              className="btn fw-semibold px-4"
              onClick={onCancel}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 10,
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn fw-bold px-4"
              disabled={saving}
              style={{
                background: '#FF6B35',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                minWidth: 120,
              }}
            >
              {saving ? (
                <span className="d-flex align-items-center gap-2 justify-content-center">
                  <span className="spinner-border spinner-border-sm" />
                  Saving...
                </span>
              ) : item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}