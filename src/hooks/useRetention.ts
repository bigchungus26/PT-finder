import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AccountabilityPairRow,
  TrainerChallengeRow,
  ChallengeParticipantRow,
  ClientProgressPhotoRow,
  ClientWeeklyLogRow,
  ClientMilestoneRow,
  ReferralRow,
  TrainerPostRow,
  WeeklyContentRow,
  SessionNoteRow,
  ProfileRow,
} from '@/types/database';

// ── Event Tracking ──────────────────────────────────────────
export function useTrackEvent() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ event_name, metadata }: { event_name: string; metadata?: Record<string, unknown> }) => {
      if (!user) return;
      await supabase.from('user_events').insert({ user_id: user.id, event_name, metadata: metadata ?? {} });
    },
  });
}

// ── Last Active Updater ─────────────────────────────────────
export function useUpdateLastActive() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
    },
  });
}

// ── Match Score Computation ─────────────────────────────────
export function computeMatchScore(
  client: Pick<ProfileRow, 'city' | 'area' | 'fitness_goals'>,
  trainer: Pick<ProfileRow, 'city' | 'area' | 'specialty' | 'verified_status' | 'rating_avg' | 'offers_home_training'>
): number {
  let score = 0;
  if (client.city && trainer.city && client.city.toLowerCase() === trainer.city.toLowerCase()) score += 1;
  if (client.area && trainer.area && client.area.toLowerCase() === trainer.area.toLowerCase()) score += 1;
  const clientGoals = (client.fitness_goals ?? []).map(g => g.toLowerCase());
  const trainerSpecs = (trainer.specialty ?? []).map(s => s.toLowerCase());
  for (const goal of clientGoals) {
    for (const spec of trainerSpecs) {
      if (spec.includes(goal) || goal.includes(spec)) score += 2;
    }
  }
  if (trainer.verified_status) score += 1;
  if ((trainer.rating_avg ?? 0) >= 4.0) score += 1;
  if (trainer.offers_home_training) score += 1;
  return score;
}

// ── Accountability Partners ─────────────────────────────────
export function useAccountabilityPartner() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['accountability-partner', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('accountability_pairs')
        .select('*, partner1:profiles!accountability_pairs_user_id_1_fkey(*), partner2:profiles!accountability_pairs_user_id_2_fkey(*)')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const partner = data.user_id_1 === user.id ? data.partner2 : data.partner1;
      return partner as ProfileRow;
    },
    enabled: !!user,
  });
}

export function useCreateAccountabilityPair() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('accountability_pairs').insert({
        user_id_1: user.id,
        user_id_2: partnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-partner'] });
    },
  });
}

// ── Trainer Challenges ──────────────────────────────────────
export function useTrainerChallenges(trainerId?: string) {
  return useQuery({
    queryKey: ['trainer-challenges', trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_challenges')
        .select('*')
        .eq('trainer_id', trainerId!)
        .eq('active', true)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrainerChallengeRow[];
    },
    enabled: !!trainerId,
  });
}

export function useMyChallenges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, challenge:trainer_challenges(*)')
        .eq('client_id', user.id);
      if (error) throw error;
      return (data ?? []) as (ChallengeParticipantRow & { challenge: TrainerChallengeRow })[];
    },
    enabled: !!user,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; target_sessions: number; start_date: string; end_date: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('trainer_challenges')
        .insert({ trainer_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as TrainerChallengeRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-challenges'] });
    },
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        client_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-participants'] });
    },
  });
}

export function useChallengeParticipants(challengeId?: string) {
  return useQuery({
    queryKey: ['challenge-participants', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, client:profiles(*)')
        .eq('challenge_id', challengeId!)
        .order('sessions_completed', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (ChallengeParticipantRow & { client: ProfileRow })[];
    },
    enabled: !!challengeId,
  });
}

// ── Progress Photos ─────────────────────────────────────────
export function useProgressPhotos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress-photos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('client_progress_photos')
        .select('*')
        .eq('client_id', user.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientProgressPhotoRow[];
    },
    enabled: !!user,
  });
}

export function useUploadProgressPhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { photo_url: string; body_side: 'front' | 'side' | 'back' | 'other' }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_progress_photos').insert({
        client_id: user.id,
        ...input,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
    },
  });
}

// ── Weekly Logs (Micro-Tracker) ─────────────────────────────
export function useWeeklyLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weekly-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('client_weekly_logs')
        .select('*')
        .eq('client_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as ClientWeeklyLogRow[];
    },
    enabled: !!user,
  });
}

export function useUpsertWeeklyLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { week_start_date: string; weight_kg?: number | null; energy?: number | null; sleep?: number | null; note?: string | null }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('client_weekly_logs')
        .upsert({ client_id: user.id, ...input }, { onConflict: 'client_id,week_start_date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-logs'] });
    },
  });
}

// ── Milestones ──────────────────────────────────────────────
export function useMilestones() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['milestones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('client_milestones')
        .select('*')
        .eq('client_id', user.id);
      if (error) throw error;
      return (data ?? []) as ClientMilestoneRow[];
    },
    enabled: !!user,
  });
}

export function useCelebrateMilestone() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (milestone: number) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_milestones').insert({
        client_id: user.id,
        milestone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

