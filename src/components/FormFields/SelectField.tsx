import type { ChangeEvent } from "react";
import styles from "./FormFields.module.css";

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const SelectField = ({
  name,
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  required,
}: SelectFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <select
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={handleChange}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectField;
