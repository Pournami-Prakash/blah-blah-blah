import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

interface TypewriterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THOUGHT_TYPES = [
  { key: 'feeling',     label: 'feeling',       color: '#C84848' },
  { key: 'question',    label: 'question',       color: '#4868C8' },
  { key: 'realization', label: 'realization',    color: '#488050' },
  { key: 'observation', label: 'observation',    color: '#8048A8' },
  { key: 'rant',        label: 'rant',           color: '#C87830' },
  { key: 'memory',      label: 'memory',         color: '#3888A8' },
];

const PROMPTS = [
  'something you noticed but didn\'t say',
  'a thing you keep thinking about',
  'what\'s actually going on with you right now',
  'something that keeps coming back',
  'the honest version of how you feel',
  'a thought you\'d never say out loud',
];

export default function TypewriterModal({ isOpen, onClose }: TypewriterModalProps) {
  const [content, setContent]     = useState('');
  const [city, setCity]           = useState('');
  const [thoughtType, setType]    = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [promptIdx]               = useState(() => Math.floor(Math.random() * PROMPTS.length));

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canSubmit = content.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await createPost({
        type: 'typewriter',
        content: content.trim(),
        tags: thoughtType ? [thoughtType] : undefined,
        location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
      } as Parameters<typeof createPost>[0]);
      setSuccess(true);
      setTimeout(() => {
        setContent(''); setCity(''); setType('');
        setSuccess(false); onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const activeType = THOUGHT_TYPES.find(t => t.key === thoughtType);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <style>{`
        @keyframes cursor-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        .typewriter-cursor::after {
          content: '|';
          animation: cursor-blink 1.1s steps(1) infinite;
          color: #E8543A;
          margin-left: 1px;
          font-weight: 300;
        }
      `}</style>

      <div style={{ padding: '28px 26px 36px', overflowY: 'auto', flex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#C8B8A8', margin: '0 0 4px', textTransform: 'lowercase' }}>
            💭 random thought
          </p>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#1A1410', margin: '0 0 6px' }}>
            just thinking out loud
          </h2>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#C8B8A8', margin: 0, letterSpacing: '0.06em' }}>
            {PROMPTS[promptIdx]}
          </p>
        </div>

        {/* Thought type selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
          {THOUGHT_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setType(thoughtType === t.key ? '' : t.key)}
              style={{
                background: thoughtType === t.key ? t.color : 'transparent',
                color: thoughtType === t.key ? '#FFFFFF' : '#9A8A7A',
                border: `1px solid ${thoughtType === t.key ? t.color : 'rgba(42,36,32,0.15)'}`,
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '11px',
                fontFamily: '"DM Mono", monospace',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.05em',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main textarea — raw & minimal */}
        <div style={{
          position: 'relative',
          marginBottom: '16px',
        }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`${PROMPTS[promptIdx]}…`}
            rows={7}
            style={{
              width: '100%',
              background: '#FAFAF8',
              border: `1.5px solid ${activeType ? `${activeType.color}30` : '#EAE4DC'}`,
              borderRadius: '14px',
              padding: '16px 18px',
              fontFamily: '"DM Mono", monospace',
              fontSize: '14px',
              color: '#1A1410',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.75,
              caretColor: '#E8543A',
              transition: 'border-color 0.2s',
              letterSpacing: '0.01em',
            }}
            onFocus={e => {
              (e.target as HTMLElement).style.borderColor = activeType ? `${activeType.color}55` : 'rgba(42,36,32,0.20)';
            }}
            onBlur={e => {
              (e.target as HTMLElement).style.borderColor = activeType ? `${activeType.color}30` : '#EAE4DC';
            }}
          />
          {/* Word + char counter */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '14px',
            fontFamily: '"DM Mono", monospace',
            fontSize: '9px',
            color: '#C8B8A8',
            letterSpacing: '0.06em',
            pointerEvents: 'none',
          }}>
            {wordCount > 0 && `${wordCount}w`}
          </div>
        </div>

        {/* City */}
        <div style={{ marginBottom: '22px' }}>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="📍 thinking from where? (optional)"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(42,36,32,0.08)',
              outline: 'none',
              padding: '6px 0',
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: '#8A7A6A',
              letterSpacing: '0.06em',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.22)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.08)'; }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
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
          {success ? '💭 thought released into the world' : loading ? 'sending…' : 'put it out there'}
        </button>

      </div>
    </BottomSheet>
  );
}
