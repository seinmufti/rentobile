import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState, SignInPrompt } from '@/components/states';
import { useFavoriteIds, useFavoriteListings, useToggleFavorite } from '@/lib/api/favorites';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { FlatList, RefreshControl, View } from 'react-native';

export default function FavoritesScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const favorites = useFavoriteListings();
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title={t.favorites} />
      {!session ? (
        <SignInPrompt message={t.signInToFavorite} />
      ) : (
        <FlatList
          data={favorites.data ?? []}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/car/[id]', params: { id: item.id } })}
              favorite={favIds.data?.has(item.id) ?? true}
              onToggleFavorite={() => toggleFav.mutate({ listingId: item.id, favorite: !favIds.data?.has(item.id) })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-4" />}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={favorites.isRefetching} onRefresh={() => void favorites.refetch()} />}
          ListEmptyComponent={
            favorites.isPending ? (
              <LoadingState />
            ) : favorites.isError ? (
              <ErrorState onRetry={() => favorites.refetch()} />
            ) : (
              <EmptyState icon={Heart} title={t.noFavorites} body={t.noFavoritesBody} />
            )
          }
        />
      )}
    </View>
  );
}
