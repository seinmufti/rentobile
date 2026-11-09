import { Text } from '@/components/ui/text';
import type { BookingStatus } from '@/lib/api/bookings';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

const STYLES: Record<BookingStatus, { box: string; text: string }> = {
  pending: { box: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-800 dark:text-amber-300' },
  approved: { box: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-300' },
  declined: { box: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-300' },
  cancelled: { box: 'bg-muted', text: 'text-muted-foreground' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  const label = {
    pending: t.statusPending,
    approved: t.statusApproved,
    declined: t.statusDeclined,
    cancelled: t.statusCancelled,
  }[status];
  return (
    <View className={cn('rounded-full px-2.5 py-0.5', STYLES[status].box)}>
      <Text className={cn('text-xs font-semibold', STYLES[status].text)}>{label}</Text>
    </View>
  );
}
