import { useEffect, useState } from 'react';
import { getPosts } from '../../api/client';
import PostCard from './PostCard';
import type { Post } from '../../types';

interface CityPostsProps {
  city: string;
  compact?: boolean;
  onCompose: () => void;
  onCount?: (count: number) => void;
}

export default function CityPosts({ city, compact = false, onCompose, onCount }: CityPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(true); setFailed(false);
    getPosts({ city }).then(data => { setPosts(data); onCount?.(data.length); }).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [city, onCount]);

  if (loading) return <div style={stateStyle}>gathering little things from {city}…</div>;
  if (failed) return <div style={stateStyle}>the whispers from {city} are hiding right now.</div>;
  if (!posts.length) return (
    <div style={stateStyle}>
      <span style={{ fontSize: '34px' }}>📍</span>
      <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '18px', margin: 0 }}>nothing has been left in {city} yet.</p>
      <button onClick={onCompose} style={{ border: '1px dashed #A38973', background: '#F8F1E7', padding: '9px 14px', color: '#4F3D30', cursor: 'pointer' }}>leave the first whisper</button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: compact ? '16px' : '22px' }}>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}

const stateStyle: React.CSSProperties = { textAlign: 'center', padding: '56px 20px', color: '#715B4A', display: 'grid', justifyItems: 'center', gap: '13px' };
