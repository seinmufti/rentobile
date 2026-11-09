import { BookingRow } from '@/components/booking-row';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState, SignInPrompt } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCancelBooking, useMyBookings } from '@/lib/api/bookings';
import { useAuth } from '@/lib/auth';
import { confirmAction, notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { router } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { FlatList, RefreshControl, View } from 'react-native';

export default function MyBookingsScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const bookings = useMyBookings();
  const cancel = useCancelBooking();

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title={t.myBookings} />
      {!session ? (
        <SignInPrompt message={t.signInToBook} />
      ) : (
        <FlatList
          data={bookings.data ?? []}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BookingRow
              booking={item}
              onPress={() => router.push({ pathname: '/car/[id]', params: { id: item.listing_id } })}
              actions={
                item.status === 'pending' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancel.isPending}
                    onPress={async () => {
                      const ok = await confirmAction({
                        title: t.cancelRequest,
                        message: '',
                        confirmLabel: t.confirm,
                        cancelLabel: t.close,
                        destructive: true,
                      });
                      if (ok) cancel.mutate(item.id, { onError: () => notify(t.errGeneric) });
                    }}
                  >
                    <Text>{t.cancelRequest}</Text>
                  </Button>
                ) : undefined
              }
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={() => void bookings.refetch()} />}
          ListEmptyComponent={
            bookings.isPending ? (
              <LoadingState />
            ) : bookings.isError ? (
              <ErrorState onRetry={() => bookings.refetch()} />
            ) : (
              <EmptyState icon={CalendarCheck} title={t.noBookings} body={t.noBookingsBody} />
            )
          }
        />
      )}
    </View>
  );
}
