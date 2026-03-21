import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LetterCard from './cards/LetterCard';
import PolaroidCard from './cards/PolaroidCard';
import PolaroidWall from './cards/PolaroidWall';
import TypewriterCard from './cards/TypewriterCard';
import CafeCard from './cards/CafeCard';
import ActivityCard from './cards/ActivityCard';
import { getPosts } from '../../api/client';
import type { Post, PostType, PolaroidPost } from '../../types';

// ── Filter structure ────────────────────────────────────────────────────────
type GroupKey  = 'all' | 'notes' | 'moments' | 'places';
type SubKey    = PostType | null;

interface SubFilter { key: PostType; label: string }
interface Group {
  key:    GroupKey;
  label:  string;
  color:  string;
  icon:   string;
  types:  PostType[];
  sub:    SubFilter[];
}

const GROUPS: Group[] = [
  {
    key: 'all', label: 'everything', color: '#8A7A6A', icon: '✦',
    types: [], sub: [],
  },
  {
    key: 'notes', label: 'notes & thoughts', color: '#C88010', icon: '✏️',
    types: ['letter', 'typewriter'],
    sub: [
      { key: 'letter',     label: 'letters'  },
      { key: 'typewriter', label: 'thoughts' },
    ],
  },
  {
    key: 'moments', label: 'moments', color: '#7A6A9A', icon: '📷',
    types: ['polaroid'],
    sub: [],
  },
  {
    key: 'places', label: 'places & things to do', color: '#C85030', icon: '🌍',
    types: ['cafe', 'activity'],
    sub: [
      { key: 'cafe',     label: 'cafés & spots'  },
      { key: 'activity', label: 'activities'      },
    ],
  },
];

function seedRot(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return ((h % 9) - 4) * 0.38;
}

function renderCard(post: Post) {
  switch (post.type) {
    case 'letter':     return <LetterCard     post={post} />;
    case 'polaroid':   return <PolaroidCard   post={post} />;
    case 'typewriter': return <TypewriterCard post={post} />;
    case 'cafe':       return <CafeCard       post={post} />;
    case 'activity':   return <ActivityCard   post={post} />;
  }
}

