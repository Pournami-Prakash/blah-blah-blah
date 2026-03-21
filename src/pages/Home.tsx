import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import Globe from '../components/Globe/Globe';
import Floaties from '../components/Floaties/Floaties';
import ComposeModal from '../components/modals/ComposeModal';
import LetterModal from '../components/modals/LetterModal';
import PolaroidModal from '../components/modals/PolaroidModal';
import TypewriterModal from '../components/modals/TypewriterModal';
import CafeModal from '../components/modals/CafeModal';
import JournalModal from '../components/modals/JournalModal';
import ActivityModal from '../components/modals/ActivityModal';
import AdviceModal from '../components/modals/AdviceModal';
import CityFeed from '../components/feed/CityFeed';
import InteractiveDotGrid from '../components/InteractiveDotGrid/InteractiveDotGrid';
import { useModal } from '../hooks/useModal';
import { getPins, getPosts } from '../api/client';
import type { Pin } from '../types';

// ── Cursor follower — coral dot + lagging ring ────────────────────────────────
// Replaces the ink-splat trail. A precise 8px dot snaps to cursor instantly;
// a 28px ring follows with lerp lag. Ring shrinks to 0 on mousedown.
function useCursorFollower() {
  useEffect(() => {
    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    const dotS = [
      'position:fixed','pointer-events:none','z-index:9999',
      'width:8px','height:8px','border-radius:50%',
      'background:#E8543A','transform:translate(-50%,-50%)',
      'will-change:left,top','transition:opacity 0.3s ease',
    ].join(';');
    const ringS = [
      'position:fixed','pointer-events:none','z-index:9998',
      'width:28px','height:28px','border-radius:50%',
      'border:1.5px solid rgba(232,84,58,0.55)',
      'transform:translate(-50%,-50%) scale(1)',
      'will-change:left,top','transition:transform 0.15s ease,opacity 0.3s ease,border-color 0.15s',
    ].join(';');
    dot.style.cssText  = dotS;
    ring.style.cssText = ringS;
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = 0, my = 0;  // cursor pos
    let rx = 0, ry = 0;  // ring pos (lerped)
    let idleTimer: ReturnType<typeof setTimeout>;
    let raf: number;

    // Hide custom cursor when over buttons/links so native pointer shows
    let overInteractive = false;
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest('button,a,input,select,textarea,[role="button"]');
      overInteractive = !!el;
      dot.style.opacity  = overInteractive ? '0' : '1';
      ring.style.opacity = overInteractive ? '0' : '1';
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
      if (!overInteractive) {
        dot.style.opacity = '1'; ring.style.opacity = '1';
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        dot.style.opacity = '0'; ring.style.opacity = '0';
      }, 2000);
    };
    const onDown = () => {
      if (overInteractive) return;
      ring.style.transform = 'translate(-50%,-50%) scale(0)';
      ring.style.borderColor = 'rgba(232,84,58,0.22)';
    };
    const onUp = () => {
      ring.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.borderColor = 'rgba(232,84,58,0.55)';
    };

    const loop = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('mousemove',  onMove, { passive: true });
    window.addEventListener('mouseover',  onOver, { passive: true });
    window.addEventListener('mousedown',  onDown);
    window.addEventListener('mouseup',    onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      dot.remove(); ring.remove();
      clearTimeout(idleTimer);
    };
  }, []);
}

// ── Ink-splat cursor trail ────────────────────────────────────────────────────
// Organic blob particles in the app palette — look like ink drops, not circles.
const TRAIL_COLORS = ['#E8543A', '#EDB846', '#5D9A70', '#C8603A', '#F5A08A'];
// Irregular blob border-radius values — each reads as a CSS border-radius shorthand
const BLOB_SHAPES = [
  '62% 38% 55% 45% / 45% 60% 40% 55%',
  '40% 60% 38% 62% / 58% 42% 58% 42%',
  '70% 30% 50% 50% / 42% 62% 38% 58%',
  '30% 70% 62% 38% / 60% 40% 68% 32%',
  '55% 45% 70% 30% / 35% 65% 45% 55%',
  '48% 52% 32% 68% / 65% 35% 55% 45%',
];

