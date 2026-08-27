import { useState, type ChangeEvent, type FocusEvent } from "react";
import styles from "./ShipmentField.module.css";

interface EditableFieldProps {
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

const EditableField = ({
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
}: EditableFieldProps) => {
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
    setErrorMessage(event.target.validationMessage);
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
          // onBlur={handleBlur}
        />
        {errorMessage && (
          <span className={styles.errorMessage}>{errorMessage}</span>
        )}
      </div>
    </div>
  );
};

export default EditableField;
