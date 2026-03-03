import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TutorPackageRow } from '@/types/database';

export function useTutorPackages(tutorId?: string) {
  return useQuery({
    queryKey: ['packages', tutorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_packages')
        .select('*')
        .eq('tutor_id', tutorId!)
        .eq('is_active', true)
        .order('total_hours', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TutorPackageRow[];
    },
    enabled: !!tutorId,
  });
}

export function useMyPackages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['packages', user?.id, 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_packages')
        .select('*')
        .eq('tutor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorPackageRow[];
    },
    enabled: !!user,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      total_hours: number;
      price: number;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_packages')
        .insert({ tutor_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as TutorPackageRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      total_hours?: number;
      price?: number;
      description?: string;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from('tutor_packages')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
