import { useState, useEffect, Fragment, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Star, DollarSign, Shield, Clock, MapPin, MessageSquare,
  Calendar, Check, Loader2, Dumbbell, Send, Award, Package, Sparkles,
  StickyNote, Users, Camera, Briefcase, Building, Quote, Home, Apple, Heart,
} from 'lucide-react';
import { useTutor, useTutors } from '@/hooks/useTutors';
import { useTutorReviews } from '@/hooks/useReviews';
import { useCreateBooking, useMyBookings } from '@/hooks/useBookings';
import { useSendDirectMessage } from '@/hooks/useDirectMessages';
import { useTutorPackages } from '@/hooks/usePackages';
import { useTrainerPackages } from '@/hooks/useTrainingPackages';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTrainerChallenges, useJoinChallenge, useMyChallenges, useTrainerPosts, useTrackEvent } from '@/hooks/useRetention';
import { useTrackProfileView, useSavedTrainers, useToggleSaveTrainer } from '@/hooks/useFeaturesV2';
import { whatsappShareUrl, trainerShareMessage } from '@/lib/share';
import { cn } from '@/lib/utils';
import { useSwipeBack } from '@/hooks/useSwipeBack';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const TIME_BLOCKS = [
  { label: 'Early AM', value: '05:00-08:00', start: '05:00', end: '08:00' },
  { label: 'Morning', value: '08:00-12:00', start: '08:00', end: '12:00' },
  { label: 'Afternoon', value: '12:00-17:00', start: '12:00', end: '17:00' },
  { label: 'Evening', value: '17:00-21:00', start: '17:00', end: '21:00' },
];

