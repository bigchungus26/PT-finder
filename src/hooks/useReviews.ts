import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ReviewRow, ProfileRow } from '@/types/database';

export interface ReviewWithStudent extends ReviewRow {
  student: ProfileRow;
}

export function useTutorReviews(tutorId?: string) {
  return useQuery({
    queryKey: ['reviews', tutorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, student:profiles!reviews_student_id_fkey(*)')
        .eq('tutor_id', tutorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewWithStudent[];
    },
    enabled: !!tutorId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      booking_id: string;
      tutor_id: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: input.booking_id,
          student_id: user.id,
          tutor_id: input.tutor_id,
          rating: input.rating,
          comment: input.comment,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReviewRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.tutor_id] });
      queryClient.invalidateQueries({ queryKey: ['tutor', data.tutor_id] });
      queryClient.invalidateQueries({ queryKey: ['tutors'] });
    },
  });
}
