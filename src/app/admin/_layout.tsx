import { Wordmark } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAllBookings } from '@/lib/api/bookings';
import { useAuth } from '@/lib/auth';
import { LANGS, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { router, Slot, usePathname, type Href } from 'expo-router';
import { CarFront, Inbox, LogOut, ShieldCheck, Users, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** Desktop admin dashboard: sidebar navigation + content area. */
export default function AdminLayout() {
  const { t } = useI18n();
  const pathname = usePathname();
  const bookings = useAllBookings();
  const pending = bookings.data?.filter((b) => b.status === 'pending').length ?? 0;

  const nav: { href: Href; match: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { href: '/admin', match: '/admin', label: t.adminListings, icon: CarFront },
    { href: '/admin/requests', match: '/admin/requests', label: t.requests, icon: Inbox, badge: pending },
    { href: '/admin/users', match: '/admin/users', label: t.users, icon: Users },
  ];

  return (
    <View className="bg-muted/40 flex-1 flex-row">
      <View className="bg-card border-border w-64 justify-between border-e px-4 py-6">
        <View className="gap-8">
          <View className="gap-1 px-2">
            <Wordmark />
            <Text className="text-muted-foreground text-start text-sm">{t.adminPanel}</Text>
          </View>
          <View className="gap-1">
            {nav.map((item) => {
              const active = pathname === item.match;
              return (
                <Pressable
                  key={item.match}
                  onPress={() => router.navigate(item.href)}
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  className={cn(
                    'flex-row items-center gap-3 rounded-lg px-3 py-2.5',
                    active ? 'bg-primary/10' : 'hover:bg-accent active:bg-accent'
                  )}
                >
                  <Icon as={item.icon} size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
                  <Text className={cn('flex-1 text-start font-medium', active ? 'text-primary' : 'text-foreground')}>
                    {item.label}
                  </Text>
                  {item.badge ? (
                    <View className="bg-primary min-w-6 items-center rounded-full px-1.5 py-0.5">
                      <Text className="text-primary-foreground text-xs font-bold">{item.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
        <SidebarFooter />
      </View>
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}

function SidebarFooter() {
  const { t, lang, setLang } = useI18n();
  const { profile, signOut } = useAuth();
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-muted-foreground px-2 text-start text-xs font-semibold uppercase tracking-wide">
          {t.language}
        </Text>
        <View className="bg-secondary flex-row rounded-lg p-1">
          {LANGS.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => setLang(l.code)}
              accessibilityLabel={l.label}
              className={cn('flex-1 items-center rounded-md py-1.5', lang === l.code && 'bg-background shadow-sm shadow-black/10')}
            >
              <Text className={cn('text-xs font-semibold', lang === l.code ? 'text-foreground' : 'text-muted-foreground')}>
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="border-border flex-row items-center gap-3 border-t px-2 pt-4">
        <View className="bg-primary h-9 w-9 items-center justify-center rounded-full">
          <Text className="text-primary-foreground font-bold">{profile?.username[0]?.toUpperCase()}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-start text-sm font-semibold" numberOfLines={1}>
            @{profile?.username}
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon as={ShieldCheck} size={12} className="text-primary" />
            <Text className="text-muted-foreground text-xs">{t.roleAdmin}</Text>
          </View>
        </View>
        <Button variant="ghost" size="icon" accessibilityLabel={t.signOut} onPress={() => signOut()}>
          <Icon as={LogOut} size={18} />
        </Button>
      </View>
    </View>
  );
}
