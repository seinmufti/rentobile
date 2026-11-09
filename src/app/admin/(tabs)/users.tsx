import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useSetRole, useUsers } from '@/lib/api/users';
import { useAuth, type Profile } from '@/lib/auth';
import { confirmAction, notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/listings';
import { Search, ShieldCheck, Users } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

export default function AdminUsersScreen() {
  const { t, locale } = useI18n();
  const { profile: me, refreshProfile } = useAuth();
  const users = useUsers();
  const setRole = useSetRole();
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const list = (users.data ?? []).filter((u) => !q || u.username.includes(q));

  const changeRole = async (u: Profile) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    const ok = await confirmAction({
      title: role === 'admin' ? t.makeAdmin : t.makeUser,
      message: `@${u.username}`,
      confirmLabel: t.confirm,
      cancelLabel: t.cancel,
    });
    if (!ok) return;
    setRole.mutate(
      { id: u.id, role },
      {
        onSuccess: () => {
          // Demoting yourself moves you to the user interface.
          if (u.id === me?.id) refreshProfile();
        },
        onError: (e) => notify(/last admin/i.test(String((e as Error).message)) ? t.lastAdmin : t.errGeneric),
      }
    );
  };

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title={t.users} />
      <FlatList
        data={list}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Card className="flex-row items-center gap-3 px-4 py-3">
            <View className="bg-secondary h-10 w-10 items-center justify-center rounded-full">
              <Text className="font-bold">{item.username[0]?.toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-semibold">@{item.username}</Text>
                {item.role === 'admin' ? <Icon as={ShieldCheck} size={14} className="text-primary" /> : null}
                {item.id === me?.id ? <Text className="text-muted-foreground text-xs">({t.you})</Text> : null}
              </View>
              <Text className="text-muted-foreground text-start text-xs">
                {item.role === 'admin' ? t.roleAdmin : t.roleUser} · {t.joined} {formatDate(item.created_at, locale)}
              </Text>
            </View>
            <Button size="sm" variant={item.role === 'admin' ? 'outline' : 'secondary'} onPress={() => changeRole(item)}>
              <Text>{item.role === 'admin' ? t.makeUser : t.makeAdmin}</Text>
            </Button>
          </Card>
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={users.isRefetching} onRefresh={() => void users.refetch()} />}
        ListHeaderComponent={
          <View className="mb-4 justify-center">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder={t.searchUsers}
              autoCapitalize="none"
              className="h-11 rounded-full ps-10 text-start"
            />
            <View pointerEvents="none" className="absolute start-3.5">
              <Icon as={Search} size={18} className="text-muted-foreground" />
            </View>
          </View>
        }
        ListEmptyComponent={
          users.isPending ? (
            <LoadingState />
          ) : users.isError ? (
            <ErrorState onRetry={() => users.refetch()} />
          ) : (
            <EmptyState icon={Users} title={t.noUsers} />
          )
        }
      />
    </View>
  );
}
