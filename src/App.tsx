import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Wall = lazy(() => import('./pages/Wall'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const CityPage = lazy(() => import('./pages/CityPage'));
const PostPage = lazy(() => import('./pages/PostPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', color: '#715B4A' }}>gathering the scraps…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/city/:cityName" element={<CityPage />} />
          <Route path="/whisper/:postId" element={<PostPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
