import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Booking } from '@/lib/api/bookings';
import { useI18n } from '@/lib/i18n';
import { formatDate, listingName } from '@/lib/listings';
import { photoUrl } from '@/lib/supabase-config';
import { Image } from 'expo-image';
import { CalendarDays, CarFront, User } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export function bookingDays(b: Pick<Booking, 'start_date' | 'end_date'>) {
  const ms = new Date(`${b.end_date}T00:00:00`).getTime() - new Date(`${b.start_date}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** One booking request: car thumbnail, dates, status, plus optional actions underneath. */
export function BookingRow({
  booking,
  showUser,
  onPress,
  actions,
}: {
  booking: Booking;
  showUser?: boolean;
  onPress?: () => void;
  actions?: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const photo = booking.listing_photos?.[0];
  const name =
    listingName({
      title: booking.listing_title ?? undefined,
      brand: booking.listing_brand ?? undefined,
      model: booking.listing_model ?? undefined,
    }) ?? t.untitled;

  return (
    <Card className="gap-0 py-0">
      <Pressable onPress={onPress} disabled={!onPress} className="flex-row gap-3 p-3 active:opacity-80">
        <View className="bg-muted h-20 w-24 items-center justify-center overflow-hidden rounded-lg">
          {photo ? (
            <Image source={{ uri: photoUrl(photo) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Icon as={CarFront} size={28} className="text-muted-foreground/50" />
          )}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-start font-semibold" numberOfLines={1}>
              {name}
            </Text>
            <StatusBadge status={booking.status} />
          </View>
          <View className="flex-row items-center gap-1.5">
            <Icon as={CalendarDays} size={14} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-sm">
              {formatDate(booking.start_date, locale)} → {formatDate(booking.end_date, locale)} · {t.days(bookingDays(booking))}
            </Text>
          </View>
          {showUser && booking.username ? (
            <View className="flex-row items-center gap-1.5">
              <Icon as={User} size={14} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-sm">@{booking.username}</Text>
            </View>
          ) : null}
          {booking.note ? (
            <Text className="text-muted-foreground text-start text-sm italic" numberOfLines={2}>
              “{booking.note}”
            </Text>
          ) : null}
        </View>
      </Pressable>
      {actions ? <View className="border-border flex-row gap-2 border-t px-3 py-2.5">{actions}</View> : null}
    </Card>
  );
}