function useCursorTrail() {
  useEffect(() => {
    let lastX = -999, lastY = -999;
    let colorIdx = 0;
    let throttle = false;

    const spawn = (x: number, y: number) => {
      const color = TRAIL_COLORS[colorIdx % TRAIL_COLORS.length];
      const blob  = BLOB_SHAPES[colorIdx % BLOB_SHAPES.length];
      colorIdx++;

      const size  = 6 + Math.random() * 7;        // 6–13 px
      const angle = Math.random() * Math.PI * 2;
      const dist  = 14 + Math.random() * 20;
      const rot   = (Math.random() - 0.5) * 60;   // slight spin on exit

      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:9997',
        `left:${x}px`, `top:${y}px`,
        `width:${size}px`, `height:${size}px`,
        `border-radius:${blob}`,
        `background:${color}`,
        'transform:translate(-50%,-50%) scale(1) rotate(0deg)',
        'opacity:0.78',
        'will-change:transform,opacity',
      ].join(';');
      document.body.appendChild(el);

      // Double-rAF: first frame commits paint, second applies transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.65s cubic-bezier(.2,1.3,.4,1), opacity 0.65s ease';
          el.style.transform  = [
            `translate(calc(-50% + ${(Math.cos(angle) * dist).toFixed(1)}px),`,
            ` calc(-50% + ${(Math.sin(angle) * dist).toFixed(1)}px))`,
            ` scale(0) rotate(${rot}deg)`,
          ].join('');
          el.style.opacity = '0';
        });
      });

      setTimeout(() => el.remove(), 750);
    };

    const onMove = (e: MouseEvent) => {
      if (throttle) return;
      throttle = true;
      setTimeout(() => { throttle = false; }, 28); // ~36 fps

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 20) return; // skip micro-movements
      lastX = e.clientX; lastY = e.clientY;
      spawn(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
}

// ── Whisper ticker marquee ────────────────────────────────────────────────────
// Continuous strip of recent whispers drifting slowly in Playfair italic.
// Replaces the old bottom hint bar. Pause on hover.
function WhisperTicker({ posts }: { posts: Array<{ content?: string; name?: string; type: string }> }) {
  if (posts.length === 0) return null;
  const items = [...posts, ...posts]; // double for seamless loop
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 8,
      overflow: 'hidden',
      padding: '10px 0',
      borderTop: '1px solid rgba(42,36,32,0.07)',
      background: 'linear-gradient(to top, rgba(244,239,232,0.96), rgba(244,239,232,0.80))',
      backdropFilter: 'blur(6px)',
    }}>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { display:flex; animation: tickerScroll 60s linear infinite; width:max-content; }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-track">
        {items.map((p, i) => {
          const text = (p as any).content ?? (p as any).name ?? '';
          if (!text) return null;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
              <span style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: '11.5px',
                color: '#6A5A48',
                whiteSpace: 'nowrap',
                padding: '0 6px',
                maxWidth: '320px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline-block',
              }}>
                {text.length > 60 ? text.slice(0, 60) + '…' : text}
              </span>
              <span style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '10px',
                color: '#E8543A',
                opacity: 0.5,
                padding: '0 10px',
              }}>✦</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Animated whisper counter ──────────────────────────────────────────────────
// Counts up from 0 to the real total using requestAnimationFrame.
function WhisperCount({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1500;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.floor(ease(progress) * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  if (target === 0) return null;
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: '16px',
      animation: 'wordDrop 0.55s ease 0.3s both',
    }}>
      <span style={{
        fontFamily: '"Playfair Display", serif',
        fontStyle: 'italic',
        fontSize: 'clamp(18px, 1.6vw, 22px)',
        color: '#E8543A',
        letterSpacing: '-0.01em',
      }}>
        {display.toLocaleString()}
      </span>
      <span style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '10px',
        color: '#B0A090',
        letterSpacing: '0.10em',
        marginLeft: '8px',
      }}>
        whispers left behind around the world
      </span>
    </div>
  );
}

