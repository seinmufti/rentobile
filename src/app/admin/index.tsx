import { AdminPageBody, AdminPageHeader, DataTable, StatTile, type Column } from '@/components/admin/page';
import { ListingForm } from '@/components/listing-form';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useDeleteListing, useListings, useSetPublished } from '@/lib/api/listings';
import { useAdminStats } from '@/lib/api/users';
import { confirmAction, notify } from '@/lib/confirm';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatPrice, listingName, type Listing } from '@/lib/listings';
import { photoUrl } from '@/lib/supabase-config';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { CarFront, Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** null = closed, 'new' = create, otherwise the listing being edited. */
type PanelState = null | 'new' | Listing;

export default function AdminListingsPage() {
  const { t, locale } = useI18n();
  const listings = useListings('admin');
  const stats = useAdminStats();
  const setPublished = useSetPublished();
  const del = useDeleteListing();
  const [query, setQuery] = React.useState('');
  const [panel, setPanel] = React.useState<PanelState>(null);

  const all = React.useMemo(() => listings.data ?? [], [listings.data]);
  const rows = React.useMemo(() => applyFilters(all, DEFAULT_FILTERS, query), [all, query]);

  const onDelete = async (l: Listing) => {
    const ok = await confirmAction({
      title: t.deleteTitle,
      message: t.deleteBody,
      confirmLabel: t.delete,
      cancelLabel: t.cancel,
      destructive: true,
    });
    if (!ok) return;
    del.mutate(l, {
      onSuccess: () => {
        if (panel !== null && panel !== 'new' && panel.id === l.id) setPanel(null);
      },
      onError: () => notify(t.errGeneric),
    });
  };

  const allColumns: Column[] = [
    { key: 'car', label: t.colCar, flex: 3 },
    { key: 'location', label: t.colLocation, flex: 2 },
    { key: 'price', label: t.colPrice, flex: 1.3 },
    { key: 'status', label: t.colStatus, width: 120 },
    { key: 'added', label: t.colAdded, width: 110 },
    { key: 'actions', label: t.colActions, width: 92, align: 'end' },
  ];
  // With the edit panel open the table is narrow, so show only the essentials.
  const columns = panel === null ? allColumns : allColumns.filter((c) => ['car', 'price', 'actions'].includes(c.key));

  const renderCell = (l: Listing, c: Column) => {
    switch (c.key) {
      case 'car':
        return (
          <View className="w-full flex-row items-center gap-3">
            <View className="bg-muted h-12 w-16 items-center justify-center overflow-hidden rounded-md">
              {l.photos[0] ? (
                <Image source={{ uri: photoUrl(l.photos[0]) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Icon as={CarFront} size={20} className="text-muted-foreground/50" />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-start font-semibold" numberOfLines={1}>
                {listingName(l) ?? t.untitled}
              </Text>
              <Text className="text-muted-foreground text-start text-xs" numberOfLines={1}>
                {[l.year, l.color].filter(Boolean).join(' · ') || '—'}
              </Text>
            </View>
          </View>
        );
      case 'location':
        return (
          <Text className="self-stretch text-start text-sm" numberOfLines={1}>
            {l.location ?? '—'}
          </Text>
        );
      case 'price':
        return (
          <Text className="text-start text-sm font-medium">
            {l.pricePerDay != null ? formatPrice(l.pricePerDay, l.currency, locale) : '—'}
          </Text>
        );
      case 'status':
        return (
          <Pressable
            onPress={() => setPublished.mutate({ id: l.id, published: !l.isPublished })}
            accessibilityRole="switch"
            accessibilityState={{ checked: l.isPublished }}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
              l.isPublished ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-muted'
            )}
          >
            <Icon
              as={l.isPublished ? Eye : EyeOff}
              size={13}
              className={l.isPublished ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}
            />
            <Text
              className={cn(
                'text-xs font-semibold',
                l.isPublished ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground'
              )}
            >
              {l.isPublished ? t.visible : t.hidden}
            </Text>
          </Pressable>
        );
      case 'added':
        return <Text className="text-muted-foreground text-sm">{formatDate(l.createdAt, locale)}</Text>;
      case 'actions':
        return (
          <View className="flex-row gap-1">
            <Button variant="ghost" size="icon" accessibilityLabel={t.edit} onPress={() => setPanel(l)}>
              <Icon as={Pencil} size={16} />
            </Button>
            <Button variant="ghost" size="icon" accessibilityLabel={t.delete} onPress={() => onDelete(l)}>
              <Icon as={Trash2} size={16} className="text-destructive" />
            </Button>
          </View>
        );
    }
  };

  const editingId = panel !== null && panel !== 'new' ? panel.id : undefined;

  return (
    <View className="flex-1 flex-row">
      <View className="flex-1">
        <AdminPageHeader title={t.adminListings} subtitle={t.overview} />
        <AdminPageBody>
          <View className="flex-row flex-wrap gap-4">
            <StatTile label={t.statListings} value={stats.data?.listings} />
            <StatTile label={t.statHidden} value={stats.data?.hidden} />
            <StatTile label={t.statPending} value={stats.data?.pending} highlight={!!stats.data?.pending} />
            <StatTile label={t.statUsers} value={stats.data?.users} />
          </View>

          <View className="max-w-md justify-center">
            <Input value={query} onChangeText={setQuery} placeholder={t.searchPlaceholder} className="h-10 ps-10 text-start" />
            <View pointerEvents="none" className="absolute start-3.5">
              <Icon as={Search} size={16} className="text-muted-foreground" />
            </View>
          </View>

          {listings.isPending ? (
            <LoadingState />
          ) : listings.isError ? (
            <ErrorState onRetry={() => listings.refetch()} />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(l) => l.id}
              renderCell={renderCell}
              onRowPress={(l) => setPanel(l)}
              rowClassName={(l) => (l.id === editingId ? 'bg-primary/5' : undefined)}
              empty={<EmptyState icon={CarFront} title={all.length ? t.noResults : t.emptyTitle} />}
            />
          )}
        </AdminPageBody>

        {/* Floating add button, centered at the bottom of the content area. */}
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-6 items-center">
          <Button size="lg" className="h-12 rounded-full px-6 shadow-lg shadow-black/25" onPress={() => setPanel('new')}>
            <Icon as={Plus} size={18} />
            <Text className="font-semibold">{t.addListing}</Text>
          </Button>
        </View>
      </View>

      {panel !== null ? (
        <View className="bg-background border-border w-[440px] border-s">
          <View className="border-border flex-row items-center justify-between border-b px-5 py-4">
            <Text className="text-lg font-semibold">{panel === 'new' ? t.newListing : t.editListing}</Text>
            <Button variant="ghost" size="icon" accessibilityLabel={t.close} onPress={() => setPanel(null)}>
              <Icon as={X} size={20} />
            </Button>
          </View>
          <ListingForm
            key={panel === 'new' ? 'new' : panel.id}
            listing={panel === 'new' ? undefined : panel}
            onSaved={() => setPanel(null)}
          />
        </View>
      ) : null}
    </View>
  );
}
