import { useState } from 'react';
import type { TypewriterPost } from '../../../types';
import LikeButton from './LikeButton';

const TYPE_COLORS: Record<string, string> = {
  feeling:     '#C84848',
  question:    '#4868C8',
  realization: '#488050',
  observation: '#8048A8',
  rant:        '#C87830',
  memory:      '#3888A8',
};

const TYPE_LABELS: Record<string, string> = {
  feeling:     'feeling',
  question:    'a question',
  realization: 'realization',
  observation: 'observation',
  rant:        'a rant',
  memory:      'memory',
};

export default function TypewriterCard({ post }: { post: TypewriterPost }) {
  const [hovered, setHovered] = useState(false);
  const tag    = (post as any).tags?.[0] ?? '';
  const accent = TYPE_COLORS[tag] ?? '#8A7A6A';
  const label  = TYPE_LABELS[tag] ?? 'random thought';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        /* Legal pad — pale canary yellow */
        background: '#FEFAE0',  /* punchy legal-pad yellow */
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 10px 30px rgba(160,120,0,0.14), 0 2px 6px rgba(160,120,0,0.09)`
          : '0 3px 12px rgba(160,120,0,0.09), 0 1px 3px rgba(160,120,0,0.06)',
        transition: 'box-shadow 0.22s ease',
        cursor: 'default',
        display: 'flex',
      }}
    >
      {/* Red margin line */}
      <div style={{
        width: '3px',
        background: `rgba(200,50,50,0.28)`,
        flexShrink: 0,
      }} />

      {/* Ruled paper body */}
      <div style={{
        flex: 1,
        padding: '18px 18px 16px 14px',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 26px, rgba(100,120,200,0.09) 26px, rgba(100,120,200,0.09) 27px)',
        backgroundSize: '100% 27px',
        backgroundPosition: '0 4px',
      }}>

        {/* Thought type badge + paperclip row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px' }}>💭</span>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '8.5px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              background: `${accent}14`,
              border: `1px solid ${accent}2A`,
              borderRadius: '3px',
              padding: '2px 7px',
            }}>
              {label}
            </span>
          </div>
          {/* Paperclip glyph */}
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '13px',
            color: 'rgba(42,36,32,0.18)',
            transform: 'rotate(30deg)',
            display: 'inline-block',
            userSelect: 'none',
          }}>
            📎
          </span>
        </div>

        {/* Content */}
        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '12.5px',
          color: '#2A2010',
          lineHeight: 1.88,
          margin: '0 0 14px 0',
          whiteSpace: 'pre-wrap',
          letterSpacing: '0.01em',
          fontWeight: 400,
          /* line-height matches the ruling */
          position: 'relative',
          zIndex: 1,
        }}>
          {post.content}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px dotted rgba(42,36,32,0.13)',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '9.5px',
            color: '#A0906A',
            letterSpacing: '0.06em',
          }}>
            {post.location?.city ?? ''}
          </span>
          <LikeButton postId={post.id} initialCount={post.likesCount} accent={accent} />
        </div>
      </div>
    </div>
  );
}
