import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { Pin } from '../../types';

interface GlobeProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
}

function ptIn(pt: [number, number], feature: GeoJSON.Feature): boolean {
  const coords = (feature.geometry as any);
  if (!coords) return false;
  const polys: number[][][][] = coords.type === 'Polygon'
    ? [coords.coordinates]
    : coords.type === 'MultiPolygon'
    ? coords.coordinates
    : [];
  return polys.some(poly =>
    poly.some(ring => {
      let inside = false;
      const [px, py] = pt;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    })
  );
}

export default function Globe({ pins, onPinClick }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    rot: [0, -20, 0] as [number, number, number],
    drag: false,
    radius: 0,
    S: 0,
    land: null as any,
    dots: [] as [number, number][],
    animating: true,
    timer: null as d3.Timer | null,
  });

  const getSize = useCallback(() => {
    return Math.floor(Math.min(window.innerWidth * 0.50, window.innerHeight * 0.66));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapRef.current) return;
    const DPR = window.devicePixelRatio || 1;
    const state = stateRef.current;

    function size() {
      state.S = getSize();
      canvas!.width = state.S * DPR;
      canvas!.height = state.S * DPR;
      canvas!.style.width = state.S + 'px';
      canvas!.style.height = state.S + 'px';
      state.radius = state.S / 2.04;
    }

    size();
    const ctx = canvas.getContext('2d')!;
    const proj = d3.geoOrthographic()
      .translate([state.S / 2, state.S / 2])
      .scale(state.radius)
      .rotate(state.rot)
      .clipAngle(90);

    const sf = DPR;

    // Cache these — creating them every frame is expensive
    const grat   = d3.geoGraticule()();
    const path2d = d3.geoPath(proj, ctx);

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      proj.translate([state.S * sf / 2, state.S * sf / 2]);
      proj.scale(Math.min(state.radius, state.S / 2.04) * sf);

      // Ocean — warm cream to match site background
      ctx.beginPath();
      ctx.arc(state.S * sf / 2, state.S * sf / 2, state.radius * sf, 0, 2 * Math.PI);
      ctx.fillStyle = '#EDE8DF';
      ctx.fill();
      ctx.beginPath(); (path2d as any)(grat);
      ctx.strokeStyle = 'rgba(160,145,130,0.18)';
      ctx.lineWidth = 0.5 * sf;
      ctx.stroke();

      if (state.land) {
        ctx.beginPath(); (path2d as any)(state.land);
        ctx.strokeStyle = 'rgba(120,100,80,0.12)';
        ctx.lineWidth = 0.4 * sf;
        ctx.stroke();
      }

      state.dots.forEach(d => {
        const p = proj(d as [number, number]);
        if (!p || p[0] < 0 || p[0] > state.S * sf || p[1] < 0 || p[1] > state.S * sf) return;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 0.7 * sf, 0, 2 * Math.PI);
        ctx.fillStyle = '#A89880';
        ctx.fill();
      });

      pins.forEach(pin => {
        const p = proj([pin.lng, pin.lat]);
        if (!p) return;
        const [px, py] = p;
        if (px < 8 || px > state.S * sf - 8 || py < 8 || py > state.S * sf - 8) return;
        // Outer pulse ring
        ctx.beginPath(); ctx.arc(px, py, 11 * sf, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(232,84,58,0.10)'; ctx.fill();
        // Mid ring
        ctx.beginPath(); ctx.arc(px, py, 6 * sf, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(232,84,58,0.22)'; ctx.fill();
        // Core dot — coral
        ctx.beginPath(); ctx.arc(px, py, 3.2 * sf, 0, 2 * Math.PI);
        ctx.fillStyle = '#E8543A'; ctx.fill();
        // Inner specular
        ctx.beginPath(); ctx.arc(px, py, 1.2 * sf, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.80)'; ctx.fill();
        ctx.font = `${8.5 * sf}px "DM Sans",sans-serif`;
        const tw = ctx.measureText(pin.city).width;
        ctx.fillStyle = 'rgba(25,20,18,0.90)';
        ctx.fillRect(px - tw / 2 - 4, py + 6 * sf, tw + 8, 12 * sf);
        ctx.fillStyle = '#F5F2F0';
        ctx.textAlign = 'center';
        ctx.fillText(pin.city, px, py + 15 * sf);
      });
    }

    state.timer = d3.timer(() => {
      if (!state.drag) {
        state.rot[0] += 0.22;
        proj.rotate(state.rot);
        draw();
      }
    });

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault(); state.drag = true; canvas.style.cursor = 'grabbing';
      const sx = e.clientX, sy = e.clientY, sr = [...state.rot] as [number, number, number];
      const onMove = (e2: MouseEvent) => {
        state.rot[0] = sr[0] + (e2.clientX - sx) * 0.44;
        state.rot[1] = Math.max(-90, Math.min(90, sr[1] - (e2.clientY - sy) * 0.44));
        proj.rotate(state.rot); draw();
      };
      const onUp = () => {
        state.drag = false; canvas.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const onTouchStart = (e: TouchEvent) => {
      state.drag = true;
      const t = e.touches[0], sx = t.clientX, sy = t.clientY, sr = [...state.rot] as [number, number, number];
      const onMove = (te: TouchEvent) => {
        const tt = te.touches[0];
        state.rot[0] = sr[0] + (tt.clientX - sx) * 0.44;
        state.rot[1] = Math.max(-90, Math.min(90, sr[1] - (tt.clientY - sy) * 0.44));
        proj.rotate(state.rot); draw();
      };
      const onEnd = () => {
        state.drag = false;
        canvas.removeEventListener('touchmove', onMove);
        canvas.removeEventListener('touchend', onEnd);
      };
      canvas.addEventListener('touchmove', onMove, { passive: true });
      canvas.addEventListener('touchend', onEnd);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const BASE_R = getSize() / 2.04;
      state.radius = Math.max(BASE_R * 0.5, Math.min(BASE_R * 3.2, state.radius * (e.deltaY > 0 ? 0.91 : 1.1)));
      proj.scale(state.radius); draw();
    };

    const onClick = (e: MouseEvent) => {
      const r2 = canvas.getBoundingClientRect();
      const scaleX = (canvas.width / DPR) / r2.width;
      const scaleY = (canvas.height / DPR) / r2.height;
      pins.forEach(pin => {
        const p = proj([pin.lng, pin.lat]);
        if (!p) return;
        const dx = (e.clientX - r2.left) * scaleX - p[0] / DPR;
        const dy = (e.clientY - r2.top) * scaleY - p[1] / DPR;
        if (dx * dx + dy * dy < 22 * 22) onPinClick(pin);
      });
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);

    fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json')
      .then(r => r.json())
      .then((geo: any) => {
        state.land = geo;
        const STEP = 1.8; // denser dots
        geo.features.forEach((f: any) => {
          try {
            const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
            for (let lng = x0; lng <= x1; lng += STEP)
              for (let lat = y0; lat <= y1; lat += STEP)
                if (ptIn([lng, lat], f)) state.dots.push([lng, lat]);
          } catch { }
        });
      });

    const onResize = () => {
      size();
      proj.translate([state.S * sf / 2, state.S * sf / 2]);
      proj.scale(Math.min(state.radius, state.S / 2.04) * sf);
      draw();
    };
    window.addEventListener('resize', onResize);

    return () => {
      state.timer?.stop();
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
    };
  }, [pins, onPinClick, getSize]);

  return (
    <div ref={wrapRef} className="relative">
      <canvas ref={canvasRef} style={{ borderRadius: '50%', cursor: 'grab', display: 'block' }} />
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap"
        style={{ bottom: '-28px', fontFamily: '"DM Mono"', fontSize: '10px', color: '#8A8275', letterSpacing: '.05em' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-pin" style={{ animation: 'blink 1.8s ease-in-out infinite' }} />
      </div>
    </div>
  );
}
