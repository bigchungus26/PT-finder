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
  compatibilityScore: number;
  reasons: { type: string; description: string; weight: number }[];
  overlappingSlots: { day: string; label: string }[];
}

export interface GroupMatchResult {
  group: GroupForMatching;
  score: number;
  reasons: { type: string; description: string; weight: number }[];
}

const DAY_NAMES: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function timeOverlap(
  a: { start_time: string; end_time: string },
  b: { start_time: string; end_time: string }
): boolean {
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

function formatTimeLabel(start: string): string {
  const hour = parseInt(start.slice(0, 2), 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getOverlappingSlots(
  mine: { day: string; start_time: string; end_time: string }[],
  theirs: { day: string; start_time: string; end_time: string }[]
): { day: string; label: string }[] {
  const out: { day: string; label: string }[] = [];
  mine.forEach((ua) => {
    theirs.forEach((a) => {
      if (ua.day === a.day && timeOverlap(ua, a)) {
        const dayName = DAY_NAMES[ua.day.toLowerCase()] ?? ua.day;
        out.push({ day: dayName, label: `${dayName} ${formatTimeLabel(ua.start_time)}` });
      }
    });
  });
  return [...new Map(out.map((x) => [x.day + x.label, x])).values()];
}

function goalLabel(g: string): string {
  if (g === 'high-grade') return 'aiming for an A';
  if (g === 'pass') return 'focused on passing';
  if (g === 'consistency') return 'consistent study';
  if (g === 'accountability') return 'accountability';
  return g;
}

const MAX_RAW_SCORE = 100;

function computePeopleMatches(
  currentUser: ProfileForMatching,
  allUsers: ProfileForMatching[],
  connectedUserIds: Set<string>
): MatchResult[] {
  return allUsers
    .filter((u) => u.id !== currentUser.id && !connectedUserIds.has(u.id))
    .map((u) => {
      const reasons: MatchResult['reasons'] = [];
      let availabilityScore = 0;
      let studyStyleScore = 0;
      let courseScore = 0;
      let goalScore = 0;

      const overlappingSlots = getOverlappingSlots(
        currentUser.availability ?? [],
        u.availability ?? []
      );
      const hasAvailabilityOverlap = overlappingSlots.length > 0;
      if (hasAvailabilityOverlap) {
        availabilityScore = 35;
        overlappingSlots.slice(0, 2).forEach((slot) => {
          reasons.push({
            type: 'availability',
            description: `Both free ${slot.label}`,
            weight: 17,
          });
        });
        if (overlappingSlots.length > 2) {
          reasons.push({ type: 'availability', description: 'More overlapping times', weight: 1 });
        }
      }

      const sharedStyles = (currentUser.study_style ?? []).filter((s) =>
        (u.study_style ?? []).includes(s)
      );
      if (sharedStyles.length > 0) {
        studyStyleScore = 35;
        reasons.push({
          type: 'study-style',
          description: `Similar style: ${sharedStyles.join(', ')}`,
          weight: 35,
        });
      }

      const sharedCourses = (currentUser.user_courses ?? []).filter((uc) =>
        (u.user_courses ?? []).some((c) => c.course_id === uc.course_id)
      );
      if (sharedCourses.length > 0) {
        const courseMultiplier = hasAvailabilityOverlap ? 1 : 0.3;
        courseScore = 15 * sharedCourses.length * courseMultiplier;
        reasons.push({
          type: 'course',
          description: `Same class: ${sharedCourses.map((c) => c.courses.code).join(', ')}`,
          weight: 15 * sharedCourses.length,
        });
      }

      const sharedGoals = (currentUser.goals ?? []).filter((g) => (u.goals ?? []).includes(g));
      if (sharedGoals.length > 0) {
        goalScore = 10 * sharedGoals.length;
        const courseContext = sharedCourses[0]?.courses?.code ?? '';
        const goalText = sharedGoals.map(goalLabel).join('; ');
        reasons.push({
          type: 'goal',
          description: courseContext
            ? `Both ${goalText} in ${courseContext}`
            : `Same goals: ${goalText}`,
          weight: 10 * sharedGoals.length,
        });
      }

      const rawScore = availabilityScore + studyStyleScore + courseScore + goalScore;
      const compatibilityScore = Math.round(Math.min(100, (rawScore / MAX_RAW_SCORE) * 100));

      return {
        user: u,
        score: rawScore,
        compatibilityScore,
        reasons,
        overlappingSlots,
      };
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
      const [{ data: allUsers }, { data: connections }] = await Promise.all([
        supabase.from('profiles').select('*, user_courses(*, courses(*)), availability(*)'),
        supabase
          .from('connections')
          .select('user_a_id, user_b_id')
          .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
          .in('status', ['pending', 'active', 'ignored', 'blocked']),
      ]);

      const users = (allUsers ?? []) as ProfileForMatching[];
      const currentUser = users.find((u) => u.id === user!.id);
      if (!currentUser) return [];

      const connectedUserIds = new Set<string>();
      (connections ?? []).forEach((c: { user_a_id: string; user_b_id: string }) => {
        connectedUserIds.add(c.user_a_id);
        connectedUserIds.add(c.user_b_id);
      });
      connectedUserIds.delete(user!.id);

      return computePeopleMatches(currentUser, users, connectedUserIds);
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
        supabase.from('profiles').select('*, user_courses(*, courses(*)), availability(*)').eq('id', user!.id).maybeSingle(),
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
