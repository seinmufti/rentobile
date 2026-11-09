import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { setConfirmListener, subscribeToasts, type ConfirmRequest } from '@/lib/confirm';
import { useI18n } from '@/lib/i18n';
import * as React from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Renders toasts from notify() and dialogs from confirmAction(). Mount once at the root. */
export function DialogHost() {
  return (
    <>
      <ConfirmDialog />
      <Toast />
    </>
  );
}

function Toast() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = React.useState<string>();
  const [opacity] = React.useState(() => new Animated.Value(0));

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeToasts((text) => {
      clearTimeout(timer);
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(undefined));
      }, 3500);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [opacity]);

  if (!message) return null;
  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center px-4" style={{ top: insets.top + 12 }}>
      <Animated.View
        style={{ opacity }}
        className="bg-foreground max-w-md rounded-xl px-4 py-3 shadow-lg shadow-black/30"
        accessibilityLiveRegion="polite"
        role="alert"
      >
        <Text className="text-background text-center text-sm font-medium">{message}</Text>
      </Animated.View>
    </View>
  );
}

function ConfirmDialog() {
  const { isRTL } = useI18n();
  const [state, setState] = React.useState<{ req: ConfirmRequest; resolve: (ok: boolean) => void }>();

  React.useEffect(() => {
    setConfirmListener((req, resolve) => setState({ req, resolve }));
    return () => setConfirmListener(undefined);
  }, []);

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(undefined);
  };

  return (
    <Modal visible={!!state} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 p-6" onPress={() => close(false)}>
        <Pressable
          onPress={() => {}}
          role="alertdialog"
          className="bg-card border-border w-full max-w-sm gap-4 rounded-2xl border p-5"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          <Text className="text-start text-lg font-semibold">{state?.req.title}</Text>
          {state?.req.message ? <Text className="text-muted-foreground text-start">{state.req.message}</Text> : null}
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={() => close(false)}>
              <Text>{state?.req.cancelLabel}</Text>
            </Button>
            <Button variant={state?.req.destructive ? 'destructive' : 'default'} onPress={() => close(true)}>
              <Text>{state?.req.confirmLabel}</Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
