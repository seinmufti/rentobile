import { Wordmark } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { LANGS, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { LogOut, Monitor } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ADMIN_URL = 'www.nordlyssolutions.com/rentobile';

/** Shown to admins on phones and small screens: the admin dashboard is desktop-only. */
export function AdminPhoneBlock() {
  const { t, lang, setLang } = useI18n();
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = React.useState(false);

  return (
    <View
      className="bg-background flex-1 items-center justify-center gap-6 px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Wordmark size="xl" />
      <View className="bg-secondary rounded-full p-6">
        <Icon as={Monitor} size={44} className="text-primary" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-center text-xl font-bold">{t.adminDesktopOnlyTitle}</Text>
        <Text className="text-muted-foreground text-center">{t.adminDesktopOnlyBody}</Text>
        <Text className="text-primary text-center font-semibold" style={{ writingDirection: 'ltr' }}>
          {ADMIN_URL}
        </Text>
      </View>
      <View className="bg-secondary flex-row rounded-full p-1">
        {LANGS.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => setLang(l.code)}
            accessibilityLabel={l.label}
            className={cn('rounded-full px-3 py-1', lang === l.code && 'bg-background')}
          >
            <Text className={cn('text-xs font-semibold', lang === l.code ? 'text-foreground' : 'text-muted-foreground')}>
              {l.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        variant="outline"
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          await signOut();
          setBusy(false);
        }}
      >
        <Icon as={LogOut} size={16} />
        <Text>
          {t.signOut} (@{profile?.username})
        </Text>
      </Button>
    </View>
  );
}
