import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPostById } from '../api/client';
import PostCard from '../components/feed/PostCard';
import SharedNav from '../components/Nav/SharedNav';
import type { Post } from '../types';

export default function PostPage() {
  const { postId = '' } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostById(postId).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [postId]);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SharedNav />
      <div style={{ width: 'min(560px, calc(100% - 36px))', margin: '0 auto', padding: '110px 0 80px' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#826D5B', letterSpacing: '.12em', marginBottom: '16px' }}>one small thing, left here ✦</p>
        {loading ? <p>finding that whisper…</p> : post ? <PostCard post={post} /> : (
          <div style={{ padding: '60px 0' }}>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 400 }}>this whisper drifted away.</h1>
            <Link to="/wall" style={{ color: '#C4563B' }}>browse the wall instead</Link>
          </div>
        )}
      </div>
    </main>
  );
}
