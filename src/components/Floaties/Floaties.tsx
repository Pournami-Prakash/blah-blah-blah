import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ModalType } from '../../hooks/useModal';

interface FloatiesProps {
  onOpen: (modal: ModalType) => void;
  verticalOffset?: number;
}

interface Floatie {
  id: string;
  label: string;
  modal: ModalType;
  pos: { x: number; y: number };
  drift: string;
  period: string;
  delay: string;
  depth: number;
  src: string;
  w: number;
  h: number;
  tilt: number;
  offsetX?: number;
}

const W = 260, H = 146;

const FLOATIES: Floatie[] = [
  { id: 'advice',    label: 'advice & quotes',   modal: 'advice',     pos: { x: 0.10, y: 0.28 }, drift: 'drift1', period: '6.8s', delay: '0s',   depth: 0.55, src: '/svgs/pointed%20finger%20girl.svg', w: W, h: H, tilt: -2 },
  { id: 'snap',      label: 'quick snap',         modal: 'polaroid',   pos: { x: 0.09, y: 0.52 }, drift: 'drift3', period: '7.6s', delay: '0.4s', depth: 0.42, src: '/svgs/polaroid.svg',                 w: W, h: H, tilt:  2 },
  { id: 'movies',    label: 'watched something',  modal: 'movie',      pos: { x: 0.10, y: 0.76 }, drift: 'drift5', period: '8.2s', delay: '0.9s', depth: 0.38, src: '/svgs/Duck%20TV.svg',                 w: W, h: H, tilt:  3 },
  { id: 'food',      label: 'food & places',      modal: 'cafe',       pos: { x: 0.22, y: 0.11 }, drift: 'drift5', period: '5.9s', delay: '0s',   depth: 0.45, src: '/svgs/eating.svg',                    w: W, h: H, tilt: -3 },
  { id: 'activities',label: 'activities',          modal: 'activity',   pos: { x: 0.78, y: 0.11 }, drift: 'drift6', period: '6.3s', delay: '0.2s', depth: 0.60, src: '/svgs/travel.svg',                    w: W, h: 257, tilt:  2 },
  { id: 'journal',   label: 'journal',             modal: 'journal',    pos: { x: 0.87, y: 0.28 }, drift: 'drift3', period: '7.2s', delay: '0.4s', depth: 0.55, src: '/svgs/typewriter.svg',                w: W, h: 232, tilt:  3, offsetX: -30 },
  { id: 'random',    label: 'thoughts',            modal: 'typewriter', pos: { x: 0.87, y: 0.52 }, drift: 'drift2', period: '6.1s', delay: '0.5s', depth: 0.50, src: '/svgs/typing.svg',                    w: W, h: 239, tilt: -2, offsetX: -25 },
  { id: 'sendNote',  label: 'note',                modal: 'letter',     pos: { x: 0.87, y: 0.76 }, drift: 'drift4', period: '6.9s', delay: '0.8s', depth: 0.65, src: '/svgs/duck%20letter.svg',             w: W, h: H,   tilt:  4, offsetX: -20 },
];

const MAX_PX = 20;

export default function Floaties({ onOpen, verticalOffset = 0 }: FloatiesProps) {
  const [visible, setVisible] = useState(false);
  const [vw, setVw] = useState(() => window.innerWidth);
  const [ripples, setRipples] = useState<Record<string, boolean>>({});

  const mouse = useRef({ x: 0, y: 0 });
  const refs  = useRef<(HTMLDivElement | null)[]>([]);
  const raf   = useRef(0);

  const handleClick = useCallback((f: Floatie) => {
    setRipples(r => ({ ...r, [f.id]: true }));
    setTimeout(() => {
      setRipples(r => { const copy = { ...r }; delete copy[f.id]; return copy; });
    }, 600);
    onOpen(f.modal);
  }, [onOpen]);

  useEffect(() => {
    const resize = () => setVw(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    const loop = () => {
      FLOATIES.forEach((f, i) => {
        const el = refs.current[i];
        if (!el) return;
        const tx = -mouse.current.x * MAX_PX * f.depth + (f.offsetX || 0);
        const ty = -mouse.current.y * MAX_PX * f.depth;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    window.addEventListener('mousemove', move);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('mousemove', move); };
  }, []);

  return createPortal(
    <>
      <style>{`
        @keyframes floatieRipple {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        .floatie-ripple {
          position: absolute; top: 50%; left: 50%;
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(232,84,58,0.18);
          pointer-events: none; z-index: 1;
          animation: floatieRipple 0.6s ease-out forwards;
        }
      `}</style>

      {FLOATIES.map((f, i) => {
        const isMobile = vw < 768;
        const scale    = 0.90;
        const w        = Math.round(f.w * scale);
        const h        = Math.round(f.h * scale);

        // ── Horizontal position ──────────────────────────────────────────────
        // Desktop: use exact % positions from FLOATIES data
        // Mobile: left column peeks off left edge (~6%), right column peeks
        //         off right edge (~88–92%) so they're symmetric and not
        //         overlapping the globe in the centre.
        let left = `${f.pos.x * 100}%`;
        if (isMobile) {
          // Left column — hug left edge
          if (f.id === 'advice' || f.id === 'snap'    || f.id === 'movies') left = '6%';
          // Top row — slight inward pull so visible
          if (f.id === 'food')        left = '20%';
          if (f.id === 'activities')  left = '80%';
          // Right column — push to right edge, peeking off symmetrically with left
          if (f.id === 'journal')     left = '94%';
          if (f.id === 'random')      left = '96%';
          if (f.id === 'sendNote')    left = '94%';
        }

        return (
          <div
            key={f.id}
            style={{
              position: 'fixed',
              left,
              top: `calc(${f.pos.y * 100}% + ${verticalOffset}px)`,
              width: w,
              transform: 'translate(-50%, -50%)',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.5s ease',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <div
              ref={el => { refs.current[i] = el; }}
              onClick={() => handleClick(f)}
              style={{
                cursor: 'pointer',
                pointerEvents: 'auto',
                position: 'relative',
                filter: 'drop-shadow(0 4px 12px rgba(40,28,18,0.10))',
              }}
            >
              {ripples[f.id] && <div className="floatie-ripple" />}
              <img
                src={f.src}
                width={w}
                height={h}
                style={{
                  display: 'block',
                  userSelect: 'none',
                }}
                alt={f.label}
                draggable={false}
              />
            </div>
          </div>
        );
      })}
    </>,
    document.body
  );
}