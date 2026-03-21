import { useState, useRef } from 'react';
import BottomSheet from './BottomSheet';
import { createPost } from '../../api/client';

interface PolaroidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PolaroidModal({ isOpen, onClose }: PolaroidModalProps) {
  const [caption, setCaption]     = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState('');
  const [city, setCity]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = evt => setPreview(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageFile) return;
    setLoading(true);
    try {
      await createPost({
        type: 'polaroid',
        imageFile,
        caption: caption.trim() || undefined,
        location: city.trim() ? { city: city.trim(), country: '', lat: 0, lng: 0 } : undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setCaption(''); setImageFile(null); setPreview(''); setCity('');
        setSuccess(false); onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!imageFile && !loading;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <style>{`
        @keyframes photoShake {
          0%,100% { transform: rotate(-1.5deg); }
          50%      { transform: rotate(1.5deg); }
        }
        .polaroid-frame {
          background: #FFFFFF;
          padding: 12px 12px 40px 12px;
          border-radius: 3px;
          box-shadow: 0 4px 24px rgba(42,36,32,0.14), 0 1px 4px rgba(42,36,32,0.08);
          transform: rotate(-1.5deg);
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s;
          cursor: pointer;
          position: relative;
        }
        .polaroid-frame:hover {
          transform: rotate(0deg) scale(1.02);
          box-shadow: 0 10px 40px rgba(42,36,32,0.18);
        }
        .polaroid-frame.has-photo:hover {
          animation: none;
          transform: rotate(0deg) scale(1.02);
        }
        .polaroid-photo {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
          border-radius: 1px;
        }
        .polaroid-empty {
          width: 100%;
          aspect-ratio: 1;
          background: #F4F0E8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 1px;
          border: 2px dashed #DDD4C0;
          transition: border-color 0.18s;
        }
        .polaroid-frame:hover .polaroid-empty {
          border-color: #B0A080;
        }
      `}</style>

      <div style={{ padding: '28px 28px 36px', overflowY: 'auto', flex: 1 }}>

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.16em', color: '#C8B8A8', margin: '0 0 4px', textTransform: 'lowercase' }}>
          📸 a moment
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#1A1410', margin: '0 0 24px' }}>
          anything worth keeping?
        </h2>

        {/* Polaroid frame */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            className={`polaroid-frame${preview ? ' has-photo' : ''}`}
            style={{ width: 'min(280px, 100%)' }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="your photo" className="polaroid-photo" />
            ) : (
              <div className="polaroid-empty">
                <span style={{ fontSize: '32px', marginBottom: '10px' }}>📷</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#B0A080', letterSpacing: '0.06em' }}>
                  tap to add photo
                </span>
              </div>
            )}

            {/* Caption area — the white bottom strip of the polaroid */}
            <div style={{ paddingTop: '10px', minHeight: '28px' }}>
              {preview && (
                <p style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '15px',
                  color: '#4A3820',
                  margin: 0,
                  textAlign: 'center',
                  opacity: caption ? 1 : 0.3,
                }}>
                  {caption || 'write a caption below…'}
                </p>
              )}
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

        {/* Caption */}
        {preview && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="what was this moment? where were you?"
              rows={2}
              style={{
                width: '100%',
                background: '#FDFCFA',
                border: '1px solid #EAE4DC',
                borderRadius: '10px',
                padding: '10px 14px',
                fontFamily: '"Caveat", cursive',
                fontSize: '17px',
                color: '#2A2420',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                caretColor: '#6050C0',
                transition: 'border-color 0.18s',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(96,80,192,0.30)'; }}
              onBlur={e  => { (e.target as HTMLElement).style.borderColor = '#EAE4DC'; }}
            />
          </div>
        )}

        {/* City */}
        <div style={{ marginBottom: '22px' }}>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="📍 where was this? (optional)"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(42,36,32,0.10)',
              outline: 'none',
              padding: '6px 0',
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              color: '#8A7A6A',
              letterSpacing: '0.06em',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(96,80,192,0.25)'; }}
            onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(42,36,32,0.10)'; }}
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
          {success ? '📸 moment saved to the wall' : loading ? 'developing…' : 'share this moment'}
        </button>

      </div>
    </BottomSheet>
  );
}
