import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessageRow, ProfileRow } from '@/types/database';

export interface MessageWithUser extends ChatMessageRow {
  profiles: ProfileRow;
}

export function useMessages(groupId?: string) {
  return useQuery({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles(*)')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageWithUser[];
    },
    enabled: !!groupId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ group_id: groupId, user_id: user.id, content })
        .select('*, profiles(*)')
        .single();
      if (error) throw error;
      return data as MessageWithUser;
    },
    // Optimistic update is not needed since we use real-time subscription
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.groupId] });
    },
  });
}

export function useMessagesSubscription(groupId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full message with user profile
          const { data } = await supabase
            .from('chat_messages')
            .select('*, profiles(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            queryClient.setQueryData<MessageWithUser[]>(
              ['messages', groupId],
              (old) => [...(old ?? []), data as MessageWithUser]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
