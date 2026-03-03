import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ConnectionRow } from '@/types/database';

const CONNECTION_EXPIRY_HOURS = 48;

function normalizePair(userId: string, otherId: string): [string, string] {
  const a = userId < otherId ? userId : otherId;
  const b = userId < otherId ? otherId : userId;
  return [a, b];
}

export function useConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['connections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`);
      if (error) throw error;
      return (data ?? []) as ConnectionRow[];
    },
    enabled: !!user,
  });
}

export function usePendingRequestsReceived() {
  const { user } = useAuth();
  const { data: connections = [] } = useConnections();
  const now = new Date();
  const cutoff = new Date(now.getTime() - CONNECTION_EXPIRY_HOURS * 60 * 60 * 1000);

  const pending = connections.filter(
    (c) =>
      c.status === 'pending' &&
      c.initiated_by !== user?.id &&
      new Date(c.created_at) > cutoff
  );
  return pending;
}

export function usePendingRequestsWithProfiles() {
  const { user } = useAuth();
  const pending = usePendingRequestsReceived();
  const { data: profiles } = useQuery({
    queryKey: ['profiles', pending.map((p) => p.initiated_by).join(',')],
    queryFn: async () => {
      if (pending.length === 0) return [];
      const ids = [...new Set(pending.map((p) => p.initiated_by))];
      const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; avatar: string | null }[];
    },
    enabled: pending.length > 0,
  });
  const profileMap = useMemo(
    () => new Map((profiles ?? []).map((p) => [p.id, p])),
    [profiles]
  );
  return pending.map((c) => ({
    connection: c,
    otherUser: profileMap.get(c.initiated_by),
  }));
}

export function useConnectionStatus(otherUserId: string | null) {
  const { user } = useAuth();
  const { data: connections = [] } = useConnections();

  if (!otherUserId || !user || otherUserId === user.id) return null;
  const [a, b] = normalizePair(user.id, otherUserId);
  const conn = connections.find((c) => c.user_a_id === a && c.user_b_id === b);
  if (!conn) return null;
  const isExpired =
    conn.status === 'pending' &&
    new Date(conn.created_at).getTime() <
      Date.now() - CONNECTION_EXPIRY_HOURS * 60 * 60 * 1000;
  return { ...conn, isExpired };
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Not logged in');
      const [userA, userB] = normalizePair(user.id, otherUserId);
      const { data, error } = await supabase
        .from('connections')
        .insert({
          user_a_id: userA,
          user_b_id: userB,
          initiated_by: user.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ConnectionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-people'] });
    },
  });
}

export function useAcceptConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase
        .from('connections')
        .update({ status: 'active', responded_at: new Date().toISOString() })
        .eq('id', connectionId)
        .select()
        .single();
      if (error) throw error;
      return data as ConnectionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-people'] });
    },
  });
}

export function useIgnoreConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase
        .from('connections')
        .update({ status: 'ignored', responded_at: new Date().toISOString() })
        .eq('id', connectionId)
        .select()
        .single();
      if (error) throw error;
      return data as ConnectionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-people'] });
    },
  });
}

export function useBlockConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase
        .from('connections')
        .update({ status: 'blocked', responded_at: new Date().toISOString() })
        .eq('id', connectionId)
        .select()
        .single();
      if (error) throw error;
      return data as ConnectionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-people'] });
    },
  });
}

export function getOtherUserId(connection: ConnectionRow, currentUserId: string): string {
  return connection.user_a_id === currentUserId ? connection.user_b_id : connection.user_a_id;
}
