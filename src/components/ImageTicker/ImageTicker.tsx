import { useEffect, useState } from 'react';

/**
 * Loads the Framer ImageTicker component dynamically.
 * A 3-column tilting photo ticker — used as a visual header on the wall page.
 * Falls back gracefully if the module can't load.
 */

// Warm lifestyle images that match the site aesthetic
const COL1 = [
  { src: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&q=80' },
];
const COL2 = [
  { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=400&q=80' },
];
const COL3 = [
  { src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&q=80' },
  { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80' },
];

export default function ImageTicker() {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
    dynamicImport('https://framer.com/m/ImageTicker-OpxX.js@CUSrxsDg9LLNkaYhFzCU')
      .then((mod: any) => {
        const C = mod.default ?? Object.values(mod).find((v: any) => typeof v === 'function');
        if (C) setComponent(() => C as React.ComponentType<any>);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  // Fallback: simple scrolling strip while Framer loads or if it fails
  if (failed || !Component) {
    return (
      <div style={{
        width: '100%', height: failed ? '180px' : '0px',
        overflow: 'hidden', display: 'flex', alignItems: 'center',
        gap: '12px', padding: failed ? '20px 0' : 0,
        transition: 'height 0.3s ease',
      }}>
        {failed && [...COL1, ...COL2, ...COL3].slice(0, 6).map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt=""
            style={{
              height: '140px',
              width: '100px',
              objectFit: 'cover',
              borderRadius: '10px',
              flexShrink: 0,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '420px', overflow: 'hidden' }}>
      <Component
        style={{ width: '100%', height: '100%' }}
        width="100%"
        height={420}
        // Common Framer ImageTicker prop patterns
        column1={COL1}
        column2={COL2}
        column3={COL3}
        images1={COL1}
        images2={COL2}
        images3={COL3}
        images={[...COL1, ...COL2, ...COL3]}
        tiltAngle={8}
        speed={30}
        gap={12}
        borderRadius={12}
      />
    </div>
  );
}
