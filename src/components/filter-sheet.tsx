import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { applyFilters, cityOf, DEFAULT_FILTERS, distinct, type Filters, type Sort } from '@/lib/filters';
import { useI18n } from '@/lib/i18n';
import { CURRENCIES, type Listing } from '@/lib/listings';
import { MOBILE_COLUMN_WIDTH } from '@/lib/use-layout';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  onClose: () => void;
  value: Filters;
  onApply: (f: Filters) => void;
  listings: Listing[];
  query: string;
};

export function FilterSheet(props: Props) {
  // Mount the body only while open so its draft state starts from the applied filters each time.
  return (
    <Modal visible={props.open} transparent animationType="slide" onRequestClose={props.onClose}>
      {props.open ? <FilterBody {...props} /> : null}
    </Modal>
  );
}

function FilterBody({ onClose, value, onApply, listings, query }: Props) {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = React.useState(value);
  const [minText, setMinText] = React.useState(value.minPrice?.toString() ?? '');
  const [maxText, setMaxText] = React.useState(value.maxPrice?.toString() ?? '');
  const [yearText, setYearText] = React.useState(value.yearFrom?.toString() ?? '');

  const parse = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : undefined);
  const current: Filters = { ...draft, minPrice: parse(minText), maxPrice: parse(maxText), yearFrom: parse(yearText) };
  const resultCount = applyFilters(listings, current, query).length;

  const cities = distinct(listings.map(cityOf));
  const brands = distinct(listings.map((l) => l.brand));
  const sorts: { key: Sort; label: string }[] = [
    { key: 'newest', label: t.sortNewest },
    { key: 'priceLow', label: t.sortPriceLow },
    { key: 'priceHigh', label: t.sortPriceHigh },
  ];

  return (
    <>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} accessibilityLabel={t.close} />
      <View
        className="bg-background max-h-[85%] rounded-t-3xl"
        style={{
          paddingBottom: insets.bottom + 12,
          direction: isRTL ? 'rtl' : 'ltr',
          width: '100%',
          maxWidth: MOBILE_COLUMN_WIDTH,
          alignSelf: 'center',
        }}
      >
        <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
          <Text className="text-xl font-bold">{t.filters}</Text>
          <Button variant="ghost" size="icon" onPress={onClose} accessibilityLabel={t.close}>
            <Icon as={X} size={22} />
          </Button>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 20, paddingBottom: 12 }}>
          <Group label={t.sortBy}>
            {sorts.map((s) => (
              <Chip key={s.key} label={s.label} active={draft.sort === s.key} onPress={() => setDraft({ ...draft, sort: s.key })} />
            ))}
          </Group>

          <View className="gap-2">
            <Label className="text-start">{t.priceRange}</Label>
            <View className="flex-row items-center gap-2">
              <Input
                value={minText}
                onChangeText={(v) => setMinText(v.replace(/[^\d]/g, ''))}
                placeholder={t.minPrice}
                keyboardType="number-pad"
                className="flex-1 text-start"
              />
              <Text className="text-muted-foreground">–</Text>
              <Input
                value={maxText}
                onChangeText={(v) => setMaxText(v.replace(/[^\d]/g, ''))}
                placeholder={t.maxPrice}
                keyboardType="number-pad"
                className="flex-1 text-start"
              />
              <View className="bg-secondary flex-row rounded-md p-1">
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setDraft({ ...draft, currency: c })}
                    className={cn('justify-center rounded px-2.5 py-1.5', draft.currency === c && 'bg-background shadow-sm shadow-black/10')}
                  >
                    <Text className={cn('text-xs font-semibold', draft.currency === c ? 'text-foreground' : 'text-muted-foreground')}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {cities.length ? (
            <Group label={t.city}>
              <Chip label={t.any} active={!draft.city} onPress={() => setDraft({ ...draft, city: undefined })} />
              {cities.map((c) => (
                <Chip key={c} label={c} active={draft.city === c} onPress={() => setDraft({ ...draft, city: c })} />
              ))}
            </Group>
          ) : null}

          {brands.length ? (
            <Group label={t.brand}>
              <Chip label={t.any} active={!draft.brand} onPress={() => setDraft({ ...draft, brand: undefined })} />
              {brands.map((b) => (
                <Chip key={b} label={b} active={draft.brand === b} onPress={() => setDraft({ ...draft, brand: b })} />
              ))}
            </Group>
          ) : null}

          <View className="gap-2">
            <Label className="text-start">{t.yearFrom}</Label>
            <Input
              value={yearText}
              onChangeText={(v) => setYearText(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="2018"
              keyboardType="number-pad"
              className="text-start"
            />
          </View>
        </ScrollView>

        <View className="flex-row gap-3 px-5 pt-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-full"
            onPress={() => {
              setDraft(DEFAULT_FILTERS);
              setMinText('');
              setMaxText('');
              setYearText('');
            }}
          >
            <Text>{t.reset}</Text>
          </Button>
          <Button
            className="h-12 flex-[2] rounded-full"
            onPress={() => {
              onApply(current);
              onClose();
            }}
          >
            <Text className="font-semibold">{t.showResults(resultCount)}</Text>
          </Button>
        </View>
      </View>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label className="text-start">{label}</Label>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      className={cn('rounded-full border px-3.5 py-1.5', active ? 'border-primary bg-primary' : 'border-border bg-background')}
    >
      <Text className={cn('text-sm font-medium', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</Text>
    </Pressable>
  );
}
