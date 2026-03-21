import { useEffect, useRef } from 'react';

const COLORS = ['#C8845A', '#D4956A', '#9A6A50', '#E8C5A0', '#B87050', '#DEB88A'];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  el: HTMLDivElement;
}

export default function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const lastSpawn = useRef(0);
  const moving = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      moving.current = true;
      clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => { moving.current = false; }, 80);
    };

    const spawn = () => {
      const div = document.createElement('div');
      el.appendChild(div);

      const angle = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * 1.4;
      const maxLife = 0.55 + Math.random() * 0.35;
      const p: Particle = {
        x: mouse.current.x, y: mouse.current.y,
        vx: Math.cos(angle) * spd * 0.7,
        vy: -0.8 - Math.random() * 1.6,
        life: maxLife, maxLife,
        size: 3.5 + Math.random() * 4.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        el: div,
      };
      particles.current.push(p);
    };

    const loop = (now: number) => {
      if (moving.current && now - lastSpawn.current > 35) {
        spawn();
        if (Math.random() > 0.58) spawn(); // micro-burst occasionally
        lastSpawn.current = now;
      }

      particles.current = particles.current.filter(p => {
        p.life -= 0.022;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;   // gentle gravity pulls down
        p.vx *= 0.98;   // slight air resistance

        if (p.life <= 0) { p.el.remove(); return false; }

        const frac = p.life / p.maxLife;
        const s = p.size * frac;
        p.el.style.cssText = [
          'position:fixed',
          'pointer-events:none',
          'border-radius:50%',
          'z-index:9999',
          `left:${(p.x - s / 2).toFixed(1)}px`,
          `top:${(p.y - s / 2).toFixed(1)}px`,
          `width:${s.toFixed(1)}px`,
          `height:${s.toFixed(1)}px`,
          `background:${p.color}`,
          `opacity:${(frac * 0.72).toFixed(2)}`,
          'mix-blend-mode:multiply',
        ].join(';');
        return true;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(stopTimer.current);
      window.removeEventListener('mousemove', onMove);
      particles.current.forEach(p => p.el.remove());
      particles.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
}
