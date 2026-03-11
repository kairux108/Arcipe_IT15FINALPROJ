import { useState } from 'react';
import { menuService } from '../../Services/orderService';
import styles from './MenuForm.module.css';

export default function MenuForm({ item, categories, onSuccess, onCancel }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || '',
    category_id: item?.category_id || '',
    description: item?.description || '',
    price: item?.price || '',
    stock_quantity: item?.stock_quantity || 0,
    low_stock_threshold: item?.low_stock_threshold || 10,
    preparation_time: item?.preparation_time || 5,
    is_available: item?.is_available ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    if (!form.price || form.price <= 0) errs.price = 'Valid price is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (isEdit) {
        await menuService.updateItem(item.id, fd);
      } else {
        await menuService.createItem(fd);
      }
      onSuccess();
    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      setErrors(serverErrors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formWrap}>
      <div className={styles.formHeader}>
        <button className="btn btn-secondary" onClick={onCancel}>← Back</button>
        <h2>{isEdit ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="e.g., Chicken Adobo" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="form-input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            {errors.category_id && <span className="form-error">{errors.category_id}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={3} placeholder="Brief description of the item..." style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Price (₱) *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} className="form-input" placeholder="0.00" min="0" step="0.01" />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} className="form-input" min="0" />
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Threshold</label>
            <input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} className="form-input" min="0" />
          </div>

          <div className="form-group">
            <label className="form-label">Prep Time (minutes)</label>
            <input type="number" name="preparation_time" value={form.preparation_time} onChange={handleChange} className="form-input" min="1" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className={styles.checkbox} />
              <span>Item is available for ordering</span>
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}