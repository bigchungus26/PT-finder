import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { StudyGroupRow, GroupMemberRow, CourseRow, ProfileRow, GroupJoinRequestRow } from '@/types/database';

export interface JoinRequestWithProfile extends GroupJoinRequestRow {
  profiles: ProfileRow;
}

export interface GroupWithDetails extends StudyGroupRow {
  courses: CourseRow;
  group_members: (GroupMemberRow & { profiles: ProfileRow })[];
}

export function useGroups(courseId?: string) {
  return useQuery({
    queryKey: ['groups', courseId],
    queryFn: async () => {
      let query = supabase
        .from('study_groups')
        .select('*, courses(*), group_members(*, profiles(*))')
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as GroupWithDetails[];
    },
  });
}

export function useGroup(groupId?: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*, courses(*), group_members(*, profiles(*))')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return data as GroupWithDetails;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      course_id: string;
      max_members?: number;
      level?: string;
      tags?: string[];
      rules?: string;
      is_public?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/** Request to join a group; group admins must approve. */
export function useRequestToJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, message }: { groupId: string; message?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('group_join_requests')
        .upsert(
          { group_id: groupId, user_id: user.id, message: message ?? null, status: 'pending', reviewed_at: null, reviewed_by: null },
          { onConflict: 'group_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupJoinRequests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/** Pending (and optionally all) join requests for a group. Admins see all; users see their own. */
export function useGroupJoinRequests(groupId: string | undefined, options?: { status?: 'pending' | 'approved' | 'rejected' }) {
  return useQuery({
    queryKey: ['groupJoinRequests', groupId, options?.status],
    queryFn: async () => {
      let query = supabase
        .from('group_join_requests')
        .select('*, profiles(*)')
        .eq('group_id', groupId!);
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as JoinRequestWithProfile[];
    },
    enabled: !!groupId,
  });
}

/** Current user's request for a specific group (if any). */
export function useMyJoinRequest(groupId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myJoinRequest', groupId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('group_id', groupId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as GroupJoinRequestRow | null;
    },
    enabled: !!groupId && !!user,
  });
}

/** Approve a join request: update request and add user to group_members. */
export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: req, error: fetchErr } = await supabase
        .from('group_join_requests')
        .select('group_id, user_id')
        .eq('id', requestId)
        .single();
      if (fetchErr || !req) throw fetchErr || new Error('Request not found');

      const { error: updateErr } = await supabase
        .from('group_join_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq('id', requestId);
      if (updateErr) throw updateErr;

      const { error: insertErr } = await supabase
        .from('group_members')
        .insert({ group_id: req.group_id, user_id: req.user_id, role: 'member' });
      if (insertErr) throw insertErr;

      return { groupId: req.group_id };
    },
    onSuccess: ({ groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupJoinRequests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/** Reject a join request. */
export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: req, error: fetchErr } = await supabase
        .from('group_join_requests')
        .select('group_id')
        .eq('id', requestId)
        .single();
      if (fetchErr || !req) throw fetchErr || new Error('Request not found');

      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq('id', requestId);
      if (error) throw error;
      return { groupId: req.group_id };
    },
    onSuccess: ({ groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groupJoinRequests', groupId] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
