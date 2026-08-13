import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Pin } from '../../types';

export default function CityBrowser({ pins }: { pins: Pin[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const cities = useMemo(() => [...pins].sort((a, b) => a.city.localeCompare(b.city)).filter(pin => `${pin.city} ${pin.country}`.toLowerCase().includes(query.toLowerCase())), [pins, query]);

  return (
    <div style={{ marginTop: '11px', position: 'relative' }}>
      <button onClick={() => setOpen(value => !value)} aria-expanded={open} style={{ border: 0, borderBottom: '1px dashed #9B806C', background: 'transparent', color: '#715B4A', fontFamily: '"DM Mono", monospace', fontSize: '10px', padding: '4px 2px', cursor: 'pointer' }}>
        {open ? 'close city list' : 'or browse cities by name'}
      </button>
      {open && (
        <div style={{ position: 'absolute', left: '50%', bottom: '34px', transform: 'translateX(-50%) rotate(-.4deg)', width: 'min(340px, calc(100vw - 32px))', maxHeight: '310px', overflow: 'auto', background: '#FBF6ED', border: '1px solid #D9CABC', boxShadow: '0 16px 46px rgba(45,31,18,.18)', padding: '16px', zIndex: 90, textAlign: 'left' }}>
          <label htmlFor="city-browser" style={{ display: 'block', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', color: '#2A211A', marginBottom: '8px' }}>find a place</label>
          <input id="city-browser" value={query} onChange={event => setQuery(event.target.value)} placeholder="type a city…" autoFocus style={{ width: '100%', border: '1px solid #D9CABC', background: '#F6EFE5', padding: '10px 11px', borderRadius: '7px', marginBottom: '10px', color: '#2A211A' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
            {cities.map(pin => <Link key={`${pin.city}-${pin.country}`} to={`/city/${encodeURIComponent(pin.city)}`} style={{ color: '#725B48', textDecoration: 'none', font: '11px "DM Sans", sans-serif', padding: '6px 2px' }}>{pin.city} <small style={{ opacity: .6 }}>({pin.count})</small></Link>)}
          </div>
          {!cities.length && <p style={{ color: '#806B5A', fontSize: '11px' }}>No whispers there yet—perhaps you’ll leave the first one.</p>}
        </div>
      )}
    </div>
  );
}
