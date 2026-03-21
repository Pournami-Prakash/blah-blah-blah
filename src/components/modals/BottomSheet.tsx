import { useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion';

interface BottomSheetProps {
  isOpen:   boolean;
  onClose:  () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

// Tight bouncy spring — Emil Kowalski style
const SPRING = { type: 'spring', stiffness: 380, damping: 28 } as const;
const SPRING_SLOW = { type: 'spring', stiffness: 280, damping: 32 } as const;

export default function BottomSheet({ isOpen, onClose, children, maxWidth = '600px' }: BottomSheetProps) {
  // y tracks how far the sheet has been dragged down
  const rawY   = useMotionValue(0);
  // Smooth the y value so derived effects don't jitter
  const smoothY = useSpring(rawY, { stiffness: 300, damping: 40 });

  // Backdrop fades from full opacity → 0 as sheet drags down 0 → 250px
  const backdropAlpha  = useTransform(smoothY, [0, 250], [1, 0]);
  // Sheet scales very slightly inward as it's dragged (depth illusion)
  const sheetScale     = useTransform(smoothY, [0, 300], [1, 0.97]);
  // Handle pill stretches as dragged
  const handleScaleX   = useTransform(smoothY, [0, 80],  [1, 1.5]);
  const handleOpacity  = useTransform(smoothY, [0, 200], [1, 0.4]);

  useEffect(() => {
    if (isOpen) {
      rawY.set(0); // reset drag position on open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, rawY]);

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          style={{
            opacity:         backdropAlpha,
            position:        'fixed',
            inset:           0,
            background:      'rgba(42,36,32,.30)',
            backdropFilter:  'blur(4px)',
            zIndex:          200,
            display:         'flex',
            alignItems:      'flex-end',
            justifyContent:  'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          {/* Sheet panel */}
          <motion.div
            onClick={e => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.25 }}
            style={{
              y:             rawY,
              scale:         sheetScale,
              background:    'var(--bg-sheet)',
              borderRadius:  '22px 22px 0 0',
              width:         '100%',
              maxWidth,
              maxHeight:     '90vh',
              display:       'flex',
              flexDirection: 'column',
              overflow:      'hidden',
              cursor:        'grab',
              transformOrigin: 'bottom center',
              /* Subtle top border for depth */
              boxShadow: '0 -2px 0 rgba(255,255,255,0.6), 0 -24px 60px rgba(42,36,32,0.20)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%', transition: SPRING_SLOW }}
            transition={SPRING}
            onDragStart={() => { rawY.set(0); }}
            onDragEnd={(_, info) => {
              // Dismiss if dragged far enough OR flicked fast enough
              if (info.offset.y > 130 || info.velocity.y > 450) {
                onClose();
              } else {
                // Spring back
                rawY.set(0);
              }
            }}
          >
            {/* Drag handle + close button row */}
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding:    '14px 16px 6px',
                flexShrink: 0,
                cursor:     'grab',
                touchAction:'none',
                position:   'relative',
              }}
            >
              {/* Pill */}
              <motion.div
                style={{
                  scaleX:       handleScaleX,
                  opacity:      handleOpacity,
                  width:        '36px',
                  height:       '4px',
                  background:   '#C8B8A8',
                  borderRadius: '2px',
                }}
                whileHover={{ scaleX: 1.35, background: '#B0A090' }}
                whileTap={{ scaleX: 1.7, scaleY: 1.4 }}
                transition={SPRING}
              />

              {/* Close button — top-right, always visible */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.15, color: '#E8543A' }}
                whileTap={{ scale: 0.88 }}
                transition={SPRING}
                style={{
                  position:   'absolute',
                  right:      '16px',
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    '4px',
                  fontFamily: '"DM Mono", monospace',
                  fontSize:   '16px',
                  color:      '#C8B8A8',
                  lineHeight: 1,
                  display:    'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                aria-label="Close"
              >
                ✕
              </motion.button>
            </div>

            {/* Scrollable content — cursor back to normal */}
            <div style={{ flex: 1, overflowY: 'auto', cursor: 'default' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
