import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** Shows the Rentobile wordmark instead of a plain title. */
  logo?: boolean;
  title?: string;
  subtitle?: string;
  /** Shows a back button at the start. */
  back?: boolean;
  /** Extra buttons placed before the settings gear. */
  actions?: React.ReactNode;
  /** Hide the settings gear (e.g. on the settings screen itself). */
  hideSettings?: boolean;
};

export function Wordmark({ size = 'lg' }: { size?: 'lg' | 'xl' }) {
  const cls = size === 'xl' ? 'text-4xl' : 'text-3xl';
  return (
    <Text className={`${cls} font-extrabold tracking-tight`}>
      Rent<Text className={`text-primary ${cls} font-extrabold tracking-tight`}>obile</Text>
    </Text>
  );
}

/** Top bar used by every screen: optional back button, title, and the settings gear at the end (top right in LTR). */
export function ScreenHeader({ logo, title, subtitle, back, actions, hideSettings }: Props) {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-background flex-row items-center gap-2 px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
      {back ? (
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="-ms-2"
        >
          <Icon as={isRTL ? ArrowRight : ArrowLeft} size={22} />
        </Button>
      ) : null}
      <View className="flex-1">
        {logo ? <Wordmark /> : <Text className="text-start text-2xl font-bold tracking-tight">{title}</Text>}
        {subtitle ? <Text className="text-muted-foreground text-start text-sm">{subtitle}</Text> : null}
      </View>
      {actions}
      {hideSettings ? null : (
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          accessibilityLabel={t.settings}
          onPress={() => router.push('/settings')}
        >
          <Icon as={Settings} size={20} />
        </Button>
      )}
    </View>
  );
}
