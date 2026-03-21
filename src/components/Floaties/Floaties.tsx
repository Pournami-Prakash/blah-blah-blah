import { useState, useEffect, useRef, useCallback } from 'react';
import type { ModalType } from '../../hooks/useModal';

interface FloatiesProps {
  onOpen: (modal: ModalType) => void;
  /** Push all floaties down by this many pixels (default 0) */
  verticalOffset?: number;
}

interface Floatie {
  id:     string;
  label:  string;
  modal:  ModalType;
  pos:    { x: number; y: number };
  drift:  string;
  period: string;
  delay:  string;
  depth:  number;
  src:    string;
  w:      number;
  h:      number;
  tier:   1 | 2 | 3;
  tilt:   number;
}

const TIER: Record<1|2|3, { scale: number; opacity: number; blur: string; shadow: string }> = {
  1: { scale: 1.00, opacity: 1.00, blur: 'none', shadow: 'drop-shadow(0 6px 18px rgba(40,28,18,0.13))' },
  2: { scale: 0.90, opacity: 0.92, blur: 'none', shadow: 'drop-shadow(0 4px 12px rgba(40,28,18,0.09))' },
  3: { scale: 0.82, opacity: 0.78, blur: 'none', shadow: 'drop-shadow(0 3px 8px rgba(40,28,18,0.06))' },
};

const W = 260, H = 146;
const FLOATIES: Floatie[] = [
  // ── Left column ────────────────────────────────────────────────
  {
    id: 'advice',
    label: 'advice & quotes',
    modal: 'advice',
    pos: { x: 0.10, y: 0.28 },
    drift: 'drift1', period: '6.8s', delay: '0s', depth: 0.55,
    src: '/svgs/pointed%20finger%20girl.svg', w: W, h: H,
    tier: 2, tilt: -2,
  },
  {
    id: 'snap',
    label: 'quick snap',
    modal: 'polaroid',
    pos: { x: 0.09, y: 0.52 },
    drift: 'drift3', period: '7.6s', delay: '0.4s', depth: 0.42,
    src: '/svgs/polaroid.svg', w: W, h: H,
    tier: 2, tilt: 2,
  },
  {
    id: 'movies',
    label: 'watched something',
    modal: 'movie',
    pos: { x: 0.10, y: 0.76 },
    drift: 'drift5', period: '8.2s', delay: '0.9s', depth: 0.38,
    src: '/svgs/Duck%20TV.svg', w: W, h: H,
    tier: 2, tilt: 3,
  },

  // ── Top ────────────────────────────────────────────────────────
  {
    id: 'food',
    label: 'food & places',
    modal: 'cafe',
    pos: { x: 0.22, y: 0.11 },
    drift: 'drift5', period: '5.9s', delay: '0s', depth: 0.45,
    src: '/svgs/eating.svg', w: W, h: H,
    tier: 2, tilt: -3,
  },
  {
    id: 'activities',
    label: 'activities',
    modal: 'activity',
    pos: { x: 0.78, y: 0.11 },
    drift: 'drift6', period: '6.3s', delay: '0.2s', depth: 0.60,
    src: '/svgs/travel.svg', w: W, h: H,
    tier: 2, tilt: 2,
  },

  // ── Right column ───────────────────────────────────────────────
  {
    id: 'journal',
    label: 'add a journal entry',
    modal: 'journal',
    pos: { x: 0.87, y: 0.28 },
    drift: 'drift3', period: '7.2s', delay: '0.4s', depth: 0.55,
    src: '/svgs/typewriter.svg', w: W, h: H,
    tier: 2, tilt: 3,
  },
  {
    id: 'random',
    label: 'just thoughts',
    modal: 'typewriter',
    pos: { x: 0.87, y: 0.52 },
    drift: 'drift2', period: '6.1s', delay: '0.5s', depth: 0.50,
    src: '/svgs/typing.svg', w: 310, h: 175,
    tier: 1, tilt: -2,
  },
  {
    id: 'sendNote',
    label: 'send a note',
    modal: 'letter',
    pos: { x: 0.87, y: 0.76 },
    drift: 'drift4', period: '6.9s', delay: '0.8s', depth: 0.65,
    src: '/svgs/duck%20letter.svg', w: W, h: H,
    tier: 2, tilt: 4,
  },
];

const MAX_PX       = 20;
const MAGNET_RANGE = 125;
const MAGNET_MAX   = 12;

