export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
};

type ConfirmListener = (req: ConfirmRequest, resolve: (ok: boolean) => void) => void;
let confirmListener: ConfirmListener | undefined;

/** Registers the dialog that answers confirmAction(). Used by <DialogHost />. */
export function setConfirmListener(listener: ConfirmListener | undefined) {
  confirmListener = listener;
}

/** Yes/no confirmation shown as an in-app dialog. Resolves true when the user confirms. */
export function confirmAction(req: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => {
    if (!confirmListener) return resolve(false);
    confirmListener(req, resolve);
  });
}

type ToastListener = (text: string) => void;
const toastListeners = new Set<ToastListener>();

export function subscribeToasts(listener: ToastListener) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

/** Short non-blocking message, shown by <DialogHost /> at the top of the screen. */
export function notify(title: string, message?: string) {
  const text = message ? `${title} ${message}` : title;
  toastListeners.forEach((l) => l(text));
}
