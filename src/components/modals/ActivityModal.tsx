import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedMode?: 'movie' | 'doing';
}

const MOVIE_TAGS  = ['mind-bending', 'emotional', 'hilarious', 'comfort watch', 'underrated', 'one sitting', 'needs tissues', 'perfect ending'];
const DOING_TAGS  = ['free', 'cheap', 'outdoor', 'solo-friendly', 'rainy day', 'hidden gem', 'physically tiring', 'bring snacks'];

const WATCH_WHERE = ['Netflix', 'cinema', 'Prime Video', 'YouTube', 'Apple TV+', 'Mubi', 'somewhere pirated'];

export default function ActivityModal({ isOpen, onClose, lockedMode }: ActivityModalProps) {
  const [internalMode, setInternalMode] = useState<'movie' | 'doing'>('movie');
  const mode    = lockedMode ?? internalMode;
  const setMode = lockedMode ? (_: 'movie' | 'doing') => {} : setInternalMode;

  // Movie state
  const [title, setTitle]           = useState('');
  const [platform, setPlatform]     = useState('');
  const [movieWhy, setMovieWhy]     = useState('');
  const [movieTags, setMovieTags]   = useState<string[]>([]);
  const [stars, setStars]           = useState(0);

  // Activity state
  const [actName, setActName]       = useState('');
  const [actHow, setActHow]         = useState('');
  const [actTags, setActTags]       = useState<string[]>([]);
  const [city, setCity]             = useState('');

  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const toggleTag = (tag: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  };

  const canSubmit = mode === 'movie'
    ? (title.trim().length > 0 && movieWhy.trim().length > 0)
    : (actName.trim().length > 0 && actHow.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      if (mode === 'movie') {
        const desc = [
          movieWhy.trim(),
          platform ? `\nWatch on: ${platform}` : '',
          stars > 0 ? `\nRating: ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}` : '',
        ].join('');
        await createPost({
          type: 'activity',
          name: title.trim(),
          description: desc,
          tags: ['movie', ...movieTags],
          location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
        });
      } else {
        await createPost({
          type: 'activity',
          name: actName.trim(),
          description: actHow.trim(),
          tags: ['activity', ...actTags],
          location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
        });
      }
      setSuccess(true);
      setTimeout(() => {
        setTitle(''); setPlatform(''); setMovieWhy(''); setMovieTags([]); setStars(0);
        setActName(''); setActHow(''); setActTags([]); setCity('');
        setSuccess(false); onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FDFCFA',
    border: '1px solid #EAE4DC',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#2A2420',
    outline: 'none',
    fontFamily: '"DM Sans", sans-serif',
    transition: 'border-color 0.18s',
  };

  const tagBtn = (_tag: string, active: boolean, accent: string) => ({
    background: active ? accent : '#F4F0E8',
    color: active ? '#FFFFFF' : '#6A5A4A',
    border: `1px solid ${active ? accent : '#E0D8CC'}`,
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
      <style>{`
        .act-focus:focus { border-color: rgba(42,36,32,0.28) !important; }
        .act-textarea { resize: none; }
      `}</style>
      <div style={{ padding: '28px 26px 36px', overflowY: 'auto', flex: 1 }}>

        {/* Header */}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#C8B8A8', margin: '0 0 4px', textTransform: 'lowercase' }}>
          a recommendation
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#1A1410', margin: '0 0 20px' }}>
          {mode === 'movie' ? 'something worth watching' : 'something worth doing'}
        </h2>

        {/* Mode toggle — hidden when locked to a single mode */}
        {!lockedMode && (
          <div style={{
            display: 'flex',
            background: '#F0ECE4',
            borderRadius: '12px',
            padding: '3px',
            marginBottom: '24px',
            gap: '2px',
          }}>
            {[
              { key: 'movie' as const, label: '🎬  movies & series' },
              { key: 'doing' as const, label: '🗺️  things to do' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: mode === tab.key ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: mode === tab.key ? 600 : 400,
                  color: mode === tab.key ? '#1A1410' : '#9A8A7A',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  boxShadow: mode === tab.key ? '0 1px 8px rgba(42,36,32,0.10)' : 'none',
                  letterSpacing: '0.02em',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Movie mode ── */}
        {mode === 'movie' && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
                what's it called?
              </label>
              <input
                className="act-focus"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Parasite, The Bear, that weird A24 film…"
                style={inputStyle}
              />
            </div>

            {/* Stars */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '8px', textTransform: 'lowercase' }}>
                your rating
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setStars(stars === n ? 0 : n)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '22px', padding: '2px 4px',
                      opacity: n <= stars ? 1 : 0.25,
                      transition: 'opacity 0.15s, transform 0.15s',
                      transform: n <= stars ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Where to watch */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '8px', textTransform: 'lowercase' }}>
                where to watch
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {WATCH_WHERE.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(platform === p ? '' : p)}
                    style={tagBtn(p, platform === p, '#2A2420')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
                why should i watch it?
              </label>
              <textarea
                className="act-focus act-textarea"
                value={movieWhy}
                onChange={e => setMovieWhy(e.target.value)}
                placeholder="without spoiling it…"
                rows={3}
                style={{ ...inputStyle, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '8px', textTransform: 'lowercase' }}>
                tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {MOVIE_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag, movieTags, setMovieTags)} style={tagBtn(tag, movieTags.includes(tag), '#3A2A50')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Doing mode ── */}
        {mode === 'doing' && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
                what's the activity?
              </label>
              <input
                className="act-focus"
                value={actName}
                onChange={e => setActName(e.target.value)}
                placeholder="walk up to the old cemetery at dusk, eat at the night market…"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
                how do i actually do it?
              </label>
              <textarea
                className="act-focus act-textarea"
                value={actHow}
                onChange={e => setActHow(e.target.value)}
                placeholder="directions, tips, what to bring, what to order…"
                rows={4}
                style={{ ...inputStyle, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '8px', textTransform: 'lowercase' }}>
                tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DOING_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag, actTags, setActTags)} style={tagBtn(tag, actTags.includes(tag), '#288050')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '0.14em', color: '#B0A090', display: 'block', marginBottom: '6px', textTransform: 'lowercase' }}>
                📍 where is this? (optional)
              </label>
              <input
                className="act-focus"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="city or neighbourhood"
                style={inputStyle}
              />
            </div>
          </>
        )}

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
          {success
            ? (mode === 'movie' ? '🎬 added to the wall' : '🗺️ added to the wall')
            : loading ? 'sharing…'
            : mode === 'movie' ? 'recommend this watch' : 'share this activity'
          }
        </button>

      </div>
    </BottomSheet>
  );
}
