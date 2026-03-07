import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'animate' | 'fadeout' | 'done'>('animate');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 1800);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: '#0A0A0A',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 400ms ease',
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(36px, 10vw, 56px)',
          letterSpacing: '0.15em',
          color: '#F5F0E8',
          animation: 'splash-wordmark 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        KOTCH
      </div>

      <div
        style={{
          width: 40,
          height: 2,
          background: '#16A34A',
          marginTop: 16,
          transformOrigin: 'left',
          animation: 'splash-line 400ms ease-out 200ms both',
        }}
      />

      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 13,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: '#666',
          marginTop: 16,
          animation: 'splash-tagline 300ms ease-out 500ms both',
        }}
      >
        Find your trainer. Build your body.
      </div>
    </div>
  );
}
