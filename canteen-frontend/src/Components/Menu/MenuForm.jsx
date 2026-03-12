import { useState, useEffect, useRef } from 'react';
import { menuService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';

const styles = `
  .mf-input { background: var(--surface-2) !important; border: 1px solid var(--border-subtle) !important; color: var(--text-primary) !important; border-radius: 10px !important; }
  .mf-input:focus { background: var(--surface-2) !important; color: var(--text-primary) !important; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important; }
  .mf-input::placeholder { color: var(--text-muted) !important; }
  .mf-input option { background: var(--surface-2) !important; color: var(--text-primary) !important; }
  .mf-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 6px; display: block; }
  .mf-drop { border: 2px dashed var(--border-subtle); border-radius: 12px; background: var(--surface-2); transition: all 0.15s; cursor: pointer; }
  .mf-drop:hover, .mf-drop.drag-over { border-color: #FF6B35; background: rgba(255,107,53,0.04); }
`;

export default function MenuForm({ item = null, categories: propCategories, onSaved, onSuccess, onCancel }) {
  // Support both onSaved and onSuccess callback names
  const handleSuccess = onSaved || onSuccess;
  const isEdit = !!item;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:           item?.name          ?? '',
    description:    item?.description   ?? '',
    price:          item?.price         ?? '',
    category_id:    item?.category_id   ?? '',
    stock_quantity: item?.stock_quantity ?? '',
    is_available:   item?.is_available  ?? true,
  });

  const [categories, setCategories]     = useState(propCategories || []);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url ?? null);
  const [removeImage, setRemoveImage]   = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]             = useState({});

  useEffect(() => {
    if (!propCategories || propCategories.length === 0) {
      menuService.getCategories().then(setCategories).catch(console.error);
    }
  }, [propCategories]);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(e => ({ ...e, image: 'Please select an image file (jpg, png, webp).' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(e => ({ ...e, image: 'Image must be under 2MB.' }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setErrors(e => ({ ...e, image: null }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                           e.name = 'Name is required.';
    if (!form.price || form.price <= 0)              e.price = 'Enter a valid price.';
    if (!form.category_id)                           e.category_id = 'Select a category.';
    if (form.stock_quantity === '' || form.stock_quantity < 0) e.stock_quantity = 'Enter stock quantity.';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append('name',           form.name);
      fd.append('description',    form.description);
      fd.append('price',          form.price);
      fd.append('category_id',    form.category_id);
      fd.append('stock_quantity', form.stock_quantity);
      fd.append('is_available',   form.is_available ? '1' : '0');
      if (imageFile)   fd.append('image', imageFile);
      if (removeImage) fd.append('remove_image', '1');
      if (isEdit)      fd.append('_method', 'PUT');

      if (isEdit) {
        await menuService.updateItemForm(item.id, fd);
      } else {
        await menuService.createItemForm(fd);
      }

      // ✅ Call whichever callback was passed
      handleSuccess?.();
    } catch (err) {
      const serverErrors = err.response?.data?.errors ?? {};
      const msg          = err.response?.data?.message ?? 'Something went wrong.';
      setErrors({ ...serverErrors, _server: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div
        className="rounded-4 p-4"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold mb-0" style={{ fontSize: 17, color: 'var(--text-primary)' }}>
            {isEdit ? '✏️ Edit Item' : '➕ Add New Item'}
          </h3>
          <button onClick={onCancel}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          {/* Name */}
          <div>
            <label className="mf-label">Item Name *</label>
            <input className={`form-control mf-input${errors.name ? ' border-danger' : ''}`}
              placeholder="e.g. Chicken Rice Combo"
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Description */}
          <div>
            <label className="mf-label">Description</label>
            <textarea className="form-control mf-input"
              placeholder="Brief description..."
              rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              style={{ resize: 'none' }} />
          </div>

          {/* Price + Category */}
          <div className="row g-2">
            <div className="col-6">
              <label className="mf-label">Price (₱) *</label>
              <input type="number"
                className={`form-control mf-input${errors.price ? ' border-danger' : ''}`}
                placeholder="0.00" value={form.price}
                onChange={e => set('price', e.target.value)} min="0" step="0.01" />
              {errors.price && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.price}</div>}
            </div>
            <div className="col-6">
              <label className="mf-label">Category *</label>
              <select className={`form-select mf-input${errors.category_id ? ' border-danger' : ''}`}
                value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.category_id}</div>}
            </div>
          </div>

          {/* Stock + Availability */}
          <div className="row g-2 align-items-end">
            <div className="col-6">
              <label className="mf-label">Stock Quantity *</label>
              <input type="number"
                className={`form-control mf-input${errors.stock_quantity ? ' border-danger' : ''}`}
                placeholder="0" value={form.stock_quantity}
                onChange={e => set('stock_quantity', e.target.value)} min="0" />
              {errors.stock_quantity && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 4 }}>{errors.stock_quantity}</div>}
            </div>
            <div className="col-6">
              <label className="mf-label">Availability</label>
              <div className="d-flex align-items-center gap-3 rounded-3 px-3 py-2"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', height: 42 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
                  {form.is_available ? '✅ Available' : '🔴 Unavailable'}
                </span>
                <div className="position-relative" style={{ width: 40, height: 22, cursor: 'pointer' }}
                  onClick={() => set('is_available', !form.is_available)}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 99, background: form.is_available ? '#06D6A0' : 'var(--surface-3)', transition: 'background 0.2s' }} />
                  <div style={{ position: 'absolute', top: 3, left: form.is_available ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="mf-label">Item Photo</label>

            {imagePreview ? (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="position-relative d-inline-block">
                  <img src={imagePreview} alt="Preview"
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-subtle)' }} />
                  <button onClick={handleRemoveImage}
                    style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#EF476F', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    ✕
                  </button>
                </div>
                <button className="btn btn-sm fw-semibold" onClick={() => fileRef.current?.click()}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 12 }}>
                  🔄 Change Photo
                </button>
              </div>
            ) : (
              <div className={`mf-drop d-flex flex-column align-items-center justify-content-center gap-2 py-4${dragOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 32 }}>🖼️</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Click or drag & drop an image</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, WebP — max 2MB</div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleImageFile(e.target.files[0])} />

            {errors.image && <div style={{ fontSize: 12, color: '#EF476F', marginTop: 6 }}>{errors.image}</div>}
          </div>

          {/* Server error */}
          {errors._server && (
            <div className="rounded-3 px-3 py-2"
              style={{ background: 'rgba(239,71,111,0.08)', border: '1px solid rgba(239,71,111,0.3)', fontSize: 13, color: '#EF476F' }}>
              ⚠️ {errors._server}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex gap-2 pt-1">
            <button className="btn fw-semibold" onClick={onCancel} disabled={submitting}
              style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 10, padding: '10px' }}>
              Cancel
            </button>
            <button className="btn fw-bold" onClick={handleSubmit} disabled={submitting}
              style={{ flex: 2, background: 'linear-gradient(135deg,#FF6B35,#e85a25)', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
              {submitting
                ? <span className="d-flex align-items-center justify-content-center gap-2"><span className="spinner-border spinner-border-sm" /> Saving...</span>
                : isEdit ? '💾 Save Changes' : '➕ Add Item'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}