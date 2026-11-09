import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useDeleteListing, useListings, useSetPublished } from '@/lib/api/listings';
import { useAdminStats } from '@/lib/api/users';
import { confirmAction, notify } from '@/lib/confirm';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import { useI18n } from '@/lib/i18n';
import type { Listing } from '@/lib/listings';
import { router } from 'expo-router';
import { CarFront, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

export default function AdminListingsScreen() {
  const { t } = useI18n();
  const listings = useListings('admin');
  const stats = useAdminStats();
  const setPublished = useSetPublished();
  const del = useDeleteListing();
  const [query, setQuery] = React.useState('');

  const all = React.useMemo(() => listings.data ?? [], [listings.data]);
  const filtered = React.useMemo(() => applyFilters(all, DEFAULT_FILTERS, query), [all, query]);

  const onDelete = async (l: Listing) => {
    const ok = await confirmAction({
      title: t.deleteTitle,
      message: t.deleteBody,
      confirmLabel: t.delete,
      cancelLabel: t.cancel,
      destructive: true,
    });
    if (ok) del.mutate(l, { onError: () => notify(t.errGeneric) });
  };

  const edit = (l: Listing) => router.push({ pathname: '/admin/listing/[id]', params: { id: l.id } });

  return (
    <View className="bg-background flex-1">
      <ScreenHeader logo subtitle={t.adminPanel} />
      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => edit(item)}
            footer={
              <View className="flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1" onPress={() => edit(item)}>
                  <Icon as={Pencil} size={14} />
                  <Text>{t.edit}</Text>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onPress={() => setPublished.mutate({ id: item.id, published: !item.isPublished })}
                >
                  {/* Shows the current state; tapping toggles it. */}
                  <Icon as={item.isPublished ? Eye : EyeOff} size={14} />
                  <Text>{item.isPublished ? t.visible : t.hidden}</Text>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => onDelete(item)}
                  accessibilityLabel={t.delete}
                  className="px-3"
                >
                  <Icon as={Trash2} size={14} className="text-destructive" />
                </Button>
              </View>
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 112, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={listings.isRefetching}
            onRefresh={() => {
              listings.refetch();
              stats.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-4">
            <View className="flex-row gap-2">
              <Stat label={t.statListings} value={stats.data?.listings} />
              <Stat label={t.statHidden} value={stats.data?.hidden} />
              <Stat label={t.statPending} value={stats.data?.pending} highlight={!!stats.data?.pending} />
              <Stat label={t.statUsers} value={stats.data?.users} />
            </View>
            <View className="justify-center">
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder={t.searchPlaceholder}
                className="h-11 rounded-full ps-10 text-start"
              />
              <View pointerEvents="none" className="absolute start-3.5">
                <Icon as={Search} size={18} className="text-muted-foreground" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          listings.isPending ? (
            <LoadingState />
          ) : listings.isError ? (
            <ErrorState onRetry={() => listings.refetch()} />
          ) : (
            <EmptyState icon={CarFront} title={all.length ? t.noResults : t.emptyTitle} body={all.length ? undefined : t.emptyBody} />
          )
        }
      />

      {/* Floating add button, centered at the bottom (admins only). */}
      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-5 items-center">
        <Button
          size="lg"
          className="h-14 rounded-full px-7 shadow-lg shadow-black/25"
          onPress={() => router.push('/admin/listing/new')}
        >
          <Icon as={Plus} size={20} />
          <Text className="text-base font-semibold">{t.addListing}</Text>
        </Button>
      </View>
    </View>
  );
}

function Stat({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <Card className="flex-1 items-center gap-0.5 px-1 py-3">
      <Text className={highlight ? 'text-primary text-xl font-bold' : 'text-xl font-bold'}>{value ?? '–'}</Text>
      <Text className="text-muted-foreground text-center text-[11px]" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}
