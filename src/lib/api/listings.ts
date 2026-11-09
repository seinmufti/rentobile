import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fromRow, toRow, type Listing, type ListingInput, type ListingRow } from '../listings';
import { supabase } from '../supabase';
import { PHOTO_BUCKET, SUPABASE_CONFIGURED } from '../supabase-config';

export const listingKeys = {
  all: ['listings'] as const,
  list: (scope: 'public' | 'admin') => ['listings', 'list', scope] as const,
  one: (id: string) => ['listings', 'one', id] as const,
};

/** Published listings for users, or every listing for admins. */
export function useListings(scope: 'public' | 'admin' = 'public') {
  return useQuery({
    queryKey: listingKeys.list(scope),
    enabled: SUPABASE_CONFIGURED,
    queryFn: async (): Promise<Listing[]> => {
      let q = supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (scope === 'public') q = q.eq('is_published', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data as ListingRow[]).map(fromRow);
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.one(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Listing | null> => {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data ? fromRow(data as ListingRow) : null;
    },
  });
}

/** Creates a listing when `id` is missing, otherwise updates it. Admin only (enforced by RLS). */
export function useSaveListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<ListingInput> }) => {
      const row = toRow(input);
      const res = id
        ? await supabase.from('listings').update(row).eq('id', id).select('id').single()
        : await supabase.from('listings').insert(row).select('id').single();
      if (res.error) throw res.error;
      return res.data.id as string;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSetPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('listings').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listing: Pick<Listing, 'id' | 'photos'>) => {
      const { error } = await supabase.from('listings').delete().eq('id', listing.id);
      if (error) throw error;
      const stored = listing.photos.filter((p) => !/^https?:/.test(p));
      if (stored.length) await supabase.storage.from(PHOTO_BUCKET).remove(stored);
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
