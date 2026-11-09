import { FilterSheet } from '@/components/filter-sheet';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useFavoriteIds, useToggleFavorite } from '@/lib/api/favorites';
import { useListings } from '@/lib/api/listings';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/confirm';
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, type Filters } from '@/lib/filters';
import { useI18n } from '@/lib/i18n';
import type { Listing } from '@/lib/listings';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { SUPABASE_CONFIGURED } from '@/lib/supabase-config';
import { CarFront, CloudOff, Search, SlidersHorizontal } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

export default function BrowseScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const listings = useListings('public');
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const all = React.useMemo(() => listings.data ?? [], [listings.data]);
  const filtered = React.useMemo(() => applyFilters(all, filters, query), [all, filters, query]);
  const filterCount = activeFilterCount(filters);

  const onFavorite = React.useCallback(
    (l: Listing) => {
      if (!session) {
        notify(t.signInToFavorite);
        router.push('/sign-in');
        return;
      }
      toggleFav.mutate({ listingId: l.id, favorite: !favIds.data?.has(l.id) });
    },
    [session, favIds.data, toggleFav, t]
  );

  return (
    <View className="bg-background flex-1">
      <ScreenHeader logo subtitle={t.appTagline} />
      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => router.push({ pathname: '/car/[id]', params: { id: item.id } })}
            favorite={favIds.data?.has(item.id)}
            onToggleFavorite={() => onFavorite(item)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={listings.isRefetching} onRefresh={() => void listings.refetch()} />}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="flex-row gap-2">
              <View className="flex-1 justify-center">
                <Input
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t.searchPlaceholder}
                  returnKeyType="search"
                  className="h-11 rounded-full ps-10 text-start"
                />
                <View pointerEvents="none" className="absolute start-3.5">
                  <Icon as={Search} size={18} className="text-muted-foreground" />
                </View>
              </View>
              <Button
                variant={filterCount ? 'default' : 'outline'}
                className={cn('h-11 rounded-full', filterCount ? 'px-4' : 'w-11 px-0')}
                onPress={() => setSheetOpen(true)}
                accessibilityLabel={t.filters}
              >
                <Icon as={SlidersHorizontal} size={18} />
                {filterCount ? <Text>{filterCount}</Text> : null}
              </Button>
            </View>
            {listings.isSuccess && all.length > 0 ? (
              <Text className="text-muted-foreground text-start text-sm">{t.listingsCount(filtered.length)}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !SUPABASE_CONFIGURED ? (
            <EmptyState icon={CloudOff} title={t.notConfigured} />
          ) : listings.isPending ? (
            <LoadingState />
          ) : listings.isError ? (
            <ErrorState onRetry={() => listings.refetch()} />
          ) : (
            <EmptyState
              icon={CarFront}
              title={all.length === 0 ? t.emptyTitle : t.noResults}
              action={
                filterCount || query ? (
                  <Button
                    variant="outline"
                    onPress={() => {
                      setFilters(DEFAULT_FILTERS);
                      setQuery('');
                    }}
                  >
                    <Text>{t.reset}</Text>
                  </Button>
                ) : undefined
              }
            />
          )
        }
      />
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filters}
        onApply={setFilters}
        listings={all}
        query={query}
      />
    </View>
  );
}
