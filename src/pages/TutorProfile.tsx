import { useState, Fragment, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Star,
  DollarSign,
  Shield,
  Clock,
  MapPin,
  BookOpen,
  MessageSquare,
  Calendar,
  Check,
  Loader2,
  GraduationCap,
  Send,
} from 'lucide-react';
import { useTutor } from '@/hooks/useTutors';
import { useTutorReviews } from '@/hooks/useReviews';
import { useCreateBooking } from '@/hooks/useBookings';
import { useSendDirectMessage } from '@/hooks/useDirectMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const TIME_BLOCKS = [
  { label: 'Morning', value: '08:00-12:00', start: '08:00', end: '12:00' },
  { label: 'Afternoon', value: '12:00-17:00', start: '12:00', end: '17:00' },
  { label: 'Evening', value: '17:00-21:00', start: '17:00', end: '21:00' },
];

const TutorProfile = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: tutor, isLoading } = useTutor(tutorId);
  const { data: reviews = [] } = useTutorReviews(tutorId);
  const createBooking = useCreateBooking();
  const sendDM = useSendDirectMessage();

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; start: string; end: string } | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  const availabilityMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of tutor?.availability ?? []) {
      if (!map.has(a.day)) map.set(a.day, new Set());
      map.get(a.day)!.add(`${a.start_time}-${a.end_time}`);
    }
    return map;
  }, [tutor?.availability]);

  const isSlotAvailable = (day: string, block: string) => {
    return availabilityMap.get(day)?.has(block) ?? false;
  };

  const courses = (tutor?.user_courses ?? []).map((uc) => uc.courses).filter(Boolean);

  const getNextDateForDay = (dayName: string): string => {
    const dayIndex = DAYS.indexOf(dayName as typeof DAYS[number]);
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7;
    let diff = dayIndex - todayIndex;
    if (diff <= 0) diff += 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().split('T')[0];
  };

  const handleBook = async () => {
    if (!selectedSlot || !tutor) return;
    try {
      await createBooking.mutateAsync({
        tutor_id: tutor.id,
        date: getNextDateForDay(selectedSlot.day),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        note: bookingNote.trim() || undefined,
      });
      toast({ title: 'Booking request sent!' });
      setBookingOpen(false);
      setSelectedSlot(null);
      setBookingNote('');
    } catch (err) {
      toast({
        title: 'Booking failed',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleInquiry = async () => {
    if (!inquiryMessage.trim() || !tutor) return;
    try {
      await sendDM.mutateAsync({
        recipientId: tutor.id,
        content: inquiryMessage.trim(),
      });
      toast({ title: 'Message sent!' });
      setInquiryOpen(false);
      setInquiryMessage('');
      navigate(`/messages/${tutor.id}`);
    } catch (err) {
      toast({
        title: 'Could not send message',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !tutor) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const isOwnProfile = user?.id === tutor.id;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>

        {/* Hero Section */}
        <div className="rounded-xl border border-border bg-card p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
              {tutor.avatar ? (
                <img src={tutor.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                tutor.name?.charAt(0)?.toUpperCase() ?? '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{tutor.name}</h1>
                {tutor.verified_status && (
                  <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
                    <Shield className="w-3 h-3" />
                    Verified Tutor
                  </Badge>
                )}
              </div>
              {tutor.bio_expert && (
                <p className="text-muted-foreground mb-3">{tutor.bio_expert}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  {(tutor.rating_avg ?? 0).toFixed(1)}
                  <span className="text-muted-foreground font-normal">({tutor.total_reviews} review{tutor.total_reviews !== 1 ? 's' : ''})</span>
                </span>
                {tutor.hourly_rate && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                    <DollarSign className="w-4 h-4" />
                    {tutor.hourly_rate}/hr
                  </span>
                )}
                {tutor.school && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {tutor.school}
                  </span>
                )}
                {tutor.major && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    {tutor.major} &middot; {tutor.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(tutor.subjects?.length > 0 || courses.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/50">
              {(tutor.subjects ?? []).map((s) => (
                <Badge key={s} className="bg-primary/10 text-primary border-0 font-medium">{s}</Badge>
              ))}
              {courses.map((c) => (
                <Badge key={c!.id} variant="outline">{c!.code} - {c!.title}</Badge>
              ))}
            </div>
          )}

          {!isOwnProfile && (
            <div className="flex gap-3 mt-5 pt-5 border-t border-border/50">
              <Button onClick={() => setBookingOpen(true)} className="gap-2">
                <Calendar className="w-4 h-4" />
                Book Now
              </Button>
              <Button variant="outline" onClick={() => setInquiryOpen(true)} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Send Inquiry
              </Button>
            </div>
          )}
        </div>

        {/* Availability Grid */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Available Slots
          </h2>
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-8 gap-1">
                <div className="h-10" />
                {DAYS.map(day => (
                  <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {day.slice(0, 3)}
                  </div>
                ))}
                {TIME_BLOCKS.map(block => (
                  <Fragment key={block.value}>
                    <div className="h-12 flex items-center text-xs text-muted-foreground pr-2">{block.label}</div>
                    {DAYS.map(day => {
                      const available = isSlotAvailable(day, block.value);
                      return (
                        <button
                          key={`${day}-${block.value}`}
                          disabled={!available || isOwnProfile}
                          onClick={() => {
                            if (!available) return;
                            setSelectedSlot({ day, start: block.start, end: block.end });
                            setBookingOpen(true);
                          }}
                          className={cn(
                            "h-12 rounded-lg border transition-all",
                            available
                              ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer"
                              : "border-border bg-muted/30"
                          )}
                        >
                          {available && <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Green slots are open for booking. Click to book instantly.
          </p>
        </div>

        {/* Reviews */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Student Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">{review.student?.name ?? 'Student'}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Dialog */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {selectedSlot ? (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="font-medium">{selectedSlot.day}</span> &middot; {selectedSlot.start} &ndash; {selectedSlot.end}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Next {selectedSlot.day}: {getNextDateForDay(selectedSlot.day)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a slot from the availability grid above.</p>
              )}
              {tutor.hourly_rate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session rate</span>
                  <span className="font-semibold text-emerald-600">${tutor.hourly_rate}/hr</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note for tutor (optional)</label>
                <Textarea
                  placeholder="What do you need help with?"
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBook}
                disabled={!selectedSlot || createBooking.isPending}
                className="gap-2"
              >
                {createBooking.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Send Booking Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Inquiry Dialog */}
        <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Inquiry to {tutor.name}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                placeholder="Ask about their teaching style, specific topics, or anything before booking..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInquiryOpen(false)}>Cancel</Button>
              <Button
                onClick={handleInquiry}
                disabled={!inquiryMessage.trim() || sendDM.isPending}
                className="gap-2"
              >
                {sendDM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TutorProfile;
