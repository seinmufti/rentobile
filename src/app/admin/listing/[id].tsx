import { ListingForm } from '@/components/listing-form';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useListing } from '@/lib/api/listings';
import { useI18n } from '@/lib/i18n';
import { router, useLocalSearchParams } from 'expo-router';
import { CarFront } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const listing = useListing(id);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="bg-background flex-1">
      <ScreenHeader back title={t.editListing} hideSettings />
      {listing.isPending ? (
        <LoadingState />
      ) : listing.isError ? (
        <ErrorState onRetry={() => listing.refetch()} />
      ) : !listing.data ? (
        <EmptyState icon={CarFront} title={t.notFound} />
      ) : (
        <ListingForm listing={listing.data} onSaved={() => (router.canGoBack() ? router.back() : router.replace('/admin'))} />
      )}
    </KeyboardAvoidingView>
  );
}
