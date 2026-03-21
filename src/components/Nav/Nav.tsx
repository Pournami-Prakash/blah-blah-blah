import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface NavProps {
  onWhisper: () => void;
  whisperCount: number;
}

export default function Nav({ onWhisper, whisperCount }: NavProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '14px 32px',
      background: '#F7F3EE',
      borderBottom: '.5px solid #E8E0D4',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <Link to="/" style={{ fontFamily: '"Playfair Display"', fontStyle: 'italic', fontSize: '20px', color: '#2A2420', textDecoration: 'none' }}>
        blah blah blah<span style={{ color: '#9A6A50' }}>.</span>
      </Link>

      <div style={{ flex: 1, maxWidth: '340px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', opacity: .45, pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="#2A2420" strokeWidth="1.2" />
          <path d="M9.5 9.5L12 12" stroke="#2A2420" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && search.trim()) navigate(`/city/${encodeURIComponent(search.trim())}`); }}
          placeholder="search a city…"
          style={{
            width: '100%',
            background: '#EDE8DF',
            border: '.5px solid #D8D0C4',
            borderRadius: '10px',
            padding: '8px 14px 8px 36px',
            fontSize: '13px',
            color: '#2A2420',
            fontFamily: '"DM Sans"',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to="/wall" style={{ fontSize: '13px', color: '#8A7A6A', textDecoration: 'none' }}>explore</Link>
        <Link to="/journal" style={{ fontSize: '13px', color: '#8A7A6A', textDecoration: 'none' }}>journal</Link>
        <span style={{ fontSize: '12px', color: '#B8A898', fontFamily: '"DM Mono"' }}>{whisperCount.toLocaleString()} posts</span>
        <button
          onClick={onWhisper}
          style={{
            background: '#2A2420', color: '#F7F3EE',
            border: 'none', borderRadius: '10px',
            padding: '9px 20px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
            fontFamily: '"DM Sans"',
          }}
        >
          + say something
        </button>
      </div>
    </nav>
  );
}
