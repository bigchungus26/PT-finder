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
  // New filters
  city?: string;
  gender?: string;
  serviceType?: string;
  trainingType?: string;
  gymId?: string;
  freelancerOnly?: boolean;
}

export function useTutors(filters?: TutorFilters) {
  return useQuery({
    queryKey: ['tutors', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, availability(*), user_courses(course_id, courses(*))')
        .eq('user_role', 'trainer')
        .order('rating_avg', { ascending: false });

      if (filters?.minRating) {
        query = query.gte('rating_avg', filters.minRating);
      }
      if (filters?.maxRate) {
        query = query.lte('hourly_rate', filters.maxRate);
      }
      if (filters?.gender && filters.gender !== 'any') {
        query = query.eq('gender', filters.gender);
      }
      if (filters?.serviceType && filters.serviceType !== 'any') {
        query = query.eq('service_type', filters.serviceType);
      }
      if (filters?.gymId) {
        query = query.eq('gym_id', filters.gymId);
      }
      if (filters?.freelancerOnly) {
        query = query.is('gym_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      let tutors = (data ?? []) as TutorWithDetails[];

      if (filters?.city && filters.city !== 'any') {
        const cityLower = filters.city.toLowerCase();
        tutors = tutors.filter(
          (t) =>
            t.city?.toLowerCase().includes(cityLower) ||
            t.area?.toLowerCase().includes(cityLower)
        );
      }

      if (filters?.courseId) {
        tutors = tutors.filter((t) =>
          t.user_courses?.some((uc) => uc.course_id === filters.courseId)
        );
      }
      if (filters?.subject) {
        const sub = filters.subject.toLowerCase();
        tutors = tutors.filter((t) =>
          (t.specialty ?? []).some((s) => s.toLowerCase().includes(sub))
        );
      }
      if (filters?.trainingType && filters.trainingType !== 'any') {
        const tt = filters.trainingType.toLowerCase();
        tutors = tutors.filter((t) =>
          (t.specialty ?? []).some((s) => s.toLowerCase().includes(tt))
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
        .eq('user_role', 'trainer')
        .in('id', tutorIds)
        .order('rating_avg', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TutorWithDetails[];
    },
    enabled: !!courseId,
  });
}
