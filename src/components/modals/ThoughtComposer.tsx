import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import { addJournalEntry, createPost } from '../../api/client';
import { getDailyPrompt } from '../../data/prompts';

export type ThoughtStyle = 'letter' | 'typewriter' | 'advice' | 'journal';

const COPY: Record<ThoughtStyle, { emoji: string; eyebrow: string; title: string; placeholder: string; accent: string; extra?: string }> = {
  typewriter: { emoji: '💭', eyebrow: 'quick thought', title: 'what’s passing through?', placeholder: getDailyPrompt(), accent: '#5C5148' },
  letter: { emoji: '🦆', eyebrow: 'little letter', title: 'leave a note for someone.', placeholder: 'write what you might never say out loud…', accent: '#D66A3D', extra: 'to / from (optional)' },
  advice: { emoji: '👆', eyebrow: 'advice or quote', title: 'pass it on.', placeholder: 'something you wish someone had told you…', accent: '#C67B2D', extra: 'source (optional)' },
  journal: { emoji: '📓', eyebrow: 'journal line', title: 'a small piece of today.', placeholder: 'what did today feel like?', accent: '#596E4C', extra: 'title (optional)' },
};

export default function ThoughtComposer({ isOpen, onClose, style }: { isOpen: boolean; onClose: () => void; style: ThoughtStyle }) {
  const copy = COPY[style];
  const [content, setContent] = useState('');
  const [extra, setExtra] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { setStatus(''); }, [style]);

  const submit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true); setStatus('');
    try {
      if (style === 'journal') {
        await addJournalEntry(extra.trim() ? `${extra.trim()}\n\n${content.trim()}` : content.trim(), city.trim() || undefined);
      } else if (style === 'letter') {
        await createPost({ type: 'letter', content: content.trim(), attribution: extra.trim() || undefined, city: city.trim() || undefined });
      } else {
        await createPost({ type: 'typewriter', content: extra.trim() ? `${content.trim()}\n— ${extra.trim()}` : content.trim(), tags: style === 'advice' ? ['advice'] : [], city: city.trim() || undefined });
      }
      setStatus('left here safely ✦');
      setTimeout(() => { setContent(''); setExtra(''); setCity(''); setStatus(''); onClose(); }, 900);
    } catch { setStatus('that didn’t land—try once more'); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="530px">
      <div style={{ padding: '25px 26px 34px', borderTop: `4px solid ${copy.accent}` }}>
        <p style={{ font: '10px "DM Mono", monospace', letterSpacing: '.15em', color: '#806D5D', margin: '0 0 5px' }}>{copy.emoji} {copy.eyebrow}</p>
        <h2 style={{ font: 'italic 26px "Playfair Display", serif', color: '#211914', margin: '0 0 20px' }}>{copy.title}</h2>
        {copy.extra && <label style={labelStyle}>{copy.extra}<input value={extra} onChange={e => setExtra(e.target.value)} style={inputStyle} /></label>}
        <label style={labelStyle}>your words<textarea value={content} onChange={e => setContent(e.target.value)} placeholder={copy.placeholder} rows={7} style={{ ...inputStyle, resize: 'vertical', font: 'italic 16px "Playfair Display", serif', lineHeight: 1.65 }} /></label>
        <label style={labelStyle}>place (optional)<input value={city} onChange={e => setCity(e.target.value)} placeholder="city or somewhere nearby" style={inputStyle} /></label>
        <button onClick={submit} disabled={!content.trim() || loading} style={{ width: '100%', border: 0, borderRadius: '10px', padding: '12px', background: copy.accent, color: '#FFF9F1', cursor: 'pointer', opacity: !content.trim() || loading ? .45 : 1 }}>{loading ? 'leaving it here…' : 'leave this thought'}</button>
        {status && <p role="status" style={{ textAlign: 'center', color: '#675443', fontSize: '11px', margin: '10px 0 0' }}>{status}</p>}
      </div>
    </BottomSheet>
  );
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: '6px', marginBottom: '15px', color: '#725E4E', font: '10px "DM Mono", monospace', letterSpacing: '.08em' };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #DCCFC1', borderRadius: '9px', background: '#FCF8F2', padding: '11px 12px', color: '#2A211A', font: '14px "DM Sans", sans-serif' };
