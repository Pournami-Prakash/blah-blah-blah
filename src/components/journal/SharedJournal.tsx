import { useEffect, useState } from 'react';
import { getJournalEntries, addJournalEntry } from '../../api/client';
import type { JournalEntry } from '../../types';

const PER_PAGE = 6;

// ── Single entry line ─────────────────────────────────────────────────────────
// Both location AND date hidden until hover — no space reserved either.
function EntryLine({ entry, index }: { entry: JournalEntry; index: number }) {
  const [hovered, setHovered] = useState(false);
  const location = entry.city || '';
  const dateStr  = new Date(entry.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid rgba(42,36,32,0.07)',
        opacity: 0,
        animation: `lineFade 0.45s ease ${index * 0.055}s forwards`,
        position: 'relative',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Coral left accent — appears on hover */}
      <div style={{
        position: 'absolute',
        left: '-24px',
        top: '50%',
        transform: `translateY(-50%) scaleY(${hovered ? 1 : 0})`,
        transformOrigin: 'center',
        width: '2px',
        height: '50%',
        background: '#E8543A',
        borderRadius: '2px',
        transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1)',
        opacity: 0.6,
      }} />

      {/* Entry text */}
      <p style={{
        fontFamily: '"Playfair Display", serif',
        fontStyle: 'italic',
        fontSize: 'clamp(14px, 1.3vw, 16.5px)',
        color: hovered ? '#1A1410' : '#2A2420',
        margin: 0,
        lineHeight: 1.72,
        letterSpacing: '-0.01em',
        transition: 'color 0.18s ease',
      }}>
        {entry.content}
      </p>

      {/* Meta — slides in on hover, takes no space when hidden */}
      <div style={{
        overflow: 'hidden',
        maxHeight: hovered ? '20px' : '0px',
        opacity: hovered ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
        marginTop: hovered ? '5px' : '0px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {location && (
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9.5px',
              color: '#E8543A',
              letterSpacing: '0.08em',
              textTransform: 'lowercase',
              opacity: 0.8,
            }}>
              {location}
            </span>
          )}
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '9.5px',
            color: '#B0A090',
            letterSpacing: '0.06em',
          }}>
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Read-only page face ───────────────────────────────────────────────────────
function ReadPage({
  entries,
  pageNum,
  totalPages,
}: {
  entries: JournalEntry[];
  pageNum: number;
  totalPages: number;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '9px',
        color: '#D4C8BC',
        letterSpacing: '0.14em',
        textAlign: 'right',
        marginBottom: '20px',
      }}>
        {pageNum} / {totalPages}
      </div>
      <div style={{ flex: 1 }}>
        {entries.length === 0 ? (
          <p style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: '15px',
            color: '#D4C8BC',
            margin: 0,
          }}>
            nothing here yet.
          </p>
        ) : (
          entries.map((e, i) => <EntryLine key={e.id} entry={e} index={i} />)
        )}
      </div>
    </div>
  );
}

