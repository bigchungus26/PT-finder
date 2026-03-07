import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileRow, AvailabilityRow, CourseRow } from '@/types/database';

export interface ProfileWithDetails extends ProfileRow {
  availability: AvailabilityRow[];
  user_courses: { course_id: string; enrolled_at: string; courses: CourseRow }[];
}

async function fetchProfile(userId: string): Promise<ProfileWithDetails | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: availability }, { data: userCourses }] = await Promise.all([
    supabase.from('availability').select('*').eq('user_id', userId),
    supabase.from('user_courses').select('*, courses(*)').eq('user_id', userId),
  ]);

  return {
    ...profile,
    availability: availability ?? [],
    user_courses: (userCourses ?? []) as ProfileWithDetails['user_courses'],
  };
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

export function useCurrentProfile() {
  const { user } = useAuth();
  return useProfile(user?.id);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ProfileRow>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, availability(*), user_courses(*, courses(*))');
      return (data ?? []) as ProfileWithDetails[];
    },
  });
}
