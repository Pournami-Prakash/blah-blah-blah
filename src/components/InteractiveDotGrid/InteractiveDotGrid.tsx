import { useEffect, useRef } from 'react';

// ── InteractiveDotGrid ────────────────────────────────────────────────────────
// A canvas-based dot grid that ripples and distorts near the cursor.
// Fully responsive — rebuilds automatically on resize.
// All values are configurable via props with sensible defaults for b.b.b.

interface Props {
  /** Visual radius of each dot in px */
  dotSize?: number;
  /** Distance between dot centres in px */
  dotSpacing?: number;
  /** CSS colour string for dots */
  dotColor?: string;
  /** How far from the cursor dots begin to react, in px */
  distortionRadius?: number;
  /** How far (in px) dots push away from the cursor at peak */
  distortionStrength?: number;
  /** Lerp factor per frame — 0.04 = slow/dreamy, 0.18 = snappy */
  animationSpeed?: number;
  /** z-index of the canvas layer */
  zIndex?: number;
}

export default function InteractiveDotGrid({
  dotSize           = 1.6,
  dotSpacing        = 30,
  dotColor          = 'rgba(42,36,32,0.13)',
  distortionRadius  = 110,
  distortionStrength = 22,
  animationSpeed    = 0.09,
  zIndex            = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── state ──
    let W = 0, H = 0;
    const mouse = { x: -99999, y: -99999 };

    type Dot = {
      ox: number; oy: number;   // origin (grid) position
      cx: number; cy: number;   // current (lerped) position
    };
    let dots: Dot[] = [];
    let raf: number;

    // ── build / rebuild grid on resize ──
    const rebuild = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      // Reset transform (safe on repeated calls)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Centre the grid so edge dots are equidistant from the frame edges
      const offX = (W % dotSpacing) / 2;
      const offY = (H % dotSpacing) / 2;
      const cols = Math.ceil(W / dotSpacing) + 1;
      const rows = Math.ceil(H / dotSpacing) + 1;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = offX + c * dotSpacing;
          const oy = offY + r * dotSpacing;
          dots.push({ ox, oy, cx: ox, cy: oy });
        }
      }
    };

    // ── RAF draw loop ──
    // Performance notes:
    // • One beginPath + batched arc() calls share a single fillStyle set
    // • Dots already at rest skip the lerp
    // • When ALL dots are settled AND cursor is idle, skip the entire redraw
    let needsRedraw = true; // true on first frame and after any cursor move
    let prevMx = -99999, prevMy = -99999;

    const draw = () => {
      const mx = mouse.x, my = mouse.y;
      const cursorMoved = mx !== prevMx || my !== prevMy;
      if (cursorMoved) { prevMx = mx; prevMy = my; needsRedraw = true; }

      if (needsRedraw) {
        const r2 = distortionRadius * distortionRadius;
        let anyMoving = false;

        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = dotColor;

        for (const d of dots) {
          const ddx = d.ox - mx;
          const ddy = d.oy - my;
          const distSq = ddx * ddx + ddy * ddy;

          let tx = d.ox, ty = d.oy;

          if (distSq < r2 && distSq > 0) {
            const dist  = Math.sqrt(distSq);
            const t     = 1 - dist / distortionRadius;
            const force = t * t * distortionStrength;
            tx = d.ox + (ddx / dist) * force;
            ty = d.oy + (ddy / dist) * force;
          }

          // Lerp current → target; snap if close enough
          const ex = tx - d.cx, ey = ty - d.cy;
          if (ex * ex + ey * ey > 0.006) {
            d.cx += ex * animationSpeed;
            d.cy += ey * animationSpeed;
            anyMoving = true;
          } else {
            d.cx = tx; d.cy = ty;
          }

          ctx.moveTo(d.cx + dotSize, d.cy);
          ctx.arc(d.cx, d.cy, dotSize, 0, Math.PI * 2);
        }

        ctx.fill();
        // If nothing is moving and cursor is idle, stop redrawing until next move
        if (!anyMoving && !cursorMoved) needsRedraw = false;
      }

      raf = requestAnimationFrame(draw);
    };

    // ── event listeners ──
    const onMouseMove = (e: MouseEvent) => {
      // Convert page coords → canvas-local coords
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      // Push dots back to rest when cursor leaves viewport
      mouse.x = -99999;
      mouse.y = -99999;
    };

    // ResizeObserver keeps grid perfectly fitted to any frame size
    const ro = new ResizeObserver(() => rebuild());
    ro.observe(canvas);

    rebuild();
    raf = requestAnimationFrame(draw);

    // Track mouse globally (canvas is pointer-events:none so events come from parent)
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  // Re-run only if visual params change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotSize, dotSpacing, dotColor, distortionRadius, distortionStrength, animationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  );
}
