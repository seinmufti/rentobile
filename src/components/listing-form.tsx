import { DateField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useSaveListing } from '@/lib/api/listings';
import { notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { CURRENCIES, type Currency, type Listing, type ListingInput } from '@/lib/listings';
import { pickPhotos, uploadPhoto, type PickedPhoto } from '@/lib/photos';
import { photoUrl } from '@/lib/supabase-config';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { Eye, EyeOff, ImagePlus, X } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_PHOTOS = 8;

/** A photo already in storage (path) or newly picked and not yet uploaded. */
type FormPhoto = { key: string; path?: string; picked?: PickedPhoto };

type Form = {
  title: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  price: string;
  currency: Currency;
  location: string;
  availableFrom?: string;
  availableTo?: string;
  photos: FormPhoto[];
  description: string;
  phone: string;
  isPublished: boolean;
};

function fromListing(l?: Listing): Form {
  return {
    title: l?.title ?? '',
    brand: l?.brand ?? '',
    model: l?.model ?? '',
    year: l?.year?.toString() ?? '',
    color: l?.color ?? '',
    price: l?.pricePerDay?.toString() ?? '',
    currency: l?.currency ?? 'USD',
    location: l?.location ?? '',
    availableFrom: l?.availableFrom,
    availableTo: l?.availableTo,
    photos: (l?.photos ?? []).map((p) => ({ key: p, path: p })),
    description: l?.description ?? '',
    phone: l?.phone ?? '',
    isPublished: l?.isPublished ?? true,
  };
}

/** Converts the form to listing fields; anything left empty becomes undefined (cleared). */
function toInput(f: Form, photos: string[]): ListingInput {
  const str = (s: string) => s.trim() || undefined;
  const num = (s: string) => {
    const n = Number(s.replace(/[^\d.]/g, ''));
    return s.trim() && Number.isFinite(n) ? n : undefined;
  };
  const price = num(f.price);
  return {
    title: str(f.title),
    brand: str(f.brand),
    model: str(f.model),
    year: num(f.year),
    color: str(f.color),
    pricePerDay: price,
    currency: price != null ? f.currency : undefined,
    location: str(f.location),
    availableFrom: f.availableFrom,
    availableTo: f.availableTo,
    photos,
    description: str(f.description),
    phone: str(f.phone),
    isPublished: f.isPublished,
  };
}

/** Create/edit form for admins. Every field is optional. */
export function ListingForm({ listing, onSaved }: { listing?: Listing; onSaved: (id: string) => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const save = useSaveListing();
  const [form, setForm] = React.useState<Form>(() => fromListing(listing));
  const [busy, setBusy] = React.useState<'idle' | 'uploading' | 'saving'>('idle');
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onAddPhotos = async () => {
    const picked = await pickPhotos(MAX_PHOTOS - form.photos.length);
    if (!picked.length) return;
    setForm((f) => ({
      ...f,
      photos: [...f.photos, ...picked.map((p, i) => ({ key: `${p.uri}-${Date.now()}-${i}`, picked: p }))].slice(0, MAX_PHOTOS),
    }));
  };

  const onSave = async () => {
    try {
      setBusy('uploading');
      const paths: string[] = [];
      for (const p of form.photos) paths.push(p.path ?? (await uploadPhoto(p.picked!)));
      setBusy('saving');
      const id = await save.mutateAsync({ id: listing?.id, input: toInput(form, paths) });
      onSaved(id);
    } catch {
      notify(t.errGeneric);
    } finally {
      setBusy('idle');
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
    >
      <Text className="text-muted-foreground text-start text-sm">{t.allOptional}</Text>

      <Pressable
        onPress={() => set('isPublished', !form.isPublished)}
        accessibilityRole="switch"
        accessibilityState={{ checked: form.isPublished }}
        className="border-border flex-row items-center justify-between rounded-lg border px-4 py-3"
      >
        <View className="flex-row items-center gap-2">
          <Icon as={form.isPublished ? Eye : EyeOff} size={18} className="text-muted-foreground" />
          <Text className="font-medium">{t.showListing}</Text>
        </View>
        <View className={cn('h-7 w-12 justify-center rounded-full px-0.5', form.isPublished ? 'bg-primary' : 'bg-input')}>
          <View
            className={cn('h-6 w-6 rounded-full bg-white shadow-sm shadow-black/20', form.isPublished && 'ms-auto')}
          />
        </View>
      </Pressable>

      <Section title={t.sectionCar}>
        <Field label={t.title}>
          <Input value={form.title} onChangeText={(v) => set('title', v)} placeholder={t.titlePh} className="text-start" />
        </Field>
        <Row>
          <Field label={t.brand}>
            <Input value={form.brand} onChangeText={(v) => set('brand', v)} placeholder={t.brandPh} className="text-start" />
          </Field>
          <Field label={t.model}>
            <Input value={form.model} onChangeText={(v) => set('model', v)} placeholder={t.modelPh} className="text-start" />
          </Field>
        </Row>
        <Row>
          <Field label={t.year}>
            <Input
              value={form.year}
              onChangeText={(v) => set('year', v.replace(/\D/g, '').slice(0, 4))}
              placeholder={t.yearPh}
              keyboardType="number-pad"
              className="text-start"
            />
          </Field>
          <Field label={t.color}>
            <Input value={form.color} onChangeText={(v) => set('color', v)} placeholder={t.colorPh} className="text-start" />
          </Field>
        </Row>
      </Section>

      <Section title={t.sectionRental}>
        <Field label={t.price}>
          <View className="flex-row gap-2">
            <Input
              value={form.price}
              onChangeText={(v) => set('price', v.replace(/[^\d.]/g, ''))}
              placeholder={t.pricePh}
              keyboardType="decimal-pad"
              className="flex-1 text-start"
            />
            <View accessibilityLabel={t.currency} className="bg-secondary flex-row rounded-md p-1">
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => set('currency', c)}
                  className={cn('justify-center rounded px-3', form.currency === c && 'bg-background shadow-sm shadow-black/10')}
                >
                  <Text className={cn('text-sm font-semibold', form.currency === c ? 'text-foreground' : 'text-muted-foreground')}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Field>
        <Field label={t.location}>
          <Input value={form.location} onChangeText={(v) => set('location', v)} placeholder={t.locationPh} className="text-start" />
        </Field>
        <Field label={t.availableFrom}>
          <DateField value={form.availableFrom} onChange={(v) => set('availableFrom', v)} />
        </Field>
        <Field label={t.availableTo}>
          <DateField value={form.availableTo} onChange={(v) => set('availableTo', v)} minimumDate={form.availableFrom} />
        </Field>
      </Section>

      <Section title={t.sectionPhotos}>
        <Field label={t.photos}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {form.photos.map((p) => (
              <View key={p.key} className="h-24 w-24 overflow-hidden rounded-lg">
                <Image
                  source={{ uri: p.path ? photoUrl(p.path) : p.picked!.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => set('photos', form.photos.filter((x) => x.key !== p.key))}
                  hitSlop={6}
                  className="absolute end-1 top-1 rounded-full bg-black/60 p-1"
                >
                  <Icon as={X} size={12} className="text-white" />
                </Pressable>
              </View>
            ))}
            {form.photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={onAddPhotos}
                className="border-input active:bg-accent h-24 w-24 items-center justify-center gap-1 rounded-lg border border-dashed"
              >
                <Icon as={ImagePlus} size={22} className="text-muted-foreground" />
                <Text className="text-muted-foreground text-center text-xs">{t.addPhotos}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Field>
        <Field label={t.description}>
          <Textarea
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder={t.descriptionPh}
            className="text-start"
          />
        </Field>
        <Field label={t.phone}>
          <Input
            value={form.phone}
            onChangeText={(v) => set('phone', v)}
            placeholder={t.phonePh}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            className="text-start"
          />
        </Field>
      </Section>

      <Button size="lg" className="h-12 rounded-full" disabled={busy !== 'idle'} onPress={onSave}>
        {busy !== 'idle' ? <ActivityIndicator color="white" /> : null}
        <Text className="text-base font-semibold">
          {busy === 'uploading' ? t.uploading : listing ? t.saveChanges : t.save}
        </Text>
      </Button>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-4">
      <Text className="text-start text-base font-semibold">{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row gap-3">{children}</View>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 gap-1.5">
      <Label className="text-start">{label}</Label>
      {children}
    </View>
  );
}
