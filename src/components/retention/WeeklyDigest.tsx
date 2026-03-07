import { useMemo } from 'react';
import { BarChart3, Eye, DollarSign, Star, MessageCircle } from 'lucide-react';
import { useMyBookings } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';

export function WeeklyDigest() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStr = weekAgo.toISOString().split('T')[0];

    const lastWeekBookings = bookings.filter(
      b => b.tutor_id === user?.id && b.date >= weekStr
    );
    const completed = lastWeekBookings.filter(b => b.status === 'completed').length;
    const pending = lastWeekBookings.filter(b => b.status === 'pending').length;
    const earnings = lastWeekBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.tutor?.hourly_rate ?? 0), 0);

    return { completed, pending, earnings };
  }, [bookings, user?.id]);

  if (stats.completed === 0 && stats.pending === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">Last Week</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">New inquiries</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">${stats.earnings}</div>
          <div className="text-xs text-muted-foreground">Earnings</div>
        </div>
      </div>
      {stats.completed >= 3 && (
        <p className="text-xs text-primary font-medium mt-3 text-center">
          Great week! You're building momentum.
        </p>
      )}
    </div>
  );
}
