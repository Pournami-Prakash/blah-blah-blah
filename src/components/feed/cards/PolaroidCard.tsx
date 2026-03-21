import { useState } from 'react';
import type { PolaroidPost } from '../../../types';
import LikeButton from './LikeButton';

function tilt(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const degs = [-2.2, -1.1, 0, 1.1, 2.2];
  return degs[h % degs.length];
}

export default function PolaroidCard({ post }: { post: PolaroidPost }) {
  const [hovered, setHovered] = useState(false);
  const deg = tilt(post.id);

  return (
    <div
      style={{
        background: '#FAFAF7',
        padding: '8px 8px 0px 8px',
        borderRadius: '3px',
        boxShadow: hovered
          ? '0 16px 48px rgba(30,20,10,0.22), 0 4px 14px rgba(30,20,10,0.14)'
          : '0 6px 22px rgba(30,20,10,0.14), 0 2px 6px rgba(30,20,10,0.09)',
        transform: hovered ? 'rotate(0deg) translateY(-6px) scale(1.02)' : `rotate(${deg}deg)`,
        transition: 'transform 0.32s cubic-bezier(.34,1.56,.64,1), box-shadow 0.24s ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo — desaturates at rest, blooms on hover */}
      <div style={{ overflow: 'hidden', borderRadius: '1px', position: 'relative' }}>
        <img
          src={post.imageUrl}
          alt="polaroid"
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            display: 'block',
            filter: hovered ? 'saturate(1.12) brightness(1.02)' : 'saturate(0.72)',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'filter 0.38s ease, transform 0.4s ease',
          }}
        />

        {/* Hover overlay — text slides up from bottom */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,6,4,0.58) 0%, rgba(10,6,4,0.1) 50%, transparent 100%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.28s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 10px 10px',
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
              transition: 'transform 0.28s ease',
            }}>
              {post.caption}
            </p>
          )}
        </div>
      </div>

      {/* White polaroid strip — city + like */}
      <div style={{ padding: '10px 6px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '9.5px',
            color: '#B0A090',
            letterSpacing: '0.06em',
          }}>
            {post.location?.city ?? ''}
          </span>
          <LikeButton postId={post.id} initialCount={post.likesCount} accent="#E8543A" />
        </div>
      </div>
    </div>
  );
}
