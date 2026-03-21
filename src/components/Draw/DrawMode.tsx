import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPost } from '../../api/client';

// ── Palette & widths ──────────────────────────────────────────────────────────
const COLORS = [
  { value: '#2A2420', label: 'ink'    },
  { value: '#E8543A', label: 'coral'  },
  { value: '#EDB846', label: 'amber'  },
  { value: '#5D9A70', label: 'sage'   },
];

const WIDTHS = [
  { value: 2,  label: 'fine'   },
  { value: 5,  label: 'medium' },
  { value: 13, label: 'thick'  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function getPos(e: MouseEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// ── DrawMode ─────────────────────────────────────────────────────────────────
interface Props {
  onPostCreated?: () => void;
}

export default function DrawMode({ onPostCreated }: Props) {
  const [active,     setActive]     = useState(false);
  const [tool,       setTool]       = useState<'pen' | 'eraser'>('pen');
  const [color,      setColor]      = useState('#2A2420');
  const [width,      setWidth]      = useState(5);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pointing   = useRef(false);
  const lastPt     = useRef<{ x: number; y: number } | null>(null);

  // ── Sync canvas size with viewport ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ctx = canvas.getContext('2d');
      // Snapshot existing content before resize clears it
      const snap = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (snap) ctx?.putImageData(snap, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Body class for blocking floaties while drawing ─────────────────────────
  useEffect(() => {
    if (active) document.body.classList.add('draw-mode');
    else        document.body.classList.remove('draw-mode');
    return () => document.body.classList.remove('draw-mode');
  }, [active]);

  // ── Drawing logic ──────────────────────────────────────────────────────────
  const stroke = useCallback((e: MouseEvent) => {
    if (!pointing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPt.current?.x ?? pt.x, lastPt.current?.y ?? pt.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.lineWidth   = tool === 'eraser' ? width * 4 : width;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.stroke();
    lastPt.current = pt;
    setHasStrokes(true);
  }, [tool, color, width]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent) => { pointing.current = true; lastPt.current = null; stroke(e); };
    const onMove = (e: MouseEvent) => stroke(e);
    const onUp   = ()              => { pointing.current = false; lastPt.current = null; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [active, stroke]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setHasStrokes(false);
  };

  const exit = () => {
    clear();
    setActive(false);
    setTool('pen');
    setColor('#2A2420');
    setWidth(5);
  };

  const submit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes || submitting) return;
    setSubmitting(true);

    // Composite drawing onto a warm cream background before export
    const off = document.createElement('canvas');
    off.width = canvas.width; off.height = canvas.height;
    const offCtx = off.getContext('2d')!;
    offCtx.fillStyle = '#F4EFE8';
    offCtx.fillRect(0, 0, off.width, off.height);
    offCtx.drawImage(canvas, 0, 0);

    try {
      const blob = await new Promise<Blob | null>(res => off.toBlob(res, 'image/png'));
      if (!blob) throw new Error('toBlob failed');
      const file = new File([blob], 'drawing.png', { type: 'image/png' });

      await createPost({
        type:      'polaroid',
        imageFile: file,
        caption:   'a sketch left behind',
      });

      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); exit(); }, 1600);
    } catch (err) {
      console.error('draw submit failed', err);
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* While drawing, floaties + cursor follower become non-interactive / hidden */
        body.draw-mode .floatie-anchor,
        body.draw-mode .floatie-px { pointer-events: none !important; }
        /* Hide the coral cursor dot + ring while draw mode is active */
        body.draw-mode > div[style*="z-index: 9999"],
        body.draw-mode > div[style*="z-index: 9998"] { opacity: 0 !important; transition: opacity 0.15s !important; }

        @keyframes toolIn {
          from { opacity:0; transform: translateY(12px) scale(0.95); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        @keyframes pulseRing {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,84,58,0); }
          50%      { box-shadow: 0 0 0 6px rgba(232,84,58,0.18); }
        }
      `}</style>

      {/* ── Drawing canvas ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: active ? 18 : -1,
          pointerEvents: active ? 'auto' : 'none',
          cursor: active
            ? tool === 'eraser'
              ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\'><circle cx=\'12\' cy=\'12\' r=\'10\' fill=\'none\' stroke=\'%238A7A6A\' stroke-width=\'2\'/></svg>") 12 12, cell'
              : 'crosshair'
            : 'default',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />

      {/* ── Pencil toggle button ── */}
      <motion.button
        onClick={() => active ? exit() : setActive(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.90 }}
        transition={{ type: 'spring', stiffness: 480, damping: 18 }}
        title={active ? 'exit draw mode' : 'draw a whisper'}
        aria-label={active ? 'exit draw mode' : 'draw a whisper'}
        style={{
          position: 'fixed',
          bottom: '88px',
          left: '28px',
          zIndex: 22,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: active ? '#E8543A' : 'rgba(247,243,238,0.94)',
          border: `1.5px solid ${active ? 'transparent' : 'rgba(42,36,32,0.13)'}`,
          boxShadow: active
            ? '0 4px 18px rgba(232,84,58,0.38)'
            : '0 2px 12px rgba(42,36,32,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          animation: active ? 'pulseRing 2s ease-in-out infinite' : 'none',
          transition: 'background 0.22s, border-color 0.22s, box-shadow 0.22s',
        }}
      >
        {active ? '✕' : '✏️'}
      </motion.button>

      {/* ── Floating toolbar ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 10, scale: 0.96  }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: '88px',
              left: '82px',
              zIndex: 23,
              background: 'rgba(247,243,238,0.97)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(42,36,32,0.09)',
              borderRadius: '16px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 28px rgba(42,36,32,0.13)',
            }}
          >
            {/* Pen / Eraser */}
            {(['pen', 'eraser'] as const).map(t => (
              <motion.button
                key={t}
                onClick={() => setTool(t)}
                whileTap={{ scale: 0.88 }}
                title={t}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  border: `1.5px solid ${tool === t ? '#E8543A' : 'rgba(42,36,32,0.10)'}`,
                  background: tool === t ? 'rgba(232,84,58,0.10)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {t === 'pen' ? '✏️' : '⬜'}
              </motion.button>
            ))}

            {/* Divider */}
            <div style={{ width: '1px', height: '22px', background: 'rgba(42,36,32,0.10)', flexShrink: 0 }} />

            {/* Colour swatches */}
            {COLORS.map(c => (
              <motion.button
                key={c.value}
                onClick={() => { setColor(c.value); setTool('pen'); }}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.85 }}
                title={c.label}
                style={{
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: c.value,
                  border: color === c.value && tool === 'pen'
                    ? '2.5px solid rgba(42,36,32,0.60)'
                    : '2px solid rgba(42,36,32,0.15)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'border-color 0.14s, transform 0.14s',
                }}
              />
            ))}

            {/* Divider */}
            <div style={{ width: '1px', height: '22px', background: 'rgba(42,36,32,0.10)', flexShrink: 0 }} />

            {/* Stroke widths */}
            {WIDTHS.map(w => (
              <motion.button
                key={w.value}
                onClick={() => setWidth(w.value)}
                whileTap={{ scale: 0.88 }}
                title={w.label}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  border: `1.5px solid ${width === w.value ? '#E8543A' : 'rgba(42,36,32,0.10)'}`,
                  background: width === w.value ? 'rgba(232,84,58,0.09)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: w.value <= 2 ? '14px' : w.value <= 5 ? '14px' : '14px',
                  height: `${w.value <= 2 ? 1.5 : w.value <= 5 ? 3 : 6}px`,
                  background: '#2A2420',
                  borderRadius: '2px',
                }} />
              </motion.button>
            ))}

            {/* Divider */}
            <div style={{ width: '1px', height: '22px', background: 'rgba(42,36,32,0.10)', flexShrink: 0 }} />

            {/* Clear */}
            <motion.button
              onClick={clear}
              whileTap={{ scale: 0.88 }}
              disabled={!hasStrokes}
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '9.5px',
                letterSpacing: '0.06em',
                color: hasStrokes ? '#8A7A6A' : '#C8B8A8',
                background: 'transparent',
                border: 'none',
                cursor: hasStrokes ? 'pointer' : 'default',
                padding: '4px 6px',
                borderRadius: '6px',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              clear
            </motion.button>

            {/* Submit */}
            <motion.button
              onClick={submit}
              disabled={!hasStrokes || submitting}
              whileTap={{ scale: 0.92 }}
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '9.5px',
                letterSpacing: '0.07em',
                background: submitted
                  ? '#5D9A70'
                  : hasStrokes ? '#E8543A' : 'rgba(42,36,32,0.08)',
                color: hasStrokes || submitted ? '#FFFFFF' : '#C8B8A8',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 14px',
                cursor: hasStrokes && !submitting ? 'pointer' : 'default',
                transition: 'background 0.22s, color 0.18s',
                whiteSpace: 'nowrap',
                opacity: submitting ? 0.65 : 1,
              }}
            >
              {submitted ? '✓ posted' : submitting ? 'posting…' : 'post it ✦'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draw mode hint overlay ── */}
      <AnimatePresence>
        {active && !hasStrokes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 17,
              pointerEvents: 'none',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <p style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              color: 'rgba(42,36,32,0.20)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              draw anything. leave it here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
