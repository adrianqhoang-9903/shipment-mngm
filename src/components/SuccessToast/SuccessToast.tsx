import { useEffect, useRef, type SyntheticEvent } from "react";
import styles from "./SuccessToast.module.css";

interface SuccessToastProps {
  message: string | null;
  onDismiss: () => void;
}

const DISPLAY_DURATION_MS = 5000;

const SuccessToast = ({ message, onDismiss }: SuccessToastProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover || !message) return;

    popover.showPopover();
    const timeout = setTimeout(() => popover.hidePopover(), DISPLAY_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [message]);

  const handleToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    if ((event.nativeEvent as ToggleEvent).newState === "closed") {
      onDismiss();
    }
  };

  return (
    <div
      ref={popoverRef}
      // "manual" (not "auto") - this is a timed toast, not something meant
      // to light-dismiss on an unrelated click. "auto" was closing it the
      // instant any other click landed on the page (including the same
      // Save button re-triggering it) before showPopover() ever got called
      // again, since the message string not actually changing meant the
      // effect below never re-ran to reopen it.
      popover="manual"
      className={styles.toast}
      onToggle={handleToggle}
    >
      {message}
    </div>
  );
};

export default SuccessToast;
