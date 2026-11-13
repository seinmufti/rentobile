import { AdminPageBody, AdminPageHeader, DataTable, type Column } from '@/components/admin/page';
import { bookingDays } from '@/components/booking-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAllBookings, useDecideBooking, type Booking } from '@/lib/api/bookings';
import { notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { formatDate, listingName } from '@/lib/listings';
import { photoUrl } from '@/lib/supabase-config';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { CarFront, Check, Inbox, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export default function AdminRequestsPage() {
  const { t, locale } = useI18n();
  const bookings = useAllBookings();
  const decide = useDecideBooking();
  const [filter, setFilter] = React.useState<'pending' | 'all'>('pending');

  const all = bookings.data ?? [];
  const rows = filter === 'pending' ? all.filter((b) => b.status === 'pending') : all;
  const pendingCount = all.filter((b) => b.status === 'pending').length;

  const act = (b: Booking, status: 'approved' | 'declined') =>
    decide.mutate({ id: b.id, status }, { onError: () => notify(t.errGeneric) });

  const columns: Column[] = [
    { key: 'car', label: t.colCar, flex: 2.4 },
    { key: 'user', label: t.colUser, flex: 1.2 },
    { key: 'dates', label: t.colDates, flex: 2 },
    { key: 'note', label: t.colNote, flex: 2 },
    { key: 'requested', label: t.colRequested, width: 110 },
    { key: 'status', label: t.colStatus, width: 100 },
    { key: 'actions', label: t.colActions, width: 200, align: 'end' },
  ];

  const renderCell = (b: Booking, c: Column) => {
    switch (c.key) {
      case 'car': {
        const photo = b.listing_photos?.[0];
        const name =
          listingName({
            title: b.listing_title ?? undefined,
            brand: b.listing_brand ?? undefined,
            model: b.listing_model ?? undefined,
          }) ?? t.untitled;
        return (
          <View className="w-full flex-row items-center gap-3">
            <View className="bg-muted h-10 w-14 items-center justify-center overflow-hidden rounded-md">
              {photo ? (
                <Image source={{ uri: photoUrl(photo) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Icon as={CarFront} size={18} className="text-muted-foreground/50" />
              )}
            </View>
            <Text className="min-w-0 flex-1 text-start font-medium" numberOfLines={1}>
              {name}
            </Text>
          </View>
        );
      }
      case 'user':
        return <Text className="text-sm">@{b.username ?? '—'}</Text>;
      case 'dates':
        return (
          <View>
            <Text className="text-start text-sm">
              {formatDate(b.start_date, locale)} → {formatDate(b.end_date, locale)}
            </Text>
            <Text className="text-muted-foreground text-start text-xs">{t.days(bookingDays(b))}</Text>
          </View>
        );
      case 'note':
        return (
          <Text className="text-muted-foreground self-stretch text-start text-sm" numberOfLines={2}>
            {b.note || '—'}
          </Text>
        );
      case 'requested':
        return <Text className="text-muted-foreground text-sm">{formatDate(b.created_at, locale)}</Text>;
      case 'status':
        return <StatusBadge status={b.status} />;
      case 'actions':
        return b.status === 'pending' ? (
          <View className="flex-row gap-2">
            <Button size="sm" disabled={decide.isPending} onPress={() => act(b, 'approved')}>
              <Icon as={Check} size={14} />
              <Text>{t.approve}</Text>
            </Button>
            <Button size="sm" variant="outline" disabled={decide.isPending} onPress={() => act(b, 'declined')}>
              <Icon as={X} size={14} />
              <Text>{t.decline}</Text>
            </Button>
          </View>
        ) : (
          <Text className="text-muted-foreground text-xs">{b.decided_at ? formatDate(b.decided_at, locale) : ''}</Text>
        );
    }
  };

  return (
    <View className="flex-1">
      <AdminPageHeader
        title={t.requests}
        actions={
          <View className="bg-secondary flex-row rounded-lg p-1">
            {(['pending', 'all'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={cn('rounded-md px-3 py-1.5', filter === f && 'bg-background shadow-sm shadow-black/10')}
              >
                <Text className={cn('text-sm font-medium', filter === f ? 'text-foreground' : 'text-muted-foreground')}>
                  {f === 'pending' ? `${t.filterPending} (${pendingCount})` : `${t.filterAll} (${all.length})`}
                </Text>
              </Pressable>
            ))}
          </View>
        }
      />
      <AdminPageBody>
        {bookings.isPending ? (
          <LoadingState />
        ) : bookings.isError ? (
          <ErrorState onRetry={() => bookings.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(b) => b.id}
            renderCell={renderCell}
            empty={<EmptyState icon={Inbox} title={t.noRequests} />}
          />
        )}
      </AdminPageBody>
    </View>
  );
}
