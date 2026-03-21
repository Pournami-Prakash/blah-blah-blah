import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { addJournalEntry } from '../../api/client';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function todayStr() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function JournalModal({ isOpen, onClose }: JournalModalProps) {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [city, setCity]       = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const fullEntry = title.trim()
        ? `${title.trim()}\n\n${content.trim()}`
        : content.trim();
      await addJournalEntry(fullEntry, city.trim() || undefined);
      setSuccess(true);
      setTimeout(() => {
        setTitle(''); setContent(''); setCity('');
        setSuccess(false); onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !loading;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="520px">
      <style>{`
        .journal-modal-bg {
          background-image: repeating-linear-gradient(
            transparent, transparent 27px,
            rgba(42,36,32,0.055) 27px, rgba(42,36,32,0.055) 28px
          );
          background-size: 100% 28px;
          background-position: 0 32px;
        }
      `}</style>

      <div style={{ overflowY: 'auto', flex: 1 }}>

        {/* Journal header — date strip */}
        <div style={{
          background: '#2A2420',
          padding: '16px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(247,243,238,0.45)', margin: '0 0 3px', textTransform: 'lowercase' }}>
              journal entry
            </p>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '13px', color: '#F7F3EE', margin: 0, opacity: 0.8 }}>
              {todayStr()}
            </p>
          </div>
          <span style={{ fontSize: '22px', opacity: 0.7 }}>📓</span>
        </div>

        {/* Paper area */}
        <div className="journal-modal-bg" style={{ padding: '24px 26px 32px' }}>

          {/* Optional title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="title (optional)…"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '18px',
              color: '#1A1410',
              padding: '0 0 4px',
              marginBottom: '6px',
              borderBottom: title ? '1px solid rgba(42,36,32,0.12)' : '1px solid transparent',
              caretColor: '#E8543A',
              lineHeight: '28px',
            }}
          />

          {/* Main textarea */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="write freely. no one is watching."
            rows={8}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '16px',
              color: '#2A2420',
              lineHeight: '28px',
              padding: '0',
              caretColor: '#E8543A',
            }}
          />

          {/* Footer row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            borderTop: '1px solid rgba(42,36,32,0.07)',
            paddingTop: '14px',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="📍 written from… (optional)"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: '"DM Mono", monospace',
                fontSize: '10px',
                color: '#9A8A7A',
                letterSpacing: '0.06em',
                flex: 1,
                minWidth: '120px',
              }}
            />
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#C8B8A8', letterSpacing: '0.08em', flexShrink: 0 }}>
              {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : ''}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%',
              marginTop: '18px',
              background: success ? '#5A9A68' : '#2A2420',
              color: '#F7F3EE',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.4,
              transition: 'background 0.3s, transform 0.18s, opacity 0.2s',
              fontFamily: '"DM Sans", sans-serif',
            }}
            onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {success ? '✓ added to the journal' : loading ? 'writing…' : 'add to the journal'}
          </button>

        </div>
      </div>
    </BottomSheet>
  );
}
