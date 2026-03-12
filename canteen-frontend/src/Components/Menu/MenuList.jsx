import { useState, useEffect } from 'react';
import { menuService } from '../../Services/orderService';
import LoadingSpinner from '../Common/LoadingSpinner';
import MenuItemCard from './MenuItemCard';
import MenuForm from './MenuForm';

export default function MenuList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [filterAvail, setFilterAvail] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Pass per_page: 100 to override the Laravel backend default of 20
      const [menuData, catData] = await Promise.all([
        menuService.getItems({ per_page: 100 }), 
        menuService.getCategories(),
      ]);
      
      // Laravel's paginate() returns the array inside 'data'
      setItems(menuData.data || menuData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditItem(null); setShowForm(true); };
  const openEdit   = (item) => { setEditItem(item); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditItem(null); };

  const handleSaved  = () => { closeForm(); loadData(); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await menuService.deleteItem(id);
    loadData();
  };
  const handleToggle = async (id) => {
    await menuService.toggleAvailability(id);
    loadData();
  };

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = selectedCat ? item.category_id == selectedCat : true;
    const matchAvail  = filterAvail === '' ? true
      : filterAvail === '1' ? item.is_available
      : !item.is_available;
    return matchSearch && matchCat && matchAvail;
  });

  return (
    <div className="d-flex flex-column gap-4" style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
            Menu Management
          </h2>
          <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {items.length} items across {categories.length} categories
          </p>
        </div>
        <button
          className="btn fw-bold px-4"
          onClick={openCreate}
          style={{
            background: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            padding: '10px 20px',
          }}
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-3 p-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="🔍  Search menu items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 10,
                fontSize: 14,
                padding: '10px 14px',
              }}
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 10,
                fontSize: 14,
                padding: '10px 14px',
              }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select"
              value={filterAvail}
              onChange={e => setFilterAvail(e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 10,
                fontSize: 14,
                padding: '10px 14px',
              }}
            >
              <option value="">All Status</option>
              <option value="1">Available</option>
              <option value="0">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {items.length} items
      </div>

      {/* Grid */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="d-flex flex-column align-items-center justify-content-center rounded-3 py-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p className="fw-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No items found</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(item => (
            <div key={item.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <MenuItemCard
                item={item}
                isAdmin={true}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={closeForm}
        >
          <div
            style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', margin: '0 16px' }}
            onClick={e => e.stopPropagation()}
          >
            <MenuForm
              item={editItem}
              categories={categories}
              onSaved={handleSaved}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}