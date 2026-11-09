import { Icon } from '@/components/ui/icon';
import { useI18n } from '@/lib/i18n';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarCheck, Heart, Search } from 'lucide-react-native';

export default function UserTabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.browse,
          tabBarIcon: ({ color, size }) => <Icon as={Search} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t.favorites,
          tabBarIcon: ({ color, size }) => <Icon as={Heart} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t.myBookings,
          tabBarIcon: ({ color, size }) => <Icon as={CalendarCheck} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
