import { useEffect, useState } from 'react';

/**
 * Loads the Framer DotOrbit component as a full-screen background.
 * Uses a dynamic import so Vite doesn't try to bundle the external URL.
 * Falls back to nothing if the load fails.
 */
export default function DotOrbitBg() {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Use new Function to bypass both TypeScript and Vite static analysis
    const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
    dynamicImport('https://framer.com/m/DotOrbit-Hr42.js@4qsg4Vw0IltefxxaFRCp')
      .then((mod: any) => {
        // Framer components export as default, or sometimes as the first named export
        const C = mod.default ?? Object.values(mod).find((v: any) => typeof v === 'function');
        if (C) setComponent(() => C as React.ComponentType<any>);
      })
      .catch(() => {
        // Silently fail — page still works without the background
      });
  }, []);

  if (!Component) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Component
        style={{ width: '100%', height: '100%' }}
        width="100%"
        height="100%"
      />
    </div>
  );
}
