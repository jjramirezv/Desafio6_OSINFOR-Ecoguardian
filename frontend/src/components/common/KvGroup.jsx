export default function KvGroup({ items = [], columns = 2, mono = false }) {
  if (!items.length) return null;
  return (
    <div
      className="kv-group"
      style={{ '--kv-cols': columns }}
    >
      {items.map((item, idx) => {
        if (item.hidden) return null;
        const val = item.value ?? item.val ?? '—';
        return (
          <div key={item.key || idx} className="kv-group__row">
            <span className="kv-group__key">{item.label || item.key}</span>
            <span
              className={`kv-group__value${item.mono || mono ? ' mono' : ''}${item.badge ? ' kv-group__value--badge' : ''}${item.color ? ' kv-group__value--colored' : ''}`}
              style={item.color ? { '--kv-color': item.color } : undefined}
            >
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}
