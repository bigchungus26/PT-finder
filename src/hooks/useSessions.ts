import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SessionRow, SessionAttendeeRow, AgendaItemRow, ProfileRow } from '@/types/database';

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
