import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../auth';
import { fromRow, type Listing, type ListingRow } from '../listings';
import { supabase } from '../supabase';

const favKeys = {
  ids: (uid?: string) => ['favorites', 'ids', uid] as const,
  list: (uid?: string) => ['favorites', 'list', uid] as const,
};

export function useFavoriteIds() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: favKeys.ids(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('favorites').select('listing_id');
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.listing_id as string));
    },
  });
}

export function useFavoriteListings() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: favKeys.list(uid),
    enabled: !!uid,
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from('favorites')
        .select('created_at, listing:listings(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as unknown as { listing: ListingRow | null }).listing)
        .filter((l): l is ListingRow => !!l && l.is_published)
        .map(fromRow);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user.id;
  return useMutation({
    mutationFn: async ({ listingId, favorite }: { listingId: string; favorite: boolean }) => {
      const { error } = favorite
        ? await supabase.from('favorites').insert({ listing_id: listingId })
        : await supabase.from('favorites').delete().eq('listing_id', listingId);
      if (error) throw error;
    },
    // Flip the heart immediately; roll back if the request fails.
    onMutate: async ({ listingId, favorite }) => {
      const key = favKeys.ids(uid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev);
      if (favorite) next.add(listingId);
      else next.delete(listingId);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(favKeys.ids(uid), ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
