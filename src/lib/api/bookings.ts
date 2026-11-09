import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../auth';
import { supabase } from '../supabase';

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export type Booking = {
  id: string;
  listing_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  decided_at: string | null;
  username: string | null;
  listing_title: string | null;
  listing_brand: string | null;
  listing_model: string | null;
  listing_photos: string[] | null;
};

export function useMyBookings() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['bookings', 'mine', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('booking_requests_detailed')
        .select('*')
        .eq('user_id', uid!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });
}

/** Every booking request (admins only via RLS). Pending ones first. */
export function useAllBookings() {
  return useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('booking_requests_detailed')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data as Booking[];
      return [...rows.filter((b) => b.status === 'pending'), ...rows.filter((b) => b.status !== 'pending')];
    },
  });
}

export function useRequestBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { listingId: string; startDate: string; endDate: string; note?: string }) => {
      const { error } = await supabase.from('booking_requests').insert({
        listing_id: input.listingId,
        start_date: input.startDate,
        end_date: input.endDate,
        note: input.note?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('cancel_booking', { request: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useDecideBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'declined' }) => {
      const { error } = await supabase.rpc('decide_booking', { request: id, new_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
