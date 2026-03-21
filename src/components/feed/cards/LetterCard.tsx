import { useState } from 'react';
import type { LetterPost } from '../../../types';
import LikeButton from './LikeButton';

export default function LetterCard({ post }: { post: LetterPost }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FDF4DC',  /* warm amber cream — clear against cork */
        /* Folded corner top-right */
        clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)',
        borderLeft: `4px solid ${hovered ? '#C88010' : '#D4A040'}`,
        boxShadow: hovered
          ? '0 10px 32px rgba(140,80,0,0.18), 0 2px 6px rgba(140,80,0,0.10)'
          : '0 3px 14px rgba(140,80,0,0.10), 0 1px 4px rgba(140,80,0,0.07)',
        transition: 'border-color 0.2s, box-shadow 0.22s ease',
        cursor: 'default',
        padding: '20px 20px 18px 18px',
        position: 'relative',
      }}
    >
      {/* Folded corner triangle */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '22px 22px 0 0',
        borderColor: `#D4A040 transparent transparent transparent`,
        opacity: hovered ? 0.55 : 0.30,
        transition: 'opacity 0.2s',
      }} />

      {/* Header — envelope label */}
      <div style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '8.5px',
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: '#C88010',
        opacity: 0.85,
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        <span>✉</span>
        <span>dear world,</span>
      </div>

      {/* Body */}
      <p style={{
        fontFamily: '"Playfair Display", serif',
        fontStyle: 'italic',
        fontSize: 'clamp(14.5px, 1.2vw, 16.5px)',
        color: '#2A1C08',
        lineHeight: 1.82,
        margin: '0 0 14px 0',
        whiteSpace: 'pre-wrap',
      }}>
        {post.content}
      </p>

      {/* Attribution */}
      {post.attribution && (
        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '9.5px',
          color: '#B07820',
          letterSpacing: '0.07em',
          margin: '0 0 14px 0',
        }}>
          — {post.attribution}
        </p>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '11px',
        borderTop: '1px dashed rgba(196,140,30,0.30)',
      }}>
        <span style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '9.5px',
          color: '#B09060',
          letterSpacing: '0.06em',
        }}>
          {post.location?.city ?? ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LikeButton postId={post.id} initialCount={post.likesCount} accent="#C88010" />
          {/* Wax seal dot */}
          <div style={{
            width: '11px',
            height: '11px',
            borderRadius: '50%',
            background: hovered ? '#E8543A' : '#D4906A',
            boxShadow: '0 1px 3px rgba(200,80,40,0.30)',
            transition: 'background 0.2s',
            flexShrink: 0,
          }} />
        </div>
      </div>
    </div>
  );
}
