import { useState } from 'react';
import type { JournalPost } from '../../../types';

export default function JournalCard({ post }: { post: JournalPost }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#F8F6E8',  /* warm notebook cream, distinct from cork bg */
        borderRadius: '9px',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 10px 32px rgba(40,30,16,0.14), 0 2px 6px rgba(40,30,16,0.09)'
          : '0 3px 14px rgba(40,30,16,0.09), 0 1px 4px rgba(40,30,16,0.06)',
        transition: 'box-shadow 0.22s ease',
        cursor: 'default',
        display: 'flex',
      }}
    >
      {/* Spiral binding strip — left edge with punched holes */}
      <div style={{
        width: '22px',
        flexShrink: 0,
        background: '#E8E4D4',  /* spiral strip — same warm tan family */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '18px',
        gap: '16px',
        borderRight: '1px solid rgba(42,36,20,0.10)',
      }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: hovered ? 'rgba(42,36,20,0.22)' : 'rgba(42,36,20,0.13)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
            transition: 'background 0.2s',
            flexShrink: 0,
          }} />
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Warm dark brown header band */}
        <div style={{
          background: '#3A2E22',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px' }}>📓</span>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '8.5px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(248,238,220,0.55)',
            }}>
              journal entry
            </span>
          </div>
          {post.location?.city && (
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '8.5px',
              color: 'rgba(248,238,220,0.38)',
              letterSpacing: '0.05em',
            }}>
              {post.location.city}
            </span>
          )}
        </div>

        {/* Ruled paper body */}
        <div style={{
          padding: '14px 16px 16px',
          backgroundImage: [
            'repeating-linear-gradient(transparent, transparent 27px, rgba(80,70,40,0.07) 27px, rgba(80,70,40,0.07) 28px)',
          ].join(','),
          backgroundSize: '100% 28px',
          backgroundPosition: '0 6px',
        }}>
          {post.title && (
            <h3 style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '15.5px',
              color: '#2A2010',
              margin: '0 0 10px 0',
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
            }}>
              {post.title}
            </h3>
          )}

          <p style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(13px, 1.1vw, 15px)',
            color: '#2A2010',
            lineHeight: 2.00,  /* matches 28px rule at ~14px font */
            whiteSpace: 'pre-wrap',
            margin: '0 0 12px 0',
            position: 'relative',
            zIndex: 1,
          }}>
            {post.content}
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid rgba(42,36,20,0.09)',
            position: 'relative',
            zIndex: 1,
          }}>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: hovered ? '#8A7A50' : '#C8B898',
              transition: 'color 0.2s',
              letterSpacing: '0.06em',
            }}>
              ♡ {post.likesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
