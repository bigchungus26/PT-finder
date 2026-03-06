import { useEffect, useState, useCallback } from 'react';
import { X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMilestones, useCelebrateMilestone } from '@/hooks/useRetention';
import { useMyBookings } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';

const MILESTONES = [1, 5, 10, 25, 50];
const MESSAGES: Record<number, string> = {
  1: "That's your first session! The hardest step is done.",
  5: "5 sessions in. You're building a real habit.",
  10: "That's 10 hours invested in yourself. You're building something real.",
  25: "25 sessions! You're in the top tier of committed clients.",
  50: "50 sessions. You're a fitness machine. Incredible dedication.",
};

export function MilestoneCelebration() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  const { data: celebrated = [] } = useMilestones();
  const celebrate = useCelebrateMilestone();
  const [showMilestone, setShowMilestone] = useState<number | null>(null);

  const completedCount = bookings.filter(
    b => b.student_id === user?.id && b.status === 'completed'
  ).length;

  const celebratedSet = new Set(celebrated.map(m => m.milestone));

  useEffect(() => {
    for (const m of MILESTONES) {
      if (completedCount >= m && !celebratedSet.has(m)) {
        setShowMilestone(m);
        celebrate.mutate(m);
        break;
      }
    }
  }, [completedCount, celebratedSet.size]);

  const handleShare = useCallback(() => {
    if (!showMilestone) return;
    const text = `I just completed my ${showMilestone}${showMilestone === 1 ? 'st' : showMilestone === 5 ? 'th' : 'th'} training session on Kotch! #KotchFit`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, [showMilestone]);

  if (!showMilestone) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-card rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-border animate-in zoom-in-95">
        <button
          onClick={() => setShowMilestone(null)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-2">
          {showMilestone} session{showMilestone !== 1 ? 's' : ''} complete!
        </h2>
        <p className="text-muted-foreground mb-6">
          {MESSAGES[showMilestone] ?? `${showMilestone} sessions and counting!`}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" /> Share this milestone
          </Button>
          <Button variant="outline" onClick={() => setShowMilestone(null)}>
            Close
          </Button>
        </div>

        {/* CSS confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: ['#16A34A', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
