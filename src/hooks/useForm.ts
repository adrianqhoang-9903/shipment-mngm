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

  const setFormRef = (node: HTMLFormElement | null) => {
    formRef.current = node;
    if (node) setIsValid(node.checkValidity());
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
    isValid,
    formProps: {
      ref: setFormRef,
      onChange: handleFormChange,
    },
    handleSubmit,
    reset,
  };
};
