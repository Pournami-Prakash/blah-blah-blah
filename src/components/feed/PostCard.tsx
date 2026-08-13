import { useState } from 'react';
import { Link } from 'react-router-dom';
import LetterCard from './cards/LetterCard';
import PolaroidCard from './cards/PolaroidCard';
import TypewriterCard from './cards/TypewriterCard';
import CafeCard from './cards/CafeCard';
import JournalCard from './cards/JournalCard';
import ActivityCard from './cards/ActivityCard';
import { reportPost } from '../../api/client';
import type { Post, PostReport } from '../../types';

function Card({ post }: { post: Post }) {
  switch (post.type) {
    case 'letter': return <LetterCard post={post} />;
    case 'polaroid': return <PolaroidCard post={post} />;
    case 'typewriter': return <TypewriterCard post={post} />;
    case 'cafe': return <CafeCard post={post} />;
    case 'journal': return <JournalCard post={post} />;
    case 'activity': return <ActivityCard post={post} />;
  }
}

export default function PostCard({ post, actions = true }: { post: Post; actions?: boolean }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  const share = async () => {
    const url = `${window.location.origin}/whisper/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'a whisper from blah blah blah', url });
      else { await navigator.clipboard.writeText(url); setStatus('link copied ✦'); }
    } catch { /* sharing was cancelled */ }
  };

  const report = async (reason: PostReport['reason']) => {
    try {
      await reportPost({ postId: post.id, reason });
      setStatus('thanks — we’ll take a look');
      setOpen(false);
    } catch {
      setStatus('couldn’t send that report yet');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Card post={post} />
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', minHeight: '30px', padding: '6px 4px 0', position: 'relative' }}>
          {status && <span role="status" style={{ marginRight: 'auto', fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#6F5C4B' }}>{status}</span>}
          <Link to={`/whisper/${post.id}`} style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#806C5B', textDecoration: 'none' }}>open</Link>
          <button onClick={share} aria-label="Share this whisper" style={actionStyle}>share</button>
          <button onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="More actions" style={actionStyle}>•••</button>
          {open && (
            <div style={{ position: 'absolute', right: 0, top: '34px', zIndex: 40, width: '176px', background: '#FBF7F0', border: '1px solid #DCCFC1', boxShadow: '0 10px 30px rgba(42,30,18,.14)', padding: '9px', transform: 'rotate(.4deg)' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#6F5C4B', margin: '0 0 7px' }}>report this whisper:</p>
              {([['spam','spam'],['harmful','harmful content'],['private-info','private information'],['other','something else']] as const).map(([reason, label]) => (
                <button key={reason} onClick={() => report(reason)} style={{ ...actionStyle, display: 'block', width: '100%', textAlign: 'left', padding: '6px' }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const actionStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  padding: '4px',
  color: '#806C5B',
  cursor: 'pointer',
  fontFamily: '"DM Mono", monospace',
  fontSize: '9px',
};
