export default function LoadingSpinner({ size = 'md', text = '' }) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32;
  const border = size === 'sm' ? 2 : size === 'lg' ? 4 : 3;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-2">
      <div
        style={{
          width: dim,
          height: dim,
          border: `${border}px solid var(--border-subtle)`,
          borderTop: `${border}px solid #FF6B35`,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {text && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{text}</span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}