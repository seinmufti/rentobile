import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n';
import { router } from 'expo-router';
import { AlertTriangle, LogIn, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center gap-2 px-6 py-16">
      <View className="bg-secondary mb-2 rounded-full p-5">
        <Icon as={icon} size={36} className="text-muted-foreground" />
      </View>
      <Text className="text-center text-lg font-semibold">{title}</Text>
      {body ? <Text className="text-muted-foreground text-center">{body}</Text> : null}
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="items-center py-16">
      <ActivityIndicator />
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={AlertTriangle}
      title={t.loadError}
      action={
        onRetry ? (
          <Button variant="outline" onPress={onRetry}>
            <Text>{t.retry}</Text>
          </Button>
        ) : undefined
      }
    />
  );
}

/** Shown in place of account-only content for guests. */
export function SignInPrompt({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={LogIn}
      title={message}
      body={t.guestBody}
      action={
        <View className="flex-row gap-2">
          <Button onPress={() => router.push('/sign-in')}>
            <Text>{t.signIn}</Text>
          </Button>
          <Button variant="outline" onPress={() => router.push('/sign-up')}>
            <Text>{t.signUp}</Text>
          </Button>
        </View>
      }
    />
  );
}
