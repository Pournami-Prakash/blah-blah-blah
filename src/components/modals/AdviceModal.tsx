import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'advice',   label: '💡 advice',          color: '#D48030' },
  { key: 'quote',    label: '💬 quote',            color: '#5060C8' },
  { key: 'reminder', label: '📌 reminder',         color: '#C84848' },
  { key: 'lesson',   label: '🌱 lesson learned',   color: '#428050' },
];

export default function AdviceModal({ isOpen, onClose }: AdviceModalProps) {
  const [content, setContent]   = useState('');
  const [source, setSource]     = useState('');
  const [city, setCity]         = useState('');
  const [category, setCategory] = useState('advice');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const charCount = content.length;
  const canSubmit = content.trim().length > 0 && !loading;
  const activeColor = CATEGORIES.find(c => c.key === category)?.color ?? '#D48030';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const fullContent = [
        content.trim(),
        source.trim() ? `\n— ${source.trim()}` : '',
      ].join('');

      await createPost({
        type: 'typewriter',
        content: fullContent,
        tags: [category],
        location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
      } as Parameters<typeof createPost>[0]);

      setSuccess(true);
      setTimeout(() => {
        setContent(''); setSource(''); setCity(''); setCategory('advice');
        setSuccess(false); onClose();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <style>{`
        @keyframes fingerPoint {
          0%,100% { transform: translateX(0px) rotate(-8deg); }
          50%      { transform: translateX(4px) rotate(-8deg); }
        }
        .advice-point { display: inline-block; animation: fingerPoint 1.2s ease-in-out infinite; }
      `}</style>

      <div style={{ padding: '28px 26px 36px', overflowY: 'auto', flex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.18em', color: '#C8B8A8', margin: '0 0 5px', textTransform: 'lowercase' }}>
            <span className="advice-point">👆</span> hey. listen.
          </p>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '26px', color: '#1A1410', margin: '0 0 4px', lineHeight: 1.15 }}>
            say it.
          </h2>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12px', color: '#A09080', margin: 0 }}>
            advice · quotes · things you wish someone had told you
          </p>
        </div>

        {/* Category selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                background: category === c.key ? c.color : 'transparent',
                color: category === c.key ? '#FFFFFF' : '#8A7A6A',
                border: `1px solid ${category === c.key ? c.color : 'rgba(42,36,32,0.15)'}`,
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '12px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: category === c.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.18s',
                letterSpacing: '0.02em',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{
          position: 'relative',
          marginBottom: '16px',
          borderLeft: `3px solid ${activeColor}`,
          paddingLeft: '16px',
          transition: 'border-color 0.25s',
        }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              category === 'quote'    ? '"the thing someone said that you can\'t forget…"' :
              category === 'reminder' ? 'the thing you need to hear right now…' :
              category === 'lesson'   ? 'what took you too long to figure out…' :
                                        'the advice you\'d give to anyone who needed it…'
            }
            rows={5}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '17px',
              color: '#1A1410',
              lineHeight: 1.75,
              caretColor: activeColor,
              letterSpacing: '-0.01em',
            }}
          />
          {charCount > 0 && (
            <span style={{
              position: 'absolute',
              bottom: '6px',
              right: '0',
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: '#C8B8A8',
              letterSpacing: '0.05em',
            }}>
              {charCount}
            </span>
          )}
        </div>

        {/* Source + city */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
              — who said this? (optional)
            </label>
            <input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="a name, 'my grandmother'…"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(42,36,32,0.10)',
                outline: 'none',
                padding: '5px 0',
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: '13px',
                color: '#4A3820',
                transition: 'border-color 0.18s',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = `${activeColor}55`; }}
              onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.10)'; }}
            />
          </div>
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
              📍 from where? (optional)
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="city or place"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(42,36,32,0.10)',
                outline: 'none',
                padding: '5px 0',
                fontFamily: '"DM Mono", monospace',
                fontSize: '11px',
                color: '#8A7A6A',
                letterSpacing: '0.05em',
                transition: 'border-color 0.18s',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.20)'; }}
              onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.10)'; }}
            />
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
          {success ? '👆 pinned to the wall' : loading ? 'pinning…' : 'put it on the wall'}
        </button>

      </div>
    </BottomSheet>
  );
}
