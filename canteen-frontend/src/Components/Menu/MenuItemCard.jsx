import React from 'react';

export default function MenuItemCard({ item, isAdmin, onEdit, onDelete, onToggle }) {
  // Currency formatter for Philippine Peso
  const fmt = (n) => `₱${parseFloat(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  // 1. Map category names to specific emojis
  const CATEGORY_ICONS = {
    'Meals': '🍛',
    'Beverages': '🥤',
    'Desserts': '🍰',
    'Snacks': '🍿',
    'Combos': '🍱',
    'default': '🍽️'
  };

  // 2. Determine which icon to show based on the item's category
  const categoryName = item.category?.name || 'default';
  const categoryIcon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS['default'];

  return (
    <div
      className="rounded-3 d-flex flex-column h-100 overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        transition: 'all 0.2s ease',
        opacity: item.is_available ? 1 : 0.6,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Image / Placeholder Section */}
      <div
        className="d-flex align-items-center justify-content-center position-relative"
        style={{ height: 140, background: 'var(--surface-2)', flexShrink: 0 }}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Use the dynamic category icon if no image is present */
          <span style={{ fontSize: 48 }}>{categoryIcon}</span>
        )}

        {/* Availability badge */}
        <span
          className="position-absolute top-0 end-0 m-2 badge rounded-pill"
          style={{
            background: item.is_available ? 'rgba(6,214,160,0.15)' : 'rgba(239,71,111,0.15)',
            color: item.is_available ? '#06D6A0' : '#EF476F',
            fontSize: 10,
            fontWeight: 700,
            border: `1px solid ${item.is_available ? 'rgba(6,214,160,0.3)' : 'rgba(239,71,111,0.3)'}`,
          }}
        >
          {item.is_available ? 'Available' : 'Unavailable'}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="mb-1">
          <span
            className="badge rounded-pill mb-2"
            style={{
              background: 'rgba(255,107,53,0.12)',
              color: '#FF6B35',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
            }}
          >
            {item.category?.name || 'Uncategorized'}
          </span>
        </div>

        <h6
          className="fw-bold mb-1 text-truncate"
          style={{ fontSize: 14, color: 'var(--text-primary)' }}
        >
          {item.name}
        </h6>

        {item.description && (
          <p
            className="mb-2"
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        )}

        <div className="mt-auto">
          <div
            className="fw-bold mb-3"
            style={{ fontSize: 18, color: '#FF6B35', fontFamily: 'var(--font-display)' }}
          >
            {fmt(item.price)}
          </div>

          {/* Stock Indicator */}
          <div className="d-flex align-items-center justify-content-center justify-content-between mb-3">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stock</span>
            <span
              className="badge rounded-pill"
              style={{
                background: item.stock_quantity <= 5
                  ? 'rgba(239,71,111,0.12)'
                  : item.stock_quantity <= 15
                  ? 'rgba(255,209,102,0.12)'
                  : 'rgba(6,214,160,0.12)',
                color: item.stock_quantity <= 5 ? '#EF476F'
                  : item.stock_quantity <= 15 ? '#FFD166'
                  : '#06D6A0',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {item.stock_quantity} units
            </span>
          </div>

          {/* Admin Management Actions */}
          {isAdmin && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm flex-fill fw-semibold"
                onClick={() => onEdit(item)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-sm fw-semibold"
                onClick={() => onToggle(item.id)}
                style={{
                  background: item.is_available ? 'rgba(255,209,102,0.1)' : 'rgba(6,214,160,0.1)',
                  border: `1px solid ${item.is_available ? 'rgba(255,209,102,0.3)' : 'rgba(6,214,160,0.3)'}`,
                  color: item.is_available ? '#FFD166' : '#06D6A0',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '4px 10px',
                }}
              >
                {item.is_available ? '⏸' : '▶'}
              </button>
              <button
                className="btn btn-sm fw-semibold"
                onClick={() => onDelete(item.id)}
                style={{
                  background: 'rgba(239,71,111,0.1)',
                  border: '1px solid rgba(239,71,111,0.3)',
                  color: '#EF476F',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '4px 10px',
                }}
              >
                🗑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}