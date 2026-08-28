import { useRef, useState } from "react";
import type { RefObject, SubmitEvent } from "react";

interface UseFormResult<T> {
  values: T;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  isDirty: boolean;
  handleSubmit: (
    onValid: (values: T) => void,
  ) => (event: SubmitEvent<HTMLFormElement>) => void;
  formProps: {
    ref: RefObject<HTMLFormElement | null>;
  };
  reset: (newValues: T) => void;
}

export const useForm = <T extends object>(
  initialValues: T,
): UseFormResult<T> => {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseline, setBaseline] = useState<T>(initialValues);
  const [values, setValues] = useState<T>(initialValues);

  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // spec does not require any nested value check
  const isDirty = (Object.keys(baseline) as (keyof T)[]).some(
    (key) => values[key] !== baseline[key],
  );

  const reset = (newValues: T) => {
    formRef.current?.reset();
    setBaseline(newValues);
    setValues(newValues);
  };

  const handleSubmit = (onValid: (values: T) => void) => {
    return (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      onValid(values);
    };
  };

  return {
    values,
    setField,
    isDirty,
    handleSubmit,
    formProps: {
      ref: formRef,
    },
    reset,
  };
};
