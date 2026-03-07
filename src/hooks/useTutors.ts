import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow, AvailabilityRow } from '@/types/database';

export interface TrainerWithDetails extends ProfileRow {
  availability: AvailabilityRow[];
}

export interface TrainerFilters {
  specialty?: string;
  minRating?: number;
  maxRate?: number;
  day?: string;
  city?: string;
  gym?: string;
  gender?: string;
  serviceType?: string;
  trainingType?: string;
  gymId?: string;
  freelancerOnly?: boolean;
  trainerType?: 'freelancer' | 'gym_affiliated';
}

export function useTutors(filters?: TrainerFilters) {
  return useQuery({
    queryKey: ['trainers', filters],
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
      if (filters?.trainerType) {
        query = query.eq('trainer_type', filters.trainerType);
      }
      if (filters?.gym) {
        query = query.ilike('gym', `%${filters.gym}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let trainers = (data ?? []) as TrainerWithDetails[];

      if (filters?.city && filters.city !== 'any') {
        const cityLower = filters.city.toLowerCase();
        trainers = trainers.filter(
          (t) =>
            t.city?.toLowerCase().includes(cityLower) ||
            t.area?.toLowerCase().includes(cityLower)
        );
      }

      if (filters?.specialty) {
        const spec = filters.specialty.toLowerCase();
        trainers = trainers.filter((t) =>
          (t.specialty ?? []).some((s: string) => s.toLowerCase().includes(spec))
        );
      }

      if (filters?.trainingType && filters.trainingType !== 'any') {
        const tt = filters.trainingType.toLowerCase();
        trainers = trainers.filter((t) =>
          (t.specialty ?? []).some((s: string) => s.toLowerCase().includes(tt))
        );
      }

      if (filters?.day) {
        trainers = trainers.filter((t) =>
          (t.availability ?? []).some((a) => a.day.toLowerCase() === filters.day!.toLowerCase())
        );
      }

      return trainers;
    },
  });
}

export type TutorWithDetails = TrainerWithDetails;

export function useTutorsForCourse(_courseId?: string) {
  return useQuery({
    queryKey: ['trainers-for-course', _courseId],
    queryFn: async () => [] as TrainerWithDetails[],
    enabled: false,
  });
}

export function useTutor(trainerId?: string) {
  return useQuery({
    queryKey: ['trainer', trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, availability(*)')
        .eq('id', trainerId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Trainer not found');
      return data as TrainerWithDetails;
    },
    enabled: !!trainerId,
  });
}
