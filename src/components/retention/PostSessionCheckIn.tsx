import { useState, useEffect, useMemo } from 'react';
import { Star, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMyBookings } from '@/hooks/useBookings';
import { useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function PostSessionCheckIn() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  const createReview = useCreateReview();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [kgLost, setKgLost] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const eligibleBooking = useMemo(() => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    return bookings.find(b => {
      if (b.student_id !== user?.id) return false;
      if (b.status !== 'completed') return false;
      if (dismissed.has(b.id)) return false;

      const sessionTime = new Date(`${b.date}T${b.start_time}`);
      return sessionTime <= twoHoursAgo && sessionTime >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
    });
  }, [bookings, user?.id, dismissed]);

  if (!eligibleBooking || submitted) return null;

  const handleQuickReaction = (stars: number) => {
    setRating(stars);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    try {
      await createReview.mutateAsync({
        booking_id: eligibleBooking.id,
        tutor_id: eligibleBooking.tutor_id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast({ title: 'Thanks for your feedback!' });
      setSubmitted(true);
    } catch {
      toast({ title: 'Could not submit review', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 mb-6 relative">
      <button
        onClick={() => setDismissed(prev => new Set([...prev, eligibleBooking.id]))}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="font-semibold text-foreground mb-1">
        How did your session with {eligibleBooking.tutor?.name ?? 'your trainer'} go?
      </h3>
      <p className="text-sm text-muted-foreground mb-3">Quick feedback helps your trainer improve</p>

      {rating === 0 ? (
        <div className="flex gap-3">
          <button onClick={() => handleQuickReaction(5)} className="flex-1 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-center">
            <span className="text-2xl block mb-1">💪</span>
            <span className="text-xs font-medium">Great</span>
          </button>
          <button onClick={() => handleQuickReaction(3)} className="flex-1 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-center">
            <span className="text-2xl block mb-1">😐</span>
            <span className="text-xs font-medium">Okay</span>
          </button>
          <button onClick={() => handleQuickReaction(1)} className="flex-1 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-center">
            <span className="text-2xl block mb-1">😞</span>
            <span className="text-xs font-medium">Rough</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)}>
                <Star className={cn('w-6 h-6', i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Optional: tell your trainer what went well or what could improve..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
          />
          <input
            type="number"
            placeholder="Kg lost/gained (optional)"
            value={kgLost}
            onChange={e => setKgLost(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={createReview.isPending} className="gap-1.5">
              Submit Review
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/trainers/${eligibleBooking.tutor_id}`}>
                <Calendar className="w-4 h-4 mr-1.5" /> Book Next Session
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
