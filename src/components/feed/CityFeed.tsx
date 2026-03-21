import { useEffect, useState } from 'react';
import BottomSheet from '../modals/BottomSheet';
import LetterCard from './cards/LetterCard';
import PolaroidCard from './cards/PolaroidCard';
import TypewriterCard from './cards/TypewriterCard';
import CafeCard from './cards/CafeCard';
import JournalCard from './cards/JournalCard';
import ActivityCard from './cards/ActivityCard';
import { getPosts } from '../../api/client';
import type { Post, Pin } from '../../types';

interface CityFeedProps {
  isOpen: boolean;
  onClose: () => void;
  pin: Pin | null;
  onOpenCompose: () => void;
}

function renderCard(post: Post) {
  switch (post.type) {
    case 'letter': return <LetterCard post={post} />;
    case 'polaroid': return <PolaroidCard post={post} />;
    case 'typewriter': return <TypewriterCard post={post} />;
    case 'cafe': return <CafeCard post={post} />;
    case 'journal': return <JournalCard post={post} />;
    case 'activity': return <ActivityCard post={post} />;
  }
}

export default function CityFeed({ isOpen, onClose, pin, onOpenCompose }: CityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !pin) return;
    setLoading(true);
    getPosts({ city: pin.city }).then(setPosts).finally(() => setLoading(false));
  }, [isOpen, pin]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div style={{ padding: '20px 28px 32px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div>
            <h2 style={{
              fontFamily: '"Playfair Display"', fontStyle: 'italic',
              fontSize: '22px', color: '#2A2420', marginBottom: '2px',
            }}>
              {pin?.city}
            </h2>
            <p style={{ fontSize: '12px', color: '#8A7A6A', fontFamily: '"DM Mono"' }}>
              {pin?.count} post{(pin?.count || 0) > 1 ? 's' : ''} from here
            </p>
          </div>
          <button
            onClick={() => { onClose(); onOpenCompose(); }}
            style={{
              marginLeft: 'auto',
              background: '#2A2420', color: '#F7F3EE',
              border: 'none', borderRadius: '8px',
              padding: '8px 14px', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer',
              fontFamily: '"DM Sans"',
            }}
          >
            + add one
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8A7A6A' }}>
            loading…
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8A7A6A' }}>
            <p style={{ marginBottom: '12px' }}>nothing yet from {pin?.city}</p>
            <button
              onClick={() => { onClose(); onOpenCompose(); }}
              style={{
                background: '#F0EBE0', border: '1px solid #D8D0C4',
                borderRadius: '8px', padding: '8px 14px', fontSize: '12px',
                color: '#2A2420', cursor: 'pointer', fontFamily: '"DM Sans"',
              }}
            >
              be the first
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {posts.map(post => (
              <div key={post.id}>{renderCard(post)}</div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
