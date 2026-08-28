import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import styles from "./FormFields.module.css";

interface TextFieldProps {
  name: string;
  label: string;
  type: "date" | "number" | "text";
  inputMode?: "decimal" | "numeric" | "text";
  value: string | number;
  onChange: (value: string) => void;
  min?: number | string;
  max?: number | string;
  required?: boolean;
  validate?: (value: string) => string;
}

const TextField = ({
  name,
  label,
  type,
  inputMode,
  value,
  onChange,
  min,
  max,
  required,
  validate,
}: TextFieldProps) => {
  const [errorMessage, setErrorMessage] = useState("");

  const applyValidation = (
    event: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>,
  ) => {
    if (validate) {
      event.target.setCustomValidity(validate(event.target.value));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyValidation(event);
    onChange(event.target.value);
    if (errorMessage) {
      setErrorMessage(event.target.validationMessage);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    applyValidation(event);
    setErrorMessage(event.target.validationMessage);
  };

  // Suppresses the browser's own validation bubble on a blocked submit
  // attempt (preventDefault() on `invalid` is specifically what that
  // does - constraint validation itself, and the block on submit, are
  // unaffected). Shows the same message in our own span instead, so
  // nothing is silently lost - a pristine field that's never been
  // touched still gets its `:user-invalid` red border from the attempt
  // (an attempted submission counts as interaction for every control),
  // but would otherwise show no explanatory text without this.
  const handleInvalid = (event: FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    // setErrorMessage(event.currentTarget.validationMessage);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id={name}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          min={min}
          max={max}
          required={required}
          onChange={handleChange}
          onBlur={handleBlur}
          onInvalid={handleInvalid}
        />
        {errorMessage && (
          <span className={styles.errorMessage}>{errorMessage}</span>
        )}
      </div>
    </div>
  );
};

export default TextField;