// ── Live status bar ───────────────────────────────────────────────────────────
// "it's morning somewhere · N whispers · N cities active" with pulsing dot.
function LiveBar({ total, cityCount }: { total: number; cityCount: number }) {
  const hour = new Date().getUTCHours();
  const timeLabel =
    hour < 6  ? "it's night somewhere" :
    hour < 12 ? "it's morning somewhere" :
    hour < 18 ? "it's afternoon somewhere" :
                "it's evening somewhere";
  if (total === 0) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '18px',
      animation: 'wordDrop 0.55s ease 0.2s both',
    }}>
      {/* Pulsing live dot */}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#5D9A70', display: 'inline-block',
          animation: 'liveDot 2s ease-in-out infinite',
        }} />
      </span>
      {[timeLabel, `${total.toLocaleString()} whispers`, `${cityCount} cities active`].map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '9.5px',
            color: '#B0A090',
            letterSpacing: '0.09em',
            textTransform: 'lowercase',
          }}>
            {item}
          </span>
          {i < 2 && <span style={{ color: 'rgba(160,144,128,0.35)', fontSize: '10px' }}>·</span>}
        </span>
      ))}
    </div>
  );
}


// ── Animated title — scatter-on-hover ────────────────────────────────────────
// Hovering the h1 fires all letters outward to random positions, then snaps back.
const TITLE_WORDS = ['blah', 'blah', 'blah'];
function AnimatedTitle() {
  const [ready, setReady] = useState(false);
  const [scattered, setScattered] = useState(false);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scatterTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => scatterTimers.current.forEach(clearTimeout), []);

  const scatter = useCallback(() => {
    if (scattered) return;
    setScattered(true);
    letterRefs.current.forEach((s, i) => {
      if (!s) return;
      const rx = (Math.random() - 0.5) * 180;
      const ry = (Math.random() - 0.5) * 80;
      const rot = (Math.random() - 0.5) * 40;
      s.style.transition = `transform 0.45s cubic-bezier(.2,1.2,.4,1) ${i * 0.018}s, color 0.2s`;
      s.style.transform = `translate(${rx}px,${ry}px) rotate(${rot}deg) scale(${0.7 + Math.random() * 0.6})`;
      s.style.color = '#E8543A';
    });
    const t = setTimeout(() => {
      letterRefs.current.forEach((s, i) => {
        if (!s) return;
        s.style.transition = `transform 0.55s cubic-bezier(.34,1.56,.64,1) ${i * 0.022}s, color 0.3s`;
        s.style.transform = 'translateY(0) rotate(0deg) scale(1)';
        s.style.color = '';
      });
      setTimeout(() => setScattered(false), 650);
    }, 950);
    scatterTimers.current.push(t);
  }, [scattered]);

  let letterIdx = 0;
  return (
    <h1
      style={{
        fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
        fontSize: 'clamp(24px, 2.8vw, 38px)', color: '#2A2420',
        margin: '0 0 8px 0', lineHeight: 1.15, letterSpacing: '-0.015em',
        userSelect: 'none', cursor: 'default',
      }}
      onMouseEnter={scatter}
    >
      {TITLE_WORDS.map((word, wi) => (
        <span key={wi}>
          {word.split('').map((ch) => {
            const idx = letterIdx++;
            return (
              <span
                key={idx}
                ref={el => { letterRefs.current[idx] = el; }}
                style={{
                  display: 'inline-block',
                  transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), color 0.18s, opacity 0.35s ease',
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: ready ? `${idx * 0.032}s` : '0s',
                }}
                onMouseEnter={e => {
                  if (scattered) return;
                  const s = e.currentTarget as HTMLSpanElement;
                  const ry = (Math.random() - 0.5) * 18;
                  s.style.transition = 'transform 0.22s cubic-bezier(.34,1.56,.64,1), color 0.18s';
                  s.style.transform = `translateY(-9px) rotate(${ry}deg) scale(1.2)`;
                  s.style.color = '#C8603A';
                }}
                onMouseLeave={e => {
                  if (scattered) return;
                  const s = e.currentTarget as HTMLSpanElement;
                  s.style.transition = 'transform 0.38s cubic-bezier(.34,1.56,.64,1), color 0.18s';
                  s.style.transform = 'translateY(0)';
                  s.style.color = '';
                }}
              >
                {ch}
              </span>
            );
          })}
          {wi < TITLE_WORDS.length - 1 && <span> </span>}
        </span>
      ))}
      <span style={{ color: '#C8603A', fontStyle: 'normal', opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease 0.45s', display: 'inline-block' }}>.</span>
    </h1>
  );
}

