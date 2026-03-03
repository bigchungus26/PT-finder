import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TutorRequestRow, TutorBidRow, ProfileRow, CourseRow } from '@/types/database';

export interface RequestWithDetails extends TutorRequestRow {
  student: ProfileRow;
  course: CourseRow | null;
  tutor_bids: (TutorBidRow & { tutor: ProfileRow })[];
}

export interface BidWithDetails extends TutorBidRow {
  tutor: ProfileRow;
  request: TutorRequestRow;
}

export function useOpenRequests() {
  return useQuery({
    queryKey: ['tutor-requests', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_requests')
        .select('*, student:profiles!tutor_requests_student_id_fkey(*), course:courses(*), tutor_bids(*, tutor:profiles!tutor_bids_tutor_id_fkey(*))')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestWithDetails[];
    },
  });
}

export function useMyRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tutor-requests', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_requests')
        .select('*, student:profiles!tutor_requests_student_id_fkey(*), course:courses(*), tutor_bids(*, tutor:profiles!tutor_bids_tutor_id_fkey(*))')
        .eq('student_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestWithDetails[];
    },
    enabled: !!user,
  });
}

export function useMyBids() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tutor-bids', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_bids')
        .select('*, tutor:profiles!tutor_bids_tutor_id_fkey(*), request:tutor_requests!tutor_bids_request_id_fkey(*)')
        .eq('tutor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BidWithDetails[];
    },
    enabled: !!user,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      subject?: string;
      course_id?: string;
      max_budget?: number;
      deadline?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_requests')
        .insert({ student_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as TutorRequestRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-requests'] });
    },
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      request_id: string;
      proposed_rate?: number;
      message?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_bids')
        .insert({ tutor_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;

      const { data: request } = await supabase
        .from('tutor_requests')
        .select('student_id')
        .eq('id', input.request_id)
        .single();

      if (request) {
        await supabase.from('notifications').insert({
          user_id: request.student_id,
          type: 'bid_received',
          title: 'New bid on your request',
          body: 'A tutor has applied to help you.',
          link: '/requests',
        });
      }

      return data as TutorBidRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-bids'] });
    },
  });
}

export function useAcceptBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, requestId }: { bidId: string; requestId: string }) => {
      const { error: bidErr } = await supabase
        .from('tutor_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);
      if (bidErr) throw bidErr;

      await supabase
        .from('tutor_bids')
        .update({ status: 'rejected' })
        .eq('request_id', requestId)
        .neq('id', bidId);

      const { error: reqErr } = await supabase
        .from('tutor_requests')
        .update({ status: 'filled' })
        .eq('id', requestId);
      if (reqErr) throw reqErr;

      const { data: bid } = await supabase
        .from('tutor_bids')
        .select('tutor_id')
        .eq('id', bidId)
        .single();

      if (bid) {
        await supabase.from('notifications').insert({
          user_id: bid.tutor_id,
          type: 'bid_accepted',
          title: 'Your bid was accepted!',
          body: 'A student has accepted your offer. Check your messages to coordinate.',
          link: '/requests',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-bids'] });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('tutor_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-requests'] });
    },
  });
}
