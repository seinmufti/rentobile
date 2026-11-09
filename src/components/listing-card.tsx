import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatPrice, listingName, type Listing } from '@/lib/listings';
import { photoUrl } from '@/lib/supabase-config';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { CalendarDays, CarFront, EyeOff, Heart, MapPin, Palette } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  listing: Listing;
  onPress?: () => void;
  /** When set, shows a heart button. */
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Extra content under the card body (admin actions). */
  footer?: React.ReactNode;
};

export const ListingCard = React.memo(function ListingCard({ listing, onPress, favorite, onToggleFavorite, footer }: Props) {
  const { t, locale } = useI18n();
  const name = listingName(listing) ?? t.untitled;
  const photo = listing.photos[0];
  const [mountedAt] = React.useState(Date.now);
  const isNew = mountedAt - new Date(listing.createdAt).getTime() < 24 * 60 * 60 * 1000;
  const subtitle = [listing.year, listing.title ? [listing.brand, listing.model].filter(Boolean).join(' ') : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', !listing.isPublished && 'opacity-80')}>
      <Pressable onPress={onPress} disabled={!onPress} className="active:opacity-90">
        <View className="bg-muted aspect-[16/10] w-full items-center justify-center">
          {photo ? (
            <Image
              source={{ uri: photoUrl(photo) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Icon as={CarFront} size={56} className="text-muted-foreground/40" />
          )}
          {listing.photos.length > 1 ? (
            <View className="absolute bottom-2 end-2 rounded-full bg-black/60 px-2 py-0.5">
              <Text className="text-xs font-medium text-white">1/{listing.photos.length}</Text>
            </View>
          ) : null}
          <View className="absolute start-3 top-3 flex-row gap-1.5">
            {!listing.isPublished ? (
              <Badge variant="secondary" className="bg-black/70">
                <Icon as={EyeOff} size={12} className="text-white" />
                <Text className="text-white">{t.hidden}</Text>
              </Badge>
            ) : null}
            {isNew ? (
              <Badge>
                <Text>{t.justNow}</Text>
              </Badge>
            ) : null}
          </View>
          {onToggleFavorite ? (
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.favorites}
              accessibilityState={{ selected: !!favorite }}
              className="absolute end-3 top-3 rounded-full bg-black/45 p-2 active:bg-black/60"
            >
              <Icon
                as={Heart}
                size={18}
                className={favorite ? 'fill-red-500 text-red-500' : 'text-white'}
                fill={favorite ? '#ef4444' : 'transparent'}
              />
            </Pressable>
          ) : null}
        </View>

        <View className="gap-3 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="text-start text-lg font-semibold leading-6" numberOfLines={1}>
                {name}
              </Text>
              {subtitle ? (
                <Text className="text-muted-foreground text-start text-sm" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              {listing.pricePerDay != null ? (
                <>
                  <Text className="text-primary text-lg font-bold leading-6">
                    {formatPrice(listing.pricePerDay, listing.currency, locale)}
                  </Text>
                  <Text className="text-muted-foreground text-xs">{t.perDay}</Text>
                </>
              ) : (
                <Text className="text-muted-foreground text-sm">{t.priceOnRequest}</Text>
              )}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            {listing.location ? <Meta icon={MapPin} label={listing.location} /> : null}
            {listing.color ? <Meta icon={Palette} label={listing.color} /> : null}
            {listing.availableFrom || listing.availableTo ? (
              <Meta
                icon={CalendarDays}
                label={[
                  listing.availableFrom ? `${t.from} ${formatDate(listing.availableFrom, locale)}` : null,
                  listing.availableTo ? `${t.to} ${formatDate(listing.availableTo, locale)}` : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ) : null}
          </View>

          {listing.description ? (
            <Text className="text-muted-foreground text-start text-sm leading-5" numberOfLines={2}>
              {listing.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {footer ? <View className="border-border border-t px-4 py-3">{footer}</View> : null}
    </Card>
  );
});

export function Meta({ icon, label }: { icon: React.ComponentProps<typeof Icon>['as']; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon as={icon} size={14} className="text-muted-foreground" />
      <Text className="text-muted-foreground text-sm">{label}</Text>
    </View>
  );
}
