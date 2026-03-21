import BottomSheet from './BottomSheet';
import type { ModalType } from '../../hooks/useModal';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ModalType) => void;
}

const OPTIONS = [
  {
    key: 'letter'     as const,
    emoji: '🦆',
    title: 'send a note',
    sub: 'to someone, somewhere, anyone',
    bg: '#FFF8F0', border: '#F0CCAA', accent: '#D4703A',
  },
  {
    key: 'cafe'       as const,
    emoji: '🍜',
    title: 'somewhere to eat',
    sub: 'cafés · trucks · that hidden gem',
    bg: '#FFF5EE', border: '#F0C4A0', accent: '#C05830',
  },
  {
    key: 'polaroid'   as const,
    emoji: '📸',
    title: 'a moment',
    sub: 'photo + caption, no filter needed',
    bg: '#F6F4FF', border: '#CCC4F0', accent: '#6050C0',
  },
  {
    key: 'movie'      as const,
    emoji: '🎬',
    title: 'movies & series',
    sub: 'something worth watching',
    bg: '#F0FFF6', border: '#AADDC0', accent: '#288050',
  },
  {
    key: 'activity'   as const,
    emoji: '🗺️',
    title: 'things to do',
    sub: 'recs from wherever you are',
    bg: '#F0F6FF', border: '#AAC4DD', accent: '#285880',
  },
  {
    key: 'typewriter' as const,
    emoji: '💭',
    title: 'random thought',
    sub: 'no structure, no context needed',
    bg: '#F8F7F5', border: '#D8D0C4', accent: '#504840',
  },
];

export default function ComposeModal({ isOpen, onClose, onSelectType }: ComposeModalProps) {
  const pick = (key: typeof OPTIONS[number]['key']) => {
    onClose();
    setTimeout(() => onSelectType(key), 100);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="520px">
      <div style={{ padding: '28px 26px 36px', overflowY: 'auto' }}>

        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: '#C8B8A8',
          textTransform: 'lowercase',
          margin: '0 0 5px',
        }}>
          hey. listen —
        </p>
        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: '26px',
          color: '#1A1410',
          margin: '0 0 24px',
          lineHeight: 1.2,
        }}>
          what do you want to leave?
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => pick(opt.key)}
              style={{
                background: opt.bg,
                border: `1.5px solid ${opt.border}`,
                borderRadius: '16px',
                padding: '18px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s, border-color 0.15s',
                fontFamily: '"DM Sans", sans-serif',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = `0 8px 28px ${opt.accent}28`;
                el.style.borderColor = opt.accent;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.borderColor = opt.border;
              }}
            >
              <span style={{ fontSize: '22px', display: 'block', marginBottom: '10px', lineHeight: 1 }}>{opt.emoji}</span>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1410', marginBottom: '3px', letterSpacing: '-0.01em' }}>
                {opt.title}
              </span>
              <span style={{ display: 'block', fontSize: '10.5px', color: '#A09080', lineHeight: 1.45 }}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: '"DM Mono", monospace',
          fontSize: '9.5px',
          color: '#C8B8A8',
          letterSpacing: '0.10em',
          margin: 0,
        }}>
          anonymous · no account · just leave it here
        </p>
      </div>
    </BottomSheet>
  );
}
