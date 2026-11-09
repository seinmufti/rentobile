import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profile, Role } from '../auth';
import { supabase } from '../supabase';

/** All profiles (admins only via RLS). */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase.rpc('set_user_role', { target: id, new_role: role });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

async function count(table: string, column?: string, value?: string | boolean) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (column) q = q.eq(column, value!);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

/** Counts for the admin dashboard. */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [listings, hidden, pending, users] = await Promise.all([
        count('listings'),
        count('listings', 'is_published', false),
        count('booking_requests', 'status', 'pending'),
        count('profiles'),
      ]);
      return { listings, hidden, pending, users };
    },
  });
}
