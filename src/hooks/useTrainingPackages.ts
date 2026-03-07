import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TrainingPackageRow } from '@/types/database';

export function useTrainerPackages(trainerId?: string) {
  return useQuery({
    queryKey: ['training-packages', trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_packages')
        .select('*')
        .eq('trainer_id', trainerId!)
        .eq('is_active', true)
        .order('duration_weeks', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrainingPackageRow[];
    },
    enabled: !!trainerId,
  });
}

export function useMyTrainingPackages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['training-packages', user?.id, 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_packages')
        .select('*')
        .eq('trainer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrainingPackageRow[];
    },
    enabled: !!user,
  });
}

export function useCreateTrainingPackage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      duration_weeks: number;
      sessions_per_week: number;
      price_without_diet: number;
      price_with_diet?: number | null;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('training_packages')
        .insert({ trainer_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as TrainingPackageRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-packages'] });
    },
  });
}

export function useUpdateTrainingPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      duration_weeks?: number;
      sessions_per_week?: number;
      price_without_diet?: number;
      price_with_diet?: number | null;
      description?: string;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from('training_packages')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-packages'] });
    },
  });
}
