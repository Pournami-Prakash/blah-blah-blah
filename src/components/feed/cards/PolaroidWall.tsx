import { useEffect, useRef, useState } from 'react';
import type { PolaroidPost } from '../../../types';
import LikeButton from './LikeButton';

// ── helpers ──────────────────────────────────────────────────────────────────
function tilt(id: string) {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xfffffff, 0);
  const degs = [-6, -4, -2, 0, 2, 4, 6];
  return degs[h % degs.length];
}

// ── single photo — NO chrome, image is the UI ─────────────────────────────────
function Photo({ post, globalTilt }: { post: PolaroidPost; globalTilt: number }) {
  const [hovered, setHovered] = useState(false);
  const baseTilt = tilt(post.id);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        /* subtle tilt that relaxes on hover */
        transform: hovered
          ? 'rotate(0deg) scale(1.025)'
          : `rotate(${(baseTilt * 0.3 + globalTilt * 0.5).toFixed(2)}deg)`,
        transition: 'transform 0.38s cubic-bezier(.34,1.56,.64,1)',
        willChange: 'transform',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — desaturated at rest, full colour + slight bloom on hover */}
      <img
        src={post.imageUrl}
        alt={post.caption ?? 'photo'}
        draggable={false}
        style={{
          width: '100%',
          aspectRatio: '3/4',
          objectFit: 'cover',
          display: 'block',
          userSelect: 'none',
          filter: hovered ? 'saturate(1.12) brightness(1.03)' : 'saturate(0.72)',
          transition: 'filter 0.38s ease',
        }}
      />

      {/* Hover overlay — gradient + text slides up from bottom */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(10,6,4,0.62) 0%, rgba(10,6,4,0.18) 45%, transparent 100%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.28s ease',
        pointerEvents: hovered ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '14px 12px 10px',
      }}>
        {post.caption && (
          <p style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'rgba(255,252,248,0.92)',
            lineHeight: 1.45,
            margin: '0 0 6px 0',
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'transform 0.30s ease',
          }}>
            {post.caption}
          </p>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: hovered ? 'translateY(0)' : 'translateY(6px)',
          transition: 'transform 0.30s ease 0.04s',
        }}>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '9px',
            color: 'rgba(255,252,248,0.65)',
            letterSpacing: '0.07em',
          }}>
            {post.location?.city ?? ''}
          </span>
          {/* LikeButton with white-ish accent so it reads on dark overlay */}
          <LikeButton postId={post.id} initialCount={post.likesCount} accent="rgba(255,220,200,0.9)" />
        </div>
      </div>
    </div>
  );
}

// ── single infinite column ────────────────────────────────────────────────────
function Column({
  posts,
  direction,
  speed,
  globalTilt,
}: {
  posts: PolaroidPost[];
  direction: 'up' | 'down';
  speed: number;
  globalTilt: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef   = useRef(direction === 'down' ? -50 : 0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const sign = direction === 'up' ? -1 : 1;
      posRef.current += sign * speed;
      if (direction === 'up'   && posRef.current < -50) posRef.current += 50;
      if (direction === 'down' && posRef.current >   0) posRef.current -= 50;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(${posRef.current}%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [direction, speed]);

  const doubled = [...posts, ...posts];

  return (
    <div style={{ overflow: 'hidden', flex: 1, height: '100%' }}>
      <div ref={trackRef} style={{ willChange: 'transform' }}>
        {doubled.map((post, i) => (
          /* 2px gap between photos — no card wrappers */
          <div key={`${post.id}-${i}`} style={{ marginBottom: '2px' }}>
            <Photo post={post} globalTilt={globalTilt} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────
export default function PolaroidWall({ posts }: { posts: PolaroidPost[] }) {
  const [globalTilt, setGlobalTilt] = useState(0);
  const lastScrollY = useRef(window.scrollY);
  const tiltRef     = useRef(0);
  const rafTilt     = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;
      tiltRef.current = Math.max(-12, Math.min(12, dy * 0.7));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const decay = () => {
      tiltRef.current *= 0.88;
      setGlobalTilt(parseFloat(tiltRef.current.toFixed(3)));
      rafTilt.current = requestAnimationFrame(decay);
    };
    rafTilt.current = requestAnimationFrame(decay);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafTilt.current);
    };
  }, []);

  if (posts.length === 0) return null;

  const col1 = posts.filter((_, i) => i % 3 === 0);
  const col2 = posts.filter((_, i) => i % 3 === 1);
  const col3 = posts.filter((_, i) => i % 3 === 2);

  const maxLen = Math.max(col1.length, col2.length, col3.length, 1);
  const pad = (arr: PolaroidPost[]) => {
    if (arr.length === 0) return posts.slice(0, maxLen);
    while (arr.length < maxLen) arr = [...arr, ...arr];
    return arr.slice(0, maxLen);
  };

  return (
    <>
      <style>{`
        @keyframes galleryIn {
          from { opacity:0; transform: scaleX(0.97); }
          to   { opacity:1; transform: scaleX(1); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: '2px',          /* 2px between columns — images are the UI */
          height: '74vh',
          overflow: 'hidden',
          animation: 'galleryIn 0.55s ease both',
          perspective: '1000px',
          /* negative margin to bleed to edges of the wall container */
          margin: '0 -44px',
        }}
      >
        <Column posts={pad(col1)} direction="up"   speed={0.18} globalTilt={globalTilt} />
        <Column posts={pad(col2)} direction="down" speed={0.14} globalTilt={globalTilt} />
        <Column posts={pad(col3)} direction="up"   speed={0.22} globalTilt={globalTilt} />
      </div>
    </>
  );
}
