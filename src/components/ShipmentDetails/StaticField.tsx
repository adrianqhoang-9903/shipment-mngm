import styles from "./ShipmentField.module.css";

interface StaticFieldProps {
  label: string;
  value: string;
}

const StaticField = ({ label, value }: StaticFieldProps) => {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <p className={styles.value}>{value}</p>
    </div>
  );
};

export default StaticField;
