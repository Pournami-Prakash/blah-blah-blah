import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Home from './pages/Home';
import Wall from './pages/Wall';
import JournalPage from './pages/JournalPage';
import CityPage from './pages/CityPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wall" element={<Wall />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/city/:cityName" element={<CityPage />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  );
}
