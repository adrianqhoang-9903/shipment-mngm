type ToastVariant = "success" | "error";

interface ToastMessage {
  text: string;
  variant: ToastVariant;
}

type Listener = () => void;

let currentToast: ToastMessage | null = null;
const listeners = new Set<Listener>();

const emitChange = () => {
  for (const listener of listeners) listener();
};

export const subscribeToast = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getToastSnapshot = () => currentToast;

export const notify = (text: string, variant: ToastVariant = "success") => {
  currentToast = { text, variant };
  emitChange();
};

export const dismissToast = () => {
  currentToast = null;
  emitChange();
};
