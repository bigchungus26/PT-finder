import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileRow, CourseRow, StudyGroupRow, GroupMemberRow } from '@/types/database';

interface ProfileForMatching extends ProfileRow {
  user_courses: { course_id: string; courses: CourseRow }[];
  availability: { day: string; start_time: string; end_time: string }[];
}

interface GroupForMatching extends StudyGroupRow {
  courses: CourseRow;
  group_members: (GroupMemberRow & { profiles: ProfileRow })[];
}

export interface MatchResult {
  user: ProfileForMatching;
  score: number;
  reasons: { type: string; description: string; weight: number }[];
}

export interface GroupMatchResult {
  group: GroupForMatching;
  score: number;
  reasons: { type: string; description: string; weight: number }[];
}

function computePeopleMatches(currentUser: ProfileForMatching, allUsers: ProfileForMatching[]): MatchResult[] {
  return allUsers
    .filter(u => u.id !== currentUser.id)
    .map(u => {
      const reasons: MatchResult['reasons'] = [];
      let score = 0;

      // Shared courses
      const sharedCourses = currentUser.user_courses.filter(uc =>
        u.user_courses.some(c => c.course_id === uc.course_id)
      );
      if (sharedCourses.length > 0) {
        reasons.push({
          type: 'course',
          description: `Same class: ${sharedCourses.map(c => c.courses.code).join(', ')}`,
          weight: 30,
        });
        score += 30 * sharedCourses.length;
      }

      // Overlapping availability
      const hasOverlap = currentUser.availability.some(ua =>
        u.availability.some(a => a.day === ua.day)
      );
      if (hasOverlap) {
        reasons.push({ type: 'availability', description: 'Overlapping free time', weight: 25 });
        score += 25;
      }

      // Study style match
      const sharedStyles = currentUser.study_style.filter(s => u.study_style.includes(s));
      if (sharedStyles.length > 0) {
        reasons.push({
          type: 'study-style',
          description: `Similar style: ${sharedStyles.join(', ')}`,
          weight: 20,
        });
        score += 20 * sharedStyles.length;
      }

      // Goals match
      const sharedGoals = currentUser.goals.filter(g => u.goals.includes(g));
      if (sharedGoals.length > 0) {
        reasons.push({
          type: 'goal',
          description: `Same goals: ${sharedGoals.join(', ')}`,
          weight: 15,
        });
        score += 15 * sharedGoals.length;
      }

      return { user: u, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

function computeGroupMatches(currentUser: ProfileForMatching, allGroups: GroupForMatching[]): GroupMatchResult[] {
  return allGroups.map(group => {
    const reasons: GroupMatchResult['reasons'] = [];
    let score = 0;

    // Same course
    const isInCourse = currentUser.user_courses.some(c => c.course_id === group.course_id);
    if (isInCourse) {
      reasons.push({ type: 'course', description: `For your ${group.courses.code} class`, weight: 40 });
      score += 40;
    }

    // Level match
    if (group.level === 'beginner' && currentUser.goals.includes('pass')) {
      reasons.push({ type: 'goal', description: 'Good for getting started', weight: 20 });
      score += 20;
    }
    if (group.level === 'advanced' && currentUser.goals.includes('high-grade')) {
      reasons.push({ type: 'goal', description: 'High-achieving focus', weight: 20 });
      score += 20;
    }

    // Style match in tags
    const hasMatchingStyle = group.tags.some(t =>
      currentUser.study_style.some(s => t.includes(s))
    );
    if (hasMatchingStyle) {
      reasons.push({ type: 'study-style', description: 'Matches your study style', weight: 15 });
      score += 15;
    }

    // Space available
    if (group.group_members.length < group.max_members) {
      const spotsLeft = group.max_members - group.group_members.length;
      reasons.push({
        type: 'availability',
        description: `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`,
        weight: 10,
      });
      score += 10;
    }

    return { group, score, reasons };
  }).sort((a, b) => b.score - a.score);
}

export function useRecommendedPeople() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommended-people', user?.id],
    queryFn: async () => {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*, user_courses(*, courses(*)), availability(*)');

      const users = (allUsers ?? []) as ProfileForMatching[];
      const currentUser = users.find(u => u.id === user!.id);
      if (!currentUser) return [];

      return computePeopleMatches(currentUser, users);
    },
    enabled: !!user,
  });
}

export function useRecommendedGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommended-groups', user?.id],
    queryFn: async () => {
      const [{ data: profileData }, { data: groupsData }] = await Promise.all([
        supabase.from('profiles').select('*, user_courses(*, courses(*)), availability(*)').eq('id', user!.id).single(),
        supabase.from('study_groups').select('*, courses(*), group_members(*, profiles(*))'),
      ]);

      if (!profileData) return [];

      const currentUser = profileData as ProfileForMatching;
      const groups = (groupsData ?? []) as GroupForMatching[];

      return computeGroupMatches(currentUser, groups);
    },
    enabled: !!user,
  });
}
