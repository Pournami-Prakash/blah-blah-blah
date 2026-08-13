# whisper. — Anonymous Globe-Based Sharing Platform

A beautiful, minimalist frontend for sharing anonymous whispers, moments, and recommendations across the globe.

## Project Structure

```
whisper-frontend/
├── public/                          # Static assets
│   └── favicon.svg
├── src/
│   ├── api/                         # API client with mock fallback
│   │   └── client.ts
│   ├── components/
│   │   ├── Globe/                   # D3 canvas globe with pins
│   │   │   └── Globe.tsx
│   │   ├── Floaties/                # Animated floating UI elements
│   │   │   └── Floaties.tsx
│   │   ├── Nav/                     # Shared navigation bar
│   │   │   └── SharedNav.tsx
│   │   ├── feed/                    # Feed and wall components
│   │   │   ├── CityFeed.tsx         # City-specific feed
│   │   │   ├── WhisperWall.tsx      # Global feed
│   │   │   └── cards/               # Post type card components
│   │   │       ├── LetterCard.tsx
│   │   │       ├── PolaroidCard.tsx
│   │   │       ├── TypewriterCard.tsx
│   │   │       ├── CafeCard.tsx
│   │   │       ├── JournalCard.tsx
│   │   │       └── ActivityCard.tsx
│   │   ├── journal/                 # Open journal
│   │   │   └── SharedJournal.tsx
│   │   └── modals/                  # Compose modals
│   │       ├── BottomSheet.tsx      # Base modal component
│   │       ├── ComposeModal.tsx     # Three-kind selector
│   │       ├── ComposeStack.tsx     # Shared compose flow
│   │       ├── ThoughtComposer.tsx  # All text styles
│   │       ├── RecommendationComposer.tsx
│   │       ├── PolaroidModal.tsx
│   ├── data/
│   │   └── mock.ts                  # Mock data for development
│   ├── hooks/
│   │   └── useModal.ts              # Modal state management
│   ├── pages/                       # Route pages
│   │   ├── Home.tsx                 # Main globe page
│   │   ├── Wall.tsx                 # Explore/feed page
│   │   ├── JournalPage.tsx          # Journal page
│   │   └── CityPage.tsx             # City-specific page
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Router setup
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles and animations
├── index.html                       # HTML template
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite build config
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind CSS config
└── postcss.config.js                # PostCSS config
```

## Setup

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```
Starts dev server at http://localhost:5173

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## Design System

### Colors
- **Background**: `#F7F3EE` (warm cream)
- **Dark**: `#2A2420` (near-black)
- **Muted**: `#8A7A6A` (soft brown-grey)
- **Border**: `#E8E0D4` (light warm)
- **Input**: `#EDE8DF` (cream variant)
- **Pin**: `#7A9A70` (globe green)
- **Globe**: `#60A060` (brighter green)

### Typography
- **Playfair Display**: Serif italic titles
- **DM Sans**: Body and UI text
- **DM Mono**: Monospace labels and counters
- **Caveat**: Handwriting-style compose text

### Components
- Rounded corners: 8px, 12px, 16px, 24px
- Shadows: Subtle (0 2px 8px) to elevated (0 4px 16px)
- Animations: Drift, blink, spark

## Features

### Simple content model

Visitors choose from three clear kinds of contribution:

- **Thought** — quick thought, letter, advice, or journal style
- **Moment** — photo and optional caption
- **Recommendation** — food/place, movie/series, or activity

The older database `type` values remain as visual styles for backwards compatibility.

### Playful discovery

- “Surprise me” opens a random whisper
- A daily prompt changes once per day
- Cities can be found through the globe or a searchable city list
- Every whisper has a shareable `/whisper/:id` link
- Anonymous safety reports are supported

### Pages

**Home** (`/`)
- Interactive D3 globe with city pins
- Animated floating UI elements (Floaties)
- Click pins to view city feeds
- Click Floaties to start composing

**Wall** (`/wall`)
- Browse all whispers globally
- Filter by type (letter, polaroid, typewriter, café, journal, activity)
- Masonry grid layout

**Journal** (`/journal`)
- Open collaborative journal
- Everyone can contribute anonymously
- Timeline view with location tags
- Journal paper aesthetic
- Reads and writes journal-styled posts from the shared `posts` table

**City** (`/city/:cityName`)
- Whispers from a specific city
- Search-driven discovery

### Post Types

1. **Letter**: Write advice or messages
2. **Polaroid**: Share a photo with caption
3. **Typewriter**: Raw typed thoughts
4. **Café/Place**: Recommend locations
5. **Journal**: Free-write journal entries
6. **Activity**: Suggest things to do

## Key Components

### Globe.tsx
- Canvas-based D3 orthographic projection
- Auto-rotates, pausable on drag
- Mouse/touch rotation, scroll zoom
- Halftone dot fill for landmasses
- Glowing pin markers with city labels
- Loads GeoJSON from Natural Earth

### Floaties.tsx
- 8 animated floating SVG illustrations
- Gentle drift animations
- Hover labels and click handlers
- Positioned around globe area

### Modals
- Bottom sheet UX with spring animations
- Form validation
- Loading and success states
- Mock API with fallback to real endpoints

### Feed Components
- Responsive grid layouts
- Type-specific card styling
- Smooth transitions and hover effects
- Location and like count display

## API Integration

Fully functional API client with mock fallback (VITE_USE_MOCK=true by default).

After the initial schema, apply `supabase/migrations/002_consolidate_content.sql`. It non-destructively copies historical `journal_entries` into `posts` and creates the private `post_reports` table.

### Endpoints (when backend is available)
```
GET /posts          → All posts
POST /posts         → Create post
GET /pins           → City pins
GET /journal        → Journal entries
POST /journal       → Add journal entry
POST /posts/:id/like → Like post
```

## Development

### Environment Variables
Create `.env.local`:
```
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=true
```

### Mock Data
All data is pre-populated in `src/data/mock.ts` including:
- 15 major cities with pins
- 10 diverse posts across all types
- 8 journal entries

## Browser Support
Modern browsers supporting ES2020, Canvas 2D, and CSS Grid/Flexbox.

## Performance
- D3 canvas rendering optimized for smooth 60fps globe
- Lazy component loading via React Router
- CSS animations use GPU acceleration
- Images optimized via Unsplash CDN

## Build Output
Production build (~200KB gzipped):
- Minified React + Router
- D3 library (~250KB uncompressed)
- Framer Motion (~150KB uncompressed)
- Tailwind CSS