// ── Referrals ───────────────────────────────────────────────
export function useMyReferrals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .or(`referrer_id.eq.${user.id},source_trainer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReferralRow[];
    },
    enabled: !!user,
  });
}

// ── Trainer Posts (Tips Feed) ───────────────────────────────
export function useTrainerPosts(trainerId?: string) {
  return useQuery({
    queryKey: ['trainer-posts', trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_posts')
        .select('*, trainer:profiles(*)')
        .eq('trainer_id', trainerId!)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as (TrainerPostRow & { trainer: ProfileRow })[];
    },
    enabled: !!trainerId,
  });
}

export function useFeedPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feed-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('tutor_id')
        .eq('student_id', user.id);
      const trainerIds = [...new Set((bookings ?? []).map(b => b.tutor_id))];
      if (trainerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('trainer_posts')
        .select('*, trainer:profiles(*)')
        .in('trainer_id', trainerIds)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as (TrainerPostRow & { trainer: ProfileRow })[];
    },
    enabled: !!user,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { content: string; image_url?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('trainer_posts').insert({
        trainer_id: user.id,
        ...input,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

// ── Weekly Content ──────────────────────────────────────────
export function useCurrentWeeklyContent() {
  const now = new Date();
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  const year = now.getFullYear();
  return useQuery({
    queryKey: ['weekly-content', weekNum, year],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_content')
        .select('*')
        .eq('week_number', weekNum)
        .eq('year', year)
        .eq('active', true)
        .maybeSingle();
      return data as WeeklyContentRow | null;
    },
  });
}

// ── Session Notes ───────────────────────────────────────────
export function useSessionNote(bookingId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['session-note', bookingId],
    queryFn: async () => {
      if (!user || !bookingId) return null;
      const { data } = await supabase
        .from('session_notes')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('trainer_id', user.id)
        .maybeSingle();
      return data as SessionNoteRow | null;
    },
    enabled: !!user && !!bookingId,
  });
}

export function useUpsertSessionNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { booking_id: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_notes')
        .upsert({
          booking_id: input.booking_id,
          trainer_id: user.id,
          content: input.content,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'booking_id,trainer_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['session-note', vars.booking_id] });
    },
  });
}

// ── Discover Sessions (live browsing counter) ───────────────
export function useDiscoverBrowsingCount(city?: string) {
  return useQuery({
    queryKey: ['discover-browsing', city],
    queryFn: async () => {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      let query = supabase
        .from('discover_sessions')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_seen_at', fifteenMinAgo);
      if (city) query = query.eq('city_filter', city);
      const { count } = await query;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
}

export function useTrackDiscoverSession() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (city?: string) => {
      if (!user) return;
      await supabase.from('discover_sessions').upsert(
        { user_id: user.id, city_filter: city ?? null, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      ).select();
    },
  });
}

// ── Trainer CRM: My Clients ─────────────────────────────────
export function useMyClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, student:profiles!bookings_student_id_fkey(*)')
        .eq('tutor_id', user.id)
        .order('date', { ascending: false });
      if (!bookings) return [];

      const clientMap = new Map<string, {
        client: ProfileRow;
        totalSessions: number;
        lastSessionDate: string;
        bookings: typeof bookings;
      }>();

      for (const b of bookings) {
        const existing = clientMap.get(b.student_id);
        if (existing) {
          if (b.status === 'completed') existing.totalSessions++;
          if (b.date > existing.lastSessionDate) existing.lastSessionDate = b.date;
          existing.bookings.push(b);
        } else {
          clientMap.set(b.student_id, {
            client: b.student,
            totalSessions: b.status === 'completed' ? 1 : 0,
            lastSessionDate: b.date,
            bookings: [b],
          });
        }
      }
      return Array.from(clientMap.values()).sort((a, b) => b.lastSessionDate.localeCompare(a.lastSessionDate));
    },
    enabled: !!user,
  });
}

// ── Profile Strength Computation ────────────────────────────
export function computeProfileStrength(profile: ProfileRow): { score: number; label: string; missing: { item: string; value: number }[] } {
  let score = 0;
  const missing: { item: string; value: number }[] = [];

  if (profile.bio_expert) score += 10; else missing.push({ item: 'Professional bio', value: 10 });
  if (profile.profile_photo_url) score += 10; else missing.push({ item: 'Profile photo', value: 10 });
  if ((profile.transformations ?? []).length >= 3) score += 15; else missing.push({ item: '3+ transformation photos', value: 15 });
  if (profile.hourly_rate) score += 10; else missing.push({ item: 'Training package', value: 10 });
  score += 15; // availability placeholder (can't check slots count from profile alone)
  if (profile.verified_status) score += 20; else missing.push({ item: 'Verification approved', value: 20 });
  if ((profile.total_reviews ?? 0) >= 5) score += 20; else missing.push({ item: '5+ reviews', value: 20 });

  const label = score >= 80 ? 'Elite' : score >= 60 ? 'Pro' : score >= 40 ? 'Rising' : 'Starter';
  return { score, label, missing };
}

// ── Seasonal Notifications (admin) ──────────────────────────
export function useSeasonalNotifications() {
  return useQuery({
    queryKey: ['seasonal-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_notifications')
        .select('*')
        .order('trigger_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as import('@/types/database').SeasonalNotificationRow[];
    },
  });
}

// ── Trainer Incidents (admin) ───────────────────────────────
export function useTrainerIncidents(trainerId?: string) {
  return useQuery({
    queryKey: ['trainer-incidents', trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_incidents')
        .select('*')
        .eq('trainer_id', trainerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as import('@/types/database').TrainerIncidentRow[];
    },
    enabled: !!trainerId,
  });
}
