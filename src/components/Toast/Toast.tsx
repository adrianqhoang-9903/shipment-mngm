import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";
import { subscribeToast, getToastSnapshot, dismissToast } from "./toastStore";
import styles from "./Toast.module.css";

const DISPLAY_DURATION_MS = 5000;

// No props - subscribes directly to the store. Mount this once, anywhere
// stable (App.tsx); any component anywhere can trigger it by importing
// `notify` from ./toastStore, with no plumbing back to here.
const Toast = () => {
  const toast = useSyncExternalStore(subscribeToast, getToastSnapshot);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover || !toast) return;

    popover.showPopover();
    const timeout = setTimeout(() => popover.hidePopover(), DISPLAY_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [toast]);

  const handleToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    if ((event.nativeEvent as ToggleEvent).newState === "closed") {
      dismissToast();
    }
  };

  return (
    <div
      ref={popoverRef}
      // "manual" (not "auto") - this is a timed toast, not something meant
      // to light-dismiss on an unrelated click. "auto" was closing it the
      // instant any other click landed on the page (including the same
      // button re-triggering it) before showPopover() ever got called
      // again, since an identical message string wouldn't otherwise be
      // seen as a state change either.
      popover="manual"
      className={`${styles.toast} ${toast?.variant === "error" ? styles.error : ""}`}
      onToggle={handleToggle}
    >
      {toast?.text}
    </div>
  );
};

export default Toast;
