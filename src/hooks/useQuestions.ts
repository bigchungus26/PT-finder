import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { QuestionRow, AnswerRow, ProfileRow } from '@/types/database';

export interface AnswerWithDetails extends AnswerRow {
  profiles: ProfileRow;
  vote_count: number;
  user_voted: boolean;
}

export interface QuestionWithDetails extends QuestionRow {
  profiles: ProfileRow;
  courses: { id: string; code: string; title: string };
  answers: (AnswerRow & { profiles: ProfileRow })[];
  vote_count: number;
  user_voted: boolean;
}

export function useCourseQuestions(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['questions', courseId],
    queryFn: async () => {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*, profiles(*), courses(*), answers(*, profiles(*))')
        .eq('course_id', courseId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get vote counts
      const questionIds = (questions ?? []).map(q => q.id);
      const { data: votes } = await supabase
        .from('question_votes')
        .select('question_id, user_id')
        .in('question_id', questionIds);

      return (questions ?? []).map(q => {
        const qVotes = (votes ?? []).filter(v => v.question_id === q.id);
        return {
          ...q,
          vote_count: qVotes.length,
          user_voted: user ? qVotes.some(v => v.user_id === user.id) : false,
        };
      }) as QuestionWithDetails[];
    },
    enabled: !!courseId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      course_id: string;
      title: string;
      content: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('questions')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions', data.course_id] });
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ questionId, content }: { questionId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('answers')
        .insert({ question_id: questionId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useVoteQuestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ questionId, hasVoted }: { questionId: string; hasVoted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasVoted) {
        const { error } = await supabase
          .from('question_votes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_votes')
          .insert({ question_id: questionId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useVoteAnswer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ answerId, hasVoted }: { answerId: string; hasVoted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasVoted) {
        const { error } = await supabase
          .from('answer_votes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('answer_votes')
          .insert({ answer_id: answerId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useAcceptAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ answerId, questionId }: { answerId: string; questionId: string }) => {
      // Mark answer as accepted
      const { error: answerError } = await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId);
      if (answerError) throw answerError;

      // Mark question as resolved
      const { error: questionError } = await supabase
        .from('questions')
        .update({ is_resolved: true })
        .eq('id', questionId);
      if (questionError) throw questionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
