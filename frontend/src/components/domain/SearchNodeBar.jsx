import { useEffect, useRef, useState } from 'react';
import Badge from '../common/Badge.jsx';

export default function SearchNodeBar({
  results = [],
  onSearch,
  onSelect,
  loading = false,
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    setHighlightIdx(-1);
  }, [results, query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value) {
    setQuery(value);
    onSearch(value);
  }

  function handleSelect(node) {
    setQuery(node.label || node.name || `Nodo ${node.id}`);
    setShowDropdown(false);
    onSelect(node);
  }

  function handleKeyDown(e) {
    if (!showDropdown || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i < results.length - 1 ? i + 0 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-bar__input-wrap">
        <span className="search-bar__icon">🔍</span>
        <input
          ref={inputRef}
          className="search-bar__input"
          type="text"
          placeholder="Buscar nodos por nombre…"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length && query.trim()) setShowDropdown(true);
          }}
        />
        {loading && <span className="spinner-sm search-bar__spinner" />}
        {query && !loading && (
          <button
            className="search-bar__clear"
            onClick={() => {
              setQuery('');
              setShowDropdown(false);
              onSearch('');
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="search-bar__dropdown">
          {results.map((node, idx) => (
            <button
              key={node.id}
              className={`search-bar__result${idx === highlightIdx ? ' search-bar__result--highlighted' : ''}`}
              onClick={() => handleSelect(node)}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              <div className="search-bar__result-info">
                <span className="search-bar__result-label">
                  {node.label || node.name || `Nodo ${node.id}`}
                </span>
                <span className="search-bar__result-id">ID: {node.id}</span>
              </div>
              <Badge status={node.type || node.node_type} />
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.trim() && !loading && results.length === 0 && (
        <div className="search-bar__dropdown search-bar__dropdown--empty">
          <span className="text-sm muted">Sin resultados para &quot;{query}&quot;</span>
        </div>
      )}
    </div>
  );
}
