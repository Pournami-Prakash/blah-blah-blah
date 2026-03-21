import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

interface CafeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIBES = ['cozy', 'lively', 'quiet', 'outdoor seating', 'good for solo', 'bring a book', 'cheap', 'hidden gem', 'great coffee', 'must-order dish'];
const TYPES = ['café', 'restaurant', 'food truck', 'market stall', 'bar', 'bakery', 'rooftop', 'street food'];

export default function CafeModal({ isOpen, onClose }: CafeModalProps) {
  const [name, setName]           = useState('');
  const [mustGet, setMustGet]     = useState('');
  const [description, setDesc]    = useState('');
  const [city, setCity]           = useState('');
  const [selectedType, setType]   = useState('');
  const [vibes, setVibes]         = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const toggleVibe = (v: string) => setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const canSubmit = name.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const desc = [
        mustGet.trim()  ? `Must get: ${mustGet.trim()}` : '',
        description.trim(),
        selectedType    ? `Type: ${selectedType}` : '',
      ].filter(Boolean).join('\n');

      await createPost({
        type: 'cafe',
        name: name.trim(),
        description: desc || name.trim(),
        tags: [...(selectedType ? [selectedType] : []), ...vibes],
        location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setName(''); setMustGet(''); setDesc(''); setCity(''); setType(''); setVibes([]);
        setSuccess(false); onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const tagBtn = (_label: string, active: boolean) => ({
    background: active ? '#C05830' : '#FFF5EE',
    color: active ? '#FFFFFF' : '#7A4A2A',
    border: `1px solid ${active ? '#C05830' : '#F0C4A0'}`,
    borderRadius: '20px',
    padding: '5px 12px',
    fontSize: '11px',
    fontFamily: '"DM Sans", sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.02em',
  } as React.CSSProperties);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="520px">
      <div style={{ padding: '28px 26px 36px', overflowY: 'auto', flex: 1 }}>

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#C8B8A8', margin: '0 0 4px', textTransform: 'lowercase' }}>
          🍜 somewhere to eat
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#1A1410', margin: '0 0 22px' }}>
          the place you keep telling people about
        </h2>

        {/* Place type pills */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(selectedType === t ? '' : t)} style={tagBtn(t, selectedType === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Name — big & prominent */}
        <div style={{ marginBottom: '16px' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="what's the place called?"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid rgba(192,88,48,0.20)',
              outline: 'none',
              padding: '8px 0',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '20px',
              color: '#1A1410',
              transition: 'border-color 0.18s',
              caretColor: '#C05830',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(192,88,48,0.55)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(192,88,48,0.20)'; }}
          />
        </div>

        {/* Must get — the most important field */}
        <div style={{
          background: '#FFF5EE',
          border: '1.5px solid #F0C4A0',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '14px',
        }}>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#C05830', display: 'block', marginBottom: '6px', textTransform: 'lowercase', fontWeight: 600 }}>
            ✦ what should i order?
          </label>
          <input
            value={mustGet}
            onChange={e => setMustGet(e.target.value)}
            placeholder="the thing that makes it worth going…"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: '"Caveat", cursive',
              fontSize: '18px',
              color: '#3A1808',
              caretColor: '#C05830',
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <textarea
            value={description}
            onChange={e => setDesc(e.target.value)}
            placeholder="anything else to know? atmosphere, when to go, how to find it…"
            rows={3}
            style={{
              width: '100%',
              background: '#FDFCFA',
              border: '1px solid #EAE4DC',
              borderRadius: '10px',
              padding: '10px 14px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              color: '#2A2420',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.65,
              transition: 'border-color 0.18s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(192,88,48,0.30)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = '#EAE4DC'; }}
          />
        </div>

        {/* City */}
        <div style={{ marginBottom: '14px' }}>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="📍 which city? (optional)"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(42,36,32,0.10)',
              outline: 'none',
              padding: '6px 0',
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              color: '#8A7A6A',
              letterSpacing: '0.06em',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(192,88,48,0.25)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.10)'; }}
          />
        </div>

        {/* Vibes */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '8px', textTransform: 'lowercase' }}>
            vibe
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {VIBES.map(v => (
              <button key={v} onClick={() => toggleVibe(v)} style={tagBtn(v, vibes.includes(v))}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            background: success ? '#5A9A68' : '#2A2420',
            color: '#F7F3EE',
            border: 'none',
            borderRadius: '12px',
            padding: '13px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.4,
            transition: 'background 0.3s, transform 0.18s, opacity 0.2s',
            fontFamily: '"DM Sans", sans-serif',
          }}
          onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          {success ? '🍜 added to the list' : loading ? 'saving…' : 'add this place'}
        </button>

      </div>
    </BottomSheet>
  );
}
