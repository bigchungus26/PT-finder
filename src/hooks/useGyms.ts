import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GymRow, ProfileRow } from '@/types/database';

export interface GymWithTrainers extends GymRow {
  trainer_count: number;
  trainers?: ProfileRow[];
}

// Fetch all gyms (public listing)
export function useGyms() {
  return useQuery({
    queryKey: ['gyms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as GymRow[];
    },
  });
}

// Fetch a single gym with all its trainers
export function useGym(gymId?: string) {
  return useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId!)
        .single();
      if (gymError) throw gymError;

      const { data: trainers, error: trainersError } = await supabase
        .from('profiles')
        .select('*, availability(*)')
        .eq('gym_id', gymId!)
        .eq('user_role', 'trainer')
        .order('rating_avg', { ascending: false });
      if (trainersError) throw trainersError;

      return {
        ...(gym as GymRow),
        trainers: (trainers ?? []) as ProfileRow[],
        trainer_count: trainers?.length ?? 0,
      } as GymWithTrainers;
    },
    enabled: !!gymId,
  });
}

// Look up a gym by invite code (for trainers joining)
export function useGymByInviteCode(code?: string) {
  return useQuery({
    queryKey: ['gym-by-code', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, city, logo_url')
        .eq('invite_code', code!.toUpperCase())
        .single();
      if (error) throw error;
      return data as Pick<GymRow, 'id' | 'name' | 'city' | 'logo_url'>;
    },
    enabled: !!code && code.trim().length >= 6,
    retry: false,
  });
}

// Create a new gym (for gym role accounts)
export function useCreateGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      city: string;
      address?: string;
      website?: string;
      owner_id: string;
    }) => {
      const { data, error } = await supabase
        .from('gyms')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as GymRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
    },
  });
}

// Update gym profile
export function useUpdateGym(gymId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<GymRow, 'name' | 'description' | 'city' | 'address' | 'logo_url' | 'website'>>) => {
      const { data, error } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gymId!)
        .select()
        .single();
      if (error) throw error;
      return data as GymRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
    },
  });
}

// Trainer joins a gym using invite code
export function useJoinGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, inviteCode }: { userId: string; inviteCode: string }) => {
      // Look up gym by invite code
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();
      if (gymError || !gym) throw new Error('Invalid invite code. Please check with your gym.');

      // Link trainer to gym
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gym_id: gym.id })
        .eq('id', userId);
      if (profileError) throw profileError;

      return gym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });
    },
  });
}

// Trainer leaves their gym
export function useLeaveGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ gym_id: null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });
    },
  });
}
