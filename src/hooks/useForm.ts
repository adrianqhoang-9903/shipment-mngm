import { useState } from "react";
import type { SubmitEvent } from "react";

interface UseFormResult<T> {
  values: T;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  isDirty: boolean;
  handleSubmit: (
    onValid: (values: T) => void,
  ) => (event: SubmitEvent<HTMLFormElement>) => void;
  reset: (newValues: T) => void;
}

export const useForm = <T extends object>(
  createInitialValues: () => T,
): UseFormResult<T> => {
  const [baseline, setBaseline] = useState<T>(createInitialValues);
  const [values, setValues] = useState<T>(createInitialValues);

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
    reset,
  };
};
