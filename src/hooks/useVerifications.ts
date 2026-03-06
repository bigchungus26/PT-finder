import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadVerificationDoc, getVerificationDocUrl } from '@/lib/storage';
import type { TutorVerificationRow, ProfileRow } from '@/types/database';

export interface VerificationWithTutor extends TutorVerificationRow {
  tutor: ProfileRow;
}

export function useMyVerifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['verifications', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tutor_verifications')
        .select('*')
        .eq('tutor_id', user.id)
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
      type: TutorVerificationRow['type'];
      documentFile?: File;
      selfieFile?: File;
      notes?: string;
      legalName?: string;
      dateOfBirth?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let documentPath: string | null = null;
      let selfiePath: string | null = null;

      if (input.documentFile) {
        documentPath = await uploadVerificationDoc(input.documentFile, user.id);
      }

      if (input.selfieFile) {
        selfiePath = await uploadVerificationDoc(input.selfieFile, user.id);
      }

      if (!documentPath) {
        throw new Error('Please upload an identity document.');
      }

      const { data, error } = await supabase
        .from('tutor_verifications')
        .insert({
          tutor_id: user.id,
          type: input.type,
          document_path: documentPath,
          selfie_path: selfiePath,
          notes: input.notes || null,
          file_type: input.documentFile?.type || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.legalName || input.dateOfBirth) {
        await supabase
          .from('profiles')
          .update({
            legal_name: input.legalName || undefined,
            date_of_birth: input.dateOfBirth || undefined,
            verification_status: 'pending',
            verification_submitted_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        await supabase
          .from('profiles')
          .update({
            verification_status: 'pending',
            verification_submitted_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      return data as TutorVerificationRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, tutorId, rejectionReason }: {
      id: string;
      status: 'approved' | 'rejected';
      tutorId: string;
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tutor_verifications')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', id);
      if (error) throw error;

      const profileUpdate: Record<string, unknown> = {
        verification_status: status,
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewer_id: user.id,
      };

      if (status === 'approved') {
        profileUpdate.verified_status = true;
        profileUpdate.verification_rejection_reason = null;
      } else {
        profileUpdate.verified_status = false;
        profileUpdate.verification_rejection_reason = rejectionReason || 'Documents did not meet requirements.';
      }

      await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', tutorId);

      await supabase.from('notifications').insert({
        user_id: tutorId,
        type: 'verification_update',
        title: status === 'approved' ? 'Verification approved!' : 'Verification needs attention',
        body: status === 'approved'
          ? 'Your identity has been verified. You now have a verified badge!'
          : `Your verification was not approved: ${rejectionReason || 'Please submit updated documents.'}`,
        link: '/settings',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export { getVerificationDocUrl };
