import { BookingRow } from '@/components/booking-row';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAllBookings, useDecideBooking, type Booking } from '@/lib/api/bookings';
import { notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { Check, Inbox, X } from 'lucide-react-native';
import { RefreshControl, SectionList, View } from 'react-native';

export default function AdminRequestsScreen() {
  const { t } = useI18n();
  const bookings = useAllBookings();
  const decide = useDecideBooking();

  const all = bookings.data ?? [];
  const sections = [
    { title: t.pendingSection, data: all.filter((b) => b.status === 'pending') },
    { title: t.historySection, data: all.filter((b) => b.status !== 'pending') },
  ].filter((s) => s.data.length);

  const act = (b: Booking, status: 'approved' | 'declined') =>
    decide.mutate({ id: b.id, status }, { onError: () => notify(t.errGeneric) });

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title={t.requests} />
      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text className="text-muted-foreground mb-2 mt-2 text-start text-sm font-semibold uppercase tracking-wide">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <BookingRow
            booking={item}
            showUser
            actions={
              item.status === 'pending' ? (
                <>
                  <Button size="sm" className="flex-1" disabled={decide.isPending} onPress={() => act(item, 'approved')}>
                    <Icon as={Check} size={14} />
                    <Text>{t.approve}</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={decide.isPending}
                    onPress={() => act(item, 'declined')}
                  >
                    <Icon as={X} size={14} />
                    <Text>{t.decline}</Text>
                  </Button>
                </>
              ) : undefined
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        SectionSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={() => void bookings.refetch()} />}
        ListEmptyComponent={
          bookings.isPending ? (
            <LoadingState />
          ) : bookings.isError ? (
            <ErrorState onRetry={() => bookings.refetch()} />
          ) : (
            <EmptyState icon={Inbox} title={t.noRequests} />
          )
        }
      />
    </View>
  );
}
