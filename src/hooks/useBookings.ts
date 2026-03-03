import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingRow, ProfileRow, CourseRow } from '@/types/database';

export interface BookingWithDetails extends BookingRow {
  student: ProfileRow;
  tutor: ProfileRow;
  course: CourseRow | null;
}

export function useMyBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, student:profiles!bookings_student_id_fkey(*), tutor:profiles!bookings_tutor_id_fkey(*), course:courses(*)')
        .or(`student_id.eq.${user!.id},tutor_id.eq.${user!.id}`)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as BookingWithDetails[];
    },
    enabled: !!user,
  });
}

export function usePendingBookingsForTutor() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  return bookings.filter(
    (b) => b.tutor_id === user?.id && b.status === 'pending'
  );
}

export function useUpcomingBookings() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  const today = new Date().toISOString().split('T')[0];
  return bookings.filter(
    (b) =>
      (b.status === 'confirmed' || b.status === 'pending') &&
      b.date >= today
  );
}

export function useCompletedBookingsForTutor() {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  return bookings.filter(
    (b) => b.tutor_id === user?.id && b.status === 'completed'
  );
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      tutor_id: string;
      course_id?: string;
      date: string;
      start_time: string;
      end_time: string;
      note?: string;
      student_prep?: string;
      is_recurring?: boolean;
      package_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('bookings')
        .insert({ student_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;

      const prepSummary = input.student_prep
        ? `\n\nSession prep: "${input.student_prep.slice(0, 120)}${input.student_prep.length > 120 ? '...' : ''}"`
        : '';

      await supabase.from('notifications').insert({
        user_id: input.tutor_id,
        type: 'booking_request',
        title: 'New booking request',
        body: `A student wants to book a session on ${input.date} at ${input.start_time}.${input.is_recurring ? ' (Recurring weekly)' : ''}${prepSummary}`,
        link: '/dashboard',
      });

      return data as BookingRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: 'confirmed' | 'completed' | 'cancelled';
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select('*, student:profiles!bookings_student_id_fkey(*), tutor:profiles!bookings_tutor_id_fkey(*)')
        .single();
      if (error) throw error;

      const booking = data as BookingWithDetails;
      const recipientId =
        status === 'confirmed' || status === 'cancelled'
          ? booking.student_id
          : booking.tutor_id;
      const label =
        status === 'confirmed'
          ? 'Booking confirmed'
          : status === 'cancelled'
          ? 'Booking cancelled'
          : 'Session completed';

      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: `booking_${status}`,
        title: label,
        body: `Your session on ${booking.date} at ${booking.start_time} has been ${status}.`,
        link: '/dashboard',
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
