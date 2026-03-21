import { useState } from 'react';
import type { CafePost } from '../../../types';
import LikeButton from './LikeButton';

export default function CafeCard({ post }: { post: CafePost }) {
  const [hovered, setHovered] = useState(false);
  const hasImage = !!post.imageUrl;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hasImage ? 'transparent' : '#FFF0E6',
        borderRadius: '9px',
        overflow: 'hidden',
        /* When image present: cleaner borderless look; text lives in overlay */
        boxShadow: hasImage
          ? hovered
            ? '0 14px 44px rgba(180,60,20,0.18), 0 3px 10px rgba(180,60,20,0.10)'
            : '0 4px 20px rgba(180,60,20,0.10)'
          : hovered
            ? '0 0 0 1px rgba(200,80,30,0.25), 0 0 0 4px rgba(200,80,30,0.07), 0 12px 36px rgba(180,60,20,0.15)'
            : '0 0 0 1px rgba(200,80,30,0.12), 0 0 0 4px rgba(200,80,30,0.04), 0 4px 16px rgba(180,60,20,0.08)',
        transition: 'box-shadow 0.22s ease',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {hasImage ? (
        /* ── Image-first layout — text lives in hover overlay ── */
        <>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src={post.imageUrl}
              alt={post.name}
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                display: 'block',
                /* Desaturate at rest, bloom on hover */
                filter: hovered ? 'saturate(1.1) brightness(1.02)' : 'saturate(0.75)',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'filter 0.38s ease, transform 0.4s ease',
              }}
            />

            {/* Gradient overlay — always present, text slides up on hover */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,4,2,0.72) 0%, rgba(10,4,2,0.24) 50%, transparent 100%)',
              opacity: hovered ? 1 : 0.55,
              transition: 'opacity 0.28s ease',
            }} />

            {/* Text content — sits over the gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              padding: '20px 16px 14px',
              transform: hovered ? 'translateY(0)' : 'translateY(6px)',
              transition: 'transform 0.30s ease',
            }}>
              <h3 style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(16px, 1.3vw, 19px)',
                color: 'rgba(255,252,248,0.96)',
                margin: '0 0 4px 0',
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}>
                {post.name}
              </h3>
              {post.description && (
                <p style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '10.5px',
                  color: 'rgba(255,252,248,0.72)',
                  lineHeight: 1.6,
                  margin: '0 0 8px 0',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.24s ease 0.06s',
                }}>
                  {post.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '9px',
                  color: 'rgba(255,252,248,0.58)',
                  letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span style={{ opacity: 0.7 }}>📍</span>
                  {post.location?.city ?? ''}
                </span>
                <LikeButton postId={post.id} initialCount={post.likesCount} accent="rgba(255,220,200,0.9)" />
              </div>
            </div>
          </div>

          {/* Tags below image if any */}
          {post.tags?.length > 0 && (
            <div style={{
              padding: '10px 14px 12px',
              background: '#FFF0E6',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
            }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '9px',
                  color: '#C85030',
                  background: 'rgba(200,80,40,0.09)',
                  border: '1px solid rgba(200,80,40,0.16)',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  letterSpacing: '0.05em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ── No-image layout — warm peach card with stripe ── */
        <>
          {/* Terracotta gradient top stripe */}
          <div style={{
            height: '5px',
            background: 'linear-gradient(90deg, #E8543A 0%, #EDB846 60%, #E8A830 100%)',
            opacity: hovered ? 1 : 0.75,
            transition: 'opacity 0.2s',
          }} />

          <div style={{ padding: '18px 20px 16px' }}>
            <h3 style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(17px, 1.4vw, 20px)',
              color: '#2A1408',
              margin: '0 0 8px 0',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}>
              {post.name}
            </h3>

            {post.description && (
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '11px',
                color: '#6A4A38',
                lineHeight: 1.72,
                margin: '0 0 12px 0',
              }}>
                {post.description}
              </p>
            )}

            {post.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '13px' }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '9px',
                    color: '#C85030',
                    background: 'rgba(200,80,40,0.09)',
                    border: '1px solid rgba(200,80,40,0.16)',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    letterSpacing: '0.05em',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              paddingTop: '10px',
              borderTop: '2px solid rgba(200,80,30,0.10)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '9.5px',
                color: '#A07060',
                letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span style={{ opacity: 0.7 }}>📍</span>
                {post.location?.city ?? ''}
              </span>
              <LikeButton postId={post.id} initialCount={post.likesCount} accent="#E8543A" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
