import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Nav from '../components/Nav/Nav';
import LetterCard from '../components/feed/cards/LetterCard';
import PolaroidCard from '../components/feed/cards/PolaroidCard';
import TypewriterCard from '../components/feed/cards/TypewriterCard';
import CafeCard from '../components/feed/cards/CafeCard';
import JournalCard from '../components/feed/cards/JournalCard';
import ActivityCard from '../components/feed/cards/ActivityCard';
import ComposeModal from '../components/modals/ComposeModal';
import LetterModal from '../components/modals/LetterModal';
import PolaroidModal from '../components/modals/PolaroidModal';
import TypewriterModal from '../components/modals/TypewriterModal';
import CafeModal from '../components/modals/CafeModal';
import JournalModal from '../components/modals/JournalModal';
import ActivityModal from '../components/modals/ActivityModal';
import { useModal } from '../hooks/useModal';
import { getPosts } from '../api/client';
import type { Post } from '../types';

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

export default function CityPage() {
  const { cityName } = useParams<{ cityName: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [whisperCount, setWhisperCount] = useState(0);
  const { activeModal, openModal, closeModal } = useModal();

  useEffect(() => {
    Promise.all([
      getPosts({ city: cityName }),
      getPosts(),
    ]).then(([cityPosts, allPosts]) => {
      setPosts(cityPosts);
      setWhisperCount(allPosts.length);
      setLoading(false);
    });
  }, [cityName]);

  return (
    <div style={{ background: '#F7F3EE', minHeight: '100vh' }}>
      <Nav onWhisper={() => openModal('compose')} whisperCount={whisperCount} />

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: '"Playfair Display"', fontStyle: 'italic',
            fontSize: '28px', color: '#2A2420', marginBottom: '8px',
          }}>
            {decodeURIComponent(cityName || '')}
          </h1>
          <p style={{
            fontSize: '13px', color: '#8A7A6A', fontFamily: '"DM Mono"',
            marginBottom: '16px',
          }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''} from here
          </p>
          {posts.length === 0 && (
            <button
              onClick={() => openModal('compose')}
              style={{
                background: '#F0EBE0', border: '1px solid #D8D0C4',
                borderRadius: '8px', padding: '8px 14px', fontSize: '12px',
                color: '#2A2420', cursor: 'pointer', fontFamily: '"DM Sans"',
              }}
            >
              be the first to say something
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A7A6A' }}>
            loading…
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A7A6A' }}>
            nothing here yet
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {posts.map(post => (
              <div key={post.id}>{renderCard(post)}</div>
            ))}
          </div>
        )}
      </div>

      <ComposeModal isOpen={activeModal === 'compose'} onClose={closeModal} onSelectType={openModal} />
      <LetterModal isOpen={activeModal === 'letter'} onClose={closeModal} />
      <PolaroidModal isOpen={activeModal === 'polaroid'} onClose={closeModal} />
      <TypewriterModal isOpen={activeModal === 'typewriter'} onClose={closeModal} />
      <CafeModal isOpen={activeModal === 'cafe'} onClose={closeModal} />
      <JournalModal isOpen={activeModal === 'journal'} onClose={closeModal} />
      <ActivityModal isOpen={activeModal === 'activity'} onClose={closeModal} />
    </div>
  );
}
