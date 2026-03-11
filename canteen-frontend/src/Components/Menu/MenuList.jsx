import { useState, useEffect } from 'react';
import { menuService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import MenuForm from './MenuForm';
import styles from './MenuList.module.css';

export default function MenuList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, catData] = await Promise.all([
        menuService.getItems({ per_page: 100 }),
        menuService.getCategories(),
      ]);
      setItems(menuData.data || []);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuService.deleteItem(item.id);
      loadData();
    } catch {
      alert('Failed to delete item');
    }
  };

  const handleToggle = async (item) => {
    try {
      await menuService.toggleAvailability(item.id);
      loadData();
    } catch {
      alert('Failed to update availability');
    }
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || i.category_id === parseInt(filterCat);
    return matchSearch && matchCat;
  });

  if (showForm || editItem) {
    return (
      <MenuForm
        item={editItem}
        categories={categories}
        onSuccess={() => { setShowForm(false); setEditItem(null); loadData(); }}
        onCancel={() => { setShowForm(false); setEditItem(null); }}
      />
    );
  }

  return (
    <div className={styles.menuList}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <select
            className="form-input"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Menu Item
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner /></div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(item => (
            <div key={item.id} className={`${styles.menuCard} ${!item.is_available ? styles.unavailable : ''}`}>
              <div className={styles.cardTop}>
                <div className={styles.emoji}>{item.category?.icon || '🍽️'}</div>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.toggleBtn} ${item.is_available ? styles.available : styles.unavail}`}
                    onClick={() => handleToggle(item)}
                    title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                  >
                    {item.is_available ? '✓' : '✗'}
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemCat}>{item.category?.name}</div>
                <div className={styles.itemDesc}>{item.description}</div>
                <div className={styles.cardMeta}>
                  <div className={styles.price}>₱{parseFloat(item.price).toFixed(2)}</div>
                  <div className={styles.stock}>
                    <span className={`badge ${item.stock_quantity <= 10 ? 'badge-warning' : 'badge-default'}`}>
                      {item.stock_quantity} left
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '7px', fontSize: 13 }} onClick={() => setEditItem(item)}>
                  Edit
                </button>
                <button
                  style={{ padding: '7px 12px', background: 'rgba(239,71,111,0.1)', color: 'var(--brand-danger)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  onClick={() => handleDelete(item)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>No menu items found</div>
          )}
        </div>
      )}
    </div>
  );
}