// ── Confetti burst ────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#E8543A', '#EDB846', '#5D9A70', '#7090C8', '#F5A08A', '#F5D080', '#90C4A0'];
function burstConfetti(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    const isSquare = Math.random() > 0.5;
    const size = 5 + Math.random() * 8;
    el.style.cssText = [
      'position:fixed', 'pointer-events:none', 'z-index:9998',
      `left:${cx}px`, `top:${cy}px`,
      `width:${size}px`, `height:${isSquare ? size : size * 0.45}px`,
      `background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}`,
      `border-radius:${isSquare ? '2px' : '50%'}`, 'transform-origin:center center',
    ].join(';');
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i / 28) + (Math.random() - 0.5) * 0.6;
    const speed = 5 + Math.random() * 8;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed - 5;
    let x = cx, y = cy, rot = Math.random() * 360, life = 1;
    const rotSpd = (Math.random() - 0.5) * 22;
    const tick = () => {
      life -= 0.022;
      if (life <= 0) { el.remove(); return; }
      vy += 0.32; vx *= 0.97; x += vx; y += vy; rot += rotSpd;
      el.style.left = `${x - size / 2}px`; el.style.top = `${y - size / 2}px`;
      el.style.opacity = String(life); el.style.transform = `rotate(${rot}deg) scale(${life})`;
      requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), i * 10);
  }
}

