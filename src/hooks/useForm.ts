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
  initialValues: T,
): UseFormResult<T> => {
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
    setBaseline(newValues);
    setValues(newValues);
  };

  // No isValid/checkValidity() tracking here at all, and no ref to the
  // form element either - nothing needs one. The Save button isn't
  // preemptively disabled for content reasons at all (only isSaving, in
  // the consuming component); the browser's own constraint validation
  // still runs before `submit` fires on a real click, and an attempted
  // submission counts as "interaction" for every control per spec, so
  // :user-invalid styling lights up everything wrong the moment someone
  // actually tries to save - no JS needs to know the form's validity
  // ahead of time to make that work.
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