export default function WhisperWall() {
  const [allPosts, setAllPosts]   = useState<Post[]>([]);
  const [group,    setGroup]      = useState<GroupKey>('all');
  const [sub,      setSub]        = useState<SubKey>(null);
  const [loading,  setLoading]    = useState(true);

  // Always fetch everything once — filter client-side
  useEffect(() => {
    setLoading(true);
    getPosts({}).then(setAllPosts).finally(() => setLoading(false));
  }, []);

  const activeGroup = GROUPS.find(g => g.key === group)!;

  // Derived post list
  const posts: Post[] = (() => {
    if (group === 'all') return allPosts;
    if (sub)             return allPosts.filter(p => p.type === sub);
    return allPosts.filter(p => (activeGroup.types as string[]).includes(p.type));
  })();

  const handleGroup = (g: GroupKey) => {
    setGroup(g);
    setSub(null);
  };

  const isPolaroidOnly = sub === 'polaroid' || (group === 'moments' && !sub && posts.every(p => p.type === 'polaroid'));
  const polaroidPosts  = posts.filter((p): p is PolaroidPost => p.type === 'polaroid');

  return (
    <>
      <style>{`
        @keyframes wallEnter {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes subSlide {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pinIn {
          0%   { opacity:0; transform:rotate(var(--rot)) scale(0.92); }
          60%  { transform:rotate(var(--rot)) scale(1.02); opacity:1; }
          100% { transform:rotate(var(--rot)) scale(1); opacity:1; }
        }

        /* ── Group buttons ────────────────── */
        .wg-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(252,248,242,0.55);
          border: 1px solid rgba(42,36,32,0.10);
          border-radius: 8px;
          padding: 8px 16px 8px 12px;
          font-family: "DM Mono", monospace;
          font-size: 10.5px;
          letter-spacing: 0.07em;
          color: #6A5A4A;
          cursor: pointer;
          transition: background 0.16s, color 0.16s, border-color 0.16s, transform 0.14s, box-shadow 0.16s;
          text-transform: lowercase;
        }
        .wg-btn:hover {
          background: rgba(252,248,242,0.90);
          color: #3A2E20;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(42,32,16,0.09);
        }
        .wg-btn.active {
          background: color-mix(in srgb, var(--gc) 11%, #FEF6EE);
          border-color: color-mix(in srgb, var(--gc) 50%, transparent);
          border-width: 1.5px;
          color: var(--gc);
          box-shadow: 0 3px 12px color-mix(in srgb, var(--gc) 20%, transparent);
        }
        .wg-btn .wg-icon {
          font-size: 13px;
          line-height: 1;
        }
        /* Count badge inside group button */
        .wg-count {
          font-family: "DM Mono", monospace;
          font-size: 8.5px;
          background: rgba(42,36,32,0.12);
          border-radius: 20px;
          padding: 1px 6px;
          letter-spacing: 0.04em;
          margin-left: 2px;
        }
        .wg-btn.active .wg-count {
          background: color-mix(in srgb, var(--gc) 18%, transparent);
          color: var(--gc);
        }

        /* ── Sub-filter row ────────────────── */
        .wsub-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          animation: subSlide 0.22s ease both;
          padding: 2px 0 0 2px;
        }
        .wsub-btn {
          background: none;
          border: 1px solid rgba(42,36,32,0.12);
          border-radius: 20px;
          padding: 5px 14px;
          font-family: "DM Mono", monospace;
          font-size: 9.5px;
          letter-spacing: 0.08em;
          color: var(--gc);
          cursor: pointer;
          transition: background 0.14s, color 0.14s, border-color 0.14s, transform 0.14s;
          text-transform: lowercase;
          opacity: 0.75;
        }
        .wsub-btn:hover {
          background: color-mix(in srgb, var(--gc) 8%, transparent);
          border-color: color-mix(in srgb, var(--gc) 35%, transparent);
          opacity: 1;
          transform: translateY(-1px);
        }
        .wsub-btn.active {
          background: color-mix(in srgb, var(--gc) 12%, #FEF6EE);
          border-color: color-mix(in srgb, var(--gc) 55%, transparent);
          border-width: 1.5px;
          color: var(--gc);
          opacity: 1;
          font-weight: 500;
        }

        /* ── Card pins ─────────────────────── */
        .wall-pin {
          break-inside: avoid;
          margin-bottom: 22px;
          transform: rotate(var(--rot));
          transition: transform 0.28s cubic-bezier(.34,1.56,.64,1);
          animation: pinIn 0.52s cubic-bezier(.34,1.56,.64,1) both;
        }
        .wall-pin:hover {
          transform: rotate(0deg) translateY(-4px);
          z-index: 10;
          position: relative;
        }

        /* ── Skeleton shimmer ───────────────── */
        @keyframes shimmer {
          0%   { background-position: -480px 0; }
          100% { background-position:  480px 0; }
        }
        .skel {
          border-radius: 9px;
          background: linear-gradient(
            90deg,
            rgba(42,36,28,0.06) 25%,
            rgba(42,36,28,0.11) 37%,
            rgba(42,36,28,0.06) 63%
          );
          background-size: 960px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }

        @media (max-width: 900px) { :root { --wall-cols: 2; } }
        @media (max-width: 560px) { :root { --wall-cols: 1; } }
      `}</style>

      <div style={{
        padding: '48px 44px 100px',
        maxWidth: '1180px',
        margin: '0 auto',
        animation: 'wallEnter 0.55s ease 0.05s both',
      }}>

        {/* ── Header ────────────────────────────────────── */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(26px, 2.6vw, 34px)',
              color: '#2A2420',
              margin: '0 0 6px 0',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              lineHeight: 1,
            }}>
              wall.
            </h1>
            <p style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9.5px',
              color: '#B0A090',
              letterSpacing: '0.10em',
              textTransform: 'lowercase',
              margin: 0,
            }}>
              everything left behind, out there
            </p>
          </div>

          {/* ── Group buttons row ────────────────────────── */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {GROUPS.map(g => {
              const count = g.key === 'all'
                ? allPosts.length
                : allPosts.filter(p => (g.types as string[]).includes(p.type)).length;
              return (
                <motion.button
                  key={g.key}
                  className={`wg-btn${group === g.key ? ' active' : ''}`}
                  style={{ '--gc': g.color } as React.CSSProperties}
                  onClick={() => handleGroup(g.key)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  <span className="wg-icon">{g.icon}</span>
                  {g.label}
                  {count > 0 && (
                    <motion.span
                      className="wg-count"
                      key={count}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      {count}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ── Sub-filter row — only when a group is active ── */}
          <AnimatePresence>
            {group !== 'all' && activeGroup.sub.length > 0 && (
              <motion.div
                className="wsub-row"
                style={{ '--gc': activeGroup.color } as React.CSSProperties}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <motion.button
                  className={`wsub-btn${!sub ? ' active' : ''}`}
                  style={{ '--gc': activeGroup.color } as React.CSSProperties}
                  onClick={() => setSub(null)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  all {activeGroup.label.split(' ')[0]}
                </motion.button>
                {activeGroup.sub.map((s, i) => (
                  <motion.button
                    key={s.key}
                    className={`wsub-btn${sub === s.key ? ' active' : ''}`}
                    style={{ '--gc': activeGroup.color } as React.CSSProperties}
                    onClick={() => setSub(s.key)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22, delay: i * 0.04 }}
                  >
                    {s.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thin accent line — shifts color with active group */}
          <div style={{
            height: '1px',
            background: `linear-gradient(90deg, ${activeGroup.color}55 0%, rgba(42,36,32,0.07) 55%, transparent 100%)`,
            marginTop: '16px',
            transition: 'background 0.3s ease',
          }} />
        </div>

        {/* ── Post grid ─────────────────────────────────── */}
        {loading ? (
          /* Shimmer skeleton — 9 cards, varied heights, 3-col masonry */
          <div style={{ columns: 'var(--wall-cols, 3)', columnGap: '22px' }}>
            {[180, 240, 160, 220, 140, 200, 170, 260, 150].map((h, i) => (
              <div
                key={i}
                className="skel wall-pin"
                style={{
                  height: `${h}px`,
                  marginBottom: '22px',
                  '--rot': `${((i * 137) % 9 - 4) * 0.38}deg`,
                  animationDelay: `${i * 0.07}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* Empty state — centered ✦ hero */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '100px 20px 120px',
              gap: '16px',
              userSelect: 'none',
            }}
          >
            {/* Large faint star */}
            <motion.span
              animate={{ opacity: [0.10, 0.20, 0.10], rotate: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: '72px',
                lineHeight: 1,
                color: activeGroup.color,
                display: 'block',
                marginBottom: '8px',
              }}
            >
              ✦
            </motion.span>
            <p style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(18px, 2vw, 22px)',
              color: '#6A5A48',
              margin: 0,
              textAlign: 'center',
            }}>
              nothing pinned here yet.
            </p>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'lowercase',
              color: '#B0A090',
            }}>
              be the first to leave something
            </span>
          </motion.div>
        ) : isPolaroidOnly && polaroidPosts.length > 0 ? (
          <PolaroidWall posts={polaroidPosts} />
        ) : (
          <div style={{ columns: 'var(--wall-cols, 3)', columnGap: '22px' }}>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                className="wall-pin"
                style={{ '--rot': `${seedRot(post.id)}deg` } as React.CSSProperties}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 28,
                  delay: Math.min(i * 0.04, 0.5),
                }}
              >
                {renderCard(post)}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
