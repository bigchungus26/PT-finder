import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Clock, Star, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'All Stores, One App', desc: 'Search across every supplement store in Lebanon.' },
  { icon: Clock, title: 'Fast Delivery', desc: 'Orders delivered in under an hour across Beirut.' },
  { icon: Star, title: 'Authentic Products', desc: 'Only verified stores with genuine supplements.' },
  { icon: ShieldCheck, title: 'Cash on Delivery', desc: 'No card needed. Pay when your order arrives.' },
];

const CATEGORIES = ['🥛 Protein', '💪 Creatine', '⚡ Pre-Workout', '💊 Vitamins', '🔥 Fat Burners', '📈 Mass Gainers'];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ background: '#0A0A0A' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.3)' }}
          >
            🇱🇧 Lebanon's Supplement Store
          </div>

          <h1
            className="text-5xl font-black leading-none tracking-tight mb-4"
            style={{ color: '#F5F0E8', fontFamily: "'Inter', sans-serif" }}
          >
            Stack<span style={{ color: '#16A34A' }}>r</span>
          </h1>

          <p className="text-lg mb-2" style={{ color: '#888', maxWidth: 320 }}>
            Every supplement. Every store. One app.
          </p>
          <p className="text-sm mb-10" style={{ color: '#555', maxWidth: 280 }}>
            Search across Protein Palace, Stack House, NutriZone and more — delivered fast.
          </p>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10 max-w-sm">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 items-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
              style={{ background: '#16A34A', color: '#000' }}
            >
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/browse"
              className="text-sm font-medium"
              style={{ color: '#555' }}
            >
              Browse without account →
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-16" style={{ background: '#0A0A0A' }}>
        <div className="max-w-sm mx-auto grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: '#16A34A' }} />
              <p className="font-semibold text-sm mb-1" style={{ color: '#F5F0E8' }}>{title}</p>
              <p className="text-xs" style={{ color: '#555', lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#333' }}>
          Stackr · Made for Lebanon 🇱🇧
        </p>
      </div>
    </div>
  );
}
