import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { likePost } from '../../../api/client';

// ── Persist liked post IDs in localStorage ───────────────────────────────────
const STORAGE_KEY = 'bbb_liked';

function readLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function writeLiked(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); }
  catch { /* storage unavailable */ }
}

// ── Mini hearts that burst outward on like ────────────────────────────────────
const PARTICLES = [
  { x: -16, y: -18 },
  { x:  16, y: -16 },
  { x:  -6, y: -24 },
  { x:  20, y:  -8 },
  { x:  -2, y: -20 },
];

interface Props {
  postId: string;
  initialCount: number;
  /** Card's accent colour — liked heart + particles inherit it */
  accent: string;
}

export default function LikeButton({ postId, initialCount, accent }: Props) {
  const [liked,  setLiked]  = useState(() => readLiked().has(postId));
  const [count,  setCount]  = useState(initialCount);
  const [burst,  setBurst]  = useState(false);
  const [hovered, setHovered] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const s = readLiked();

    if (liked) {
      // Unlike — local only (most APIs don't expose unlike)
      s.delete(postId);
      setCount(c => Math.max(0, c - 1));
    } else {
      // Like — fire API + burst animation
      s.add(postId);
      setCount(c => c + 1);
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
      likePost(postId).catch(() => {/* optimistic, ignore errors */});
    }

    writeLiked(s);
    setLiked(l => !l);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Particle burst on like ── */}
      <AnimatePresence>
        {burst && PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0.9, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 0,   scale: 1.1, x: p.x, y: p.y }}
            exit={{}}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay: i * 0.03 }}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              fontSize: '9px',
              pointerEvents: 'none',
              userSelect: 'none',
              color: accent,
              lineHeight: 1,
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
          >
            ♥
          </motion.span>
        ))}
      </AnimatePresence>

      {/* ── The button itself ── */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.72 }}
        transition={{ type: 'spring', stiffness: 600, damping: 14 }}
        style={{
          background: liked
            ? `${accent}18`
            : hovered ? `${accent}0D` : 'transparent',
          border: liked
            ? `1px solid ${accent}38`
            : `1px solid ${hovered ? accent + '28' : 'transparent'}`,
          borderRadius: '20px',
          padding: '3px 8px 3px 7px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'background 0.18s, border-color 0.18s',
          /* override global spring-press: likeButton manages its own */
          transform: 'none',
        }}
        aria-label={liked ? 'Unlike' : 'Like'}
        aria-pressed={liked}
      >
        {/* Heart glyph — springs from 0→1 on state change */}
        <motion.span
          key={liked ? 'filled' : 'hollow'}
          initial={{ scale: 0.4, rotate: liked ? -20 : 0 }}
          animate={{ scale: 1,   rotate: 0 }}
          transition={{ type: 'spring', stiffness: 650, damping: 14 }}
          style={{
            display: 'inline-block',
            fontSize: '11px',
            lineHeight: 1,
            color: liked ? accent : hovered ? accent : 'rgba(100,88,76,0.55)',
            transition: 'color 0.15s',
          }}
        >
          {liked ? '♥' : '♡'}
        </motion.span>

        {/* Count — slides in from above when it changes */}
        <motion.span
          key={count}
          initial={{ y: liked ? -8 : 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.04em',
            color: liked ? accent : hovered ? accent : 'rgba(100,88,76,0.65)',
            transition: 'color 0.15s',
            lineHeight: 1,
          }}
        >
          {count}
        </motion.span>
      </motion.button>
    </div>
  );
}
