import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TutorStudentNoteRow } from '@/types/database';

export function useStudentNotes(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['student-notes', user?.id, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_student_notes')
        .select('*')
        .eq('tutor_id', user!.id)
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorStudentNoteRow[];
    },
    enabled: !!user && !!studentId,
  });
}

export function useAllStudentNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['student-notes', user?.id, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_student_notes')
        .select('*')
        .eq('tutor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorStudentNoteRow[];
    },
    enabled: !!user,
  });
}

export function useCreateStudentNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ studentId, content }: { studentId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_student_notes')
        .insert({ tutor_id: user.id, student_id: studentId, content })
        .select()
        .single();
      if (error) throw error;
      return data as TutorStudentNoteRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes'] });
    },
  });
}

export function useUpdateStudentNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const { error } = await supabase
        .from('tutor_student_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes'] });
    },
  });
}

export function useDeleteStudentNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('tutor_student_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes'] });
    },
  });
}
