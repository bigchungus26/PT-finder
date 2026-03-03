import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TutorVerificationRow, ProfileRow } from '@/types/database';

export interface VerificationWithTutor extends TutorVerificationRow {
  tutor: ProfileRow;
}

export function useMyVerifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['verifications', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_verifications')
        .select('*')
        .eq('tutor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorVerificationRow[];
    },
    enabled: !!user,
  });
}

export function useAllVerifications(isAdmin: boolean) {
  return useQuery({
    queryKey: ['verifications', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_verifications')
        .select('*, tutor:profiles!tutor_verifications_tutor_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VerificationWithTutor[];
    },
    enabled: isAdmin,
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      type: 'transcript' | 'linkedin' | 'background_check' | 'other';
      document_url?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_verifications')
        .insert({ tutor_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as TutorVerificationRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, tutorId }: {
      id: string;
      status: 'approved' | 'rejected';
      tutorId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tutor_verifications')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      if (status === 'approved') {
        await supabase
          .from('profiles')
          .update({ verified_status: true })
          .eq('id', tutorId);
      }

      await supabase.from('notifications').insert({
        user_id: tutorId,
        type: 'verification_update',
        title: status === 'approved' ? 'Verification approved!' : 'Verification rejected',
        body: status === 'approved'
          ? 'Your verification has been approved. You now have a verified badge!'
          : 'Your verification was not approved. Please submit updated documents.',
        link: '/settings',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}
