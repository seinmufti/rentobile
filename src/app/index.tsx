import { LanguageSwitcher } from '@/components/language-switcher';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n';
import { listingName, useListings } from '@/lib/listings';
import { Link } from 'expo-router';
import { CarFront, Plus, Search } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ListingsScreen() {
  const { t } = useI18n();
  const { listings, ready } = useListings();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) =>
      [listingName(l), l.brand, l.model, l.location, l.color, l.year?.toString()]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [listings, query]);

  return (
    <View className="bg-background flex-1">
      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ItemSeparatorComponent={() => <View className="h-4" />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 112, paddingHorizontal: 16 }}
        ListHeaderComponent={
          <View className="mb-4 gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-extrabold tracking-tight">
                  Rent<Text className="text-primary text-3xl font-extrabold tracking-tight">obile</Text>
                </Text>
                <Text className="text-muted-foreground text-start text-sm">{t.appTagline}</Text>
              </View>
              <LanguageSwitcher />
            </View>

            <View className="justify-center">
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder={t.searchPlaceholder}
                returnKeyType="search"
                className="h-11 rounded-full ps-10 text-start"
              />
              <View pointerEvents="none" className="absolute start-3.5">
                <Icon as={Search} size={18} className="text-muted-foreground" />
              </View>
            </View>

            {ready && listings.length > 0 ? (
              <Text className="text-muted-foreground text-start text-sm">{t.listingsCount(filtered.length)}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !ready ? (
            <ActivityIndicator className="mt-16" />
          ) : (
            <View className="items-center gap-2 py-16">
              <View className="bg-secondary mb-2 rounded-full p-5">
                <Icon as={CarFront} size={36} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-semibold">{listings.length === 0 ? t.emptyTitle : t.noResults}</Text>
              {listings.length === 0 ? <Text className="text-muted-foreground text-center">{t.emptyBody}</Text> : null}
            </View>
          )
        }
      />

      {/* Floating add button, centered at the bottom */}
      <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 20 }}>
        <Link href="/add" asChild>
          <Button size="lg" className="h-14 rounded-full px-7 shadow-lg shadow-black/25">
            <Icon as={Plus} size={20} />
            <Text className="text-base font-semibold">{t.addListing}</Text>
          </Button>
        </Link>
      </View>
    </View>
  );
}
