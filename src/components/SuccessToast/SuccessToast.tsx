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
      popover="auto"
      className={styles.toast}
      onToggle={handleToggle}
    >
      {message}
    </div>
  );
};

export default SuccessToast;
