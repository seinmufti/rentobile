import { ListingForm } from '@/components/listing-form';
import { ScreenHeader } from '@/components/screen-header';
import { useI18n } from '@/lib/i18n';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default function NewListingScreen() {
  const { t } = useI18n();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="bg-background flex-1">
      <ScreenHeader back title={t.newListing} hideSettings />
      <ListingForm onSaved={() => (router.canGoBack() ? router.back() : router.replace('/admin'))} />
    </KeyboardAvoidingView>
  );
}