// ── Write page (right side of spread 0) ──────────────────────────────────────
function WritePage({ onAdded }: { onAdded: (e: JournalEntry) => void }) {
  const [content, setContent]     = useState('');
  const [city, setCity]           = useState('');
  const [submitting, setSubmit]   = useState(false);
  const [success, setSuccess]     = useState(false);


  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmit(true);
    try {
      const entry = await addJournalEntry(content.trim(), city.trim() || undefined);
      onAdded(entry);
      setSuccess(true);
      setTimeout(() => {
        setContent(''); setCity(''); setSuccess(false);
      }, 1600);
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Page num placeholder so alignment matches left page */}
      <div style={{ height: '9px', marginBottom: '20px' }} />

      {/* Cute prompt */}
      <p style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '9.5px',
        color: '#C8B8A8',
        letterSpacing: '0.14em',
        textTransform: 'lowercase',
        margin: '0 0 18px 0',
      }}>
        leave something here ✦
      </p>

      {/* Textarea — lined paper feel via repeating gradient */}
      <div style={{
        flex: 1,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(42,36,32,0.06) 27px, rgba(42,36,32,0.06) 28px)',
        backgroundSize: '100% 28px',
        backgroundPosition: '0 4px',
        position: 'relative',
      }}>
        {/* Ghost placeholder — visible only when textarea is empty */}
        {content.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '4px', left: 0, right: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <style>{`
              @keyframes caretBlink {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0; }
              }
            `}</style>
            {/* Blinking caret */}
            <span style={{
              display: 'inline-block',
              width: '1.5px',
              height: '1.1em',
              background: '#E8543A',
              verticalAlign: 'text-bottom',
              marginRight: '3px',
              animation: 'caretBlink 1.1s ease-in-out infinite',
            }} />
            {[
              'something small happened today.',
              'a thought you didn\'t say out loud.',
              'the feeling before the words.',
              'what the sky looked like this morning.',
              'a sentence that\'s been sitting with you.',
            ].map((line, i) => (
              <p key={i} style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(14px, 1.3vw, 16px)',
                color: 'rgba(42,36,32,0.18)',
                lineHeight: '28px',
                margin: 0,
                padding: 0,
              }}>
                {line}
              </p>
            ))}
          </div>
        )}

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder=""
          style={{
            width: '100%',
            height: '100%',
            minHeight: '280px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(14px, 1.3vw, 16px)',
            color: '#2A2420',
            lineHeight: '28px',
            padding: '4px 0 0 0',
            caretColor: '#E8543A',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>

      {/* Location + submit — animate in when content exists */}
      <div style={{
        marginTop: '16px',
        overflow: 'hidden',
        maxHeight: content.length > 0 ? '80px' : '0px',
        opacity: content.length > 0 ? 1 : 0,
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
      }}>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="from where? (optional)"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(42,36,32,0.10)',
            outline: 'none',
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            color: '#8A7A6A',
            letterSpacing: '0.06em',
            padding: '6px 0',
            marginBottom: '12px',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: '"DM Mono", monospace',
            fontSize: '10.5px',
            letterSpacing: '0.08em',
            color: success ? '#5D9A70' : '#E8543A',
            cursor: content.trim() && !submitting ? 'pointer' : 'default',
            opacity: content.trim() && !submitting ? 1 : 0.4,
            transition: 'color 0.2s, opacity 0.2s',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {success ? '✓ added to the journal' : submitting ? 'adding…' : 'add to journal →'}
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SharedJournal() {
  const [entries, setEntries]   = useState<JournalEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [spread, setSpread]     = useState(0);
  const [flipAnim, setFlipAnim] = useState<'idle' | 'fwd' | 'back'>('idle');

  useEffect(() => {
    getJournalEntries().then(setEntries).finally(() => setLoading(false));
  }, []);

  const handleAdded = (entry: JournalEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  // Spread 0: left = entries[0..PER_PAGE-1], right = write form
  // Spread 1+: left = entries[PER_PAGE + (spread-1)*PER_PAGE*2 .. ], right = next PER_PAGE
  const getSpreadEntries = (s: number) => {
    if (s === 0) {
      return { left: entries.slice(0, PER_PAGE), rightIsWrite: true, right: [] as JournalEntry[] };
    }
    const base = PER_PAGE + (s - 1) * PER_PAGE * 2;
    return {
      left: entries.slice(base, base + PER_PAGE),
      rightIsWrite: false,
      right: entries.slice(base + PER_PAGE, base + PER_PAGE * 2),
    };
  };

  const totalReadPages = Math.ceil(Math.max(entries.length, 1) / PER_PAGE);
  const maxSpread      = Math.ceil((totalReadPages - 1) / 2);

  const navigate = (dir: 'fwd' | 'back') => {
    if (flipAnim !== 'idle') return;
    if (dir === 'fwd' && spread >= maxSpread) return;
    if (dir === 'back' && spread <= 0) return;
    setFlipAnim(dir);
    setTimeout(() => setSpread(s => dir === 'fwd' ? s + 1 : s - 1), 240);
    setTimeout(() => setFlipAnim('idle'), 500);
  };

  const { left, rightIsWrite, right } = getSpreadEntries(spread);
  const leftPageNum  = spread === 0 ? 1 : PER_PAGE + (spread - 1) * PER_PAGE * 2;
  const rightPageNum = leftPageNum + 1;
  const totalPages   = Math.max(rightPageNum, totalReadPages + 1);

  return (
    <>
      <style>{`
        @keyframes lineFade {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bookEnter {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes flipFwd {
          0%   { opacity: 1; transform: perspective(1200px) rotateY(0deg);  }
          40%  { opacity: 0; transform: perspective(1200px) rotateY(-28deg); }
          41%  { opacity: 0; transform: perspective(1200px) rotateY(28deg);  }
          100% { opacity: 1; transform: perspective(1200px) rotateY(0deg);  }
        }
        @keyframes flipBack {
          0%   { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
          40%  { opacity: 0; transform: perspective(1200px) rotateY(28deg); }
          41%  { opacity: 0; transform: perspective(1200px) rotateY(-28deg); }
          100% { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
        }
        .jrn-flip-fwd  { animation: flipFwd  0.52s cubic-bezier(.4,0,.2,1) forwards; transform-origin: left center; }
        .jrn-flip-back { animation: flipBack 0.52s cubic-bezier(.4,0,.2,1) forwards; transform-origin: left center; }

        .jrn-nav-btn {
          background: none;
          border: 1px solid rgba(42,36,32,0.12);
          border-radius: 20px;
          padding: 8px 22px;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          letter-spacing: 0.07em;
          color: #8A7A6A;
          cursor: pointer;
          transition: color 0.18s, border-color 0.18s, background 0.18s, transform 0.15s;
        }
        .jrn-nav-btn:hover:not(:disabled) {
          color: #E8543A;
          border-color: rgba(232,84,58,0.30);
          background: rgba(232,84,58,0.05);
          transform: translateY(-1px);
        }
        .jrn-nav-btn:disabled { opacity: 0.22; cursor: default; }

        .jrn-left  { box-shadow: inset -14px 0 20px -6px rgba(42,36,32,0.06); }
        .jrn-right { box-shadow: inset  14px 0 20px -6px rgba(42,36,32,0.06); }

        textarea::placeholder { color: rgba(42,36,32,0.22); font-style: italic; }
        input::placeholder    { color: rgba(42,36,32,0.22); }
      `}</style>

      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '52px 24px 80px',
      }}>

        {/* Label */}
        <div style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '10px',
          color: '#C8B8A8',
          letterSpacing: '0.18em',
          textTransform: 'lowercase',
          marginBottom: '36px',
          animation: 'bookEnter 0.55s ease 0.1s both',
        }}>
          shared journal.
        </div>
        <div style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '9px',
          color: '#B0A090',
          letterSpacing: '0.12em',
          textTransform: 'lowercase',
          marginTop: '-28px',
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          pages written in the quiet
        </div>

        {/* Book */}
        <div style={{
          width: '100%',
          maxWidth: '860px',
          animation: 'bookEnter 0.65s cubic-bezier(.34,1.56,.64,1) 0.15s both',
        }}>
          <div
            style={{
              display: 'flex',
              gap: '1px',
              background: 'rgba(42,36,32,0.07)',
              borderRadius: '2px',
            }}
          >
            {/* LEFT — stays fixed, only right page flips */}
            <div className="jrn-left" style={{
              flex: 1, background: 'var(--bg-sheet)',
              padding: '36px 40px 36px 32px',
              borderRadius: '2px 0 0 2px',
              minHeight: '500px', display: 'flex',
            }}>
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#C8B8A8', letterSpacing: '0.10em' }}>
                    leafing through…
                  </span>
                </div>
              ) : (
                <ReadPage entries={left} pageNum={leftPageNum} totalPages={totalPages} />
              )}
            </div>

            {/* RIGHT — only this page flips, pivoting from spine */}
            <div
              className={`jrn-right${flipAnim === 'fwd' ? ' jrn-flip-fwd' : flipAnim === 'back' ? ' jrn-flip-back' : ''}`}
              style={{
                flex: 1, background: 'var(--bg-sheet-r)',
                padding: '36px 32px 36px 40px',
                borderRadius: '0 2px 2px 0',
                minHeight: '500px', display: 'flex',
              }}
            >
              {rightIsWrite
                ? <WritePage onAdded={handleAdded} />
                : <ReadPage entries={right} pageNum={rightPageNum} totalPages={totalPages} />
              }
            </div>
          </div>

          {/* Nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '24px', padding: '0 2px',
          }}>
            <button className="jrn-nav-btn" onClick={() => navigate('back')} disabled={spread <= 0 || flipAnim !== 'idle'}>
              ← newer
            </button>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#C8B8A8', letterSpacing: '0.10em', textTransform: 'lowercase' }}>
              spread {spread + 1} of {maxSpread + 1}
            </span>
            <button className="jrn-nav-btn" onClick={() => navigate('fwd')} disabled={spread >= maxSpread || flipAnim !== 'idle'}>
              older →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}