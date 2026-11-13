import { AdminPageBody, AdminPageHeader, DataTable, type Column } from '@/components/admin/page';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useSetRole, useUsers } from '@/lib/api/users';
import { useAuth, type Profile } from '@/lib/auth';
import { confirmAction, notify } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/listings';
import { cn } from '@/lib/utils';
import { Search, ShieldCheck, Users } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const { profile: me, refreshProfile } = useAuth();
  const users = useUsers();
  const setRole = useSetRole();
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const rows = (users.data ?? []).filter((u) => !q || u.username.includes(q));

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
        // Demoting yourself switches you to the user interface.
        onSuccess: () => (u.id === me?.id ? refreshProfile() : undefined),
        onError: (e) => notify(/last admin/i.test(String((e as Error).message)) ? t.lastAdmin : t.errGeneric),
      }
    );
  };

  const columns: Column[] = [
    { key: 'user', label: t.colUser, flex: 2 },
    { key: 'role', label: t.colRole, flex: 1 },
    { key: 'joined', label: t.colJoined, flex: 1 },
    { key: 'actions', label: t.colActions, width: 160, align: 'end' },
  ];

  const renderCell = (u: Profile, c: Column) => {
    switch (c.key) {
      case 'user':
        return (
          <View className="w-full flex-row items-center gap-3">
            <View className="bg-secondary h-9 w-9 items-center justify-center rounded-full">
              <Text className="font-bold">{u.username[0]?.toUpperCase()}</Text>
            </View>
            <Text className="font-semibold">@{u.username}</Text>
            {u.id === me?.id ? <Text className="text-muted-foreground text-xs">({t.you})</Text> : null}
          </View>
        );
      case 'role':
        return (
          <View
            className={cn(
              'flex-row items-center gap-1 rounded-full px-2.5 py-1',
              u.role === 'admin' ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            {u.role === 'admin' ? <Icon as={ShieldCheck} size={13} className="text-primary" /> : null}
            <Text className={cn('text-xs font-semibold', u.role === 'admin' ? 'text-primary' : 'text-muted-foreground')}>
              {u.role === 'admin' ? t.roleAdmin : t.roleUser}
            </Text>
          </View>
        );
      case 'joined':
        return <Text className="text-muted-foreground text-sm">{formatDate(u.created_at, locale)}</Text>;
      case 'actions':
        return (
          <Button size="sm" variant={u.role === 'admin' ? 'outline' : 'secondary'} onPress={() => changeRole(u)}>
            <Text>{u.role === 'admin' ? t.makeUser : t.makeAdmin}</Text>
          </Button>
        );
    }
  };

  return (
    <View className="flex-1">
      <AdminPageHeader title={t.users} />
      <AdminPageBody>
        <View className="max-w-md justify-center">
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchUsers}
            autoCapitalize="none"
            className="h-10 ps-10 text-start"
          />
          <View pointerEvents="none" className="absolute start-3.5">
            <Icon as={Search} size={16} className="text-muted-foreground" />
          </View>
        </View>
        {users.isPending ? (
          <LoadingState />
        ) : users.isError ? (
          <ErrorState onRetry={() => users.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(u) => u.id}
            renderCell={renderCell}
            empty={<EmptyState icon={Users} title={t.noUsers} />}
          />
        )}
      </AdminPageBody>
    </View>
  );
}
