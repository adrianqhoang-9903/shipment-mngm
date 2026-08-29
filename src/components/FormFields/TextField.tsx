import {
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InvalidEvent,
} from "react";
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
  placeholder?: string;
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
  placeholder,
}: TextFieldProps) => {
  const [errorMessage, setErrorMessage] = useState("");
  // :user-invalid only lights up once the value has actually been changed
  // and then blurred (or a submit was attempted) - merely focusing a
  // blank field and leaving it again was never a "change" as far as the
  // spec is concerned. handleBlur used to show the message unconditionally
  // on any blur, which disagreed with the border in exactly that case -
  // this mirrors the same gate so the two can't say different things.
  const hasChangedRef = useRef(false);

  const applyValidation = (
    event: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>,
  ) => {
    if (validate) {
      event.target.setCustomValidity(validate(event.target.value));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    hasChangedRef.current = true;
    applyValidation(event);
    onChange(event.target.value);
    if (errorMessage) {
      setErrorMessage(event.target.validationMessage);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    applyValidation(event);
    if (hasChangedRef.current) {
      setErrorMessage(event.target.validationMessage);
    }
  };

  const handleInvalid = (event: InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    setErrorMessage(event.currentTarget.validationMessage);
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
          placeholder={placeholder}
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
