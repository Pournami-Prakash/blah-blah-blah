import { useMemo, useState } from 'react';
import BottomSheet from './BottomSheet';
import type { ModalType } from '../../hooks/useModal';
import { getDailyPrompt } from '../../data/prompts';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ModalType) => void;
}

type Choice = { key: Exclude<ModalType, 'compose' | 'cityFeed' | null>; emoji: string; title: string; sub: string };
type Group = { key: string; emoji: string; title: string; sub: string; accent: string; bg: string; choices: Choice[] };

const GROUPS: Group[] = [
  {
    key: 'thought', emoji: '✏️', title: 'a thought', sub: 'words, advice, or a journal line', accent: '#C46B3D', bg: '#FFF5EA',
    choices: [
      { key: 'typewriter', emoji: '💭', title: 'quick thought', sub: 'no context needed' },
      { key: 'letter', emoji: '🦆', title: 'little letter', sub: 'to anyone, anywhere' },
      { key: 'advice', emoji: '👆', title: 'advice or quote', sub: 'something worth passing on' },
      { key: 'journal', emoji: '📓', title: 'journal line', sub: 'a small piece of today' },
    ],
  },
  {
    key: 'moment', emoji: '📷', title: 'a moment', sub: 'one photo and a few words', accent: '#6A61A8', bg: '#F5F2FF',
    choices: [{ key: 'polaroid', emoji: '📸', title: 'add a snapshot', sub: 'photo + optional caption' }],
  },
  {
    key: 'recommendation', emoji: '🗺️', title: 'a recommendation', sub: 'somewhere, something, or what to watch', accent: '#4F8162', bg: '#EFF8F0',
    choices: [
      { key: 'cafe', emoji: '🍜', title: 'food or place', sub: 'a spot worth finding' },
      { key: 'movie', emoji: '🎬', title: 'movie or series', sub: 'something worth watching' },
      { key: 'activity', emoji: '🗺️', title: 'thing to do', sub: 'a tiny adventure' },
    ],
  },
];

export default function ComposeModal({ isOpen, onClose, onSelectType }: ComposeModalProps) {
  const [active, setActive] = useState<string | null>(null);
  const prompt = useMemo(getDailyPrompt, []);
  const group = GROUPS.find(item => item.key === active);

  const pick = (key: Choice['key']) => {
    onClose();
    setActive(null);
    setTimeout(() => onSelectType(key), 100);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { setActive(null); onClose(); }} maxWidth="560px">
      <div style={{ padding: '28px 26px 34px', overflowY: 'auto' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#947C68', margin: '0 0 5px' }}>
          today’s tiny prompt — {prompt}
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '27px', color: '#1A1410', margin: '0 0 22px', lineHeight: 1.2 }}>
          {group ? `what kind of ${group.title.slice(2)}?` : 'what do you want to leave?'}
        </h2>

        {!group ? (
          <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
            {GROUPS.map(item => (
              <button key={item.key} onClick={() => item.choices.length === 1 ? pick(item.choices[0].key) : setActive(item.key)} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', alignItems: 'center', gap: '12px', background: item.bg, border: `1px solid ${item.accent}42`, borderRadius: '14px', padding: '15px 17px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '25px' }}>{item.emoji}</span>
                <span><strong style={{ display: 'block', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '17px', color: '#211914', fontWeight: 600 }}>{item.title}</strong><small style={{ fontFamily: '"DM Sans", sans-serif', color: '#725F50', fontSize: '11px' }}>{item.sub}</small></span>
                <span aria-hidden="true" style={{ color: item.accent }}>→</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button onClick={() => setActive(null)} style={{ border: 0, background: 'transparent', color: '#806B5A', padding: '0 0 12px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '10px' }}>← back to the three kinds</button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {group.choices.map(choice => (
                <button key={choice.key} onClick={() => pick(choice.key)} style={{ background: group.bg, border: `1px solid ${group.accent}42`, borderRadius: '14px', padding: '17px 15px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{choice.emoji}</span>
                  <strong style={{ display: 'block', fontFamily: '"DM Sans", sans-serif', color: '#211914', fontSize: '13px', marginBottom: '3px' }}>{choice.title}</strong>
                  <small style={{ color: '#725F50', fontSize: '10.5px' }}>{choice.sub}</small>
                </button>
              ))}
            </div>
          </>
        )}
        <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '9.5px', color: '#947C68', letterSpacing: '0.08em', margin: 0 }}>anonymous · no account · just leave it here</p>
      </div>
    </BottomSheet>
  );
}