export default function TutorProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: trainer, isLoading } = useTutor(tutorId);
  const { data: reviews = [] } = useTutorReviews(tutorId);
  const createBooking = useCreateBooking();
  const sendDM = useSendDirectMessage();
  const { data: currentProfile } = useCurrentProfile();
  const { data: packages = [] } = useTutorPackages(tutorId);
  const { data: trainingPackages = [] } = useTrainerPackages(tutorId);

  useSwipeBack();
  const { data: challenges = [] } = useTrainerChallenges(tutorId);
  const { data: myChallenges = [] } = useMyChallenges();
  const joinChallenge = useJoinChallenge();
  const { data: trainerTips = [] } = useTrainerPosts(tutorId);
  const { data: allTrainers = [] } = useTutors();
  const { data: myBookings = [] } = useMyBookings();
  const trackEvent = useTrackEvent();

  const trackProfileView = useTrackProfileView();
  const { data: savedTrainers = [] } = useSavedTrainers();
  const toggleSave = useToggleSaveTrainer();
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | '3below'>('all');

  useEffect(() => {
    if (tutorId) {
      trackProfileView.mutate(tutorId);
      trackEvent.mutate({ event_name: 'trainer_profile_viewed', metadata: { trainer_id: tutorId } });
    }
  }, [tutorId]);

  const isSaved = useMemo(() => savedTrainers.some((s: any) => s.trainer_id === tutorId), [savedTrainers, tutorId]);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; start: string; end: string } | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [studentPrep, setStudentPrep] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of trainer?.availability ?? []) {
      if (!map.has(a.day)) map.set(a.day, new Set());
      map.get(a.day)!.add(`${a.start_time}-${a.end_time}`);
    }
    return map;
  }, [trainer?.availability]);

  const totalSlots = useMemo(() => {
    let c = 0;
    availabilityMap.forEach(s => { c += s.size; });
    return c;
  }, [availabilityMap]);

  const isSlotAvailable = (day: string, block: string) =>
    availabilityMap.get(day)?.has(block) ?? false;

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
    if (!selectedSlot || !trainer) return;
    try {
      await createBooking.mutateAsync({
        tutor_id: trainer.id,
        date: getNextDateForDay(selectedSlot.day),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        note: bookingNote.trim() || undefined,
        student_prep: studentPrep.trim() || undefined,
        is_recurring: isRecurring,
        package_id: selectedPackageId || undefined,
      });
      setBookingOpen(false);
      setShowConfirmation(true);
      setBookingNote('');
      setStudentPrep('');
      setIsRecurring(false);
      setSelectedPackageId('');
    } catch (err) {
      toast({ title: 'Booking failed', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' });
    }
  };

  const handleInquiry = async () => {
    if (!inquiryMessage.trim() || !trainer) return;
    try {
      await sendDM.mutateAsync({ recipientId: trainer.id, content: inquiryMessage.trim() });
      toast({ title: 'Message sent!' });
      setInquiryOpen(false);
      setInquiryMessage('');
      navigate(`/messages/${trainer.id}`);
    } catch (err) {
      toast({ title: 'Could not send message', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' });
    }
  };

  if (isLoading || !trainer) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const isOwnProfile = user?.id === trainer.id;
  const testimonials = (trainer.testimonials ?? []) as { name: string; text: string; date?: string }[];
  const transformations = trainer.transformations ?? [];

  // Social proof: area clients count (Section 5b)
  const areaClientCount = useMemo(() => {
    if (!currentProfile?.area || !myBookings) return 0;
    const clientArea = currentProfile.area.toLowerCase();
    return 0; // Computed server-side ideally; placeholder for now
  }, [currentProfile?.area]);

  // Transformation impact (Section 5d)
  const totalCompletedSessions = useMemo(() => {
    return myBookings.filter(b => b.tutor_id === trainer.id && b.status === 'completed').length;
  }, [myBookings, trainer.id]);

  const totalKgLost = useMemo(() => {
    return reviews.reduce((sum, r) => sum + (r.kg_lost ?? 0), 0);
  }, [reviews]);

  // Best 5-star review snippet (Section 5a)
  const topReviewSnippet = useMemo(() => {
    const fiveStar = reviews.find(r => r.rating === 5 && r.comment);
    if (!fiveStar) return null;
    const comment = fiveStar.comment ?? '';
    return {
      text: comment.length > 60 ? comment.slice(0, 60) + '...' : comment,
      name: fiveStar.student?.name?.split(' ')[0] ?? 'Client',
      area: fiveStar.student?.area ?? '',
    };
  }, [reviews]);

  const hasPreviousBooking = useMemo(() =>
    myBookings.some(b => b.tutor_id === trainer?.id && (b.status === 'completed' || b.status === 'confirmed')),
    [myBookings, trainer?.id]
  );

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    if (reviewFilter === '5') return reviews.filter(r => r.rating === 5);
    if (reviewFilter === '4') return reviews.filter(r => r.rating === 4);
    return reviews.filter(r => r.rating <= 3);
  }, [reviews, reviewFilter]);

  // Similar trainers (Section 8d)
  const similarTrainers = useMemo(() => {
    if (!trainer) return [];
    return allTrainers
      .filter(t => t.id !== trainer.id && t.city?.toLowerCase() === trainer.city?.toLowerCase())
      .filter(t => (t.specialty ?? []).some((s: string) => (trainer.specialty ?? []).includes(s)))
      .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0))
      .slice(0, 3);
  }, [allTrainers, trainer]);

  // Joined challenges
  const joinedChallengeIds = new Set(myChallenges.map(c => c.challenge_id));

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <Link to="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>

        {/* ── Hero ── */}
        <div className="rounded-xl border border-border bg-card p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary shrink-0 overflow-hidden">
              {trainer.profile_photo_url ? (
                <img src={trainer.profile_photo_url} alt="" className="w-24 h-24 rounded-2xl object-cover" />
              ) : trainer.avatar ? (
                <img src={trainer.avatar} alt="" className="w-24 h-24 rounded-2xl object-cover" />
              ) : (
                trainer.name?.charAt(0)?.toUpperCase() ?? '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{trainer.name}</h1>
                {trainer.verified_status && (
                  <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0"><Shield className="w-3 h-3" />Verified</Badge>
                )}
                {(trainer.rating_avg ?? 0) >= 4.8 && (trainer.total_reviews ?? 0) >= 5 && (
                  <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0"><Sparkles className="w-3 h-3" />Top Rated</Badge>
                )}
                {trainer.trainer_type === 'freelancer' && (
                  <Badge className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0"><Briefcase className="w-3 h-3" />Freelancer</Badge>
                )}
                {trainer.trainer_type === 'gym_affiliated' && (
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0"><Building className="w-3 h-3" />Gym Trainer</Badge>
                )}
              </div>

              {trainer.bio_expert && <p className="text-muted-foreground mb-3">{trainer.bio_expert}</p>}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  {(trainer.rating_avg ?? 0).toFixed(1)}
                  <span className="text-muted-foreground font-normal">({trainer.total_reviews} review{trainer.total_reviews !== 1 ? 's' : ''})</span>
                </span>
                {trainer.hourly_rate != null && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                    <DollarSign className="w-4 h-4" />{trainer.hourly_rate}/session
                  </span>
                )}
                {trainer.city && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />{trainer.city}{trainer.area ? `, ${trainer.area}` : ''}
                  </span>
                )}
                {trainer.gym && (
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Dumbbell className="w-4 h-4" />{trainer.gym}</span>
                )}
                {trainer.offers_home_training && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Home className="w-4 h-4" />Home Training
                  </span>
                )}
                {trainer.offers_diet_plan && (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                    <Apple className="w-4 h-4" />Diet Planning
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3 mt-4">
                {trainer.age != null && (
                  <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                    <span className="text-muted-foreground">Age</span>{' '}
                    <span className="font-semibold text-foreground">{trainer.age}</span>
                  </div>
                )}
                {trainer.gender && (
                  <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs capitalize">
                    <span className="text-muted-foreground">Gender</span>{' '}
                    <span className="font-semibold text-foreground">{trainer.gender}</span>
                  </div>
                )}
                {(trainer.years_experience ?? 0) > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                    <span className="text-muted-foreground">Experience</span>{' '}
                    <span className="font-semibold text-foreground">{trainer.years_experience} yr{trainer.years_experience !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {(trainer.clients_worked_with ?? 0) > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                    <Users className="w-3 h-3 inline mr-1" />
                    <span className="font-semibold text-foreground">{trainer.clients_worked_with}</span>{' '}
                    <span className="text-muted-foreground">clients</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  <span className="font-semibold text-foreground">{totalSlots}</span>{' '}
                  <span className="text-muted-foreground">open slots/week</span>
                </div>
              </div>
            </div>
          </div>

          {(trainer.specialty ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/50">
              {(trainer.specialty ?? []).map((s: string) => (
                <Badge key={s} className="bg-primary/10 text-primary border-0 font-medium">{s}</Badge>
              ))}
            </div>
          )}
          {(trainer.certifications ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(trainer.certifications ?? []).map((c: string) => (
                <Badge key={c} variant="outline" className="text-xs gap-1"><Award className="w-3 h-3" />{c}</Badge>
              ))}
            </div>
          )}

          {/* Transformation Impact (Section 5d) */}
          {(reviews.length > 0 || totalKgLost > 0) && (
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {reviews.length > 0 && (
                <span>💪 {reviews.length * 2 + (trainer.clients_worked_with ?? 0)} sessions completed</span>
              )}
              {totalKgLost > 0 && (
                <span>&middot; Clients lost a combined {totalKgLost} kg</span>
              )}
            </div>
          )}

          {/* Response commitment (Section 9a) */}
          {trainer.response_commitment && trainer.response_commitment !== 'asap' && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Committed to respond within {trainer.response_commitment === '1hour' ? '1 hour' : trainer.response_commitment === '4hours' ? '4 hours' : '24 hours'}
            </div>
          )}

          {!isOwnProfile && (
            <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border/50">
              {hasPreviousBooking ? (
                <>
                  <Button onClick={() => setBookingOpen(true)} className="gap-2"><Calendar className="w-4 h-4" />Book Session</Button>
                  <Button variant="outline" onClick={() => setInquiryOpen(true)} className="gap-2"><MessageSquare className="w-4 h-4" />Send Inquiry</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setInquiryOpen(true)} className="gap-2"><MessageSquare className="w-4 h-4" />Send Inquiry</Button>
                  <Button variant="outline" onClick={() => setBookingOpen(true)} className="gap-2"><Calendar className="w-4 h-4" />Book Session</Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSave.mutate(trainer.id)}
                className={cn('gap-1.5', isSaved && 'text-green-600')}
              >
                <Heart className={cn('w-4 h-4', isSaved && 'fill-green-600')} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const msg = trainerShareMessage(trainer.name, trainer.area ?? trainer.city ?? '', trainer.id);
                  window.open(whatsappShareUrl(msg), '_blank');
                }}
                className="gap-1.5 text-xs"
              >
                Share Profile
              </Button>
            </div>
          )}
        </div>

        {/* ── Home Training Info ── */}
        {trainer.offers_home_training && (trainer.home_training_cities ?? []).length > 0 && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" /> Home Training Available
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              {trainer.name} can train you at your home in the following cities:
            </p>
            <div className="flex flex-wrap gap-2">
              {(trainer.home_training_cities ?? []).map((city: string) => (
                <Badge key={city} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">
                  <MapPin className="w-3 h-3 mr-1" />{city}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Available Hours ── */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Available Hours
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {totalSlots > 0 ? `${totalSlots} open time slots per week. Click a green slot to book.` : 'No availability set yet.'}
          </p>
          {totalSlots > 0 ? (
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[540px]">
                <div className="grid grid-cols-8 gap-1">
                  <div className="h-10" />
                  {DAYS.map(d => <div key={d} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">{d.slice(0, 3)}</div>)}
                  {TIME_BLOCKS.map(block => (
                    <Fragment key={block.value}>
                      <div className="h-14 flex items-center text-xs text-muted-foreground pr-2 whitespace-nowrap">{block.label}</div>
                      {DAYS.map(day => {
                        const ok = isSlotAvailable(day, block.value);
                        return (
                          <button key={`${day}-${block.value}`} disabled={!ok || isOwnProfile}
                            onClick={() => { if (ok) { setSelectedSlot({ day, start: block.start, end: block.end }); setBookingOpen(true); } }}
                            className={cn("h-14 rounded-lg border transition-all",
                              ok ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer" : "border-border bg-muted/30"
                            )}>
                            {ok && <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />}
                          </button>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              This trainer hasn't set their availability yet. Send an inquiry to ask about their schedule.
            </div>
          )}
        </div>

        {/* ── Transformations ── */}
        {transformations.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Client Transformations ({transformations.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {transformations.map((url, i) => (
                <button key={i} onClick={() => setGalleryIdx(i)}
                  className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-md">
                  <img src={url} alt={`Transformation ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Testimonials ── */}
        {testimonials.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Quote className="w-5 h-5 text-primary" /> Testimonials ({testimonials.length})
            </h2>
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-foreground italic mb-2">"{t.text}"</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">— {t.name}</span>
                    {t.date && <span>{new Date(t.date).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Training Packages ── */}
        {trainingPackages.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Training Packages
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {trainingPackages.map(pkg => {
                const totalSessions = pkg.duration_weeks * pkg.sessions_per_week;
                const effRate = pkg.price_without_diet / totalSessions;
                return (
                  <div key={pkg.id} className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-foreground">{pkg.title}</h3>
                      <Badge variant="outline" className="text-xs">{pkg.duration_weeks} weeks</Badge>
                    </div>
                    {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                    <div className="text-xs text-muted-foreground">
                      {pkg.sessions_per_week}x/week &middot; {totalSessions} total sessions
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5" />Training Only
                        </span>
                        <span className="font-semibold text-emerald-600 text-lg">${pkg.price_without_diet}</span>
                      </div>
                      {pkg.price_with_diet != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Apple className="w-3.5 h-3.5 text-green-600" />With Diet Plan
                          </span>
                          <span className="font-semibold text-primary text-lg">${pkg.price_with_diet}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">${effRate.toFixed(0)}/session effective rate</p>
                    {!isOwnProfile && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPackageId(pkg.id); setBookingOpen(true); }} className="w-full gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" /> Book Package
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Legacy Session Packages ── */}
        {packages.length > 0 && trainingPackages.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Session Packages
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map(pkg => {
                const eff = pkg.price / pkg.total_hours;
                return (
                  <div key={pkg.id} className="rounded-lg border border-border p-4 bg-muted/30 space-y-2">
                    <h3 className="font-medium text-sm text-foreground">{pkg.title}</h3>
                    {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{pkg.total_hours} sessions</span>
                      <span className="font-semibold text-emerald-600 text-lg">${pkg.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">${eff.toFixed(0)}/session effective rate</p>
                    {!isOwnProfile && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPackageId(pkg.id); setBookingOpen(true); }} className="w-full gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" /> Book Package
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Kotch Promise (Section 9b) ── */}
        {!isOwnProfile && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Kotch Promise</h3>
                <p className="text-xs text-muted-foreground">
                  If your trainer cancels or doesn't show up, Kotch will help you find a replacement session at no extra cost.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Challenges (Section 3c) ── */}
        {challenges.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Active Challenges
            </h2>
            <div className="space-y-3">
              {challenges.map(ch => {
                const joined = joinedChallengeIds.has(ch.id);
                return (
                  <div key={ch.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-foreground text-sm">{ch.title}</h3>
                        {ch.description && <p className="text-xs text-muted-foreground mt-1">{ch.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {ch.target_sessions} sessions &middot; {new Date(ch.start_date).toLocaleDateString()} – {new Date(ch.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      {!isOwnProfile && !joined && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinChallenge.mutate(ch.id)}
                          disabled={joinChallenge.isPending}
                        >
                          Join Challenge
                        </Button>
                      )}
                      {joined && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Joined
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trainer Tips (Section 7a) ── */}
        {trainerTips.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              From {trainer.name}
            </h2>
            <div className="space-y-3">
              {trainerTips.slice(0, 5).map(tip => (
                <div key={tip.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-foreground">{tip.content}</p>
                  {tip.image_url && (
                    <img src={tip.image_url} alt="" className="mt-2 rounded-lg w-full max-h-48 object-cover" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(tip.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Client Reviews ({reviews.length})
          </h2>
          {reviews.length > 0 && (
            <div className="flex gap-2 mb-4">
              {(['all', '5', '4', '3below'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    reviewFilter === f
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'border-border bg-card text-foreground hover:border-green-300'
                  )}
                >
                  {f === 'all' ? 'All' : f === '5' ? '5★' : f === '4' ? '4★' : '3★ & below'}
                </button>
              ))}
            </div>
          )}
          {filteredReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{reviews.length === 0 ? 'No reviews yet.' : 'No reviews match this filter.'}</p>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(r => {
                const reviewerName = r.student?.name ?? 'Client';
                const firstName = reviewerName.split(' ')[0];
                const lastInitial = reviewerName.split(' ').length > 1 ? ` ${reviewerName.split(' ')[1][0]}.` : '';
                const area = r.student?.area;
                return (
                  <div key={r.id} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {firstName}{lastInitial}
                        {area && <span className="text-muted-foreground font-normal"> &middot; {area}</span>}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    {r.kg_lost != null && r.kg_lost > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">Lost {r.kg_lost} kg</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Similar Trainers (Section 8d) ── */}
        {similarTrainers.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mt-6">
            <h2 className="font-semibold text-foreground mb-4">Similar Trainers</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {similarTrainers.map(st => (
                <Link
                  key={st.id}
                  to={`/trainers/${st.id}`}
                  className="rounded-lg border border-border p-3 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                      {st.profile_photo_url ? (
                        <img src={st.profile_photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        st.name?.charAt(0) ?? '?'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{st.name}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{(st.rating_avg ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  {(st.specialty ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(st.specialty ?? []).slice(0, 2).map((s: string) => (
                        <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Booking Dialog ── */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Book a Session with {trainer.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {selectedSlot ? (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="font-medium">{selectedSlot.day}</span> &middot; {selectedSlot.start} – {selectedSlot.end}
                  <br /><span className="text-xs text-muted-foreground">Next {selectedSlot.day}: {getNextDateForDay(selectedSlot.day)}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a slot from the availability grid first.</p>
              )}
              {trainer.hourly_rate != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session rate</span>
                  <span className="font-semibold text-emerald-600">${trainer.hourly_rate}/session</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note for trainer (optional)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['First session — beginner', 'Continuing from last week', 'Focusing on upper body'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBookingNote(t)}
                      className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground hover:bg-muted/80 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Any specific goals or areas to focus on?" value={bookingNote} onChange={e => setBookingNote(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5 text-primary" />Session Prep</label>
                <Textarea placeholder="What are you struggling with? e.g. 'I want to improve squat form and build upper body strength.'" value={studentPrep} onChange={e => setStudentPrep(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">Your trainer will receive a brief so the first 10 min aren't wasted.</p>
              </div>
              {packages.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-primary" />Apply a Package (optional)</label>
                  <select value={selectedPackageId} onChange={e => setSelectedPackageId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">No package (pay per session)</option>
                    {packages.map(p => <option key={p.id} value={p.id}>{p.title} — {p.total_hours} sessions for ${p.price}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <input type="checkbox" id="recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-border" />
                <label htmlFor="recurring" className="text-sm cursor-pointer">
                  <span className="font-medium">Repeat weekly</span>
                  <span className="text-muted-foreground ml-1">— same slot every week</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
              <Button onClick={handleBook} disabled={!selectedSlot || createBooking.isPending} className="gap-2">
                {createBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Send Booking Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Booking Confirmation ── */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                Request Sent to {trainer.name}!
              </h2>
              {selectedSlot && (
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedSlot.day} &middot; {selectedSlot.start} – {selectedSlot.end}
                </p>
              )}
              {trainer.response_commitment && (
                <p className="text-xs text-muted-foreground mb-4">
                  They usually respond within {trainer.response_commitment === '1hour' ? '1 hour' : trainer.response_commitment === '4hours' ? '4 hours' : '24 hours'}
                </p>
              )}
              <div className="flex gap-3 justify-center mt-4">
                <Button onClick={() => { setShowConfirmation(false); navigate(`/messages/${trainer.id}`); }} className="gap-2">
                  <MessageSquare className="w-4 h-4" /> Message {trainer.name?.split(' ')[0]}
                </Button>
                <Button variant="outline" onClick={() => { setShowConfirmation(false); navigate('/discover'); }}>
                  Back to Discover
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Inquiry Dialog ── */}
        <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Inquiry to {trainer.name}</DialogTitle></DialogHeader>
            <div className="py-2">
              <Textarea placeholder="Ask about training style, specialties, availability..." value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} rows={4} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInquiryOpen(false)}>Cancel</Button>
              <Button onClick={handleInquiry} disabled={!inquiryMessage.trim() || sendDM.isPending} className="gap-2">
                {sendDM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Transformation Lightbox ── */}
        <Dialog open={galleryIdx !== null} onOpenChange={() => setGalleryIdx(null)}>
          <DialogContent className="max-w-2xl p-2">
            {galleryIdx !== null && transformations[galleryIdx] && (
              <img src={transformations[galleryIdx]} alt={`Transformation ${galleryIdx + 1}`} className="w-full rounded-lg object-contain max-h-[80vh]" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
