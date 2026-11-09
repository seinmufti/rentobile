import { bookingDays } from '@/components/booking-row';
import { DateField } from '@/components/date-field';
import { Meta } from '@/components/listing-card';
import { PhotoGallery } from '@/components/photo-gallery';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useRequestBooking } from '@/lib/api/bookings';
import { useFavoriteIds, useToggleFavorite } from '@/lib/api/favorites';
import { useListing } from '@/lib/api/listings';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatPrice, listingName, whatsappUrl } from '@/lib/listings';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, CarFront, Heart, MapPin, MessageCircle, Palette, Phone } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const listing = useListing(id);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const request = useRequestBooking();

  const [start, setStart] = React.useState<string>();
  const [end, setEnd] = React.useState<string>();
  const [note, setNote] = React.useState('');
  const [formError, setFormError] = React.useState<string>();

  const l = listing.data;
  const isFav = !!l && !!favIds.data?.has(l.id);

  const onFavorite = () => {
    if (!l) return;
    if (!session) {
      notify(t.signInToFavorite);
      router.push('/sign-in');
      return;
    }
    toggleFav.mutate({ listingId: l.id, favorite: !isFav });
  };

  const onRequest = () => {
    if (!l) return;
    if (!start || !end) return setFormError(t.chooseDates);
    if (end < start) return setFormError(t.dateOrderError);
    setFormError(undefined);
    request.mutate(
      { listingId: l.id, startDate: start, endDate: end, note },
      {
        onSuccess: () => {
          setStart(undefined);
          setEnd(undefined);
          setNote('');
          notify(t.requestSent);
        },
        onError: () => setFormError(t.errGeneric),
      }
    );
  };

  const headerActions = l ? (
    <Button variant="secondary" size="icon" className="rounded-full" onPress={onFavorite} accessibilityLabel={t.favorites}>
      <Icon as={Heart} size={20} className={isFav ? 'text-red-500' : undefined} fill={isFav ? '#ef4444' : 'transparent'} />
    </Button>
  ) : null;

  const days = start && end && end >= start ? bookingDays({ start_date: start, end_date: end }) : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="bg-background flex-1">
      <ScreenHeader back title={t.details} actions={headerActions} />
      {listing.isPending ? (
        <LoadingState />
      ) : listing.isError ? (
        <ErrorState onRetry={() => listing.refetch()} />
      ) : !l ? (
        <EmptyState icon={CarFront} title={t.notFound} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <PhotoGallery photos={l.photos} />

          <View className="gap-5 p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-start text-2xl font-bold leading-8">{listingName(l) ?? t.untitled}</Text>
                <Text className="text-muted-foreground text-start">
                  {[l.year, [l.brand, l.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View className="items-end">
                {l.pricePerDay != null ? (
                  <>
                    <Text className="text-primary text-2xl font-bold">{formatPrice(l.pricePerDay, l.currency, locale)}</Text>
                    <Text className="text-muted-foreground text-xs">{t.perDay}</Text>
                  </>
                ) : (
                  <Text className="text-muted-foreground">{t.priceOnRequest}</Text>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-x-5 gap-y-2">
              {l.location ? <Meta icon={MapPin} label={l.location} /> : null}
              {l.color ? <Meta icon={Palette} label={l.color} /> : null}
            </View>

            {l.availableFrom || l.availableTo ? (
              <Section title={t.availability}>
                <Meta
                  icon={CalendarDays}
                  label={[
                    l.availableFrom ? `${t.from} ${formatDate(l.availableFrom, locale)}` : null,
                    l.availableTo ? `${t.to} ${formatDate(l.availableTo, locale)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              </Section>
            ) : null}

            {l.description ? (
              <Section title={t.description}>
                <Text className="text-start leading-6">{l.description}</Text>
              </Section>
            ) : null}

            {l.phone ? (
              <Section title={t.contact}>
                <View className="flex-row gap-2">
                  <Button variant="secondary" className="flex-1" onPress={() => Linking.openURL(`tel:${l.phone}`)}>
                    <Icon as={Phone} size={16} />
                    <Text>{t.call}</Text>
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onPress={() => Linking.openURL(whatsappUrl(l.phone!))}
                  >
                    <Icon as={MessageCircle} size={16} />
                    <Text>{t.whatsapp}</Text>
                  </Button>
                </View>
                <Text className="text-muted-foreground text-center text-sm" style={{ writingDirection: 'ltr' }}>
                  {l.phone}
                </Text>
              </Section>
            ) : null}

            <Card className="gap-4 px-4 py-4">
              <Text className="text-start text-lg font-semibold">{t.requestBooking}</Text>
              {!session ? (
                <View className="gap-3">
                  <Text className="text-muted-foreground text-start">{t.signInToBook}</Text>
                  <View className="flex-row gap-2">
                    <Button className="flex-1" onPress={() => router.push('/sign-in')}>
                      <Text>{t.signIn}</Text>
                    </Button>
                    <Button variant="outline" className="flex-1" onPress={() => router.push('/sign-up')}>
                      <Text>{t.signUp}</Text>
                    </Button>
                  </View>
                </View>
              ) : (
                <>
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-1.5">
                      <Label className="text-start">{t.bookingStart}</Label>
                      <DateField value={start} onChange={setStart} minimumDate={today()} />
                    </View>
                    <View className="flex-1 gap-1.5">
                      <Label className="text-start">{t.bookingEnd}</Label>
                      <DateField value={end} onChange={setEnd} minimumDate={start ?? today()} />
                    </View>
                  </View>
                  <View className="gap-1.5">
                    <Label className="text-start">{t.note}</Label>
                    <Textarea value={note} onChangeText={setNote} placeholder={t.notePh} className="text-start" />
                  </View>
                  {days > 0 ? (
                    <View className="bg-secondary flex-row items-center justify-between rounded-md px-3 py-2">
                      <Text className="text-sm">{t.days(days)}</Text>
                      {l.pricePerDay != null ? (
                        <Text className="text-sm font-semibold">
                          {t.estTotal}: {formatPrice(l.pricePerDay * days, l.currency, locale)}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {formError ? <Text className="text-destructive text-start text-sm">{formError}</Text> : null}
                  <Button size="lg" className="h-12 rounded-full" disabled={request.isPending} onPress={onRequest}>
                    <Text className="font-semibold">{t.sendRequest}</Text>
                  </Button>
                </>
              )}
            </Card>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-start text-base font-semibold">{title}</Text>
      {children}
    </View>
  );
}
