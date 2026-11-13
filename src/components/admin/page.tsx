import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

/** Title row for admin pages, with page actions and the settings gear at the end (top right in LTR). */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <View className="flex-row items-center gap-3 px-8 pb-4 pt-7">
      <View className="flex-1 gap-0.5">
        <Text className="text-start text-2xl font-bold tracking-tight">{title}</Text>
        {subtitle ? <Text className="text-muted-foreground text-start text-sm">{subtitle}</Text> : null}
      </View>
      {actions}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        accessibilityLabel={t.settings}
        onPress={() => router.push('/settings')}
      >
        <Icon as={Settings} size={18} />
      </Button>
    </View>
  );
}

/** Scrollable page body with standard padding. */
export function AdminPageBody({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 120, gap: 20 }}>{children}</ScrollView>
  );
}

export type Column = { key: string; label: string; flex?: number; width?: number; align?: 'start' | 'end' | 'center' };

/** Simple data table: header row + rows rendered by the caller. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderCell,
  empty,
  onRowPress,
  rowClassName,
}: {
  columns: Column[];
  rows: T[];
  rowKey: (row: T) => string;
  renderCell: (row: T, column: Column) => React.ReactNode;
  empty?: React.ReactNode;
  onRowPress?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
}) {
  // minWidth 0 lets long text truncate instead of overflowing into the next column.
  const cellStyle = (c: Column) => (c.width ? { width: c.width } : { flex: c.flex ?? 1, minWidth: 0 });
  const justify = (c: Column) => (c.align === 'end' ? 'items-end' : c.align === 'center' ? 'items-center' : 'items-start');
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <View className="bg-muted/60 border-border flex-row gap-4 border-b px-4 py-2.5">
        {columns.map((c) => (
          <View key={c.key} style={cellStyle(c)} className={cn('overflow-hidden', justify(c))}>
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{c.label}</Text>
          </View>
        ))}
      </View>
      {rows.length === 0
        ? empty
        : rows.map((row, i) => (
            <RowView
              key={rowKey(row)}
              onPress={onRowPress ? () => onRowPress(row) : undefined}
              className={cn(i > 0 && 'border-border border-t', rowClassName?.(row))}
            >
              {columns.map((c) => (
                <View key={c.key} style={cellStyle(c)} className={cn('overflow-hidden', justify(c))}>
                  {renderCell(row, c)}
                </View>
              ))}
            </RowView>
          ))}
    </Card>
  );
}

function RowView({ children, onPress, className }: { children: React.ReactNode; onPress?: () => void; className?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={cn('flex-row items-center gap-4 px-4 py-3', onPress && 'hover:bg-accent/60 active:bg-accent', className)}
    >
      {children}
    </Pressable>
  );
}

/** Small stat tile for the overview row. */
export function StatTile({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <Card className="min-w-36 flex-1 gap-1 px-5 py-4">
      <Text className="text-muted-foreground text-start text-sm">{label}</Text>
      <Text className={cn('text-start text-3xl font-bold', highlight && 'text-primary')}>{value ?? '–'}</Text>
    </Card>
  );
}