export default function Floaties({ onOpen, verticalOffset = 0 }: FloatiesProps) {
  const [visible, setVisible] = useState(false);
  const [ripples, setRipples] = useState<Record<string, boolean>>({});
  const [vw, setVw] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rawMouse    = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const cursorPx    = useRef({ x: -9999, y: -9999 });
  const pxRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef      = useRef<number>(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    rawMouse.current = {
      x: (e.clientX / window.innerWidth  - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    };
    cursorPx.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const loop = () => {
      const LERP = 0.07;
      smoothMouse.current.x += (rawMouse.current.x - smoothMouse.current.x) * LERP;
      smoothMouse.current.y += (rawMouse.current.y - smoothMouse.current.y) * LERP;

      const W = window.innerWidth;
      const H = window.innerHeight;

      FLOATIES.forEach((f, i) => {
        const el = pxRefs.current[i];
        if (!el) return;

        let tx = -smoothMouse.current.x * MAX_PX * f.depth;
        let ty = -smoothMouse.current.y * MAX_PX * f.depth;

        // Use the offset-adjusted Y for magnet distance calculation
        const floatX = f.pos.x * W;
        const floatY = f.pos.y * H + verticalOffset;
        const dx = cursorPx.current.x - floatX;
        const dy = cursorPx.current.y - floatY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAGNET_RANGE && dist > 1) {
          const pull = (1 - dist / MAGNET_RANGE) ** 2;
          tx += (dx / dist) * pull * MAGNET_MAX;
          ty += (dy / dist) * pull * MAGNET_MAX;
        }

        el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [onMouseMove, verticalOffset]);

  const handleClick = useCallback((f: Floatie) => {
    setRipples(r => ({ ...r, [f.id]: true }));
    setTimeout(() => setRipples(r => { const n = { ...r }; delete n[f.id]; return n; }), 600);
    onOpen(f.modal);
  }, [onOpen]);

  return (
    <>
      <style>{`
        .floatie-anchor {
          position: fixed;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 20;
        }
        .floatie-px {
          position: relative;
          display: inline-block;
          pointer-events: auto;
          cursor: pointer;
          will-change: transform;
        }
        .floatie-pop {
          display: inline-block;
          opacity: 0;
        }
        .floatie-pop.entered {
          animation: popIn 0.72s cubic-bezier(.34,1.56,.64,1) both;
        }

        .floatie-px:hover .floatie-inner img {
          transform: scale(1.10) rotate(-2deg) translateY(-4px) !important;
        }
        .floatie-inner img {
          transition: transform 0.42s cubic-bezier(.34,1.56,.64,1);
          display: block;
          mix-blend-mode: multiply;
        }

        .floatie-px:active .floatie-inner img {
          transform: scale(0.92) rotate(2deg) translateY(2px) !important;
          transition: transform 0.08s ease !important;
        }

        .ftag {
          position: absolute;
          left: 50%;
          white-space: nowrap;
          font-size: 9px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.08em;
          color: rgba(42,28,16,0.80);
          background: rgba(252,248,242,0.97);
          border: 1px solid rgba(232,84,58,0.18);
          border-left: 2.5px solid rgba(232,84,58,0.55);
          border-radius: 4px;
          padding: 4px 10px 4px 8px;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(40,24,12,0.10);
          backdrop-filter: blur(4px);
          transition: opacity 0.2s ease, transform 0.22s cubic-bezier(.34,1.56,.64,1);
          /* all tiers hidden by default */
          opacity: 0;
          transform: translateX(-50%) translateY(8px) rotate(-1deg);
        }
        .floatie-px:hover .ftag {
          opacity: 1;
          transform: translateX(-50%) translateY(2px) rotate(0deg);
        }

        .floatie-ripple {
          position: absolute;
          top: 50%; left: 50%;
          width: 88px; height: 88px;
          margin: -44px 0 0 -44px;
          border-radius: 50%;
          background: rgba(232,84,58,0.20);
          pointer-events: none;
          z-index: 1;
          animation: ripple 0.65s ease-out forwards;
        }

        .floatie-ring { display: none; }
      `}</style>

      {FLOATIES.map((f, i) => {
        const t = TIER[f.tier];
        const isMobile = vw < 768;

        // On mobile: ignore tier scaling — flat 0.72 for all so left and right
        // column illustrations are identical in size.
        const scale = isMobile ? 0.72 : t.scale;
        const scaledW = Math.round(f.w * scale);
        const scaledH = Math.round(f.h * scale);

        // Apply verticalOffset as a pixel shift on top of the percentage-based position
        const topValue = `calc(${f.pos.y * 100}% + ${verticalOffset}px)`;

        // On mobile positioning:
        // Left col (x≈0.09-0.10) peeks ~57px off-screen left — intentional, charming
        // Right col should mirror: same ~57px off right edge → center at ~90% of screen
        // activities top (x=0.78) → nudge to 82% so it's more visible
        // food top (x=0.22) → stays, fine
        let leftValue = `${f.pos.x * 100}%`;
        if (isMobile) {
          if (f.pos.x > 0.83) {
            // right column — pin to 90% so it peeks off right edge like left peeks off left
            leftValue = '90%';
          } else if (f.pos.x > 0.70) {
            // activities (0.78) — pull inward slightly so more of it shows
            leftValue = '82%';
          }
        }

        return (
          <div
            key={f.id}
            className="floatie-anchor"
            style={{
              left: leftValue,
              top: topValue,
            }}
          >
            <div
              ref={el => { pxRefs.current[i] = el; }}
              className="floatie-px"
              style={{ filter: t.shadow, opacity: isMobile ? 1 : t.opacity }}
              onClick={() => handleClick(f)}
            >
              {ripples[f.id] && <div className="floatie-ripple" />}
              {f.tier === 1 && <div className="floatie-ring" />}

              <div
                className={`floatie-pop${visible ? ' entered' : ''}`}
                style={{ animationDelay: `${i * 0.09}s` }}
              >
                <div
                  className="floatie-inner"
                  style={{
                    display: 'inline-block',
                    transform: `rotate(${f.tilt}deg)`,
                    animation: visible
                      ? `${f.drift} ${f.period} ease-in-out ${f.delay} infinite`
                      : 'none',
                  }}
                >
                  <img
                    src={f.src}
                    width={scaledW}
                    height={scaledH}
                    style={{
                      width: scaledW,
                      height: scaledH,
                      filter: t.blur !== 'none' ? t.blur : undefined,
                    }}
                    alt={f.label}
                    draggable={false}
                    loading="eager"
                  />
                </div>

                <div
                  className={`ftag ftag-t${f.tier}`}
                  style={{ top: scaledH + 7 }}
                >
                  {f.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}