/**
 * Entropy Field — full-page background
 *
 * Each particle carries an `entropy` value (0 = calm, 1 = chaotic).
 * Moving the cursor near a particle injects entropy; it slowly decays
 * back to 0, pulling the particle back into a gentle organic drift.
 *
 * Calm state  → small soft dots, thin faint connections, slow sine drift
 * Chaotic state → dots swell, glow, scatter with random impulses, thick bright lines
 */
import { useEffect, useRef } from 'react';

// App palette: coral · amber · sage · periwinkle
const PALETTE: [number, number, number][] = [
  [232, 84,  58],
  [237, 184, 70],
  [93,  154, 112],
  [112, 144, 200],
];

const N             = 58;    // fewer particles — let floaties breathe
const CONN_DIST     = 105;   // shorter connections — less visual noise
const CURSOR_R      = 155;   // cursor influence radius
const ENTROPY_BOOST = 0.22;  // gentler injection
const ENTROPY_DECAY = 0.960; // slightly faster decay — chaos settles quicker
const CHAOS_KICK    = 2.6;   // softer outward impulse
const DRIFT_SPEED   = 0.20;  // slower base drift

interface P {
  x: number; y: number;   // live position
  ox: number; oy: number; // wandering rest target
  vx: number; vy: number; // velocity
  e: number;              // entropy 0–1
  col: [number, number, number];
  r: number;              // base radius
  ph: number;             // sine phase
}

export default function InteractiveBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const DPR    = Math.min(window.devicePixelRatio || 1, 2);

    let W = window.innerWidth;
    let H = window.innerHeight;
    let mx = -9999, my = -9999; // cursor offscreen until first move
    let frame = 0, raf = 0;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width  = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(DPR, DPR);
    };
    resize();

    // Scatter particles across full viewport
    const pts: P[] = Array.from({ length: N }, () => {
      const x = Math.random() * W, y = Math.random() * H;
      return {
        x, y, ox: x, oy: y,
        vx: (Math.random() - 0.5) * DRIFT_SPEED,
        vy: (Math.random() - 0.5) * DRIFT_SPEED,
        e:  0,
        col: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        r:   1.8 + Math.random() * 2.8,
        ph:  Math.random() * Math.PI * 2,
      };
    });

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // ── Update ─────────────────────────────────────────────────────────────
      for (const p of pts) {
        const cdx = p.x - mx, cdy = p.y - my;
        const cd2 = cdx * cdx + cdy * cdy;

        if (cd2 < CURSOR_R * CURSOR_R && cd2 > 1) {
          const cd  = Math.sqrt(cd2);
          const str = (1 - cd / CURSOR_R) ** 2;

          // Inject chaotic impulse — outward + random jitter
          p.vx += (cdx / cd) * str * CHAOS_KICK + (Math.random() - 0.5) * str * 1.8;
          p.vy += (cdy / cd) * str * CHAOS_KICK + (Math.random() - 0.5) * str * 1.8;
          p.e   = Math.min(1, p.e + str * ENTROPY_BOOST);
        }

        // Entropy always decays toward order
        p.e *= ENTROPY_DECAY;

        // Drag: chaotic particles keep velocity longer
        const drag = 0.90 + p.e * 0.06;
        p.vx *= drag; p.vy *= drag;

        // When calm: sine drift + pull back toward rest
        const calm = 1 - p.e;
        p.vx += Math.sin(frame * 0.009 + p.ph) * 0.13 * calm;
        p.vy += Math.cos(frame * 0.007 + p.ph) * 0.10 * calm;
        p.vx += (p.ox - p.x) * 0.007 * calm;
        p.vy += (p.oy - p.y) * 0.007 * calm;

        // When chaotic: rest wanders more freely
        p.ox += p.vx * (0.12 + p.e * 0.22);
        p.oy += p.vy * (0.12 + p.e * 0.22);

        p.x += p.vx; p.y += p.vy;

        // Seamless wrap
        const pad = 80;
        if (p.ox < -pad) p.ox = W + pad; else if (p.ox > W + pad) p.ox = -pad;
        if (p.oy < -pad) p.oy = H + pad; else if (p.oy > H + pad) p.oy = -pad;
        if (p.x  < -pad) p.x  = W + pad; else if (p.x  > W + pad) p.x  = -pad;
        if (p.y  < -pad) p.y  = H + pad; else if (p.y  > H + pad) p.y  = -pad;
      }

      // ── Draw connections ───────────────────────────────────────────────────
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b  = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= CONN_DIST * CONN_DIST) continue;

          const d      = Math.sqrt(d2);
          const avgE   = (a.e + b.e) * 0.5;
          // Calm = thin/faint, chaotic = thick/bright
          const alpha  = (1 - d / CONN_DIST) * (0.07 + avgE * 0.18);
          const lw     = 0.5 + avgE * 1.4;
          const [r, g, bl] = a.col;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${Math.min(alpha, 0.40)})`;
          ctx.lineWidth   = lw;
          ctx.stroke();
        }
      }

      // ── Draw dots ──────────────────────────────────────────────────────────
      for (const p of pts) {
        const [r, g, b] = p.col;
        const size  = p.r * (1 + p.e * 1.2);  // swell with entropy
        const alpha = 0.14 + p.e * 0.22;

        // Outer soft glow — expands dramatically with entropy
        const glowR = size * (2.0 + p.e * 2.5);
        const grad  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${0.03 + p.e * 0.08})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    tick();

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
}
