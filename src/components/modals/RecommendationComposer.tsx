import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

export type RecommendationStyle = 'cafe' | 'movie' | 'activity';

const COPY = {
  cafe: { emoji: '🍜', eyebrow: 'food or place', title: 'where should someone go?', name: 'place name', description: 'what makes it worth finding?', accent: '#C85D38' },
  movie: { emoji: '🎬', eyebrow: 'movie or series', title: 'what should someone watch?', name: 'title', description: 'why is it worth their time?', accent: '#5969B5' },
  activity: { emoji: '🗺️', eyebrow: 'thing to do', title: 'what should someone try?', name: 'activity', description: 'how should they do it?', accent: '#4D865E' },
} satisfies Record<RecommendationStyle, Record<string, string>>;

export default function RecommendationComposer({ isOpen, onClose, style }: { isOpen: boolean; onClose: () => void; style: RecommendationStyle }) {
  const copy = COPY[style];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const submit = async () => {
    if (!name.trim() || !description.trim() || loading) return;
    setLoading(true); setStatus('');
    try {
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await createPost({
        type: style === 'cafe' ? 'cafe' : 'activity',
        name: name.trim(), description: description.trim(),
        tags: style === 'cafe' ? parsedTags : [style === 'movie' ? 'movie' : 'activity', ...parsedTags],
        city: city.trim() || undefined,
      });
      setStatus('recommendation pinned ✦');
      setTimeout(() => { setName(''); setDescription(''); setTags(''); setCity(''); setStatus(''); onClose(); }, 900);
    } catch { setStatus('that didn’t pin—try once more'); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="530px">
      <div style={{ padding: '25px 26px 34px', borderTop: `4px solid ${copy.accent}` }}>
        <p style={{ font: '10px "DM Mono", monospace', letterSpacing: '.15em', color: '#806D5D', margin: '0 0 5px' }}>{copy.emoji} {copy.eyebrow}</p>
        <h2 style={{ font: 'italic 26px "Playfair Display", serif', color: '#211914', margin: '0 0 20px' }}>{copy.title}</h2>
        <label style={labelStyle}>{copy.name}<input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>{copy.description}<textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} /></label>
        <label style={labelStyle}>tags (optional, separated by commas)<input value={tags} onChange={e => setTags(e.target.value)} placeholder="cozy, free, rainy day…" style={inputStyle} /></label>
        <label style={labelStyle}>place (optional)<input value={city} onChange={e => setCity(e.target.value)} placeholder="city or somewhere nearby" style={inputStyle} /></label>
        <button onClick={submit} disabled={!name.trim() || !description.trim() || loading} style={{ width: '100%', border: 0, borderRadius: '10px', padding: '12px', background: copy.accent, color: '#FFF9F1', cursor: 'pointer', opacity: !name.trim() || !description.trim() || loading ? .45 : 1 }}>{loading ? 'pinning it…' : 'leave this recommendation'}</button>
        {status && <p role="status" style={{ textAlign: 'center', color: '#675443', fontSize: '11px', margin: '10px 0 0' }}>{status}</p>}
      </div>
    </BottomSheet>
  );
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: '6px', marginBottom: '15px', color: '#725E4E', font: '10px "DM Mono", monospace', letterSpacing: '.08em' };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #DCCFC1', borderRadius: '9px', background: '#FCF8F2', padding: '11px 12px', color: '#2A211A', font: '14px "DM Sans", sans-serif' };
