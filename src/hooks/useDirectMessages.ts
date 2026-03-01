import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DirectMessageRow, ProfileRow } from '@/types/database';

export interface DMWithProfile extends DirectMessageRow {
  sender: ProfileRow;
  receiver: ProfileRow;
}

export interface Conversation {
  otherUser: ProfileRow;
  lastMessage: DirectMessageRow;
  unreadCount: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch all DMs involving the current user
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!direct_messages_sender_id_fkey(*), receiver:profiles!direct_messages_receiver_id_fkey(*)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      // Group by conversation partner
      const convMap = new Map<string, Conversation>();
      for (const msg of messages as any[]) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(otherUserId)) {
          const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
          convMap.set(otherUserId, {
            otherUser,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        if (!msg.is_read && msg.receiver_id === user.id) {
          const conv = convMap.get(otherUserId)!;
          conv.unreadCount++;
        }
      }

      return Array.from(convMap.values());
    },
    enabled: !!user,
  });
}

export function useDirectMessages(otherUserId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['direct-messages', otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return [];

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!direct_messages_sender_id_fkey(*), receiver:profiles!direct_messages_receiver_id_fkey(*)')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DMWithProfile[];
    },
    enabled: !!user && !!otherUserId,
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: user.id, receiver_id: receiverId, content })
        .select()
        .single();
      if (error) throw error;

      // Create a notification for the receiver
      await supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'new_dm',
        title: 'New message',
        body: content.length > 80 ? content.slice(0, 80) + '...' : content,
        link: `/messages/${user.id}`,
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkDMRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    },
  });
}

export function useDMSubscription(otherUserId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`dm-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessageRow;
          if (msg.sender_id === otherUserId) {
            queryClient.invalidateQueries({ queryKey: ['direct-messages', otherUserId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, queryClient]);
}

export function useTotalUnreadDMs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-dm-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // poll every 30s for unread count
  });
}
