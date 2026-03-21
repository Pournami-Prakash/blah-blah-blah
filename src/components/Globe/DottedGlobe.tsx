import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Pin } from '../../types';

interface DottedGlobeProps {
  pins?: Pin[];
  onPinClick?: (pin: Pin) => void;
  size?: number; // diameter in px; if omitted, auto from viewport
}

function ptInFeature(pt: [number, number], feature: any): boolean {
  const { type, coordinates } = feature.geometry;
  const rings: [number, number][][] = type === 'Polygon' ? coordinates : type === 'MultiPolygon' ? coordinates.flat() : [];
  if (!rings.length) return false;
  const inRing = (r: [number, number][]) => {
    let inside = false;
    const [x, y] = pt;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  if (type === 'Polygon') {
    if (!inRing(coordinates[0])) return false;
    return !coordinates.slice(1).some(inRing);
  }
  return coordinates.some((poly: [number, number][][]) => inRing(poly[0]) && !poly.slice(1).some(inRing));
}

export default function DottedGlobe({ pins = [], onPinClick, size }: DottedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pinsRef = useRef(pins);
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => { pinsRef.current = pins; }, [pins]);
  useEffect(() => { onPinClickRef.current = onPinClick; }, [onPinClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const getS = () => size ?? Math.floor(Math.min(window.innerWidth * 0.52, window.innerHeight * 0.74));
    let S = getS();
    let radius = S / 2.04;

    function setSize() {
      S = getS();
      radius = S / 2.04;
      canvas!.width = S * dpr;
      canvas!.height = S * dpr;
      canvas!.style.width = S + 'px';
      canvas!.style.height = S + 'px';
    }
    setSize();

    const proj = d3.geoOrthographic()
      .translate([S * dpr / 2, S * dpr / 2])
      .scale(radius * dpr)
      .rotate([0, -20, 0])
      .clipAngle(90);

    const geoPath = d3.geoPath().projection(proj).context(ctx);
    const rot: [number, number, number] = [0, -20, 0];
    let drag = false;
    let land: any = null;
    const dots: [number, number][] = [];

    function draw() {
      ctx!.clearRect(0, 0, S * dpr, S * dpr);
      const cx = S * dpr / 2, cy = S * dpr / 2;
      const r = proj.scale();

      // Globe sphere
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx!.fillStyle = '#0D0D0D';
      ctx!.fill();

      // Outer ring
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx!.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx!.lineWidth = 1.5 * dpr;
      ctx!.stroke();

      if (land) {
        // Graticule
        const grat = d3.geoGraticule()();
        ctx!.beginPath(); geoPath(grat);
        ctx!.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx!.lineWidth = 0.8 * dpr;
        ctx!.stroke();

        // Land outlines
        ctx!.beginPath();
        land.features.forEach((f: any) => geoPath(f));
        ctx!.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx!.lineWidth = 0.7 * dpr;
        ctx!.stroke();

        // Halftone dots
        dots.forEach(([lng, lat]) => {
          const p = proj([lng, lat]);
          if (!p || p[0] < 0 || p[0] > S * dpr || p[1] < 0 || p[1] > S * dpr) return;
          ctx!.beginPath();
          ctx!.arc(p[0], p[1], 1.0 * dpr, 0, 2 * Math.PI);
          ctx!.fillStyle = 'rgba(200,200,200,0.7)';
          ctx!.fill();
        });
      }

      // City pins
      pinsRef.current.forEach(pin => {
        const p = proj([pin.lng, pin.lat]);
        if (!p) return;
        const [px, py] = p;
        const edge = 10 * dpr;
        if (px < edge || px > S * dpr - edge || py < edge || py > S * dpr - edge) return;

        // Glow
        ctx!.beginPath(); ctx!.arc(px, py, 11 * dpr, 0, 2 * Math.PI);
        ctx!.fillStyle = 'rgba(100,220,100,0.08)'; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(px, py, 6 * dpr, 0, 2 * Math.PI);
        ctx!.fillStyle = 'rgba(100,220,100,0.20)'; ctx!.fill();

        // Dot
        ctx!.beginPath(); ctx!.arc(px, py, 3.2 * dpr, 0, 2 * Math.PI);
        ctx!.fillStyle = '#6FD46F'; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(px, py, 1.3 * dpr, 0, 2 * Math.PI);
        ctx!.fillStyle = '#FFFFFF'; ctx!.fill();

        // Label
        ctx!.font = `${8.5 * dpr}px "DM Sans",sans-serif`;
        const tw = ctx!.measureText(pin.city).width;
        ctx!.fillStyle = 'rgba(15,15,15,0.88)';
        const lh = 12 * dpr, lpad = 4;
        ctx!.fillRect(px - tw / 2 - lpad, py + 6 * dpr, tw + lpad * 2, lh);
        ctx!.fillStyle = '#E8E8E8';
        ctx!.textAlign = 'center';
        ctx!.fillText(pin.city, px, py + 6 * dpr + lh * 0.76);
        ctx!.textAlign = 'left';
      });
    }

    const timer = d3.timer(() => {
      if (!drag) { rot[0] += 0.2; proj.rotate(rot); draw(); }
    });

    // Mouse drag
    canvas.addEventListener('mousedown', e => {
      e.preventDefault(); drag = true; canvas.style.cursor = 'grabbing';
      const sx = e.clientX, sy = e.clientY, sr = [...rot] as [number, number, number];
      const mm = (e2: MouseEvent) => {
        rot[0] = sr[0] + (e2.clientX - sx) * 0.44;
        rot[1] = Math.max(-90, Math.min(90, sr[1] - (e2.clientY - sy) * 0.44));
        proj.rotate(rot); draw();
      };
      const mu = () => {
        drag = false; canvas.style.cursor = 'grab';
        document.removeEventListener('mousemove', mm);
        document.removeEventListener('mouseup', mu);
      };
      document.addEventListener('mousemove', mm);
      document.addEventListener('mouseup', mu);
    });

    // Touch drag
    canvas.addEventListener('touchstart', e => {
      drag = true;
      const t = e.touches[0], sx = t.clientX, sy = t.clientY, sr = [...rot] as [number, number, number];
      const tm = (te: TouchEvent) => {
        const tt = te.touches[0];
        rot[0] = sr[0] + (tt.clientX - sx) * 0.44;
        rot[1] = Math.max(-90, Math.min(90, sr[1] - (tt.clientY - sy) * 0.44));
        proj.rotate(rot); draw();
      };
      const tu = () => {
        drag = false;
        canvas.removeEventListener('touchmove', tm);
        canvas.removeEventListener('touchend', tu);
      };
      canvas.addEventListener('touchmove', tm, { passive: true });
      canvas.addEventListener('touchend', tu);
    }, { passive: true });

    // Zoom
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const base = getS() / 2.04 * dpr;
      const next = Math.max(base * 0.5, Math.min(base * 3.2, proj.scale() * (e.deltaY > 0 ? 0.91 : 1.1)));
      proj.scale(next); draw();
    }, { passive: false });

    // Pin click
    canvas.addEventListener('click', e => {
      if (!onPinClickRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * dpr;
      const my = (e.clientY - rect.top) * dpr;
      pinsRef.current.forEach(pin => {
        const p = proj([pin.lng, pin.lat]);
        if (!p) return;
        const dx = mx - p[0], dy = my - p[1];
        if (dx * dx + dy * dy < (20 * dpr) ** 2) onPinClickRef.current!(pin);
      });
    });

    // Load geo data + generate dots
    fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json')
      .then(r => r.json())
      .then(geo => {
        land = geo;
        geo.features.forEach((f: any) => {
          try {
            const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
            for (let lng = x0; lng <= x1; lng += 2.5)
              for (let lat = y0; lat <= y1; lat += 2.5)
                if (ptInFeature([lng, lat], f)) dots.push([lng, lat]);
          } catch { }
        });
        draw();
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // Resize
    const onResize = () => {
      setSize();
      proj.translate([S * dpr / 2, S * dpr / 2]);
      proj.scale(radius * dpr);
      draw();
    };
    window.addEventListener('resize', onResize);
    canvas.style.cursor = 'grab';

    return () => {
      timer.stop();
      window.removeEventListener('resize', onResize);
    };
  }, [size]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
          fontFamily: '"Playfair Display",serif', fontStyle: 'italic',
          fontSize: 13, color: '#8A7A6A', background: '#0D0D0D',
          pointerEvents: 'none', zIndex: 1,
        }}>
          loading the world…
        </div>
      )}
      <canvas ref={canvasRef} style={{ borderRadius: '50%', display: 'block' }} />
    </div>
  );
}
