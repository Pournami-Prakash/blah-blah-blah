import { useState } from 'react';
import type { ActivityPost } from '../../../types';
import LikeButton from './LikeButton';

export default function ActivityCard({ post }: { post: ActivityPost }) {
  const [hovered, setHovered] = useState(false);
  const isMovie = post.tags?.some(t => ['movie','series','film','watch'].includes(t.toLowerCase()));
  const icon    = isMovie ? '🎬' : '🗺️';
  const accent  = isMovie ? '#4868C8' : '#5A9A6A';
  const bg      = isMovie ? '#EAECF9' : '#E6F5EA';  /* stronger sage / periwinkle */
  const label   = isMovie ? 'watch this' : 'do this';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        borderRadius: '9px',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 10px 32px ${accent}22, 0 2px 8px ${accent}18`
          : `0 3px 14px ${accent}0F, 0 1px 4px ${accent}0A`,
        transition: 'box-shadow 0.22s ease',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Big background emoji stamp — very faint */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '12px',
        fontSize: '44px',
        opacity: hovered ? 0.13 : 0.07,
        pointerEvents: 'none',
        transition: 'opacity 0.3s',
        userSelect: 'none',
        lineHeight: 1,
      }}>
        {icon}
      </div>

      {/* Top accent band */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, ${accent} 0%, ${accent}66 100%)`,
        opacity: hovered ? 1 : 0.65,
        transition: 'opacity 0.2s',
      }} />

      <div style={{ padding: '16px 18px 16px' }}>

        {/* Mode label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginBottom: '10px',
        }}>
          <span style={{ fontSize: '11px' }}>{icon}</span>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '8.5px',
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: accent,
            opacity: 0.90,
          }}>
            {label}
          </span>
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 'clamp(15px, 1.25vw, 17.5px)',
          color: '#1A2818',
          margin: '0 0 8px 0',
          fontWeight: 400,
          lineHeight: 1.3,
          paddingRight: '36px', /* avoid overlapping with bg emoji */
        }}>
          {post.name}
        </h3>

        {/* Description */}
        {post.description && (
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            color: isMovie ? '#384878' : '#3A6A48',
            lineHeight: 1.72,
            margin: '0 0 12px 0',
          }}>
            {post.description}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '9px',
                color: accent,
                background: `${accent}16`,
                border: `1px solid ${accent}28`,
                padding: '3px 9px',
                borderRadius: '20px',
                letterSpacing: '0.05em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: `1px solid ${accent}18`,
        }}>
          {/* City as postmark-style badge */}
          {post.location?.city ? (
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: accent,
              background: `${accent}14`,
              border: `1px solid ${accent}28`,
              borderRadius: '20px',
              padding: '2px 9px',
              letterSpacing: '0.07em',
            }}>
              {post.location.city}
            </span>
          ) : <span />}
          <LikeButton postId={post.id} initialCount={post.likesCount} accent={accent} />
        </div>
      </div>
    </div>
  );
}
