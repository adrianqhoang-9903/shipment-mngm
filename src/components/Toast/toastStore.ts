// A minimal external store (React's own `useSyncExternalStore` primitive -
// the same mechanism libraries like Zustand/Redux use to hook non-React
// state into React), not a Context/Provider and not an event-bus library.
// `notify()` is a plain function, importable and callable from anywhere -
// no hook, no prop, no ancestor component has to know about it - so a
// future route tree (e.g. Extra Credit's /assignments) gets toasts for
// free. Exactly one component (`Toast`) ever subscribes, so triggering a
// toast never re-renders anything else, unlike a Context whose value
// changes on every notification.

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
