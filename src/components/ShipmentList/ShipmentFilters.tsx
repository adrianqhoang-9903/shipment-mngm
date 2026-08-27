import type { ChangeEvent } from "react";
import { STATUS_LABELS } from "../../constants";
import type { ShipmentStatus } from "../../types";
import styles from "./ShipmentFilters.module.css";

interface ShipmentFiltersProps {
  statuses: ShipmentStatus[];
  value: ShipmentStatus;
  onChange: (status: ShipmentStatus) => void;
  disabled?: boolean;
}

const ShipmentFilters = ({
  statuses,
  value,
  onChange,
  disabled,
}: ShipmentFiltersProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as ShipmentStatus);
  };

  return (
    <div className={styles.filters}>
      <label htmlFor="status-filter">Status</label>
      <select
        id="status-filter"
        value={value}
        onChange={handleChange}
        disabled={disabled || statuses.length === 0}
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ShipmentFilters;
