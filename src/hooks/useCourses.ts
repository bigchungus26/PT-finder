import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CourseRow } from '@/types/database';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as CourseRow[];
    },
  });
}

export function useUserCourses(userId?: string) {
  return useQuery({
    queryKey: ['user-courses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as ({ id: string; user_id: string; course_id: string; enrolled_at: string; courses: CourseRow })[];
    },
    enabled: !!userId,
  });
}

export function useMyCoursesIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as ({ id: string; user_id: string; course_id: string; enrolled_at: string; courses: CourseRow })[];
    },
    enabled: !!user,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_courses')
        .insert({ user_id: user.id, course_id: courseId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
    },
  });
}

export function useUnenrollCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
    },
  });
}
