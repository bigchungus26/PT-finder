import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ResourceRow, ProfileRow } from '@/types/database';

export interface ResourceWithUser extends ResourceRow {
  profiles: ProfileRow;
}

export function useGroupResources(groupId?: string) {
  return useQuery({
    queryKey: ['resources', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*, profiles(*)')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ResourceWithUser[];
    },
    enabled: !!groupId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      type: string;
      url?: string;
      group_id?: string;
      course_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('resources')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['resources', data.group_id] });
      }
    },
  });
}
