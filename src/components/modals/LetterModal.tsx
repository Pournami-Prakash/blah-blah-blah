import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';
import type { Location } from '../../types';

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LetterModal({ isOpen, onClose }: LetterModalProps) {
  const [to, setTo]               = useState('');
  const [content, setContent]     = useState('');
  const [from, setFrom]           = useState('');
  const [city, setCity]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [sealed, setSealed]       = useState(false);

  const charCount = content.length;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setSealed(true);
    try {
      const fullContent = [
        to.trim()   ? `dear ${to.trim()},\n\n` : 'to whoever finds this,\n\n',
        content.trim(),
        from.trim() ? `\n\n— ${from.trim()}` : '\n\n— someone, somewhere',
      ].join('');

      const loc: Location | undefined = city.trim() ? {
        city: city.trim(), country: '', lat: 0, lng: 0,
      } : undefined;

      await createPost({ type: 'letter', content: fullContent, location: loc });
      setSuccess(true);
      setTimeout(() => {
        setTo(''); setContent(''); setFrom(''); setCity('');
        setSuccess(false); setSealed(false);
        onClose();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !loading;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <style>{`
        @keyframes sealBounce {
          0%   { transform: scale(1) rotate(-2deg); }
          40%  { transform: scale(1.18) rotate(2deg); }
          70%  { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .seal-anim { animation: sealBounce 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }
        .letter-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(42,36,32,0.10);
          outline: none;
          padding: 6px 0;
          font-family: "Playfair Display", serif;
          font-style: italic;
          font-size: 15px;
          color: #2A2420;
          transition: border-color 0.18s;
        }
        .letter-input:focus { border-color: rgba(42,36,32,0.28); }
        .letter-input::placeholder { color: rgba(42,36,32,0.22); }
      `}</style>

      <div style={{ padding: '28px 28px 36px', overflowY: 'auto', flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#C8B8A8', margin: '0 0 4px', textTransform: 'lowercase' }}>
              🦆 a note
            </p>
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#1A1410', margin: 0 }}>
              send a note to someone
            </h2>
          </div>
          {/* Wax seal — animates when sealed */}
          <div
            className={sealed ? 'seal-anim' : ''}
            style={{
              width: '42px', height: '42px',
              borderRadius: '50%',
              background: success ? '#5A9A68' : '#E8543A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 2px 12px rgba(232,84,58,0.25)',
              flexShrink: 0,
              transition: 'background 0.4s ease',
            }}
          >
            {success ? '✓' : '🦆'}
          </div>
        </div>

        {/* To: */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
            heyyy —
          </label>
          <input
            className="letter-input"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="a friend, a stranger, no one in particular…"
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '18px' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="write what you'd never say out loud…"
            rows={6}
            style={{
              width: '100%',
              background: '#FDFCFA',
              border: '1px solid #EAE4DC',
              borderRadius: '12px',
              padding: '14px 16px',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '16px',
              color: '#2A2420',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.75,
              caretColor: '#E8543A',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(232,84,58,0.30)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = '#EAE4DC'; }}
          />
          <div style={{ textAlign: 'right', marginTop: '4px', fontFamily: '"DM Mono", monospace', fontSize: '9px', color: charCount > 0 ? '#C8B8A8' : 'transparent', letterSpacing: '0.06em' }}>
            {charCount} chars
          </div>
        </div>

        {/* From + City row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
              — from (optional)
            </label>
            <input
              className="letter-input"
              value={from}
              onChange={e => setFrom(e.target.value)}
              placeholder="a name, a feeling…"
            />
          </div>
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
              📍 sent from (optional)
            </label>
            <input
              className="letter-input"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="city or place"
            />
          </div>
        </div>

        {/* Submit */}
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
            letterSpacing: '0.03em',
          }}
          onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          {success ? '🦆 letter sent into the world' : loading ? 'sealing…' : 'seal & leave this letter'}
        </button>

      </div>
    </BottomSheet>
  );
}
