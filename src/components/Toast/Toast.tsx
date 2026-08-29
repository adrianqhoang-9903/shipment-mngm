import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";
import { subscribeToast, getToastSnapshot, dismissToast } from "./toastStore";
import styles from "./Toast.module.css";

const DISPLAY_DURATION_MS = 5000;

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
      popover="manual"
      className={`${styles.toast} ${toast?.variant === "error" ? styles.error : ""}`}
      onToggle={handleToggle}
    >
      {toast?.text}
    </div>
  );
};

export default Toast;
