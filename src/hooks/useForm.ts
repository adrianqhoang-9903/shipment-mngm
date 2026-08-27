import { useRef, useState } from "react";
import type { SubmitEvent } from "react";

interface UseFormResult<T> {
  values: T;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  isDirty: boolean;
  isValid: boolean;
  formProps: {
    ref: (node: HTMLFormElement | null) => void;
    onChange: () => void;
  };
  handleSubmit: (
    onValid: (values: T) => void,
  ) => (event: SubmitEvent<HTMLFormElement>) => void;
  reset: (newValues: T) => void;
}

export const useForm = <T extends object>(
  initialValues: T,
): UseFormResult<T> => {
  const [baseline, setBaseline] = useState<T>(initialValues);
  const [values, setValues] = useState<T>(initialValues);
  const [isValid, setIsValid] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // spec does not require any nested value check
  const isDirty = (Object.keys(baseline) as (keyof T)[]).some(
    (key) => values[key] !== baseline[key],
  );

  const reset = (newValues: T) => {
    setBaseline(newValues);
    setValues(newValues);
  };

  const handleFormChange = () => {
    setIsValid(formRef.current?.checkValidity() ?? true);
  };

  // Callback ref instead of a plain RefObject: it fires synchronously at
  // mount time (commit phase, before paint), so the initial isValid check
  // runs as soon as the form's DOM actually exists - no separate mount-only
  // useEffect needed, and no window where isValid is stuck at its `true`
  // default for a form that starts with blank required fields (e.g. Create).
  const setFormRef = (node: HTMLFormElement | null) => {
    formRef.current = node;
    if (node) setIsValid(node.checkValidity());
  };

  const handleSubmit = (onValid: (values: T) => void) => {
    return (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      // No manual checkValidity() re-check here: the browser already runs
      // its own constraint validation before `submit` is even dispatched -
      // if any control were invalid, this handler would never be called.
      onValid(values);
    };
  };

  return {
    values,
    setField,
    isDirty,
    isValid,
    formProps: {
      ref: setFormRef,
      onChange: handleFormChange,
    },
    handleSubmit,
    reset,
    // revalidate: handleFormChange,
  };
};
