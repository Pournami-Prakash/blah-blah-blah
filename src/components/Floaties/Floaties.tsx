import { useState, useEffect, useRef, useCallback } from 'react';
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
  tier: 1 | 2 | 3;
  tilt: number;
  offsetX?: number;
}

const TIER = {
  1: { scale: 1.0, opacity: 1.0, blur: 'none', shadow: 'drop-shadow(0 6px 18px rgba(40,28,18,0.13))' },
  2: { scale: 0.9, opacity: 0.92, blur: 'none', shadow: 'drop-shadow(0 4px 12px rgba(40,28,18,0.09))' },
  3: { scale: 0.82, opacity: 0.78, blur: 'none', shadow: 'drop-shadow(0 3px 8px rgba(40,28,18,0.06))' },
} as const;

const W = 260, H = 146;

const FLOATIES: Floatie[] = [
  { id: 'advice', label: 'advice & quotes', modal: 'advice', pos: { x: 0.10, y: 0.28 }, drift: 'drift1', period: '6.8s', delay: '0s', depth: 0.55, src: '/svgs/pointed%20finger%20girl.svg', w: W, h: H, tier: 2, tilt: -2 },
  { id: 'snap', label: 'quick snap', modal: 'polaroid', pos: { x: 0.09, y: 0.52 }, drift: 'drift3', period: '7.6s', delay: '0.4s', depth: 0.42, src: '/svgs/polaroid.svg', w: W, h: H, tier: 2, tilt: 2 },
  { id: 'movies', label: 'watched something', modal: 'movie', pos: { x: 0.10, y: 0.76 }, drift: 'drift5', period: '8.2s', delay: '0.9s', depth: 0.38, src: '/svgs/Duck%20TV.svg', w: W, h: H, tier: 2, tilt: 3 },

  { id: 'food', label: 'food & places', modal: 'cafe', pos: { x: 0.22, y: 0.11 }, drift: 'drift5', period: '5.9s', delay: '0s', depth: 0.45, src: '/svgs/eating.svg', w: W, h: H, tier: 2, tilt: -3 },
  { id: 'activities', label: 'activities', modal: 'activity', pos: { x: 0.78, y: 0.11 }, drift: 'drift6', period: '6.3s', delay: '0.2s', depth: 0.60, src: '/svgs/travel.svg', w: W, h: H, tier: 2, tilt: 2 },

  { id: 'journal', label: 'add a journal entry', modal: 'journal', pos: { x: 0.87, y: 0.28 }, drift: 'drift3', period: '7.2s', delay: '0.4s', depth: 0.55, src: '/svgs/typewriter.svg', w: W, h: H, tier: 2, tilt: 3, offsetX: -30 },
  { id: 'random', label: 'just thoughts', modal: 'typewriter', pos: { x: 0.87, y: 0.52 }, drift: 'drift2', period: '6.1s', delay: '0.5s', depth: 0.50, src: '/svgs/typing.svg', w: 310, h: 175, tier: 1, tilt: -2, offsetX: -25 },
  { id: 'sendNote', label: 'send a note', modal: 'letter', pos: { x: 0.87, y: 0.76 }, drift: 'drift4', period: '6.9s', delay: '0.8s', depth: 0.65, src: '/svgs/duck%20letter.svg', w: W, h: H, tier: 2, tilt: 4, offsetX: -20 },
];

const MAX_PX = 20;

export default function Floaties({ onOpen, verticalOffset = 0 }: FloatiesProps) {
  const [visible, setVisible] = useState(false);
  const [vw, setVw] = useState(() => window.innerWidth);
  const mouse = useRef({ x: 0, y: 0 });
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const resize = () => setVw(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    setTimeout(() => setVisible(true), 300);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
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

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', move);
    };
  }, []);

  return (
    <>
      {FLOATIES.map((f, i) => {
        const t = TIER[f.tier];
        const isMobile = vw < 768;

        const mobileScale =
          isMobile && f.id === 'random' ? 0.85 : 1;

        const w = f.w * t.scale * mobileScale;
        const h = f.h * t.scale * mobileScale;

        let left = `${f.pos.x * 100}%`;

        if (isMobile) {
          if (f.id === 'journal') left = '75%';
          if (f.id === 'random') left = '68%';
          if (f.id === 'sendNote') left = '78%';
        }

        return (
          <div
            key={f.id}
            style={{
              position: 'fixed',
              left,
              top: `calc(${f.pos.y * 100}% + ${verticalOffset}px)`,
              transform: 'translate(-50%, -50%)',
              opacity: visible ? t.opacity : 0,
              zIndex: 20,
            }}
          >
            <div
              ref={el => { refs.current[i] = el; }}
              onClick={() => onOpen(f.modal)}
              style={{ cursor: 'pointer', filter: t.shadow }}
            >
              <img
                src={f.src}
                width={w}
                height={h}
                style={{ display: 'block' }}
                alt={f.label}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}