import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { LANGS, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Check, Languages, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = React.useState(false);

  return (
    <View className="bg-background flex-1">
      <ScreenHeader back title={t.settings} hideSettings />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
          gap: 24,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Section icon={Languages} title={t.language}>
          <Card className="gap-0 py-0">
            {LANGS.map((l, i) => (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: lang === l.code }}
                className={cn('active:bg-accent flex-row items-center justify-between px-4 py-3.5', i > 0 && 'border-border border-t')}
              >
                <Text className={cn('text-base', lang === l.code && 'font-semibold')}>{l.label}</Text>
                {lang === l.code ? <Icon as={Check} size={18} className="text-primary" /> : null}
              </Pressable>
            ))}
          </Card>
        </Section>

        <Section icon={UserRound} title={t.account}>
          <Card className="gap-4 px-4 py-4">
            {profile ? (
              <>
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary h-12 w-12 items-center justify-center rounded-full">
                    <Text className="text-primary-foreground text-lg font-bold">{profile.username[0]?.toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted-foreground text-start text-xs">{t.signedInAs}</Text>
                    <Text className="text-start text-lg font-semibold">@{profile.username}</Text>
                  </View>
                  <View className="bg-secondary flex-row items-center gap-1 rounded-full px-2.5 py-1">
                    {profile.role === 'admin' ? <Icon as={ShieldCheck} size={14} className="text-primary" /> : null}
                    <Text className="text-xs font-semibold">{profile.role === 'admin' ? t.roleAdmin : t.roleUser}</Text>
                  </View>
                </View>
                <Button
                  variant="outline"
                  disabled={signingOut}
                  onPress={async () => {
                    setSigningOut(true);
                    await signOut();
                    setSigningOut(false);
                    router.dismissTo('/');
                  }}
                >
                  <Icon as={LogOut} size={16} />
                  <Text>{t.signOut}</Text>
                </Button>
              </>
            ) : (
              <>
                <View className="gap-1">
                  <Text className="text-start font-semibold">{t.guestTitle}</Text>
                  <Text className="text-muted-foreground text-start text-sm">{t.guestBody}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Button className="flex-1" onPress={() => router.push('/sign-in')}>
                    <Text>{t.signIn}</Text>
                  </Button>
                  <Button variant="outline" className="flex-1" onPress={() => router.push('/sign-up')}>
                    <Text>{t.signUp}</Text>
                  </Button>
                </View>
              </>
            )}
          </Card>
        </Section>

        <Text className="text-muted-foreground text-center text-xs">
          Rentobile · {t.version} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ icon, title, children }: { icon: typeof Languages; title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2 px-1">
        <Icon as={icon} size={16} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-start text-sm font-semibold uppercase tracking-wide">{title}</Text>
      </View>
      {children}
    </View>
  );
}
