import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SessionRow, SessionAttendeeRow, AgendaItemRow, ProfileRow, SessionGoalRow } from '@/types/database';

export interface SessionWithDetails extends SessionRow {
  session_attendees: (SessionAttendeeRow & { profiles: ProfileRow })[];
  agenda_items: AgendaItemRow[];
}

export function useGroupSessions(groupId?: string) {
  return useQuery({
    queryKey: ['sessions', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_attendees(*, profiles(*)), agenda_items(*)')
        .eq('group_id', groupId!)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SessionWithDetails[];
    },
    enabled: !!groupId,
  });
}

export function useUpcomingSessions(groupIds?: string[]) {
  return useQuery({
    queryKey: ['upcoming-sessions', groupIds],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_attendees(*, profiles(*)), agenda_items(*)')
        .in('group_id', groupIds!)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as SessionWithDetails[];
    },
    enabled: !!groupIds && groupIds.length > 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      group_id: string;
      title: string;
      description?: string;
      date: string;
      start_time: string;
      end_time: string;
      location?: string;
      is_online?: boolean;
      meeting_link?: string;
      agenda?: { title: string; duration: number; description?: string }[];
    }) => {
      const { agenda, ...sessionData } = input;

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();
      if (sessionError) throw sessionError;

      if (agenda && agenda.length > 0) {
        const { error: agendaError } = await supabase
          .from('agenda_items')
          .insert(agenda.map((item, i) => ({
            session_id: session.id,
            title: item.title,
            duration: item.duration,
            description: item.description,
            sort_order: i,
          })));
        if (agendaError) throw agendaError;
      }

      return session;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.group_id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
  });
}

export function useSessionsWithBuddy(buddyId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions-with-buddy', user?.id, buddyId],
    queryFn: async () => {
      if (!user || !buddyId) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { data: myAttendances } = await supabase
        .from('session_attendees')
        .select('session_id')
        .eq('user_id', user.id);
      const mySessionIds = (myAttendances ?? []).map((a) => a.session_id);
      if (mySessionIds.length === 0) return 0;
      const { data: shared } = await supabase
        .from('session_attendees')
        .select('session_id')
        .eq('user_id', buddyId)
        .in('session_id', mySessionIds);
      const sharedIds = [...new Set((shared ?? []).map((s) => s.session_id))];
      if (sharedIds.length === 0) return 0;
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .in('id', sharedIds)
        .lt('date', today);
      return (sessions ?? []).length;
    },
    enabled: !!user && !!buddyId,
  });
}

export function useSessionGoals(sessionId?: string) {
  return useQuery({
    queryKey: ['session-goals', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', sessionId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SessionGoalRow[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateSessionGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('session_goals')
        .insert({ session_id: sessionId, user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      return data as SessionGoalRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session-goals', data.session_id] });
    },
  });
}

export function useToggleSessionGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ goalId, isCompleted, sessionId }: { goalId: string; isCompleted: boolean; sessionId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_goals')
        .update({
          is_completed: isCompleted,
          completed_by: isCompleted ? user.id : null,
        })
        .eq('id', goalId);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session-goals', sessionId] });
    },
  });
}

export function useActiveSessions(groupIds?: string[]) {
  return useQuery({
    queryKey: ['active-sessions', groupIds],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_attendees(*, profiles(*)), agenda_items(*)')
        .in('group_id', groupIds!)
        .eq('date', today)
        .order('start_time', { ascending: true });
      if (error) throw error;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return ((data ?? []) as SessionWithDetails[]).filter((s) => {
        const [sh, sm] = s.start_time.split(':').map(Number);
        const [eh, em] = s.end_time.split(':').map(Number);
        return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em;
      });
    },
    enabled: !!groupIds && groupIds.length > 0,
    refetchInterval: 30_000,
  });
}

export function useRSVP() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('session_attendees')
        .upsert(
          { session_id: sessionId, user_id: user.id, status },
          { onConflict: 'session_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
  });
}
