import { useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from 'framer-motion';

interface BottomSheetProps {
  isOpen:    boolean;
  onClose:   () => void;
  children:  React.ReactNode;
  maxWidth?: string;
}

const SPRING      = { type: 'spring', stiffness: 380, damping: 30 } as const;
const SPRING_EXIT = { type: 'spring', stiffness: 300, damping: 35 } as const;

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  maxWidth = '600px',
}: BottomSheetProps) {
  const rawY = useMotionValue(0);

  const sheetScale    = useTransform(rawY, [0, 300], [1, 0.97]);
  const handleScaleX  = useTransform(rawY, [0, 80],  [1, 1.5]);
  const handleOpacity = useTransform(rawY, [0, 200], [1, 0.4]);

  useEffect(() => {
    if (isOpen) {
      rawY.set(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, rawY]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — simple fade only, no drag MotionValue */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position:   'fixed',
              inset:       0,
              background: 'rgba(42,36,32,0.32)',
              zIndex:      200,
            }}
          />

          {/* Blur layer — separate div so blur doesn't repaint with opacity */}
          <motion.div
            key="blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position:            'fixed',
              inset:                0,
              backdropFilter:      'blur(4px)',
              WebkitBackdropFilter:'blur(4px)',
              zIndex:               200,
              pointerEvents:       'none',
            }}
          />

          {/* Sheet panel */}
          <motion.div
            key="sheet"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.25 }}
            style={{
              y:               rawY,
              scale:           sheetScale,
              position:        'fixed',
              bottom:          0,
              left:            '50%',
              x:               '-50%',
              width:           '100%',
              maxWidth,
              maxHeight:       '90vh',
              display:         'flex',
              flexDirection:   'column',
              background:      'var(--bg-sheet)',
              borderRadius:    '22px 22px 0 0',
              boxShadow:       '0 -2px 0 rgba(255,255,255,0.6), 0 -24px 60px rgba(42,36,32,0.20)',
              zIndex:          201,
              overflow:        'hidden',
              cursor:          'grab',
              transformOrigin: 'bottom center',
              willChange:      'transform',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%', transition: SPRING_EXIT }}
            transition={SPRING}
            onClick={e => e.stopPropagation()}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 450) {
                onClose();
              } else {
                rawY.set(0);
              }
            }}
          >
            {/* Handle + close row */}
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '14px 16px 6px',
                flexShrink:      0,
                position:       'relative',
                touchAction:    'none',
              }}
            >
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
                  lineHeight:  1,
                  display:    'flex',
                  alignItems: 'center',
                }}
                aria-label="Close"
              >
                ✕
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', cursor: 'default' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
