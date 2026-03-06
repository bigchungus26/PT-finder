import { useEffect, useState } from 'react';

interface BookingSuccessProps {
  trainerName: string;
  date: string;
  time: string;
  responseHours?: number;
  onDismiss: () => void;
  onMessage?: () => void;
  onBack?: () => void;
}

export function BookingSuccess({
  trainerName,
  date,
  time,
  responseHours,
  onDismiss,
  onMessage,
  onBack,
}: BookingSuccessProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: '#0A0A0A',
        opacity: visible ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    >
      {/* Radial burst */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(22,163,74,0.3), transparent)',
          animation: 'successBurst 400ms ease-out both',
        }}
      />

      {/* Circle + checkmark */}
      <div
        className="relative"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#16A34A',
          animation: 'successCircle 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M8 18L15 25L28 11"
            stroke="#000"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 48,
              animation: 'successCheck 400ms ease-out 200ms both',
            }}
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          color: '#F5F0E8',
          marginTop: 24,
          opacity: 0,
          animation: 'fadeIn 300ms ease-out 400ms both',
        }}
      >
        Booked!
      </h2>

      <div
        style={{
          opacity: 0,
          animation: 'fadeIn 300ms ease-out 600ms both',
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        <p style={{ color: '#888', fontSize: 15 }}>
          Request sent to <span style={{ color: '#F5F0E8', fontWeight: 600 }}>{trainerName}</span>
        </p>
        <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
          {date} at {time}
        </p>
        {responseHours && (
          <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
            They usually respond in ~{responseHours} hours
          </p>
        )}
      </div>

      <div
        className="flex gap-3 mt-8"
        style={{
          opacity: 0,
          animation: 'fadeIn 300ms ease-out 800ms both',
        }}
      >
        {onMessage && (
          <button
            onClick={onMessage}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: '#16A34A',
              color: '#000',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 14,
            }}
            className="active:scale-[0.96] transition-transform"
          >
            Message {trainerName.split(' ')[0]}
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid #2A2A2A',
              color: '#888',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
              fontSize: 14,
            }}
            className="active:scale-[0.96] transition-transform"
          >
            Back to Discover
          </button>
        )}
      </div>
    </div>
  );
}