// ── Magnetic CTA button ───────────────────────────────────────────────────────
// Follows the cursor with spring physics. Coral fill floods up on hover.
// whileTap snaps it down with a bouncy spring release.
function LiquidButton({ onClick, children }: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Raw magnet offset
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Spring-smoothed — gives that organic trailing feel
  const sx = useSpring(mx, { stiffness: 280, damping: 22, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 280, damping: 22, mass: 0.6 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - (rect.left + rect.width  / 2)) * 0.32);
    my.set((e.clientY - (rect.top  + rect.height / 2)) * 0.32);
  };
  const onMouseLeave = () => {
    mx.set(0); my.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={wrapRef}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
    >
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.93, y: 2 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        style={{
          position: 'relative', overflow: 'hidden',
          background: '#2A2420', color: '#F7F3EE', border: 'none',
          borderRadius: '14px', padding: '13px 36px',
          fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
          fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.04em',
          boxShadow: hovered
            ? '0 16px 44px rgba(42,36,32,0.38), 0 0 0 3px rgba(42,36,32,0.12)'
            : '0 4px 20px rgba(42,36,32,0.16)',
          transition: 'box-shadow 0.24s ease',
        }}
      >
        {/* Coral flood — rises from bottom on hover */}
        <motion.span
          animate={{ scaleY: hovered ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          style={{
            position: 'absolute', inset: 0, background: '#E8543A',
            transformOrigin: 'bottom center',
            borderRadius: 'inherit', zIndex: 0, display: 'block',
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </motion.button>
    </motion.div>
  );
}

// ── Onboarding hint ───────────────────────────────────────────────────────────
function GlobeHint({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss(); }, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '16px', height: '16px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#E8543A', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '1.5px solid rgba(232,84,58,0.5)', animation: 'hintPulse 1.4s ease-out infinite' }} />
      </div>
      <div style={{ background: 'rgba(42,36,32,0.88)', backdropFilter: 'blur(8px)', color: '#F7F3EE', fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.07em', padding: '7px 14px', borderRadius: '20px', whiteSpace: 'nowrap', marginTop: '4px' }}>
        tap a city to read a moment
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [pins,      setPins]      = useState<Pin[]>([]);
  const [posts,     setPosts]     = useState<Array<{ id: string; content?: string; name?: string; type: string }>>([]);
  const [loaded,    setLoaded]    = useState(false);
  const [showHint,  setShowHint]  = useState(false);
  const hintShownRef = useRef(false);
  const { activeModal, selectedCity, openModal, closeModal, openCityFeed } = useModal();

  useCursorFollower();
  useCursorTrail();

  useEffect(() => {
    Promise.all([getPins(), getPosts({ limit: 20 })]).then(([pinsData, postsData]) => {
      setPins(pinsData);
      setPosts(postsData as any[]);
      setTimeout(() => {
        setLoaded(true);
        if (!sessionStorage.getItem('bbb_hinted') && !hintShownRef.current) {
          hintShownRef.current = true;
          setTimeout(() => setShowHint(true), 1200);
          sessionStorage.setItem('bbb_hinted', '1');
        }
      }, 80);
    });
  }, []);

  // Count total posts + unique cities for LiveBar
  const cityCount = useMemo(() => new Set(posts.map((p: any) => p.location?.city).filter(Boolean)).size, [posts]);

  const handlePinClick = (pin: Pin) => { setShowHint(false); openCityFeed(pin); };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes hintPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes shadowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%       { opacity: 0.3; transform: translateX(-50%) scaleX(0.88); }
        }
        @keyframes orbitPulse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ctaBreathe {
          0%, 100% { box-shadow: 0 4px 20px rgba(42,36,32,0.15); }
          50%       { box-shadow: 0 10px 36px rgba(42,36,32,0.28); }
        }
        @keyframes globeEnter {
          0%   { transform: scale(0.88); opacity: 0; }
          60%  { transform: scale(1.03); }
          80%  { transform: scale(0.98); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes globeBreathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.008); }
        }
        @keyframes wordDrop {
          0%   { opacity: 0; transform: translateY(-14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitFade {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.28; }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.5); }
        }
        /* Italic Playfair nav links with sliding underline */
        .home-nav-link {
          font-family: "Playfair Display", serif !important;
          font-style: italic !important;
          font-size: 13px;
          color: #9A8A7A;
          text-decoration: none;
          padding: 4px 2px;
          border-radius: 0;
          border: none !important;
          background: transparent !important;
          position: relative;
          transition: color 0.18s;
          display: inline-block;
        }
        .home-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1px;
          background: #E8543A;
          transition: width 0.24s cubic-bezier(.34,1.56,.64,1);
        }
        .home-nav-link:hover { color: #E8543A; }
        .home-nav-link:hover::after { width: 100%; }
        div[style*="bottom: -28px"][style*="DM Mono"],
        div[style*="bottom:-28px"][style*="DM Mono"] { display: none !important; }
        .globe-wrap:hover .globe-shadow {
          opacity: 0.9 !important;
          transform: translateX(-50%) scaleX(1.14) !important;
        }
      `}</style>

      <InteractiveDotGrid
        dotSize={1}
        dotSpacing={10}
        dotColor="rgba(42,36,32,0.09)"
        distortionRadius={120}
        distortionStrength={28}
        animationSpeed={0.1}
      />

      {/* Paper grain */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.040\'/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 0 }} />

      {/* Corner marks */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M 22 22 L 22 46 M 22 22 L 46 22" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 1418 22 L 1394 22 M 1418 22 L 1418 46" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 22 878 L 22 854 M 22 878 L 46 878" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 1418 878 L 1394 878 M 1418 878 L 1418 854" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', zIndex: 30, opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease 0.2s' }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '14px', color: '#0F0D0B', letterSpacing: '-0.01em', opacity: 0.45 }}>
          b<span style={{ color: '#E8543A' }}>.</span>b<span style={{ color: '#EDB846' }}>.</span>b
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/wall"    className="home-nav-link" title="Browse all whispers">wall</Link>
          <Link to="/journal" className="home-nav-link" title="Shared journal">journal</Link>
        </div>
      </nav>

      {/* Globe stack */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', pointerEvents: 'none' }}>
          <AnimatedTitle />
          <p style={{ fontSize: 'clamp(10.5px, 1.0vw, 12.5px)', color: '#B0A090', fontFamily: '"DM Mono", monospace', margin: '0 0 4px 0', letterSpacing: '0.10em', textTransform: 'lowercase', animation: loaded ? 'wordDrop 0.55s ease 0.55s both' : 'none' }}>
            small moments.{' '}
            <span style={{ color: '#E8543A', opacity: 0.7 }}>✦</span>
            {' '}shared quietly.{' '}everywhere.
          </p>
        </div>

        {/* Globe — spring enter + slow breathe + grab cursor */}
        <div
          className="globe-wrap"
          style={{ position: 'relative', cursor: 'grab', animation: loaded ? 'globeEnter 1.1s cubic-bezier(.34,1.56,.64,1) 0.1s both, globeBreathe 8s ease-in-out 1.5s infinite' : 'none' }}
          onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing'; setShowHint(false); }}
          onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.cursor = 'grab'; }}
        >
          <Globe pins={pins} onPinClick={handlePinClick} />
          {showHint && <GlobeHint onDismiss={() => setShowHint(false)} />}

          {/* Drop shadow — expands on hover via .globe-wrap:hover .globe-shadow */}
          <div className="globe-shadow" style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '65%', height: '24px', background: 'radial-gradient(ellipse, rgba(80,55,30,0.16) 0%, transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none', transition: 'opacity 0.4s ease, transform 0.4s ease', animation: 'shadowPulse 10s ease-in-out infinite' }} />

          {/* Orbit ring 1 — coral dashes, slow CW spin */}
          <div style={{ position: 'absolute', inset: '-16px', borderRadius: '50%', border: '1px dashed rgba(232,84,58,0.22)', pointerEvents: 'none', animation: 'orbitPulse 16s linear infinite' }} />
          {/* Orbit ring 2 — amber, CCW spin */}
          <div style={{ position: 'absolute', inset: '-32px', borderRadius: '50%', border: '0.6px dashed rgba(237,184,70,0.14)', pointerEvents: 'none', animation: 'orbitPulse 26s linear infinite reverse' }} />
          {/* Orbit ring 3 — outer glow, pulses opacity only */}
          <div style={{ position: 'absolute', inset: '-52px', borderRadius: '50%', border: '1px solid rgba(232,84,58,0.06)', pointerEvents: 'none', animation: 'orbitFade 7s ease-in-out infinite' }} />
        </div>

        {/* Hero CTA */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <LiquidButton onClick={e => { burstConfetti(e.currentTarget as HTMLElement); openModal('compose'); }}>
            + leave a whisper
          </LiquidButton>
        </div>
      </div>

      {/* Floaties */}
      <Floaties onOpen={openModal} verticalOffset={80} />

      {/* Whisper ticker — drifts slowly along the bottom */}
      {loaded && <WhisperTicker posts={posts} />}

      {/* Modals */}
      <ComposeModal isOpen={activeModal === 'compose'} onClose={closeModal} onSelectType={openModal} />
      <LetterModal isOpen={activeModal === 'letter'} onClose={closeModal} />
      <PolaroidModal isOpen={activeModal === 'polaroid'} onClose={closeModal} />
      <TypewriterModal isOpen={activeModal === 'typewriter'} onClose={closeModal} />
      <CafeModal isOpen={activeModal === 'cafe'} onClose={closeModal} />
      <JournalModal isOpen={activeModal === 'journal'} onClose={closeModal} />
      <ActivityModal isOpen={activeModal === 'activity'} onClose={closeModal} lockedMode="doing" />
      <ActivityModal isOpen={activeModal === 'movie'}    onClose={closeModal} lockedMode="movie" />
      <AdviceModal   isOpen={activeModal === 'advice'}   onClose={closeModal} />
      <CityFeed isOpen={activeModal === 'cityFeed'} onClose={closeModal} pin={selectedCity} onOpenCompose={() => openModal('compose')} />
    </div>
  );
}