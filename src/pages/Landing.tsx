import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

const STATS = [
  { number: '47', label: 'Verified Trainers' },
  { number: '3', label: 'Cities in Lebanon' },
  { number: '0', label: 'Free to Browse', prefix: '' },
];

const Landing = () => {
  const [statIndex, setStatIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setStatIndex((prev) => (prev + 1) % STATS.length);
        setAnimating(false);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentStat = STATS[statIndex];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#0A0A0A' }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22, 163, 74, 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(22, 163, 74, 0.08) 0%, transparent 60%),
            #0A0A0A
          `,
        }}
      />

      {/* Watermark K */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: -40,
          right: -40,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 900,
          fontSize: 400,
          color: 'rgba(255,255,255,0.03)',
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        K
      </div>

      {/* Hero zone (top 65%) */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          minHeight: '65vh',
          paddingTop: `calc(24px + var(--sat))`,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: '0.15em',
            color: '#F5F0E8',
          }}
        >
          KOTCH
        </div>

        {/* Stat counter */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            style={{
              transition: 'opacity 400ms ease, transform 400ms ease',
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(-30px)' : 'translateY(0)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(48px, 12vw, 72px)',
                lineHeight: 1.15,
                color: '#F5F0E8',
              }}
            >
              {currentStat.number === '0' ? 'Free' : currentStat.number}
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#888',
                fontWeight: 400,
                marginTop: 4,
              }}
            >
              {currentStat.label}
            </div>
          </div>

          {/* Green separator */}
          <div
            style={{
              width: 40,
              height: 2,
              background: '#16A34A',
              marginTop: 24,
            }}
          />
        </div>
      </div>

      {/* Action zone (bottom 35%) */}
      <div
        className="relative"
        style={{
          padding: '32px 24px',
          paddingBottom: `calc(32px + var(--sab))`,
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: '#F5F0E8',
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          Find your perfect
          <br />
          personal trainer
        </h2>
        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.5, marginBottom: 24 }}>
          Browse verified trainers in Lebanon. Book sessions and crush your fitness goals.
        </p>

        {/* Primary CTA */}
        <Link
          to="/onboarding"
          className="flex items-center justify-center gap-2 w-full active:scale-[0.96] transition-transform"
          style={{
            height: 52,
            borderRadius: 14,
            background: '#16A34A',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: '#000',
            marginBottom: 12,
          }}
        >
          Get Started
          <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>

        {/* Secondary CTA */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full active:scale-[0.96] transition-transform"
          style={{
            height: 52,
            borderRadius: 14,
            background: 'transparent',
            border: '1px solid #2A2A2A',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: '#888',
          }}
        >
          I already have an account
        </Link>

        {/* Browse link */}
        <Link
          to="/discover-preview"
          className="flex items-center justify-center gap-1 w-full mt-4 active:opacity-70"
          style={{
            fontSize: 13,
            color: '#16A34A',
            fontWeight: 500,
          }}
        >
          Browse trainers first — no account needed
          <ChevronRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  );
};

export default Landing;
