import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow, CourseRow, AvailabilityRow } from '@/types/database';

export interface TutorWithDetails extends ProfileRow {
  availability: AvailabilityRow[];
  user_courses: { course_id: string; courses: CourseRow }[];
}

export interface TutorFilters {
  courseId?: string;
  subject?: string;
  minRating?: number;
  maxRate?: number;
  day?: string;
}

export function useTutors(filters?: TutorFilters) {
  return useQuery({
    queryKey: ['tutors', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, availability(*), user_courses(course_id, courses(*))')
        .eq('user_role', 'tutor')
        .order('rating_avg', { ascending: false });

      if (filters?.minRating) {
        query = query.gte('rating_avg', filters.minRating);
      }
      if (filters?.maxRate) {
        query = query.lte('hourly_rate', filters.maxRate);
      }

      const { data, error } = await query;
      if (error) throw error;

      let tutors = (data ?? []) as TutorWithDetails[];

      if (filters?.courseId) {
        tutors = tutors.filter((t) =>
          t.user_courses?.some((uc) => uc.course_id === filters.courseId)
        );
      }
      if (filters?.subject) {
        const sub = filters.subject.toLowerCase();
        tutors = tutors.filter((t) =>
          (t.subjects ?? []).some((s) => s.toLowerCase().includes(sub))
        );
      }
      if (filters?.day) {
        tutors = tutors.filter((t) =>
          (t.availability ?? []).some((a) => a.day.toLowerCase() === filters.day!.toLowerCase())
        );
      }

      return tutors;
    },
  });
}

export function useTutor(tutorId?: string) {
  return useQuery({
    queryKey: ['tutor', tutorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, availability(*), user_courses(course_id, courses(*))')
        .eq('id', tutorId!)
        .single();
      if (error) throw error;
      return data as TutorWithDetails;
    },
    enabled: !!tutorId,
  });
}

export function useTutorsForCourse(courseId?: string) {
  return useQuery({
    queryKey: ['tutors-for-course', courseId],
    queryFn: async () => {
      const { data: userCourses } = await supabase
        .from('user_courses')
        .select('user_id')
        .eq('course_id', courseId!);
      const tutorIds = (userCourses ?? []).map((uc) => uc.user_id);
      if (tutorIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*, availability(*), user_courses(course_id, courses(*))')
        .eq('user_role', 'tutor')
        .in('id', tutorIds)
        .order('rating_avg', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorWithDetails[];
    },
    enabled: !!courseId,
  });
}
