import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ── Section 7: Gamification ──────────────────────────────────

export function useLeaderboard(category: 'rating' | 'sessions' | 'reviews') {
  return useQuery({
    queryKey: ['leaderboard', category],
    queryFn: async () => {
      const col = category === 'rating' ? 'rating_avg' : category === 'reviews' ? 'total_reviews' : 'total_completed_sessions';
      const { data } = await supabase
        .from('profiles')
        .select('id, name, city, profile_photo_url, rating_avg, total_reviews, total_completed_sessions')
        .eq('user_role', 'trainer')
        .order(col, { ascending: false })
        .limit(10);
      return (data ?? []).map((t, i) => ({ ...t, rank: i + 1 }));
    },
  });
}

export function usePlatformChallenge() {
  const now = new Date();
  return useQuery({
    queryKey: ['platform-challenge', now.getMonth(), now.getFullYear()],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_challenges')
        .select('*')
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .eq('active', true)
        .maybeSingle();
      return data;
    },
  });
}

export function useChallengeProgress(challengeId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['challenge-progress', challengeId, user?.id],
    queryFn: async () => {
      if (!challengeId || !user) return null;
      const { data } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!challengeId && !!user,
  });
}

// ── Section 8: Messaging ─────────────────────────────────────

export function useMessageReactions(messageId: string) {
  return useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);
      return data ?? [];
    },
    enabled: !!messageId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
      }
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
  });
}

// ── Section 9: Trainer Tools ─────────────────────────────────

export function useTrainerClientNotes(clientId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trainer-client-notes', user?.id, clientId],
    queryFn: async () => {
      if (!user || !clientId) return null;
      const { data } = await supabase
        .from('trainer_client_notes')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!clientId,
  });
}

export function useUpsertClientNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, note }: { clientId: string; note: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('trainer_client_notes')
        .upsert({
          trainer_id: user.id,
          client_id: clientId,
          note,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'trainer_id,client_id' });
      if (error) throw error;
    },
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['trainer-client-notes', user?.id, clientId] });
    },
  });
}

export function useProfileViews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile-views', user?.id],
    queryFn: async () => {
      if (!user) return { thisWeek: 0, thisMonth: 0 };
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: weekCount }, { count: monthCount }] = await Promise.all([
        supabase.from('profile_views').select('id', { count: 'exact', head: true })
          .eq('profile_id', user.id).gte('viewed_at', weekAgo),
        supabase.from('profile_views').select('id', { count: 'exact', head: true })
          .eq('profile_id', user.id).gte('viewed_at', monthAgo),
      ]);
      return { thisWeek: weekCount ?? 0, thisMonth: monthCount ?? 0 };
    },
    enabled: !!user,
  });
}

export function useTrackProfileView() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (profileId: string) => {
      await supabase.from('profile_views').insert({
        profile_id: profileId,
        viewer_id: user?.id ?? null,
      });
    },
  });
}

export function useToggleAcceptingBookings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (accepting: boolean) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ accepting_bookings: accepting })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    },
  });
}

// ── Section 10: Client Experience ────────────────────────────

export function useSavedTrainers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-trainers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('saved_trainers')
        .select('*, trainer:profiles!saved_trainers_trainer_id_fkey(id, name, city, profile_photo_url, rating_avg, total_reviews, hourly_rate, specialty)')
        .eq('client_id', user.id)
        .order('saved_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useToggleSaveTrainer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (trainerId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('saved_trainers')
        .select('id')
        .eq('client_id', user.id)
        .eq('trainer_id', trainerId)
        .maybeSingle();

      if (existing) {
        await supabase.from('saved_trainers').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('saved_trainers').insert({
          client_id: user.id,
          trainer_id: trainerId,
        });
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-trainers', user?.id] });
    },
  });
}

export function useGoalCheckins() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goal-checkins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('client_id', user.id)
        .order('checked_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateGoalCheckin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ goal, response }: { goal: string; response: string }) => {
      if (!user) throw new Error('Not authenticated');
      await supabase.from('goal_checkins').insert({
        client_id: user.id,
        goal,
        response,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-checkins', user?.id] });
    },
  });
}

// ── Section 12: Admin ────────────────────────────────────────

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string; type: string; target_audience: string }) => {
      const { error } = await supabase.from('announcements').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeactivateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('announcements').update({ active: false }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalUsers },
        { count: verifiedTrainers },
        { count: totalBookings },
        { count: completedSessions },
        { count: activeThisWeek },
        { count: newSignups },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('user_role', 'trainer').eq('verified_status', true),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_active_at', weekAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      ]);

      return {
        totalUsers: totalUsers ?? 0,
        verifiedTrainers: verifiedTrainers ?? 0,
        totalBookings: totalBookings ?? 0,
        completedSessions: completedSessions ?? 0,
        activeThisWeek: activeThisWeek ?? 0,
        newSignups: newSignups ?? 0,
      };
    },
  });
}
