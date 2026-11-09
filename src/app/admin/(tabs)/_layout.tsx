import { Icon } from '@/components/ui/icon';
import { useAllBookings } from '@/lib/api/bookings';
import { useI18n } from '@/lib/i18n';
import { Tabs } from 'expo-router/js-tabs';
import { CarFront, Inbox, Users } from 'lucide-react-native';

export default function AdminTabsLayout() {
  const { t } = useI18n();
  const bookings = useAllBookings();
  const pending = bookings.data?.filter((b) => b.status === 'pending').length ?? 0;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.adminListings,
          tabBarIcon: ({ color, size }) => <Icon as={CarFront} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t.requests,
          tabBarBadge: pending || undefined,
          tabBarIcon: ({ color, size }) => <Icon as={Inbox} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t.users,
          tabBarIcon: ({ color, size }) => <Icon as={Users} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
