import { useRef, useCallback, useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = currentY.current - startY.current;
    if (diff > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    startY.current = 0;
    currentY.current = 0;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bottom-sheet-scrim"
        style={{
          animation: 'fadeIn 200ms ease both',
        }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0"
        style={{
          maxHeight: '90vh',
          background: '#111111',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 'var(--sab)',
          animation: 'sheetSlideUp 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
          overflow: 'hidden',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div
            style={{
              width: 36,
              height: 4,
              background: '#333',
              borderRadius: 2,
            }}
          />
        </div>
        {title && (
          <div className="px-5 pb-3">
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#F5F0E8',
              }}
            >
              {title}
            </h3>
          </div>
        )}
        <div
          className="overflow-y-auto scroll-container"
          style={{
            maxHeight: 'calc(90vh - 60px)',
            padding: '0 20px 20px',
          }}
        >
          {children}
        </div>
      </div>
      <style>{`
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
